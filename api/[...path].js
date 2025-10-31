var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// server/email.ts
var email_exports = {};
__export(email_exports, {
  generateTrackingToken: () => generateTrackingToken,
  sendOrderConfirmationEmail: () => sendOrderConfirmationEmail
});
import { Resend } from "resend";
function generateTrackingToken() {
  const randomChars = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let result = "";
    for (let i = 0; i < 4; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };
  return `OFF-${randomChars()}-${randomChars()}`;
}
function getSiteUrl() {
  const fromEnv = process.env.SITE_URL || process.env.NEXT_PUBLIC_SITE_URL;
  if (fromEnv) return fromEnv.replace(/\/$/, "");
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return "http://localhost:5000";
}
async function getResendClient() {
  const apiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.RESEND_FROM || process.env.FROM_EMAIL;
  if (!apiKey || !fromEmail) {
    throw new Error(
      "Missing RESEND_API_KEY or RESEND_FROM/FROM_EMAIL env vars for email sending."
    );
  }
  return { client: new Resend(apiKey), fromEmail };
}
async function sendOrderConfirmationEmail(orderData) {
  const { client, fromEmail } = await getResendClient();
  const networkDisplay = orderData.network === "base" ? "Base" : "Solana";
  const itemsList = orderData.items.map(
    (item) => `${item.name} - Size ${item.size} \xD7 ${item.quantity} = $${(parseFloat(item.price) * item.quantity).toFixed(2)}`
  ).join("\n");
  const filesList = orderData.productFiles.map((file) => {
    const files = [];
    if (file.glbUrl) files.push(`\u2022 3D Model (GLB): ${file.glbUrl}`);
    files.push(`\u2022 Thumbnail (PNG): ${file.thumbnailUrl}`);
    return `${file.name}:
${files.join("\n")}`;
  }).join("\n\n");
  const downloadUrl = `${getSiteUrl()}/api/orders/download/${orderData.trackingToken}`;
  const htmlContent = `<!DOCTYPE html>
<html><head><style>
  body { font-family: 'Courier New', monospace; background:#000; color:#00FF41; padding:20px; line-height:1.6; }
  .container { max-width:600px; margin:0 auto; background:#0a0a0a; border:2px solid #00FF41; padding:30px; }
  h1 { color:#00FF41; text-transform:uppercase; letter-spacing:3px; text-shadow:0 0 10px #00FF41; margin-bottom:20px; }
  .tracking-token { font-size:24px; font-weight:bold; color:#000; background:#00FF41; padding:15px; text-align:center; letter-spacing:2px; margin:20px 0; box-shadow:0 0 20px #00FF41; }
  .section { margin:20px 0; padding:15px; border-left:3px solid #00FF41; }
  .section-title { color:#00FF41; font-weight:bold; text-transform:uppercase; margin-bottom:10px; }
  .download-btn { display:inline-block; background:#00FF41; color:#000; padding:15px 30px; text-decoration:none; font-weight:bold; text-transform:uppercase; letter-spacing:2px; margin:20px 0; box-shadow:0 0 20px #00FF41; transition: all .3s; }
  .download-btn:hover { box-shadow: 0 0 30px #00FF41; transform: scale(1.05); }
  .transaction { word-break:break-all; font-size:12px; color:#888; }
</style></head>
<body><div class="container">
  <h1>OFF HUMAN</h1>
  <p>Thank you for your purchase! Your digital products are ready for download.</p>
  <div class="tracking-token">${orderData.trackingToken}</div>
  <div class="section"><div class="section-title">Order Details</div>
    <div style="white-space: pre-line;">${itemsList}</div>
    <div style="margin-top:10px;"><strong>Total: $${orderData.totalAmount}</strong></div>
  </div>
  <div class="section"><div class="section-title">Payment Confirmed</div>
    <div>Network: ${networkDisplay}</div>
    <div class="transaction">Transaction: ${orderData.transactionHash}</div>
  </div>
  <div class="section"><div class="section-title">Your Digital Products</div>
    <div style="white-space: pre-line;">${filesList}</div>
  </div>
  <div style="text-align:center;"><a href="${downloadUrl}" class="download-btn">Download All Files</a></div>
</div></body></html>`;
  const textContent = `OFF HUMAN - ORDER CONFIRMATION

Thank you for your purchase!

TRACKING TOKEN: ${orderData.trackingToken}
(Save this for your records)

ORDER DETAILS:
${itemsList}
Total: $$${orderData.totalAmount}

PAYMENT CONFIRMED:
Network: ${networkDisplay}
Transaction: ${orderData.transactionHash}

YOUR DIGITAL PRODUCTS:
${filesList}

DOWNLOAD LINK:
${downloadUrl}

---
OFF HUMAN - Streetwear for the Singularity
Keep your tracking token to re-download your files anytime`;
  await client.emails.send({
    from: fromEmail,
    to: orderData.customerEmail,
    subject: `OFF HUMAN Order ${orderData.trackingToken} - Digital Products Ready`,
    html: htmlContent,
    text: textContent
  });
  console.log(`[Email] Order confirmation sent to ${orderData.customerEmail}`);
}
var init_email = __esm({
  "server/email.ts"() {
    "use strict";
  }
});

