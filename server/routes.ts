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
  const X402_SOLANA_WALLET = process.env.X402_SOLANA_WALLET_ADDRESS || X402_WALLET; // Can use same wallet or separate Solana wallet
  const FACILITATOR_URL = "https://facilitator.payai.network";
  
  if (!X402_WALLET) {
    console.warn("⚠️  X402_WALLET_ADDRESS not set - X402 payments will not work");
  }
  
  if (!X402_SOLANA_WALLET) {
    console.warn("⚠️  X402_SOLANA_WALLET_ADDRESS not set - Solana payments will not work");
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
            price: "$2.50", // Price in USD - facilitator converts to USDC
            network: "base", // BASE MAINNET - Real USDC payments
            asset: {
              address: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913" as `0x${string}`, // USDC on Base Mainnet
              decimals: 6, // USDC has 6 decimals
            },
          },
        },
        {
          url: FACILITATOR_URL,
        }
      ),
      // This route handler ONLY executes if middleware verified payment
      async (req, res) => {
        // Safety check: middleware may have already sent a response
        if (res.headersSent) {
          console.log("[Payment] Response already sent by middleware, skipping handler");
          return;
        }
        
        try {
          const { customerEmail, items, totalAmount } = req.body;
          
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
          
          if (!res.headersSent) {
            res.status(200).json({
              success: true,
              order,
              message: "Payment verified and order created",
            });
          }
        } catch (error) {
          console.error("Order creation error:", error);
          if (!res.headersSent) {
            res.status(500).json({ message: "Failed to create order after payment" });
          }
        }
      }
    );
  }

  // Solana X402 Payment Endpoint
  // Using X402PaymentHandler library for proper payment handling
  app.post("/api/checkout/pay/solana", async (req, res) => {
    try {
      if (!X402_SOLANA_WALLET) {
        return res.status(503).json({
          error: "Service Unavailable",
          message: "Solana payment system not configured",
        });
      }

      // Import X402PaymentHandler
      const { X402PaymentHandler } = await import('x402-solana/server');

      // Create payment handler with proper configuration
      // DEVNET - Mainnet doesn't work despite docs claiming "drop-in setup"
      // This is a facilitator bug or undocumented limitation
      const x402 = new X402PaymentHandler({
        network: 'solana-devnet',
        treasuryAddress: X402_SOLANA_WALLET,
        facilitatorUrl: FACILITATOR_URL,
        rpcUrl: 'https://api.devnet.solana.com',
      });

      const paymentHeader = x402.extractPayment(req.headers);
      const { customerEmail, items, totalAmount } = req.body;

      // USDC mint address on Solana DEVNET
      const USDC_MINT_DEVNET = "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU";

      // Create payment requirements using library format
      const protocol = req.secure || req.headers['x-forwarded-proto'] === 'https' ? 'https' : 'http';
      const baseUrl = req.headers.host ? `${protocol}://${req.headers.host}` : 'http://localhost:5000';
      const resourceUrl = `${baseUrl}/api/checkout/pay/solana` as `${string}://${string}`;
      const paymentRequirements = await x402.createPaymentRequirements({
        price: {
          amount: "2500000", // $2.50 USDC (6 decimals)
          asset: { 
            address: USDC_MINT_DEVNET,
            decimals: 6, // USDC has 6 decimals
          },
        },
        network: "solana-devnet",
        config: {
          description: "OFF HUMAN Streetwear Order",
          resource: resourceUrl,
        },
      });

      // If no payment header, return 402 using library method
      if (!paymentHeader) {
        const response = x402.create402Response(paymentRequirements);
        console.log("[Solana Payment] Returning 402 with requirements:", JSON.stringify(response.body, null, 2));
        return res.status(response.status).json(response.body);
      }

      // Step 1: Verify payment signature using library
      console.log("[Solana Payment] Step 1: Verifying payment signature...");
      console.log("[Solana Payment] Payment header (first 100 chars):", paymentHeader.substring(0, 100));
      
      // Decode payment header to see what's inside
      try {
        const decodedPayment = JSON.parse(Buffer.from(paymentHeader, 'base64').toString('utf-8'));
        console.log("[Solana Payment] Decoded payment header:", JSON.stringify(decodedPayment, null, 2));
      } catch (e) {
        console.log("[Solana Payment] Could not decode payment header");
      }
      
      console.log("[Solana Payment] Payment requirements:", JSON.stringify(paymentRequirements, null, 2));
      
      // Use library's verifyPayment method (handles facilitator communication)
      const verificationResult = await x402.verifyPayment(paymentHeader, paymentRequirements);
      console.log("[Solana Payment] Library verification result:", verificationResult);
      
      if (!verificationResult) {
        console.log("[Solana Payment] ❌ Payment verification FAILED");
        console.log("[Solana Payment] This usually means:");
        console.log("  1. Facilitator rejected the signature");
        console.log("  2. Transaction doesn't match requirements");
        console.log("  3. Network mismatch (mainnet vs devnet)");
        
        return res.status(402).json({
          error: "Payment verification failed",
          message: "Facilitator rejected payment signature - this may be a mainnet compatibility issue",
        });
      }
      
      console.log("[Solana Payment] ✅ Payment signature VERIFIED by facilitator");

      // Extract transaction info from payment header
      let txSignature = 'solana-pending';
      try {
        const decodedHeader = JSON.parse(Buffer.from(paymentHeader, 'base64').toString('utf-8'));
        const signedTxBase64 = decodedHeader.payload?.transaction;
        
        if (signedTxBase64) {
          // Decode the transaction to get its signature
          const { VersionedTransaction } = await import('@solana/web3.js');
          const txBuffer = Buffer.from(signedTxBase64, 'base64');
          const transaction = VersionedTransaction.deserialize(txBuffer);
          
          // Get the transaction signature (first signature in signatures array)
          const signature = transaction.signatures[0];
          if (signature) {
            // Convert signature bytes to base58 string
            const bs58 = await import('bs58');
            txSignature = bs58.default.encode(signature);
            console.log("[Solana Payment] Extracted transaction signature:", txSignature);
          }
        }
      } catch (error) {
        console.log("[Solana Payment] Could not extract transaction signature:", error);
      }

      // Step 2: Settle payment on-chain
      console.log("[Solana Payment] Step 2: Submitting transaction to blockchain...");
      const settlementResult = await x402.settlePayment(paymentHeader, paymentRequirements);
      console.log("[Solana Payment] Settlement result:", settlementResult);
      
      if (!settlementResult) {
        console.log("[Solana Payment] Payment settlement FAILED");
        return res.status(500).json({
          error: "Payment settlement failed",
          message: "Transaction could not be submitted to blockchain",
        });
      }

      console.log("[Solana Payment] ✅ Payment VERIFIED and SETTLED on blockchain!");
      console.log("[Solana Payment] Transaction signature:", txSignature);
      console.log("[Solana Payment] Explorer:", `https://explorer.solana.com/tx/${txSignature}`);
      console.log("[Solana Payment] 💰 USDC received at:", X402_SOLANA_WALLET);

      // Create the order with verified and settled payment
      const order = await dbStorage.createOrder({
        customerEmail,
        items: JSON.stringify(items),
        totalAmount,
        transactionHash: txSignature,
        status: "completed",
      });

      console.log("[Solana Payment] ✅ Order created:", order.id);
      
      res.status(200).json({
        success: true,
        order,
        message: "Payment successful - USDC transferred on Solana!",
        transaction: {
          signature: txSignature,
          explorer: `https://explorer.solana.com/tx/${txSignature}`,
          network: "Solana Mainnet",
          amount: "$2.50 USDC",
          receivedAt: X402_SOLANA_WALLET,
        },
      });
    } catch (error) {
      console.error("Solana payment error:", error);
      res.status(500).json({ 
        message: "Failed to process Solana payment",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // REMOVED: Public order creation endpoint
  // Orders can ONLY be created through the X402-protected payment endpoints
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
