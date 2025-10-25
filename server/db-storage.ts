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

  async getOrder(id: string): Promise<Order | undefined> {
    const [order] = await db.select().from(orders).where(eq(orders.id, id));
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
        name: "GHOST TEE",
        description: "Oversized distressed tee with vintage screen print. Heavy washed cotton with intentional fading and worn-in feel. Features front graphic and back print.",
        price: "65.00",
        category: "tees",
        imageUrl: "PRODUCT-IMG-GHOST-TEE-MAIN",
        images: ["PRODUCT-IMG-GHOST-TEE-1", "PRODUCT-IMG-GHOST-TEE-2", "PRODUCT-IMG-GHOST-TEE-3"],
        inventory: { S: 15, M: 20, L: 18, XL: 12, XXL: 8 },
      },
      {
        name: "VOID HOODIE",
        description: "Premium heavyweight hoodie with deconstructed details. Raw edge seams and acid wash treatment. Dropped shoulders with relaxed fit.",
        price: "120.00",
        category: "hoodies",
        imageUrl: "PRODUCT-IMG-VOID-HOODIE-MAIN",
        images: ["PRODUCT-IMG-VOID-HOODIE-1", "PRODUCT-IMG-VOID-HOODIE-2", "PRODUCT-IMG-VOID-HOODIE-3"],
        inventory: { S: 10, M: 15, L: 12, XL: 8 },
      },
      {
        name: "DECAY CARGO",
        description: "Multi-pocket cargo pants with vintage military aesthetic. Distressed fabric with reinforced stitching. Adjustable waist with D-ring details.",
        price: "95.00",
        category: "bottoms",
        imageUrl: "PRODUCT-IMG-DECAY-CARGO-MAIN",
        images: ["PRODUCT-IMG-DECAY-CARGO-1", "PRODUCT-IMG-DECAY-CARGO-2", "PRODUCT-IMG-DECAY-CARGO-3"],
        inventory: { "28": 8, "30": 12, "32": 15, "34": 10, "36": 7 },
      },
      {
        name: "STATIC LONGSLEEVE",
        description: "Y2K inspired longsleeve with pixelated graphics. Fitted silhouette with ribbed cuffs. All-over print design with glow-in-the-dark accents.",
        price: "75.00",
        category: "tees",
        imageUrl: "PRODUCT-IMG-STATIC-LS-MAIN",
        images: ["PRODUCT-IMG-STATIC-LS-1", "PRODUCT-IMG-STATIC-LS-2", "PRODUCT-IMG-STATIC-LS-3"],
        inventory: { S: 12, M: 18, L: 14, XL: 10 },
      },
      {
        name: "GLITCH ZIP-UP",
        description: "Technical jacket with holographic details. Water-resistant fabric with mesh lining. Concealed pockets and adjustable hem.",
        price: "145.00",
        category: "outerwear",
        imageUrl: "PRODUCT-IMG-GLITCH-ZIP-MAIN",
        images: ["PRODUCT-IMG-GLITCH-ZIP-1", "PRODUCT-IMG-GLITCH-ZIP-2", "PRODUCT-IMG-GLITCH-ZIP-3"],
        inventory: { M: 8, L: 10, XL: 6 },
      },
      {
        name: "RUIN DENIM",
        description: "Vintage-wash denim with heavy distressing. Classic straight fit with modern proportions. Hand-finished details and leather patch.",
        price: "110.00",
        category: "bottoms",
        imageUrl: "PRODUCT-IMG-RUIN-DENIM-MAIN",
        images: ["PRODUCT-IMG-RUIN-DENIM-1", "PRODUCT-IMG-RUIN-DENIM-2", "PRODUCT-IMG-RUIN-DENIM-3"],
        inventory: { "28": 7, "30": 10, "32": 12, "34": 9, "36": 6 },
      }
    ];

    await db.insert(products).values(sampleProducts);
  }
}

export const dbStorage = new DbStorage();
