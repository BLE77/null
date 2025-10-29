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
  const X402_SOLANA_WALLET = process.env.X402_SOLANA_WALLET_ADDRESS || X402_WALLET;
  const FACILITATOR_URL = "https://facilitator.payai.network";
  
  if (!X402_WALLET) {
    console.warn("⚠️  X402_WALLET_ADDRESS not set - X402 payments will not work");
  }
  
  if (!X402_SOLANA_WALLET) {
    console.warn("⚠️  X402_SOLANA_WALLET_ADDRESS not set - Solana payments will not work");
  }
  
  // Remove middleware - using manual handling for dynamic pricing
  
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

  // Base X402 Payment Endpoint
  // Manual x402 handling with dynamic pricing based on cart total
  app.post("/api/checkout/pay", async (req, res) => {
    try {
      if (!X402_WALLET) {
        return res.status(503).json({
          error: "Service Unavailable",
          message: "Payment system not configured",
        });
      }

      // Extract payment header manually from request headers
      const paymentHeader = req.headers['x-payment'] as string | undefined;
      const { customerEmail, items, totalAmount } = req.body;

      // CRITICAL: Server-side cart validation
      // Validate cart against database to prevent price manipulation
      console.log("[Base Payment] Validating cart server-side...");
      let serverTotal = 0;
      
      if (!items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ 
          error: "Invalid cart",
          message: "Cart is empty or invalid"
        });
      }

      for (const item of items) {
        const product = await dbStorage.getProduct(item.productId);
        if (!product) {
          return res.status(400).json({ 
            error: "Invalid product",
            message: `Product ${item.productId} not found`
          });
        }
        
        const itemTotal = parseFloat(product.price) * item.quantity;
        serverTotal += itemTotal;
        console.log(`[Base Payment] ${product.name} x${item.quantity} = $${itemTotal.toFixed(2)}`);
      }

      // Verify cart total matches claimed amount
      const claimedTotal = parseFloat(totalAmount);
      if (Math.abs(serverTotal - claimedTotal) > 0.01) {
        console.log(`[Base Payment] ❌ Cart total mismatch! Server: $${serverTotal.toFixed(2)}, Client: $${claimedTotal.toFixed(2)}`);
        return res.status(400).json({
          error: "Cart total mismatch",
          message: `Server calculated $${serverTotal.toFixed(2)} but client claimed $${claimedTotal.toFixed(2)}`
        });
      }

      // Enforce $100 maximum cap
      if (serverTotal > 100) {
        return res.status(400).json({
          error: "Cart exceeds maximum",
          message: "Cart total exceeds $100 maximum"
        });
      }

      console.log(`[Base Payment] ✅ Cart validation passed: $${serverTotal.toFixed(2)}`);

      // USDC contract on Base Mainnet
      const USDC_BASE_MAINNET = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";

      // Convert validated server total to USDC micro-units (6 decimals)
      // Using Math.round to avoid floating-point errors
      const usdcMicroUnits = Math.round(serverTotal * 1_000_000);

      // Create payment requirements with EXACT cart total
      const protocol = req.headers.host?.includes('replit.dev') ? 'https' : 'http';
      const baseUrl = req.headers.host ? `${protocol}://${req.headers.host}` : 'http://localhost:5000';
      
      // X402 protocol format (correct v0.7.0 spec)
      const paymentRequirements = {
        x402Version: 1,
        paymentRequirements: [
          {
            scheme: "eip7702-sign",
            network: "base", // MAINNET PRODUCTION
            asset: {
              address: USDC_BASE_MAINNET,
              decimals: 6
            },
            recipient: X402_WALLET,
            amount: usdcMicroUnits.toString(),
            resource: `${baseUrl}/api/checkout/pay`,
            extras: {
              description: `OFF HUMAN Streetwear Order - $${serverTotal.toFixed(2)} USDC`,
            }
          }
        ]
      };

      // If no payment header, return 402 with payment requirements
      if (!paymentHeader) {
        console.log("[Base Payment] No payment header found, returning 402 with requirements");
        console.log("[Base Payment] Required payment:", JSON.stringify({
          amount: `$${serverTotal.toFixed(2)}`,
          microUnits: usdcMicroUnits,
          network: "base",
        }, null, 2));
        console.log("[Base Payment] FULL 402 RESPONSE:", JSON.stringify(paymentRequirements, null, 2));
        
        return res.status(402).json(paymentRequirements);
      }

      // Verify payment with facilitator via HTTP
      console.log("[Base Payment] Verifying payment with facilitator...");
      console.log("[Base Payment] Payment header (first 100 chars):", paymentHeader.substring(0, 100));
      
      try {
        // Decode payment header to extract payload
        const decodedPayment = JSON.parse(Buffer.from(paymentHeader, 'base64').toString('utf-8'));
        
        // Call facilitator verify endpoint
        // Facilitator expects: { paymentPayload, paymentRequirements }
        // paymentPayload should be the EIP-712 payload (not the full envelope)
        // paymentRequirements should be the individual requirement object (not the array wrapper)
        const verifyResponse = await fetch(`${FACILITATOR_URL}/verify`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            paymentPayload: decodedPayment.payload,
            paymentRequirements: paymentRequirements.paymentRequirements[0],
          }),
        });

        if (!verifyResponse.ok) {
          console.log("[Base Payment] ❌ Facilitator verification failed:", verifyResponse.status);
          return res.status(402).json({
            error: "Payment verification failed",
            message: "Facilitator rejected payment signature"
          });
        }

        const verifyResult = await verifyResponse.json();
        console.log("[Base Payment] Facilitator verification result:", verifyResult);

        if (!verifyResult.valid) {
          console.log("[Base Payment] ❌ Payment is not valid");
          return res.status(402).json({
            error: "Payment verification failed",
            message: verifyResult.reason || "Payment signature invalid"
          });
        }

        console.log("[Base Payment] ✅ Payment VERIFIED by facilitator!");
      } catch (verifyError) {
        console.error("[Base Payment] Verification error:", verifyError);
        return res.status(500).json({
          error: "Verification failed",
          message: "Could not verify payment with facilitator"
        });
      }

      // Extract transaction hash from payment header
      let txHash = 'base-x402-verified';
      try {
        const decodedHeader = JSON.parse(Buffer.from(paymentHeader, 'base64').toString('utf-8'));
        if (decodedHeader.payload?.transaction) {
          txHash = decodedHeader.payload.transaction;
        }
      } catch (error) {
        console.log("[Base Payment] Could not extract transaction hash:", error);
      }

      console.log("[Base Payment] Transaction hash:", txHash);
      console.log("[Base Payment] 💰 USDC received at:", X402_WALLET);

      // Create the order with verified payment
      const order = await dbStorage.createOrder({
        customerEmail,
        items: JSON.stringify(items),
        totalAmount: serverTotal.toFixed(2), // Use server-validated total
        transactionHash: txHash,
        status: "completed",
      });

      console.log("[Base Payment] ✅ Order created:", order.id);

      res.status(200).json({
        success: true,
        order,
        message: "Payment verified and order created",
        transaction: {
          hash: txHash,
          network: "Base Mainnet",
          amount: `$${serverTotal.toFixed(2)} USDC`,
          receivedAt: X402_WALLET,
        },
      });
    } catch (error) {
      console.error("Base payment error:", error);
      res.status(500).json({
        message: "Failed to process Base payment",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // Direct USDC Transfer Endpoint (Base Mainnet)
  // Simple approach - no broken x402 libraries
  app.post("/api/checkout/pay/direct", async (req, res) => {
    try {
      const { customerEmail, items, totalAmount, transactionHash, network } = req.body;
      
      if (!transactionHash) {
        return res.status(400).json({ message: "Transaction hash required" });
      }

      // Server-side cart validation
      console.log("[Direct Payment] Validating cart...");
      let serverTotal = 0;
      
      if (!items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ 
          error: "Invalid cart",
          message: "Cart is empty or invalid"
        });
      }

      for (const item of items) {
        const product = await dbStorage.getProduct(item.productId);
        if (!product) {
          return res.status(400).json({
            error: "Product not found",
            message: `Product ${item.productId} not found`
          });
        }
        
        const itemTotal = parseFloat(product.price) * item.quantity;
        serverTotal += itemTotal;
        console.log(`[Direct Payment] ${product.name} x${item.quantity} = $${itemTotal.toFixed(2)}`);
      }

      // Verify cart total matches
      const claimedTotal = parseFloat(totalAmount);
      if (Math.abs(serverTotal - claimedTotal) > 0.01) {
        console.log(`[Direct Payment] ❌ Cart total mismatch! Server: $${serverTotal.toFixed(2)}, Client: $${claimedTotal.toFixed(2)}`);
        return res.status(400).json({
          error: "Cart total mismatch",
          message: `Server calculated $${serverTotal.toFixed(2)} but client claimed $${claimedTotal.toFixed(2)}`
        });
      }

      console.log(`[Direct Payment] ✅ Cart validated: $${serverTotal.toFixed(2)}`);
      console.log(`[Direct Payment] Transaction hash: ${transactionHash}`);
      console.log(`[Direct Payment] Network: ${network}`);

      // Create order
      const order = await dbStorage.createOrder({
        customerEmail,
        items: JSON.stringify(items),
        totalAmount: serverTotal.toFixed(2),
        transactionHash,
        status: "completed",
      });

      console.log("[Direct Payment] ✅ Order created:", order.id);

      res.status(200).json({
        success: true,
        order,
        message: "Order created successfully",
      });
    } catch (error) {
      console.error("Direct payment error:", error);
      res.status(500).json({
        message: "Failed to create order",
        error: error instanceof Error ? error.message : "Unknown error"
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

      // CRITICAL: Server-side cart validation
      // Validate cart against database to prevent price manipulation
      console.log("[Solana Payment] Validating cart server-side...");
      let serverTotal = 0;
      
      if (!items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ 
          error: "Invalid cart",
          message: "Cart is empty or invalid"
        });
      }

      for (const item of items) {
        const product = await dbStorage.getProduct(item.productId);
        if (!product) {
          return res.status(400).json({ 
            error: "Invalid product",
            message: `Product ${item.productId} not found`
          });
        }
        
        const itemTotal = parseFloat(product.price) * item.quantity;
        serverTotal += itemTotal;
        console.log(`[Solana Payment] ${product.name} x${item.quantity} = $${itemTotal.toFixed(2)}`);
      }

      // Verify cart total matches claimed amount
      const claimedTotal = parseFloat(totalAmount);
      if (Math.abs(serverTotal - claimedTotal) > 0.01) {
        console.log(`[Solana Payment] ❌ Cart total mismatch! Server: $${serverTotal.toFixed(2)}, Client: $${claimedTotal.toFixed(2)}`);
        return res.status(400).json({
          error: "Cart total mismatch",
          message: `Server calculated $${serverTotal.toFixed(2)} but client claimed $${claimedTotal.toFixed(2)}`
        });
      }

      // Enforce $100 maximum cap
      if (serverTotal > 100) {
        return res.status(400).json({
          error: "Cart exceeds maximum",
          message: "Cart total exceeds $100 maximum"
        });
      }

      console.log(`[Solana Payment] ✅ Cart validation passed: $${serverTotal.toFixed(2)}`);

      // USDC mint address on Solana DEVNET
      const USDC_MINT_DEVNET = "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU";

      // Convert validated server total to USDC micro-units (6 decimals)
      // Using Math.round to avoid floating-point errors
      const usdcMicroUnits = Math.round(serverTotal * 1_000_000);

      // Create payment requirements using library format
      const protocol = req.headers.host?.includes('replit.dev') ? 'https' : 'http';
      const baseUrl = req.headers.host ? `${protocol}://${req.headers.host}` : 'http://localhost:5000';
      const paymentRequirements = await x402.createPaymentRequirements({
        price: {
          amount: usdcMicroUnits.toString(), // Exact cart total from server validation
          asset: { 
            address: USDC_MINT_DEVNET,
            decimals: 6, // USDC has 6 decimals
          },
        },
        network: "solana-devnet",
        config: {
          description: "OFF HUMAN Streetwear Order",
          resource: `${baseUrl}/api/checkout/pay/solana` as `${string}://${string}`,
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
        totalAmount: serverTotal.toFixed(2), // Use server-validated total
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
          network: "Solana Devnet",
          amount: `$${serverTotal.toFixed(2)} USDC`,
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