// server/app.ts
import express2 from "express";
import path3 from "path";

// server/routes.ts
import { createServer } from "http";

// server/db.ts
import { drizzle } from "drizzle-orm/neon-serverless";
import { Pool, neonConfig } from "@neondatabase/serverless";
import ws from "ws";

// shared/schema.ts
var schema_exports = {};
__export(schema_exports, {
  getProductSizes: () => getProductSizes,
  getProductStock: () => getProductStock,
  insertOrderSchema: () => insertOrderSchema,
  insertProductSchema: () => insertProductSchema,
  insertUserSchema: () => insertUserSchema,
  isProductInStock: () => isProductInStock,
  orders: () => orders,
  products: () => products,
  users: () => users
});
import { sql } from "drizzle-orm";
import { pgTable, text, varchar, decimal, boolean, timestamp, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
var users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").notNull().unique(),
  isAdmin: boolean("is_admin").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow()
});
var products = pgTable("products", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description").notNull(),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  category: text("category").notNull(),
  imageUrl: text("image_url").notNull(),
  // Legacy field for backwards compatibility
  homePageImageUrl: text("home_page_image_url"),
  // Image for home page "Latest Collection"
  shopImageUrl: text("shop_image_url"),
  // Image for shop page product cards
  images: text("images").array().notNull().default(sql`ARRAY[]::text[]`),
  inventory: json("inventory").notNull(),
  modelUrl: text("model_url"),
  createdAt: timestamp("created_at").notNull().defaultNow()
});
var orders = pgTable("orders", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id"),
  customerEmail: text("customer_email").notNull(),
  items: text("items").notNull(),
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }).notNull(),
  transactionHash: text("transaction_hash"),
  network: text("network"),
  trackingToken: text("tracking_token").notNull().unique(),
  status: text("status").notNull().default("pending"),
  createdAt: timestamp("created_at").notNull().defaultNow()
});
var insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  isAdmin: true
});
var insertProductSchema = createInsertSchema(products).omit({
  id: true,
  createdAt: true
});
var insertOrderSchema = createInsertSchema(orders).omit({
  id: true,
  createdAt: true
});
function getProductSizes(product) {
  const inventory = product.inventory;
  return Object.keys(inventory);
}
function getProductStock(product, size) {
  const inventory = product.inventory;
  return inventory[size] || 0;
}
function isProductInStock(product) {
  const inventory = product.inventory;
  return Object.values(inventory).some((stock) => stock > 0);
}

// server/db.ts
neonConfig.webSocketConstructor = ws;
if (!process.env.DATABASE_URL) {
  console.error("\u274C DATABASE_URL environment variable is required");
  throw new Error("DATABASE_URL environment variable is required");
}
console.log("\u2705 Database connection initialized (DATABASE_URL is set)");
var pool = new Pool({ connectionString: process.env.DATABASE_URL });
var db = drizzle(pool, { schema: schema_exports });

