import { db } from "./db.js";
import { users, products, orders, type User, type InsertUser, type Product, type InsertProduct, type Order, type InsertOrder, type ProductInventory } from "../shared/schema.js";
import { eq } from "drizzle-orm";
import bcrypt from "bcrypt";

const SALT_ROUNDS = 10;

export class DbStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const hashedPassword = await bcrypt.hash(insertUser.password, SALT_ROUNDS);
    const [user] = await db.insert(users).values({
      ...insertUser,
      password: hashedPassword,
    }).returning();
    return user;
  }

  async verifyPassword(user: User, password: string): Promise<boolean> {
    return bcrypt.compare(password, user.password);
  }

  async getAllProducts(): Promise<Product[]> {
    return db.select().from(products);
  }

  async getProduct(id: string): Promise<Product | undefined> {
    const [product] = await db.select().from(products).where(eq(products.id, id));
    return product;
  }

  async getProductsByCategory(category: string): Promise<Product[]> {
    return db.select().from(products).where(eq(products.category, category));
  }

  async createProduct(insertProduct: InsertProduct): Promise<Product> {
    const [product] = await db.insert(products).values(insertProduct).returning();
    return product;
  }

  async updateProduct(id: string, updates: Partial<InsertProduct>): Promise<Product | undefined> {
    const [product] = await db.update(products)
      .set(updates)
      .where(eq(products.id, id))
      .returning();
    return product;
  }

  async deleteProduct(id: string): Promise<boolean> {
    const result = await db.delete(products).where(eq(products.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  async updateInventory(productId: string, size: string, quantity: number): Promise<boolean> {
    const product = await this.getProduct(productId);
    if (!product) return false;

    const inventory = product.inventory as ProductInventory;
    inventory[size] = quantity;

    await db.update(products)
      .set({ inventory })
      .where(eq(products.id, productId));
    
    return true;
  }

  async decrementInventory(productId: string, size: string, quantity: number): Promise<boolean> {
    const product = await this.getProduct(productId);
    if (!product) return false;

    const inventory = product.inventory as ProductInventory;
    if (!inventory[size] || inventory[size] < quantity) return false;

    inventory[size] -= quantity;
    await db.update(products)
      .set({ inventory })
      .where(eq(products.id, productId));
    
    return true;
  }

  async createOrder(insertOrder: InsertOrder): Promise<Order> {
    const [order] = await db.insert(orders).values(insertOrder).returning();
    return order;
  }

  async getOrder(id: string): Promise<Order | undefined> {
    const [order] = await db.select().from(orders).where(eq(orders.id, id));
    return order;
  }

  async getOrderByTrackingToken(trackingToken: string): Promise<Order | undefined> {
    const [order] = await db.select().from(orders).where(eq(orders.trackingToken, trackingToken));
    return order;
  }

  async getAllOrders(): Promise<Order[]> {
    return db.select().from(orders);
  }

  async getOrdersByUser(userId: string): Promise<Order[]> {
    return db.select().from(orders).where(eq(orders.userId, userId));
  }

  async updateOrderStatus(id: string, status: string): Promise<Order | undefined> {
    const [order] = await db.update(orders)
      .set({ status })
      .where(eq(orders.id, id))
      .returning();
    return order;
  }

  async seedProducts(): Promise<void> {
    const existingProducts = await this.getAllProducts();
    if (existingProducts.length > 0) return;

    const sampleProducts: InsertProduct[] = [
      {
        name: "BYTE ME",
        description: "Neon grin mech head printed with cracked puff inks on heavyweight cotton. Built for late-night prompts and mainframe mischief.",
        price: "80.00",
        category: "tees",
        imageUrl: "/attached_assets/ProdByte.png",
        homePageImageUrl: "/attached_assets/StreetCall.png",
        shopImageUrl: "/attached_assets/RobotByte.png",
        images: [
          "/attached_assets/ProdByte.png",
          "/attached_assets/RobotByte.png",
        ],
        inventory: { "S": 15, "M": 20, "L": 18, "XL": 12 },
        modelUrl: "/attached_assets/GLBByte.glb",
      },
      {
        name: "CLANKERS TOKYO",
        description: "Three-quarter neon skull with glitch kanji overlays. Acid washed tee wearing the whole Shibuya neon stack.",
        price: "95.00",
        category: "tees",
        imageUrl: "/attached_assets/ProdTokyo.png",
        homePageImageUrl: "/attached_assets/StreetTokyo.mp4",
        shopImageUrl: "/attached_assets/RobotTokyo.png",
        images: [
          "/attached_assets/ProdTokyo.png",
          "/attached_assets/RobotTokyo.png",
        ],
        inventory: { "S": 10, "M": 18, "L": 16, "XL": 10 },
        modelUrl: "/attached_assets/GLBTokyo.glb",
      },
      {
        name: "X402 TIE",
        description: "Signal-stitched tie with reflective X402 weave and integrated NFC tag. Ships with magnetic keeper clip.",
        price: "110.00",
        category: "accessories",
        imageUrl: "/attached_assets/ProdTie.png",
        homePageImageUrl: "/attached_assets/StreetTie.mp4",
        shopImageUrl: "/attached_assets/RobotTie.png",
        images: [
          "/attached_assets/ProdTie.png",
          "/attached_assets/RobotTie.png",
        ],
        inventory: { "OS": 24 },
        modelUrl: "/attached_assets/GLBTie.glb",
      },
      {
        name: "X402 CALL TEE",
        description: "Dial-in distress call from the future. Retro flip phone plus chrome gauntlet finished with holo-foil grid hits.",
        price: "85.00",
        category: "tees",
        imageUrl: "/attached_assets/ProdCall.png",
        homePageImageUrl: "/attached_assets/StreetCall2.png",
        shopImageUrl: "/attached_assets/RobotCall.png",
        images: [
          "/attached_assets/ProdCall.png",
          "/attached_assets/RobotCall.png",
        ],
        inventory: { "S": 12, "M": 20, "L": 16, "XL": 10 },
        modelUrl: "/attached_assets/GLBCall.glb",
      },
      {
        name: "CLANKERS BMX HOODIE",
        description: "Charcoal heavyweight fleece with midnight ride print. Oversized drop shoulders, ribbed cuffs, reinforced pocket seams.",
        price: "140.00",
        category: "hoodies",
        imageUrl: "/attached_assets/ProdGTA.png",
        homePageImageUrl: "/attached_assets/StreetGTA.png",
        shopImageUrl: "/attached_assets/RobotGTA.png",
        images: [
          "/attached_assets/ProdGTA.png",
          "/attached_assets/RobotGTA.png",
        ],
        inventory: { "S": 8, "M": 14, "L": 12, "XL": 8 },
        modelUrl: "/attached_assets/GLBGTA.glb",
      },
      {
        name: "PROVE YOU\'RE NOT HUMAN",
        description: "Verification glitch tee with security cam overlays and evidence tags. Printed on enzyme-washed cotton for archival softness.",
        price: "75.00",
        category: "tees",
        imageUrl: "/attached_assets/ProdProve.png",
        homePageImageUrl: "/attached_assets/StreetCall.png",
        shopImageUrl: "/attached_assets/RobotProve.png",
        images: [
          "/attached_assets/ProdProve.png",
          "/attached_assets/RobotProve.png",
        ],
        inventory: { "S": 10, "M": 16, "L": 15, "XL": 9 },
        modelUrl: "/attached_assets/GLBProve.glb",
      },
    ];

    await db.insert(products).values(sampleProducts);
  }

  async seedAdmin(): Promise<void> {
    // Never seed admin in production; skip instead of crashing if misconfigured
    if (process.env.NODE_ENV !== "development") {
      if (process.env.SEED_ADMIN === "true") {
        console.warn("[Security] SEED_ADMIN is set but ignored in production. Skipping admin seeding.");
      }
      return;
    }

    // Only seed admin in development mode and if explicitly enabled
    if (process.env.SEED_ADMIN !== "true") {
      return;
    }

    const adminUsername = process.env.ADMIN_USERNAME || "admin";
    const existingAdmin = await this.getUserByUsername(adminUsername);
    if (existingAdmin) return;

    // Using environment variables for credentials (or defaults in development)
    const adminEmail = process.env.ADMIN_EMAIL || "admin@offhuman.store";
    const adminPassword = process.env.ADMIN_PASSWORD || "admin123";

    await this.createUser({
      username: adminUsername,
      email: adminEmail,
      password: adminPassword,
    });

    // Update the user to be an admin
    const adminUser = await this.getUserByUsername(adminUsername);
    if (adminUser) {
      await db.update(users)
        .set({ isAdmin: true })
        .where(eq(users.id, adminUser.id));
    }

    console.log(`[Security Warning] Admin user seeded with default credentials. Please change password immediately!`);
  }

  async createAdminUser(username: string, email: string, password: string): Promise<void> {
    const existingUser = await this.getUserByUsername(username);
    if (existingUser) {
      throw new Error("Username already exists");
    }

    await this.createUser({ username, email, password });

    const adminUser = await this.getUserByUsername(username);
    if (adminUser) {
      await db.update(users)
        .set({ isAdmin: true })
        .where(eq(users.id, adminUser.id));
    }
  }
}

export const dbStorage = new DbStorage();

