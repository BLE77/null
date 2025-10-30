import { db } from "./db";
import { users, products, orders, type User, type InsertUser, type Product, type InsertProduct, type Order, type InsertOrder, type ProductInventory } from "@shared/schema";
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

  async updateOrder(id: string, updates: Partial<InsertOrder>): Promise<Order | undefined> {
    const [order] = await db.update(orders)
      .set(updates)
      .where(eq(orders.id, id))
      .returning();
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
        name: "X402 PROTOCOL TEE",
        description: "Cybernetic hands exchanging encrypted data. Oversized fit with airbrushed gradient graphics on premium heavyweight cotton. Features X402 branding and distressed finish.",
        price: "5.00",
        category: "tees",
        imageUrl: "@assets/ChatGPT Image Oct 25, 2025, 04_51_32 PM_1761436509620.png",
        images: ["@assets/ChatGPT Image Oct 25, 2025, 04_51_32 PM_1761436509620.png"],
        inventory: { "S": 15, "M": 20, "L": 18, "XL": 12 },
      },
      {
        name: "CLANKERS TOKYO",
        description: "Neon green cyberpunk skull with Japanese クレンケス graphics. Retro-tech aesthetic on acid-washed cotton. Bold statement piece with vintage Y2K vibes.",
        price: "4.00",
        category: "tees",
        imageUrl: "@assets/ChatGPT Image Oct 25, 2025, 04_49_09 PM_1761436509620.png",
        images: ["@assets/ChatGPT Image Oct 25, 2025, 04_49_09 PM_1761436509620.png"],
        inventory: { "S": 12, "M": 18, "L": 16, "XL": 10 },
      },
      {
        name: "PROVE YOU'RE NOT HUMAN",
        description: "Dystopian identity verification graphic with glitch effects. Green screen-printed design on distressed vintage tee. Question everything in the digital age.",
        price: "3.00",
        category: "tees",
        imageUrl: "@assets/prove_1761436638560.png",
        images: ["@assets/prove_1761436638560.png"],
        inventory: { "S": 10, "M": 15, "L": 14, "XL": 8 },
      },
      {
        name: "X402 CALL TEE",
        description: "Retro-futuristic phone with robotic hand and X402 glitch text. Premium print on heavyweight cotton. Nostalgic tech meets cyber streetwear aesthetic.",
        price: "4.00",
        category: "tees",
        imageUrl: "@assets/402 call_1761436644815.png",
        images: ["@assets/402 call_1761436644815.png"],
        inventory: { "S": 14, "M": 20, "L": 16, "XL": 10 },
      },
      {
        name: "CLANKERS BMX HOODIE",
        description: "Robot riding BMX with C-star branding. Premium heavyweight hoodie in vintage charcoal wash. Dropped shoulders and relaxed fit for maximum comfort.",
        price: "5.00",
        category: "hoodies",
        imageUrl: "@assets/clankersar_1761436647628.png",
        images: ["@assets/clankersar_1761436647628.png"],
        inventory: { "S": 8, "M": 12, "L": 10, "XL": 6 },
      },
      {
        name: "CYBER ARMS LONGSLEEVE",
        description: "Geometric robotic arms sleeve print with chest emblem. Cropped fit oversized tee with extended sleeves. Technical graphics meet Y2K fashion aesthetics.",
        price: "5.00",
        category: "tees",
        imageUrl: "@assets/long sleeve_1761436670427.png",
        images: ["@assets/long sleeve_1761436670427.png"],
        inventory: { "S": 10, "M": 14, "L": 12, "XL": 8 },
      }
    ];

    await db.insert(products).values(sampleProducts);
  }

  async seedAdmin(): Promise<void> {
    // Fail fast if SEED_ADMIN is enabled in non-development environment
    if (process.env.SEED_ADMIN === "true" && process.env.NODE_ENV !== "development") {
      throw new Error("CRITICAL: SEED_ADMIN cannot be enabled in production! This is a security risk.");
    }

    // Only seed admin in development mode and if explicitly enabled
    if (process.env.NODE_ENV !== "development" || process.env.SEED_ADMIN !== "true") {
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