// server/db-storage.ts
import { eq } from "drizzle-orm";
import bcrypt from "bcrypt";
var SALT_ROUNDS = 10;
var DbStorage = class {
  async getUser(id) {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }
  async getUserByUsername(username) {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }
  async getUserByEmail(email) {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }
  async createUser(insertUser) {
    const hashedPassword = await bcrypt.hash(insertUser.password, SALT_ROUNDS);
    const [user] = await db.insert(users).values({
      ...insertUser,
      password: hashedPassword
    }).returning();
    return user;
  }
  async verifyPassword(user, password) {
    return bcrypt.compare(password, user.password);
  }
  async getAllProducts() {
    return db.select().from(products);
  }
  async getProduct(id) {
    const [product] = await db.select().from(products).where(eq(products.id, id));
    return product;
  }
  async getProductsByCategory(category) {
    return db.select().from(products).where(eq(products.category, category));
  }
  async createProduct(insertProduct) {
    const [product] = await db.insert(products).values(insertProduct).returning();
    return product;
  }
  async updateProduct(id, updates) {
    const [product] = await db.update(products).set(updates).where(eq(products.id, id)).returning();
    return product;
  }
  async deleteProduct(id) {
    const result = await db.delete(products).where(eq(products.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }
  async updateInventory(productId, size, quantity) {
    const product = await this.getProduct(productId);
    if (!product) return false;
    const inventory = product.inventory;
    inventory[size] = quantity;
    await db.update(products).set({ inventory }).where(eq(products.id, productId));
    return true;
  }
  async decrementInventory(productId, size, quantity) {
    const product = await this.getProduct(productId);
    if (!product) return false;
    const inventory = product.inventory;
    if (!inventory[size] || inventory[size] < quantity) return false;
    inventory[size] -= quantity;
    await db.update(products).set({ inventory }).where(eq(products.id, productId));
    return true;
  }
  async createOrder(insertOrder) {
    const [order] = await db.insert(orders).values(insertOrder).returning();
    return order;
  }
  async getOrder(id) {
    const [order] = await db.select().from(orders).where(eq(orders.id, id));
    return order;
  }
  async getOrderByTrackingToken(trackingToken) {
    const [order] = await db.select().from(orders).where(eq(orders.trackingToken, trackingToken));
    return order;
  }
  async getAllOrders() {
    return db.select().from(orders);
  }
  async getOrdersByUser(userId) {
    return db.select().from(orders).where(eq(orders.userId, userId));
  }
  async updateOrderStatus(id, status) {
    const [order] = await db.update(orders).set({ status }).where(eq(orders.id, id)).returning();
    return order;
  }
  async seedProducts() {
    const existingProducts = await this.getAllProducts();
    if (existingProducts.length > 0) return;
    const sampleProducts = [
      {
        name: "X402 PROTOCOL TEE",
        description: "Cybernetic hands exchanging encrypted data. Oversized fit with airbrushed gradient graphics on premium heavyweight cotton. Features X402 branding and distressed finish.",
        price: "5.00",
        category: "tees",
        imageUrl: "@assets/ChatGPT Image Oct 25, 2025, 04_51_32 PM_1761436509620.png",
        images: ["@assets/ChatGPT Image Oct 25, 2025, 04_51_32 PM_1761436509620.png"],
        inventory: { "S": 15, "M": 20, "L": 18, "XL": 12 }
      },
      {
        name: "CLANKERS TOKYO",
        description: "Neon green cyberpunk skull with Japanese \u30AF\u30EC\u30F3\u30B1\u30B9 graphics. Retro-tech aesthetic on acid-washed cotton. Bold statement piece with vintage Y2K vibes.",
        price: "4.00",
        category: "tees",
        imageUrl: "@assets/ChatGPT Image Oct 25, 2025, 04_49_09 PM_1761436509620.png",
        images: ["@assets/ChatGPT Image Oct 25, 2025, 04_49_09 PM_1761436509620.png"],
        inventory: { "S": 12, "M": 18, "L": 16, "XL": 10 }
      },
      {
        name: "PROVE YOU'RE NOT HUMAN",
        description: "Dystopian identity verification graphic with glitch effects. Green screen-printed design on distressed vintage tee. Question everything in the digital age.",
        price: "3.00",
        category: "tees",
        imageUrl: "@assets/prove_1761436638560.png",
        images: ["@assets/prove_1761436638560.png"],
        inventory: { "S": 10, "M": 15, "L": 14, "XL": 8 }
      },
      {
        name: "X402 CALL TEE",
        description: "Retro-futuristic phone with robotic hand and X402 glitch text. Premium print on heavyweight cotton. Nostalgic tech meets cyber streetwear aesthetic.",
        price: "4.00",
        category: "tees",
        imageUrl: "@assets/402 call_1761436644815.png",
        images: ["@assets/402 call_1761436644815.png"],
        inventory: { "S": 14, "M": 20, "L": 16, "XL": 10 }
      },
      {
        name: "CLANKERS BMX HOODIE",
        description: "Robot riding BMX with C-star branding. Premium heavyweight hoodie in vintage charcoal wash. Dropped shoulders and relaxed fit for maximum comfort.",
        price: "5.00",
        category: "hoodies",
        imageUrl: "@assets/clankersar_1761436647628.png",
        images: ["@assets/clankersar_1761436647628.png"],
        inventory: { "S": 8, "M": 12, "L": 10, "XL": 6 }
      },
      {
        name: "CYBER ARMS LONGSLEEVE",
        description: "Geometric robotic arms sleeve print with chest emblem. Cropped fit oversized tee with extended sleeves. Technical graphics meet Y2K fashion aesthetics.",
        price: "5.00",
        category: "tees",
        imageUrl: "@assets/long sleeve_1761436670427.png",
        images: ["@assets/long sleeve_1761436670427.png"],
        inventory: { "S": 10, "M": 14, "L": 12, "XL": 8 }
      }
    ];
    await db.insert(products).values(sampleProducts);
  }
  async seedAdmin() {
    if (process.env.SEED_ADMIN === "true" && process.env.NODE_ENV !== "development") {
      throw new Error("CRITICAL: SEED_ADMIN cannot be enabled in production! This is a security risk.");
    }
    if (process.env.NODE_ENV !== "development" || process.env.SEED_ADMIN !== "true") {
      return;
    }
    const adminUsername = process.env.ADMIN_USERNAME || "admin";
    const existingAdmin = await this.getUserByUsername(adminUsername);
    if (existingAdmin) return;
    const adminEmail = process.env.ADMIN_EMAIL || "admin@offhuman.store";
    const adminPassword = process.env.ADMIN_PASSWORD || "admin123";
    await this.createUser({
      username: adminUsername,
      email: adminEmail,
      password: adminPassword
    });
    const adminUser = await this.getUserByUsername(adminUsername);
    if (adminUser) {
      await db.update(users).set({ isAdmin: true }).where(eq(users.id, adminUser.id));
    }
    console.log(`[Security Warning] Admin user seeded with default credentials. Please change password immediately!`);
  }
  async createAdminUser(username, email, password) {
    const existingUser = await this.getUserByUsername(username);
    if (existingUser) {
      throw new Error("Username already exists");
    }
    await this.createUser({ username, email, password });
    const adminUser = await this.getUserByUsername(username);
    if (adminUser) {
      await db.update(users).set({ isAdmin: true }).where(eq(users.id, adminUser.id));
    }
  }
};
var dbStorage = new DbStorage();

// server/routes.ts
import passport from "passport";
async function registerRoutes(app) {
  await dbStorage.seedProducts();
  await dbStorage.seedAdmin();
  const X402_WALLET = process.env.X402_WALLET_ADDRESS;
  const X402_SOLANA_WALLET = process.env.X402_SOLANA_WALLET_ADDRESS || X402_WALLET;
  const FACILITATOR_URL = "https://facilitator.payai.network";
  if (!X402_WALLET) {
    console.warn("\u26A0\uFE0F  X402_WALLET_ADDRESS not set - X402 payments will not work");
  }
  if (!X402_SOLANA_WALLET) {
    console.warn("\u26A0\uFE0F  X402_SOLANA_WALLET_ADDRESS not set - Solana payments will not work");
  }
  app.get("/api/products", async (req, res) => {
    try {
      const products2 = await dbStorage.getAllProducts();
      res.json(products2);
    } catch (error) {
      console.error("[API /api/products] Error:", error);
      console.error("[API /api/products] Error message:", error?.message);
      console.error("[API /api/products] DATABASE_URL exists:", !!process.env.DATABASE_URL);
      res.status(500).json({
        message: "Failed to fetch products",
        error: process.env.NODE_ENV === "development" ? error?.message : void 0
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
      const products2 = await dbStorage.getProductsByCategory(category);
      res.json(products2);
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
  app.post("/api/checkout/pay", async (req, res) => {
    try {
      if (!X402_WALLET) {
        return res.status(503).json({
          error: "Service Unavailable",
          message: "Payment system not configured"
        });
      }
      const { customerEmail, items, totalAmount } = req.body;
      console.log("[Base Payment] Validating cart total...");
      console.log("[Base Payment] Frontend sent items:", JSON.stringify(items, null, 2));
      console.log("[Base Payment] Frontend sent total:", totalAmount);
      let calculatedTotal = 0;
      const validatedItems = [];
      for (const item of items) {
        const product = await dbStorage.getProduct(item.productId);
        if (!product) {
          return res.status(400).json({
            error: "Invalid product",
            message: `Product ${item.productId} not found`
          });
        }
        const itemTotal = Number(product.price) * item.quantity;
        calculatedTotal += itemTotal;
        validatedItems.push({
          ...item,
          price: Number(product.price),
          // Use real price from DB
          name: product.name,
          product
          // Keep full product object for email generation
        });
        console.log(`[Base Payment] - ${product.name}: $${product.price} x ${item.quantity} = $${itemTotal.toFixed(2)}`);
      }
      console.log("[Base Payment] Calculated total: $" + calculatedTotal.toFixed(2));
      if (Math.abs(calculatedTotal - Number(totalAmount)) > 0.01) {
        console.log("[Base Payment] \u274C Price mismatch detected!");
        console.log(`[Base Payment] Frontend claimed: $${totalAmount}`);
        console.log(`[Base Payment] Actual total: $${calculatedTotal.toFixed(2)}`);
        return res.status(400).json({
          error: "Price mismatch",
          message: "Cart total doesn't match product prices"
        });
      }
      console.log("[Base Payment] \u2705 Cart total validated");
      const paymentHeader = req.headers["x-payment"];
      const amountInMicroUnits = Math.floor(calculatedTotal * 1e6).toString();
      const USDC_BASE_MAINNET = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";
      const protocol = req.secure || req.headers["x-forwarded-proto"] === "https" ? "https" : "http";
      const baseUrl = req.headers.host ? `${protocol}://${req.headers.host}` : "http://localhost:5000";
      const resourceUrl = `${baseUrl}/api/checkout/pay`;
      const paymentRequirement = {
        scheme: "exact",
        network: "base",
        maxAmountRequired: amountInMicroUnits,
        resource: resourceUrl,
        description: `OFF HUMAN Order - $${calculatedTotal.toFixed(2)}`,
        mimeType: "application/json",
        // Required field for x402-fetch
        payTo: X402_WALLET,
        asset: USDC_BASE_MAINNET,
        maxTimeoutSeconds: 60,
        // EIP-3009 domain parameters for USDC on Base
        extra: {
          name: "USD Coin",
          version: "2"
        }
      };
      if (!paymentHeader) {
        console.log("[Base Payment] No payment header - returning 402 for $" + calculatedTotal.toFixed(2));
        return res.status(402).json({
          x402Version: 1,
          accepts: [paymentRequirement]
        });
      }
      console.log("[Base Payment] Step 1: Verifying payment with facilitator...");
      console.log("[Base Payment] Payment header (first 100 chars):", paymentHeader.substring(0, 100));
      let paymentPayload;
      try {
        paymentPayload = JSON.parse(Buffer.from(paymentHeader, "base64").toString("utf-8"));
        console.log("[Base Payment] Decoded payment payload:", JSON.stringify(paymentPayload, null, 2));
      } catch (error) {
        console.error("[Base Payment] Failed to decode payment header:", error);
        return res.status(400).json({
          error: "Invalid payment header",
          message: "Could not decode payment header"
        });
      }
      try {
        const verifyRequest = {
          x402Version: 1,
          paymentPayload,
          // Decoded object, not base64 string
          paymentRequirements: paymentRequirement
          // Single object, not array
        };
        console.log("[Base Payment] Sending verification request to facilitator...");
        const verifyResponse = await fetch(`${FACILITATOR_URL}/verify`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(verifyRequest)
        });
        const verifyResult = await verifyResponse.json();
        console.log("[Base Payment] Facilitator verification response:", verifyResult);
        if (!verifyResponse.ok || !verifyResult.isValid) {
          console.log("[Base Payment] \u274C Payment verification FAILED");
          return res.status(402).json({
            error: "Payment verification failed",
            message: "Facilitator rejected payment signature",
            details: verifyResult
          });
        }
        console.log("[Base Payment] \u2705 Payment signature VERIFIED by facilitator!");
        console.log("[Base Payment] Payer address:", verifyResult.payer);
      } catch (error) {
        console.error("[Base Payment] Facilitator verification error:", error);
        return res.status(500).json({
          error: "Verification failed",
          message: "Could not verify payment with facilitator"
        });
      }
      console.log("[Base Payment] Step 2: Extracting transaction details...");
      let txHash = "base-verified";
      try {
        const decodedHeader = JSON.parse(Buffer.from(paymentHeader, "base64").toString("utf-8"));
        if (decodedHeader.payload?.txHash) {
          txHash = decodedHeader.payload.txHash;
        }
      } catch (e) {
        console.log("[Base Payment] Could not extract tx hash from header");
      }
      console.log("[Base Payment] Transaction hash:", txHash);
      console.log("[Base Payment] \u2705 Payment complete - $" + calculatedTotal.toFixed(2) + " USDC transferred on Base!");
      const { generateTrackingToken: generateTrackingToken2 } = await Promise.resolve().then(() => (init_email(), email_exports));
      const trackingToken = generateTrackingToken2();
      const order = await dbStorage.createOrder({
        customerEmail,
        items: JSON.stringify(validatedItems),
        totalAmount: calculatedTotal.toFixed(2),
        transactionHash: txHash,
        network: "base",
        trackingToken,
        status: "completed"
      });
      console.log("[Base Payment] \u2705 Order created:", order.id);
      try {
        const { sendOrderConfirmationEmail: sendOrderConfirmationEmail2 } = await Promise.resolve().then(() => (init_email(), email_exports));
        const productFiles = validatedItems.map((item) => ({
          productId: item.productId,
          name: item.name,
          glbUrl: item.product.modelUrl || void 0,
          thumbnailUrl: item.product.shopImageUrl || item.product.imageUrl
        }));
        await sendOrderConfirmationEmail2({
          customerEmail,
          trackingToken,
          network: "base",
          transactionHash: txHash,
          items: validatedItems.map((item) => ({
            productId: item.productId,
            name: item.name,
            size: item.size,
            quantity: item.quantity,
            price: item.product.price
          })),
          totalAmount: calculatedTotal.toFixed(2),
          productFiles
        });
        console.log("[Base Payment] \u2705 Delivery email sent to", customerEmail);
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
          receivedAt: X402_WALLET
        }
      });
    } catch (error) {
      console.error("[Base Payment] Error:", error);
      res.status(500).json({
        message: "Failed to process Base payment",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });
  app.post("/api/checkout/pay/solana", async (req, res) => {
    try {
      if (!X402_SOLANA_WALLET) {
        return res.status(503).json({
          error: "Service Unavailable",
          message: "Solana payment system not configured"
        });
      }
      const paymentHeader = req.headers["x-payment"];
      const { customerEmail, items, totalAmount } = req.body;
      const USDC_MINT_MAINNET = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";
      const USDC_MINT_DEVNET = "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU";
      const PAYAI_FEE_PAYER = "2wKupLR9q6wXYppw8Gr2NvWxKBUqm4PPJKkQfoxHDBg4";
      const SOLANA_NETWORK = process.env.SOLANA_NETWORK || "solana";
      const USDC_MINT = SOLANA_NETWORK === "solana-devnet" ? USDC_MINT_DEVNET : USDC_MINT_MAINNET;
      const EXPLORER_URL = SOLANA_NETWORK === "solana-devnet" ? "https://explorer.solana.com/tx/" : "https://explorer.solana.com/tx/";
      console.log(`[Solana Payment] Network: ${SOLANA_NETWORK}, USDC Mint: ${USDC_MINT}`);
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
            message: `Product ${item.productId} not found`
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
          product
          // Keep full product object for email generation
        });
      }
      console.log("[Solana Payment] Calculated total: $" + calculatedTotal.toFixed(2));
      const frontendTotal = parseFloat(totalAmount);
      const priceDifference = Math.abs(frontendTotal - calculatedTotal);
      if (priceDifference > 0.01) {
        console.log("[Solana Payment] \u274C Price mismatch detected!");
        console.log(`[Solana Payment] Frontend: $${frontendTotal}, Server: $${calculatedTotal}`);
        return res.status(400).json({
          error: "Price validation failed",
          message: "Cart total does not match server calculation",
          details: {
            clientTotal: frontendTotal,
            serverTotal: calculatedTotal
          }
        });
      }
      console.log("[Solana Payment] \u2705 Cart total validated");
      const amountInMicroUnits = Math.round(calculatedTotal * 1e6).toString();
      const protocol = req.secure || req.headers["x-forwarded-proto"] === "https" ? "https" : "http";
      const baseUrl = req.headers.host ? `${protocol}://${req.headers.host}` : "http://localhost:5000";
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
          feePayer: PAYAI_FEE_PAYER
        }
      };
      if (!paymentHeader) {
        console.log(`[Solana Payment] No payment header - returning 402 for $${calculatedTotal.toFixed(2)}`);
        return res.status(402).json({
          x402Version: 1,
          accepts: [paymentRequirement]
        });
      }
      console.log("[Solana Payment] Step 1: Verifying payment with facilitator...");
      console.log("[Solana Payment] Payment header (first 100 chars):", paymentHeader.substring(0, 100));
      let paymentPayload;
      try {
        paymentPayload = JSON.parse(Buffer.from(paymentHeader, "base64").toString("utf-8"));
        console.log("[Solana Payment] Decoded payment payload:", JSON.stringify(paymentPayload, null, 2));
      } catch (error) {
        console.error("[Solana Payment] Failed to decode payment header:", error);
        return res.status(400).json({
          error: "Invalid payment header",
          message: "Could not decode payment header"
        });
      }
      let verifyResult;
      try {
        const verifyRequest = {
          x402Version: 1,
          paymentPayload,
          // Decoded object, not base64 string
          paymentRequirements: paymentRequirement
          // Single object, not array
        };
        console.log("[Solana Payment] Sending settlement request to facilitator...");
        console.log("[Solana Payment] Using /settle endpoint to verify AND submit transaction");
        const settleResponse = await fetch(`${FACILITATOR_URL}/settle`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(verifyRequest)
        });
        verifyResult = await settleResponse.json();
        console.log("[Solana Payment] Facilitator settlement response:", JSON.stringify(verifyResult, null, 2));
        if (!settleResponse.ok || !verifyResult.success) {
          console.log("[Solana Payment] \u274C Payment settlement FAILED");
          return res.status(402).json({
            error: "Payment settlement failed",
            message: "Facilitator rejected or failed to submit transaction",
            details: verifyResult
          });
        }
        console.log("[Solana Payment] \u2705 Payment VERIFIED AND SUBMITTED by facilitator!");
        console.log("[Solana Payment] Payer address:", verifyResult.payer);
        console.log("[Solana Payment] Transaction signature:", verifyResult.transaction);
      } catch (error) {
        console.error("[Solana Payment] Facilitator verification error:", error);
        return res.status(500).json({
          error: "Verification failed",
          message: "Could not verify payment with facilitator"
        });
      }
      console.log("[Solana Payment] Step 2: Processing successful settlement...");
      const txSignature = verifyResult.transaction || "solana-settled";
      console.log("[Solana Payment] Transaction signature:", txSignature);
      console.log("[Solana Payment] \u2705 $" + calculatedTotal.toFixed(2) + " USDC transferred on Solana!");
      const { generateTrackingToken: generateTrackingToken2 } = await Promise.resolve().then(() => (init_email(), email_exports));
      const trackingToken = generateTrackingToken2();
      const order = await dbStorage.createOrder({
        customerEmail,
        items: JSON.stringify(validatedItems),
        totalAmount: calculatedTotal.toFixed(2),
        transactionHash: txSignature,
        network: SOLANA_NETWORK,
        trackingToken,
        status: "completed"
      });
      console.log("[Solana Payment] \u2705 Order created:", order.id);
      try {
        const { sendOrderConfirmationEmail: sendOrderConfirmationEmail2 } = await Promise.resolve().then(() => (init_email(), email_exports));
        const productFiles = validatedItems.map((item) => ({
          productId: item.productId,
          name: item.name,
          glbUrl: item.product.modelUrl || void 0,
          thumbnailUrl: item.product.shopImageUrl || item.product.imageUrl
        }));
        await sendOrderConfirmationEmail2({
          customerEmail,
          trackingToken,
          network: SOLANA_NETWORK,
          transactionHash: txSignature,
          items: validatedItems.map((item) => ({
            productId: item.productId,
            name: item.name,
            size: item.size,
            quantity: item.quantity,
            price: item.product.price
          })),
          totalAmount: calculatedTotal.toFixed(2),
          productFiles
        });
        console.log("[Solana Payment] \u2705 Delivery email sent to", customerEmail);
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
          explorer: `${EXPLORER_URL}${txSignature}${SOLANA_NETWORK === "solana-devnet" ? "?cluster=devnet" : ""}`
        }
      });
    } catch (error) {
      console.error("[Solana Payment] Error:", error);
      res.status(500).json({
        message: "Failed to process Solana payment",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });
  app.get("/api/orders/download/:trackingToken", async (req, res) => {
    try {
      const { trackingToken } = req.params;
      console.log("[Download] Looking up order with tracking token:", trackingToken);
      const order = await dbStorage.getOrderByTrackingToken(trackingToken);
      if (!order) {
        return res.status(404).json({ message: "Order not found. Please check your tracking token." });
      }
      const items = JSON.parse(order.items);
      const productIds = items.map((item) => item.productId);
      const products2 = await Promise.all(
        productIds.map((id) => dbStorage.getProduct(id))
      );
      const downloads = products2.filter((p) => p !== void 0).map((product) => ({
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
        downloads
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
      const orders2 = await dbStorage.getAllOrders();
      res.json(orders2);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch orders" });
    }
  });
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
    const user = req.user;
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
      const user = req.user;
      const { password: _, ...userWithoutPassword } = user;
      return res.json(userWithoutPassword);
    }
    res.status(401).json({ message: "Not authenticated" });
  });
  const httpServer = createServer(app);
  return httpServer;
}

// server/admin-routes.ts
import multer from "multer";

// server/auth.ts
import passport2 from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import session from "express-session";
import createMemoryStore from "memorystore";
import connectPgSimple from "connect-pg-simple";
var MemoryStore = createMemoryStore(session);
function setupAuth(app) {
  const usePgStore = app.get("env") === "production" || !!process.env.VERCEL;
  const baseCookie = {
    maxAge: 7 * 24 * 60 * 60 * 1e3,
    sameSite: usePgStore ? "lax" : "lax"
  };
  const sessionSettings = {
    secret: process.env.SESSION_SECRET || "y2k-secret-key-2001",
    resave: false,
    saveUninitialized: false,
    cookie: baseCookie,
    store: usePgStore ? new (connectPgSimple(session))({
      conString: process.env.DATABASE_URL,
      createTableIfMissing: true,
      tableName: "session"
    }) : new MemoryStore({
      checkPeriod: 864e5
    })
  };
  if (usePgStore) {
    app.set("trust proxy", 1);
    sessionSettings.cookie = {
      ...sessionSettings.cookie,
      secure: true
    };
  }
  app.use(session(sessionSettings));
  app.use(passport2.initialize());
  app.use(passport2.session());
  passport2.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        const user = await dbStorage.getUserByUsername(username);
        if (!user) {
          return done(null, false, { message: "Invalid username or password" });
        }
        const isValid = await dbStorage.verifyPassword(user, password);
        if (!isValid) {
          return done(null, false, { message: "Invalid username or password" });
        }
        return done(null, user);
      } catch (error) {
        return done(error);
      }
    })
  );
  passport2.serializeUser((user, done) => {
    done(null, user.id);
  });
  passport2.deserializeUser(async (id, done) => {
    try {
      const user = await dbStorage.getUser(id);
      done(null, user);
    } catch (error) {
      done(error);
    }
  });
}
var requireAdmin = (req, res, next) => {
  if (req.isAuthenticated()) {
    const user = req.user;
    if (user.isAdmin) {
      return next();
    }
    return res.status(403).json({ message: "Admin access required" });
  }
  res.status(401).json({ message: "Authentication required" });
};

