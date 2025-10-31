import type { Express } from "express";
import { createServer, type Server } from "http";
import { dbStorage } from "./db-storage.js";
import { insertProductSchema, insertOrderSchema, insertUserSchema, type User } from "@shared/schema";
import passport from "passport";
import { requireAuth, requireAdmin } from "./auth.js";

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
      console.log("[API /api/products] Fetching products...");
      console.log("[API /api/products] DATABASE_URL exists:", !!process.env.DATABASE_URL);
      
      const products = await dbStorage.getAllProducts();
      console.log(`[API /api/products] Successfully fetched ${products.length} products`);
      res.json(products);
    } catch (error: any) {
      console.error("[API /api/products] Error:", error);
      console.error("[API /api/products] Error message:", error?.message);
      console.error("[API /api/products] Error stack:", error?.stack);
      console.error("[API /api/products] DATABASE_URL exists:", !!process.env.DATABASE_URL);
      res.status(500).json({ 
        message: "Failed to fetch products",
        error: process.env.NODE_ENV === "development" ? error?.message : undefined
      });
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

  // Base X402 Payment Endpoint with Dynamic Pricing
  // Using direct x402 handling for flexible per-request pricing
  app.post("/api/checkout/pay", async (req, res) => {
    try {
      if (!X402_WALLET) {
        return res.status(503).json({
          error: "Service Unavailable",
          message: "Payment system not configured",
        });
      }

      const { customerEmail, items, totalAmount } = req.body;
      
      // Step 1: Calculate and validate cart total from actual product prices
      console.log("[Base Payment] Validating cart total...");
      console.log("[Base Payment] Frontend sent items:", JSON.stringify(items, null, 2));
      console.log("[Base Payment] Frontend sent total:", totalAmount);
      
      let calculatedTotal = 0;
      const validatedItems = [];
      
      for (const item of items) {
        // Fetch actual product from database
        const product = await dbStorage.getProduct(item.productId);
        
        if (!product) {
          return res.status(400).json({
            error: "Invalid product",
            message: `Product ${item.productId} not found`,
          });
        }
        
        // Calculate item total using real database price
        const itemTotal = Number(product.price) * item.quantity;
        calculatedTotal += itemTotal;
        
        validatedItems.push({
          ...item,
          price: Number(product.price), // Use real price from DB
          name: product.name,
          product: product, // Keep full product object for email generation
        });
        
        console.log(`[Base Payment] - ${product.name}: $${product.price} x ${item.quantity} = $${itemTotal.toFixed(2)}`);
      }
      
      console.log("[Base Payment] Calculated total: $" + calculatedTotal.toFixed(2));
      
      // Verify frontend didn't lie about the price
      if (Math.abs(calculatedTotal - Number(totalAmount)) > 0.01) {
        console.log("[Base Payment] ❌ Price mismatch detected!");
        console.log(`[Base Payment] Frontend claimed: $${totalAmount}`);
        console.log(`[Base Payment] Actual total: $${calculatedTotal.toFixed(2)}`);
        return res.status(400).json({
          error: "Price mismatch",
          message: "Cart total doesn't match product prices",
        });
      }
      
      console.log("[Base Payment] ✅ Cart total validated");
      
      // Extract payment header
      const paymentHeader = req.headers['x-payment'] as string;
      
      // Convert total to USDC micro-units (6 decimals)
      const amountInMicroUnits = Math.floor(calculatedTotal * 1_000_000).toString();
      const USDC_BASE_MAINNET = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";
      
      // Create payment requirements
      const protocol = req.secure || req.headers['x-forwarded-proto'] === 'https' ? 'https' : 'http';
      const baseUrl = req.headers.host ? `${protocol}://${req.headers.host}` : 'http://localhost:5000';
      const resourceUrl = `${baseUrl}/api/checkout/pay`;
      
      const paymentRequirement = {
        scheme: "exact",
        network: "base",
        maxAmountRequired: amountInMicroUnits,
        resource: resourceUrl,
        description: `OFF HUMAN Order - $${calculatedTotal.toFixed(2)}`,
        mimeType: "application/json", // Required field for x402-fetch
        payTo: X402_WALLET as `0x${string}`,
        asset: USDC_BASE_MAINNET as `0x${string}`,
        maxTimeoutSeconds: 60,
        // EIP-3009 domain parameters for USDC on Base
        extra: {
          name: "USD Coin",
          version: "2",
        },
      };
      
      // If no payment header, return 402 with correct x402 format
      // x402-fetch expects "accepts" field, not "paymentRequirements"
      if (!paymentHeader) {
        console.log("[Base Payment] No payment header - returning 402 for $" + calculatedTotal.toFixed(2));
        return res.status(402).json({
          x402Version: 1,
          accepts: [paymentRequirement],
        });
      }
      
      // Step 1: Verify payment with facilitator using direct HTTP call
      console.log("[Base Payment] Step 1: Verifying payment with facilitator...");
      console.log("[Base Payment] Payment header (first 100 chars):", paymentHeader.substring(0, 100));
      
      // Decode the payment header to get the payment payload
      let paymentPayload;
      try {
        paymentPayload = JSON.parse(Buffer.from(paymentHeader, 'base64').toString('utf-8'));
        console.log("[Base Payment] Decoded payment payload:", JSON.stringify(paymentPayload, null, 2));
      } catch (error) {
        console.error("[Base Payment] Failed to decode payment header:", error);
        return res.status(400).json({
          error: "Invalid payment header",
          message: "Could not decode payment header",
        });
      }
      
      try {
        // Facilitator expects: { x402Version, paymentPayload, paymentRequirements }
        const verifyRequest = {
          x402Version: 1,
          paymentPayload: paymentPayload,  // Decoded object, not base64 string
          paymentRequirements: paymentRequirement,  // Single object, not array
        };
        
        console.log("[Base Payment] Sending verification request to facilitator...");
        
        const verifyResponse = await fetch(`${FACILITATOR_URL}/verify`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(verifyRequest),
        });
        
        const verifyResult = await verifyResponse.json();
        console.log("[Base Payment] Facilitator verification response:", verifyResult);
        
        // Check isValid (not valid) - facilitator returns isValid field
        if (!verifyResponse.ok || !verifyResult.isValid) {
          console.log("[Base Payment] ❌ Payment verification FAILED");
          return res.status(402).json({
            error: "Payment verification failed",
            message: "Facilitator rejected payment signature",
            details: verifyResult,
          });
        }
        
        console.log("[Base Payment] ✅ Payment signature VERIFIED by facilitator!");
        console.log("[Base Payment] Payer address:", verifyResult.payer);
      } catch (error) {
        console.error("[Base Payment] Facilitator verification error:", error);
        return res.status(500).json({
          error: "Verification failed",
          message: "Could not verify payment with facilitator",
        });
      }
      
      // Step 2: Extract transaction hash
      console.log("[Base Payment] Step 2: Extracting transaction details...");
      
      let txHash = 'base-verified';
      try {
        const decodedHeader = JSON.parse(Buffer.from(paymentHeader, 'base64').toString('utf-8'));
        if (decodedHeader.payload?.txHash) {
          txHash = decodedHeader.payload.txHash;
        }
      } catch (e) {
        console.log("[Base Payment] Could not extract tx hash from header");
      }
      
      console.log("[Base Payment] Transaction hash:", txHash);
      console.log("[Base Payment] ✅ Payment complete - $" + calculatedTotal.toFixed(2) + " USDC transferred on Base!");
      
      // Generate tracking token
      const { generateTrackingToken } = await import('./email.js');
      const trackingToken = generateTrackingToken();
      
      // Create the order with verified payment
      const order = await dbStorage.createOrder({
        customerEmail,
        items: JSON.stringify(validatedItems),
        totalAmount: calculatedTotal.toFixed(2),
        transactionHash: txHash,
        network: "base",
        trackingToken,
        status: "completed",
      });
      
      console.log("[Base Payment] ✅ Order created:", order.id);
      
      // Send delivery email with product files
      try {
        const { sendOrderConfirmationEmail } = await import('./email.js');
        const productFiles = validatedItems.map((item: any) => ({
          productId: item.productId,
          name: item.name,
          glbUrl: item.product.modelUrl || undefined,
          thumbnailUrl: item.product.shopImageUrl || item.product.imageUrl,
        }));
        
        await sendOrderConfirmationEmail({
          customerEmail,
          trackingToken,
          network: "base",
          transactionHash: txHash,
          items: validatedItems.map((item: any) => ({
            productId: item.productId,
            name: item.name,
            size: item.size,
            quantity: item.quantity,
            price: item.product.price,
          })),
          totalAmount: calculatedTotal.toFixed(2),
          productFiles,
        });
        
        console.log("[Base Payment] ✅ Delivery email sent to", customerEmail);
      } catch (emailError) {
        console.error("[Base Payment] Failed to send delivery email:", emailError);
      }
      
      res.status(200).json({
        success: true,
        order,
        message: `Payment successful - $${calculatedTotal.toFixed(2)} USDC transferred on Base!`,
        transaction: {
          hash: txHash,
          network: "Base Mainnet",
          amount: `$${calculatedTotal.toFixed(2)} USDC`,
          receivedAt: X402_WALLET,
        },
      });
    } catch (error) {
      console.error("[Base Payment] Error:", error);
      res.status(500).json({
        message: "Failed to process Base payment",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });

  // Solana X402 Payment Endpoint
  // Manual x402 implementation with PayAI fee payer configuration
  // Supports both mainnet and devnet with dynamic pricing
  app.post("/api/checkout/pay/solana", async (req, res) => {
    try {
      if (!X402_SOLANA_WALLET) {
        return res.status(503).json({
          error: "Service Unavailable",
          message: "Solana payment system not configured",
        });
      }

      const paymentHeader = req.headers['x-payment'] as string | undefined;
      const { customerEmail, items, totalAmount } = req.body;

      // USDC mint addresses
      const USDC_MINT_MAINNET = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"; // USDC on Solana mainnet
      const USDC_MINT_DEVNET = "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU"; // USDC on Solana devnet
      
      // PayAI fee payer wallet (from facilitator's /supported endpoint)
      const PAYAI_FEE_PAYER = "2wKupLR9q6wXYppw8Gr2NvWxKBUqm4PPJKkQfoxHDBg4";
      
      // Determine network from environment or default to mainnet
      const SOLANA_NETWORK = process.env.SOLANA_NETWORK || "solana"; // "solana" or "solana-devnet"
      const USDC_MINT = SOLANA_NETWORK === "solana-devnet" ? USDC_MINT_DEVNET : USDC_MINT_MAINNET;
      const EXPLORER_URL = SOLANA_NETWORK === "solana-devnet" 
        ? "https://explorer.solana.com/tx/"
        : "https://explorer.solana.com/tx/";
      
      console.log(`[Solana Payment] Network: ${SOLANA_NETWORK}, USDC Mint: ${USDC_MINT}`);

      // Validate cart total server-side (same logic as Base)
      console.log("[Solana Payment] Validating cart total...");
      console.log("[Solana Payment] Frontend sent items:", JSON.stringify(items, null, 2));
      console.log("[Solana Payment] Frontend sent total:", totalAmount);

      const validatedItems = [];
      let calculatedTotal = 0;

      for (const item of items) {
        const product = await dbStorage.getProduct(item.productId);
        if (!product) {
          return res.status(400).json({
            error: "Invalid product",
            message: `Product ${item.productId} not found`,
          });
        }

        const itemPrice = parseFloat(product.price);
        const itemTotal = itemPrice * item.quantity;
        calculatedTotal += itemTotal;

        console.log(`[Solana Payment] - ${product.name}: $${itemPrice} x ${item.quantity} = $${itemTotal.toFixed(2)}`);

        validatedItems.push({
          productId: product.id,
          name: product.name,
          size: item.size,
          quantity: item.quantity,
          price: product.price,
          product: product, // Keep full product object for email generation
        });
      }

      console.log("[Solana Payment] Calculated total: $" + calculatedTotal.toFixed(2));

      // Verify frontend total matches server-calculated total
      const frontendTotal = parseFloat(totalAmount);
      const priceDifference = Math.abs(frontendTotal - calculatedTotal);
      if (priceDifference > 0.01) {
        console.log("[Solana Payment] ❌ Price mismatch detected!");
        console.log(`[Solana Payment] Frontend: $${frontendTotal}, Server: $${calculatedTotal}`);
        return res.status(400).json({
          error: "Price validation failed",
          message: "Cart total does not match server calculation",
          details: {
            clientTotal: frontendTotal,
            serverTotal: calculatedTotal,
          },
        });
      }

      console.log("[Solana Payment] ✅ Cart total validated");

      // Convert to USDC micro-units (6 decimals)
      const amountInMicroUnits = Math.round(calculatedTotal * 1_000_000).toString();

      // Build payment requirements with PayAI fee payer
      const protocol = req.secure || req.headers['x-forwarded-proto'] === 'https' ? 'https' : 'http';
      const baseUrl = req.headers.host ? `${protocol}://${req.headers.host}` : 'http://localhost:5000';
      const resourceUrl = `${baseUrl}/api/checkout/pay/solana`;

      const paymentRequirement = {
        scheme: "exact",
        network: SOLANA_NETWORK,
        maxAmountRequired: amountInMicroUnits,
        resource: resourceUrl,
        description: `OFF HUMAN Order - $${calculatedTotal.toFixed(2)}`,
        mimeType: "application/json",
        payTo: X402_SOLANA_WALLET,
        asset: USDC_MINT,
        maxTimeoutSeconds: 60,
        // CRITICAL: PayAI wallet must pay transaction fees
        extra: {
          feePayer: PAYAI_FEE_PAYER,
        },
      };

      // If no payment header, return 402 with correct x402 format
      if (!paymentHeader) {
        console.log(`[Solana Payment] No payment header - returning 402 for $${calculatedTotal.toFixed(2)}`);
        return res.status(402).json({
          x402Version: 1,
          accepts: [paymentRequirement],
        });
      }

      // Step 1: Verify payment with facilitator using direct HTTP call
      console.log("[Solana Payment] Step 1: Verifying payment with facilitator...");
      console.log("[Solana Payment] Payment header (first 100 chars):", paymentHeader.substring(0, 100));
      
      // Decode the payment header to get the payment payload
      let paymentPayload;
      try {
        paymentPayload = JSON.parse(Buffer.from(paymentHeader, 'base64').toString('utf-8'));
        console.log("[Solana Payment] Decoded payment payload:", JSON.stringify(paymentPayload, null, 2));
      } catch (error) {
        console.error("[Solana Payment] Failed to decode payment header:", error);
        return res.status(400).json({
          error: "Invalid payment header",
          message: "Could not decode payment header",
        });
      }
      
      let verifyResult: any;
      try {
        // Facilitator expects: { x402Version, paymentPayload, paymentRequirements }
        const verifyRequest = {
          x402Version: 1,
          paymentPayload: paymentPayload,  // Decoded object, not base64 string
          paymentRequirements: paymentRequirement,  // Single object, not array
        };
        
        console.log("[Solana Payment] Sending settlement request to facilitator...");
        console.log("[Solana Payment] Using /settle endpoint to verify AND submit transaction");
        
        // Use /settle instead of /verify - this submits the transaction to Solana!
        const settleResponse = await fetch(`${FACILITATOR_URL}/settle`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(verifyRequest),
        });
        
        verifyResult = await settleResponse.json();
        console.log("[Solana Payment] Facilitator settlement response:", JSON.stringify(verifyResult, null, 2));
        
        // Check success field from facilitator /settle response (different from /verify which uses isValid)
        if (!settleResponse.ok || !verifyResult.success) {
          console.log("[Solana Payment] ❌ Payment settlement FAILED");
          return res.status(402).json({
            error: "Payment settlement failed",
            message: "Facilitator rejected or failed to submit transaction",
            details: verifyResult,
          });
        }
        
        console.log("[Solana Payment] ✅ Payment VERIFIED AND SUBMITTED by facilitator!");
        console.log("[Solana Payment] Payer address:", verifyResult.payer);
        console.log("[Solana Payment] Transaction signature:", verifyResult.transaction);
      } catch (error) {
        console.error("[Solana Payment] Facilitator verification error:", error);
        return res.status(500).json({
          error: "Verification failed",
          message: "Could not verify payment with facilitator",
        });
      }
      
      // Step 2: Get transaction signature from settlement result
      console.log("[Solana Payment] Step 2: Processing successful settlement...");
      
      // The /settle endpoint returns the transaction signature in the "transaction" field
      const txSignature = verifyResult.transaction || 'solana-settled';
      
      console.log("[Solana Payment] Transaction signature:", txSignature);
      console.log("[Solana Payment] ✅ $" + calculatedTotal.toFixed(2) + " USDC transferred on Solana!");
      
      // Generate tracking token
      const { generateTrackingToken } = await import('./email.js');
      const trackingToken = generateTrackingToken();
      
      // Create the order with verified payment
      const order = await dbStorage.createOrder({
        customerEmail,
        items: JSON.stringify(validatedItems),
        totalAmount: calculatedTotal.toFixed(2),
        transactionHash: txSignature,
        network: SOLANA_NETWORK,
        trackingToken,
        status: "completed",
      });
      
      console.log("[Solana Payment] ✅ Order created:", order.id);
      
      // Send delivery email with product files
      try {
        const { sendOrderConfirmationEmail } = await import('./email.js');
        const productFiles = validatedItems.map((item: any) => ({
          productId: item.productId,
          name: item.name,
          glbUrl: item.product.modelUrl || undefined,
          thumbnailUrl: item.product.shopImageUrl || item.product.imageUrl,
        }));
        
        await sendOrderConfirmationEmail({
          customerEmail,
          trackingToken,
          network: SOLANA_NETWORK,
          transactionHash: txSignature,
          items: validatedItems.map((item: any) => ({
            productId: item.productId,
            name: item.name,
            size: item.size,
            quantity: item.quantity,
            price: item.product.price,
          })),
          totalAmount: calculatedTotal.toFixed(2),
          productFiles,
        });
        
        console.log("[Solana Payment] ✅ Delivery email sent to", customerEmail);
      } catch (emailError) {
        console.error("[Solana Payment] Failed to send delivery email:", emailError);
      }
      
      const networkName = SOLANA_NETWORK === "solana-devnet" ? "Solana Devnet" : "Solana Mainnet";
      
      res.status(200).json({
        success: true,
        order,
        message: `Payment successful - $${calculatedTotal.toFixed(2)} USDC transferred on Solana!`,
        transaction: {
          signature: txSignature,
          network: networkName,
          amount: `$${calculatedTotal.toFixed(2)} USDC`,
          receivedAt: X402_SOLANA_WALLET,
          explorer: `${EXPLORER_URL}${txSignature}${SOLANA_NETWORK === "solana-devnet" ? "?cluster=devnet" : ""}`,
        },
      });
    } catch (error) {
      console.error("[Solana Payment] Error:", error);
      res.status(500).json({
        message: "Failed to process Solana payment",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });

  // REMOVED: Public order creation endpoint
  // Orders can ONLY be created through the X402-protected payment endpoints
  // This prevents bypassing payment verification

  // Download endpoint - allows customers to re-download using tracking token
  app.get("/api/orders/download/:trackingToken", async (req, res) => {
    try {
      const { trackingToken } = req.params;
      
      console.log("[Download] Looking up order with tracking token:", trackingToken);
      const order = await dbStorage.getOrderByTrackingToken(trackingToken);
      
      if (!order) {
        return res.status(404).json({ message: "Order not found. Please check your tracking token." });
      }
      
      // Parse order items to get product info
      const items = JSON.parse(order.items);
      const productIds = items.map((item: any) => item.productId);
      
      // Fetch all products for this order
      const products = await Promise.all(
        productIds.map((id: string) => dbStorage.getProduct(id))
      );
      
      // Build download links
      const downloads = products
        .filter((p): p is any => p !== undefined)
        .map(product => ({
          productId: product.id,
          name: product.name,
          files: [
            product.modelUrl ? { type: "3D Model (GLB)", url: product.modelUrl } : null,
            { type: "Thumbnail (PNG)", url: product.shopImageUrl || product.imageUrl }
          ].filter(Boolean)
        }));
      
      console.log("[Download] Found order with", downloads.length, "products");
      
      res.json({
        trackingToken: order.trackingToken,
        customerEmail: order.customerEmail,
        network: order.network,
        transactionHash: order.transactionHash,
        totalAmount: order.totalAmount,
        createdAt: order.createdAt,
        items,
        downloads,
      });
    } catch (error) {
      console.error("[Download] Error:", error);
      res.status(500).json({ message: "Failed to fetch order" });
    }
  });

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
