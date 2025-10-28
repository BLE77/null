import type { Express } from "express";
import { createServer, type Server } from "http";
import { dbStorage } from "./db-storage";
import { insertProductSchema, insertOrderSchema, insertUserSchema, type User } from "@shared/schema";
import passport from "passport";
import { requireAuth, requireAdmin } from "./auth";
import { paymentMiddleware } from "x402-express";

export async function registerRoutes(app: Express): Promise<Server> {
  // Seed products and admin user on startup
  await dbStorage.seedProducts();
  await dbStorage.seedAdmin();

  // X402 Payment configuration
  const X402_WALLET = process.env.X402_WALLET_ADDRESS;
  const FACILITATOR_URL = "https://facilitator.payai.network";
  
  if (!X402_WALLET) {
    console.warn("⚠️  X402_WALLET_ADDRESS not set - X402 payments will not work");
  }
  
  app.get("/api/products", async (req, res) => {
    try {
      const products = await dbStorage.getAllProducts();
      res.json(products);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch products" });
    }
  });

  app.get("/api/products/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const product = await dbStorage.getProduct(id);
      
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }
      
      res.json(product);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch product" });
    }
  });

  app.get("/api/products/category/:category", async (req, res) => {
    try {
      const { category } = req.params;
      const products = await dbStorage.getProductsByCategory(category);
      res.json(products);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch products by category" });
    }
  });

  app.post("/api/products", async (req, res) => {
    try {
      const validatedProduct = insertProductSchema.parse(req.body);
      const product = await dbStorage.createProduct(validatedProduct);
      res.status(201).json(product);
    } catch (error) {
      res.status(400).json({ message: "Invalid product data" });
    }
  });

  // X402 Protected Payment Endpoint
  // The middleware MUST be applied in a way that blocks all requests without valid payment
  if (!X402_WALLET) {
    // Disable endpoint entirely if wallet not configured
    app.post("/api/checkout/pay", (req, res) => {
      res.status(503).json({
        error: "Service Unavailable",
        message: "Payment system not configured",
      });
    });
  } else {
    // Apply X402 middleware - this handles payment verification with the facilitator
    // The middleware will:
    // 1. Check for X-PAYMENT header
    // 2. Verify cryptographic signature with facilitator
    // 3. Only call next() if payment is valid
    // 4. Return 402 if payment missing/invalid
    app.post(
      "/api/checkout/pay",
      paymentMiddleware(
        X402_WALLET as `0x${string}`,
        {
          "POST /api/checkout/pay": {
            price: "$0.01", // Minimum test price - will be dynamic from request
            network: "base-sepolia", // Use base-sepolia for testing
            // Change to "base" for production mainnet
          },
        },
        {
          url: FACILITATOR_URL,
        }
      ),
      // This route handler ONLY executes if middleware verified payment
      async (req, res) => {
        try {
          const { customerEmail, items, totalAmount, shippingDetails } = req.body;
          
          // At this point, payment has been cryptographically verified by X402 middleware
          // The facilitator has confirmed the EIP-712 signature and blockchain transaction
          const paymentTxHash = req.headers['x-payment-tx'] as string || 'x402-verified';
          
          // Create the order with verified transaction details
          const order = await dbStorage.createOrder({
            customerEmail,
            items: JSON.stringify(items),
            totalAmount,
            transactionHash: paymentTxHash,
            status: "completed",
          });
          
          res.status(200).json({
            success: true,
            order,
            message: "Payment verified and order created",
          });
        } catch (error) {
          console.error("Order creation error:", error);
          res.status(500).json({ message: "Failed to create order after payment" });
        }
      }
    );
  }

  // REMOVED: Public order creation endpoint
  // Orders can ONLY be created through the X402-protected /api/checkout/pay endpoint
  // This prevents bypassing payment verification

  app.get("/api/orders/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const order = await dbStorage.getOrder(id);
      
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }
      
      res.json(order);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch order" });
    }
  });

  app.get("/api/orders", async (req, res) => {
    try {
      const orders = await dbStorage.getAllOrders();
      res.json(orders);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch orders" });
    }
  });

  // Auth routes
  app.post("/api/auth/register", async (req, res) => {
    try {
      const { username, email, password } = insertUserSchema.parse(req.body);
      
      const existingUser = await dbStorage.getUserByUsername(username);
      if (existingUser) {
        return res.status(400).json({ message: "Username already exists" });
      }

      const existingEmail = await dbStorage.getUserByEmail(email);
      if (existingEmail) {
        return res.status(400).json({ message: "Email already registered" });
      }

      const user = await dbStorage.createUser({ username, email, password });
      
      req.login(user, (err) => {
        if (err) {
          return res.status(500).json({ message: "Login after registration failed" });
        }
        const { password: _, ...userWithoutPassword } = user;
        res.status(201).json(userWithoutPassword);
      });
    } catch (error) {
      res.status(400).json({ message: "Invalid registration data" });
    }
  });

  app.post("/api/auth/login", passport.authenticate("local"), (req, res) => {
    const user = req.user as User;
    const { password: _, ...userWithoutPassword } = user;
    res.json(userWithoutPassword);
  });

  app.post("/api/auth/logout", (req, res) => {
    req.logout((err) => {
      if (err) {
        return res.status(500).json({ message: "Logout failed" });
      }
      res.json({ message: "Logged out successfully" });
    });
  });

  app.get("/api/auth/me", (req, res) => {
    if (req.isAuthenticated()) {
      const user = req.user as User;
      const { password: _, ...userWithoutPassword } = user;
      return res.json(userWithoutPassword);
    }
    res.status(401).json({ message: "Not authenticated" });
  });

  const httpServer = createServer(app);

  return httpServer;
}