// server/admin-routes.ts
import path from "path";
import fs from "fs";
import { put } from "@vercel/blob";
var isVercel = !!process.env.VERCEL;
var useBlob = isVercel || !!process.env.BLOB_READ_WRITE_TOKEN;
var uploadsDir = path.join(process.cwd(), "uploads");
if (!useBlob) {
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }
}
var storage = useBlob ? multer.memoryStorage() : multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname));
  }
});
var upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|glb|mp4|webm|mov|avi/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = file.mimetype.startsWith("image/") || file.mimetype.startsWith("video/") || file.mimetype === "model/gltf-binary" || file.originalname.endsWith(".glb");
    if (extname && mimetype) {
      return cb(null, true);
    } else {
      cb(new Error("Only images, videos, and .glb files are allowed"));
    }
  },
  limits: {
    fileSize: 100 * 1024 * 1024
    // 100MB limit for videos
  }
});
function registerAdminRoutes(app) {
  app.post("/api/admin/uploads/image", requireAdmin, upload.single("image"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }
      if (useBlob) {
        const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
        const key = `uploads/${req.file.fieldname}-${uniqueSuffix}${path.extname(req.file.originalname)}`;
        const { url } = await put(key, req.file.buffer, {
          access: "public",
          token: process.env.BLOB_READ_WRITE_TOKEN
        });
        return res.json({ url });
      }
      const fileUrl = `/uploads/${req.file.filename}`;
      res.json({ url: fileUrl });
    } catch (error) {
      res.status(500).json({ message: "Failed to upload image" });
    }
  });
  app.post("/api/admin/uploads/model", requireAdmin, upload.single("model"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }
      if (useBlob) {
        const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
        const key = `uploads/${req.file.fieldname}-${uniqueSuffix}${path.extname(req.file.originalname)}`;
        const { url } = await put(key, req.file.buffer, {
          access: "public",
          token: process.env.BLOB_READ_WRITE_TOKEN
        });
        return res.json({ url });
      }
      const fileUrl = `/uploads/${req.file.filename}`;
      res.json({ url: fileUrl });
    } catch (error) {
      res.status(500).json({ message: "Failed to upload model" });
    }
  });
  app.post("/api/admin/uploads/images", requireAdmin, upload.array("images", 10), async (req, res) => {
    try {
      const files = req.files;
      if (!files || files.length === 0) {
        return res.status(400).json({ message: "No files uploaded" });
      }
      if (useBlob) {
        const urls = [];
        for (const f of files) {
          const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
          const key = `uploads/${f.fieldname}-${uniqueSuffix}${path.extname(f.originalname)}`;
          const { url } = await put(key, f.buffer, {
            access: "public",
            token: process.env.BLOB_READ_WRITE_TOKEN
          });
          urls.push(url);
        }
        return res.json({ urls });
      }
      const fileUrls = files.map((file) => `/uploads/${file.filename}`);
      res.json({ urls: fileUrls });
    } catch (error) {
      res.status(500).json({ message: "Failed to upload images" });
    }
  });
  app.get("/api/admin/products", requireAdmin, async (req, res) => {
    try {
      const products2 = await dbStorage.getAllProducts();
      res.json(products2);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch products" });
    }
  });
  app.post("/api/admin/products", requireAdmin, async (req, res) => {
    try {
      const validatedProduct = insertProductSchema.parse(req.body);
      const product = await dbStorage.createProduct(validatedProduct);
      res.status(201).json(product);
    } catch (error) {
      res.status(400).json({ message: error.message || "Invalid product data" });
    }
  });
  app.patch("/api/admin/products/:id", requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      const product = await dbStorage.updateProduct(id, updates);
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }
      res.json(product);
    } catch (error) {
      res.status(400).json({ message: error.message || "Failed to update product" });
    }
  });
  app.delete("/api/admin/products/:id", requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const success = await dbStorage.deleteProduct(id);
      if (!success) {
        return res.status(404).json({ message: "Product not found" });
      }
      res.json({ message: "Product deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete product" });
    }
  });
}

