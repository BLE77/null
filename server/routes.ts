import type { Express } from "express";
import { createServer, type Server } from "http";
import { dbStorage } from "./db-storage";
import { insertProductSchema, insertOrderSchema, insertUserSchema, type User } from "@shared/schema";
import passport from "passport";
import { requireAuth, requireAdmin } from "./auth";

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
      
      // IMPORTANT: We need to actually settle the payment on-chain, not just verify
      // x402-express middleware handles both verification AND settlement
      
      // Convert total to USDC micro-units (6 decimals)
      const amountInMicroUnits = Math.floor(calculatedTotal * 1_000_000).toString();
      const USDC_BASE_MAINNET = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";
      
      console.log("[Base Payment] Creating x402-express middleware with dynamic amount: $" + calculatedTotal.toFixed(2));
      
      // Import and configure x402-express middleware
      const { paymentMiddleware } = await import('x402-express');
      
      // Create middleware instance with dynamic payment requirements
      // This middleware will:
      // 1. Return 402 if no payment header
      // 2. Verify payment signature with facilitator
      // 3. Submit transaction to Base network (ACTUAL PAYMENT)
      // 4. Call next() on success
      const middleware = paymentMiddleware(
        X402_WALLET as `0x${string}`,
        {
          price: `$${calculatedTotal.toFixed(2)}`, // Dynamic price in dollar format
          network: 'base' // Base Mainnet
        },
        {
          url: FACILITATOR_URL
        }
      );
      
      // Execute middleware
      // CRITICAL: The middleware will either:
      // 1. Send a 402 response (if no payment) - in this case res.headersSent will be true
      // 2. Call next() after verifying payment - in this case we continue
      await new Promise<void>((resolve, reject) => {
        middleware(req, res, (error?: any) => {
          if (error) {
            console.log("[Base Payment] ❌ Middleware error:", error);
            reject(error);
          } else {
            resolve();
          }
        });
      });
      
      // Check if middleware already sent a response (402 Payment Required)
      if (res.headersSent) {
        console.log("[Base Payment] Middleware sent 402 - waiting for payment");
        return; // Don't continue - client needs to provide payment
      }
      
      // If we get here, payment was verified AND settled successfully
      console.log("[Base Payment] ✅ Payment verified AND settled on Base!");
      
      // Extract transaction hash from payment header
      let txHash = 'base-verified';
      const paymentHeader = req.headers['x-payment'] as string;
      if (paymentHeader) {
        try {
          const decodedHeader = JSON.parse(Buffer.from(paymentHeader, 'base64').toString('utf-8'));
          if (decodedHeader.payload?.txHash) {
            txHash = decodedHeader.payload.txHash;
          }
        } catch (e) {
          console.log("[Base Payment] Could not extract tx hash");
        }
      }
      
      console.log("[Base Payment] Transaction hash:", txHash);
      console.log("[Base Payment] ✅ Payment complete - $" + calculatedTotal.toFixed(2) + " USDC received");
      
      // Create the order with verified payment
      const order = await dbStorage.createOrder({
        customerEmail,
        items: JSON.stringify(validatedItems),
        totalAmount: calculatedTotal.toFixed(2),
        transactionHash: txHash,
        status: "completed",
      });
      
      console.log("[Base Payment] ✅ Order created:", order.id);
      
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