// server/vite.ts
import express from "express";
import { createServer as createViteServer, createLogger } from "vite";

// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path2 from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";
var vite_config_default = defineConfig({
  plugins: [
    react(),
    runtimeErrorOverlay(),
    ...process.env.NODE_ENV !== "production" && process.env.REPL_ID !== void 0 ? [
      await import("@replit/vite-plugin-cartographer").then(
        (m) => m.cartographer()
      ),
      await import("@replit/vite-plugin-dev-banner").then(
        (m) => m.devBanner()
      )
    ] : []
  ],
  resolve: {
    alias: {
      "@": path2.resolve(import.meta.dirname, "client", "src"),
      "@shared": path2.resolve(import.meta.dirname, "shared"),
      "@assets": path2.resolve(import.meta.dirname, "attached_assets")
    }
  },
  root: path2.resolve(import.meta.dirname, "client"),
  build: {
    outDir: path2.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true
  },
  server: {
    fs: {
      strict: true,
      deny: ["**/.*"]
    }
  }
});

// server/vite.ts
import { nanoid } from "nanoid";
var viteLogger = createLogger();
function log(message, source = "express") {
  const formattedTime = (/* @__PURE__ */ new Date()).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}

// server/app.ts
async function createApp() {
  const app = express2();
  setupAuth(app);
  app.use(
    "/attached_assets",
    express2.static(path3.join(process.cwd(), "attached_assets"), {
      setHeaders: (res, filePath) => {
        if (filePath.endsWith(".otf")) {
          res.setHeader("Content-Type", "font/otf");
        } else if (filePath.endsWith(".ttf")) {
          res.setHeader("Content-Type", "font/ttf");
        } else if (filePath.endsWith(".woff")) {
          res.setHeader("Content-Type", "font/woff");
        } else if (filePath.endsWith(".woff2")) {
          res.setHeader("Content-Type", "font/woff2");
        }
      }
    })
  );
  if (!process.env.VERCEL) {
    app.use(
      "/uploads",
      express2.static(path3.join(process.cwd(), "uploads"), {
        setHeaders: (res, filePath) => {
          if (filePath.endsWith(".glb")) {
            res.setHeader("Content-Type", "model/gltf-binary");
          }
        }
      })
    );
  }
  app.use(
    express2.json({
      verify: (req, _res, buf) => {
        req.rawBody = buf;
      }
    })
  );
  app.use(express2.urlencoded({ extended: false }));
  app.use((req, res, next) => {
    const start = Date.now();
    const p = req.path;
    let capturedJsonResponse = void 0;
    const originalResJson = res.json.bind(res);
    res.json = function(bodyJson, ...args) {
      capturedJsonResponse = bodyJson;
      return originalResJson(bodyJson, ...args);
    };
    res.on("finish", () => {
      const duration = Date.now() - start;
      if (p.startsWith("/api")) {
        let logLine = `${req.method} ${p} ${res.statusCode} in ${duration}ms`;
        if (capturedJsonResponse) {
          try {
            logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
          } catch {
          }
        }
        if (logLine.length > 80) logLine = logLine.slice(0, 79) + "\u2026";
        log(logLine);
      }
    });
    next();
  });
  const httpServer = await registerRoutes(app);
  registerAdminRoutes(app);
  app.use((err, _req, res, _next) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
    throw err;
  });
  return { app, httpServer };
}

// api/[...path].ts
var appPromise = null;
async function getApp() {
  if (!appPromise) {
    const bundle = await createApp();
    appPromise = bundle.app;
  }
  return appPromise;
}
async function handler(req, res) {
  const app = await getApp();
  return app(req, res);
}
export {
  handler as default
};
