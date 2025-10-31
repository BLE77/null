import { type User, type InsertUser, type Product, type InsertProduct, type Order, type InsertOrder } from "../shared/schema.js";
import { randomUUID } from "crypto";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  getAllProducts(): Promise<Product[]>;
  getProduct(id: string): Promise<Product | undefined>;
  getProductsByCategory(category: string): Promise<Product[]>;
  createProduct(product: InsertProduct): Promise<Product>;
  
  createOrder(order: InsertOrder): Promise<Order>;
  getOrder(id: string): Promise<Order | undefined>;
  getOrderByTrackingToken(trackingToken: string): Promise<Order | undefined>;
  getAllOrders(): Promise<Order[]>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private products: Map<string, Product>;
  private orders: Map<string, Order>;

  constructor() {
    this.users = new Map();
    this.products = new Map();
    this.orders = new Map();
    this.seedProducts();
  }

  private seedProducts() {
    const sampleProducts: InsertProduct[] = [
      {
        name: "GHOST TEE",
        description: "Oversized distressed tee with vintage screen print. Heavy washed cotton with intentional fading and worn-in feel. Features front graphic and back print.",
        price: "65.00",
        category: "tees",
        imageUrl: "PRODUCT-IMG-GHOST-TEE-MAIN",
        images: ["PRODUCT-IMG-GHOST-TEE-1", "PRODUCT-IMG-GHOST-TEE-2", "PRODUCT-IMG-GHOST-TEE-3"],
        sizes: ["S", "M", "L", "XL", "XXL"],
        inStock: 1
      },
      {
        name: "VOID HOODIE",
        description: "Premium heavyweight hoodie with deconstructed details. Raw edge seams and acid wash treatment. Dropped shoulders with relaxed fit.",
        price: "120.00",
        category: "hoodies",
        imageUrl: "PRODUCT-IMG-VOID-HOODIE-MAIN",
        images: ["PRODUCT-IMG-VOID-HOODIE-1", "PRODUCT-IMG-VOID-HOODIE-2", "PRODUCT-IMG-VOID-HOODIE-3"],
        sizes: ["S", "M", "L", "XL"],
        inStock: 1
      },
      {
        name: "DECAY CARGO",
        description: "Multi-pocket cargo pants with vintage military aesthetic. Distressed fabric with reinforced stitching. Adjustable waist with D-ring details.",
        price: "95.00",
        category: "bottoms",
        imageUrl: "PRODUCT-IMG-DECAY-CARGO-MAIN",
        images: ["PRODUCT-IMG-DECAY-CARGO-1", "PRODUCT-IMG-DECAY-CARGO-2", "PRODUCT-IMG-DECAY-CARGO-3"],
        sizes: ["28", "30", "32", "34", "36"],
        inStock: 1
      },
      {
        name: "STATIC LONGSLEEVE",
        description: "Y2K inspired longsleeve with pixelated graphics. Fitted silhouette with ribbed cuffs. All-over print design with glow-in-the-dark accents.",
        price: "75.00",
        category: "tees",
        imageUrl: "PRODUCT-IMG-STATIC-LS-MAIN",
        images: ["PRODUCT-IMG-STATIC-LS-1", "PRODUCT-IMG-STATIC-LS-2", "PRODUCT-IMG-STATIC-LS-3"],
        sizes: ["S", "M", "L", "XL"],
        inStock: 1
      },
      {
        name: "GLITCH ZIP-UP",
        description: "Technical jacket with holographic details. Water-resistant fabric with mesh lining. Concealed pockets and adjustable hem.",
        price: "145.00",
        category: "outerwear",
        imageUrl: "PRODUCT-IMG-GLITCH-ZIP-MAIN",
        images: ["PRODUCT-IMG-GLITCH-ZIP-1", "PRODUCT-IMG-GLITCH-ZIP-2", "PRODUCT-IMG-GLITCH-ZIP-3"],
        sizes: ["M", "L", "XL"],
        inStock: 1
      },
      {
        name: "RUIN DENIM",
        description: "Vintage-wash denim with heavy distressing. Classic straight fit with modern proportions. Hand-finished details and leather patch.",
        price: "110.00",
        category: "bottoms",
        imageUrl: "PRODUCT-IMG-RUIN-DENIM-MAIN",
        images: ["PRODUCT-IMG-RUIN-DENIM-1", "PRODUCT-IMG-RUIN-DENIM-2", "PRODUCT-IMG-RUIN-DENIM-3"],
        sizes: ["28", "30", "32", "34", "36"],
        inStock: 1
      }
    ];

    sampleProducts.forEach(product => {
      const id = randomUUID();
      this.products.set(id, { ...product, id });
    });
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async getAllProducts(): Promise<Product[]> {
    return Array.from(this.products.values());
  }

  async getProduct(id: string): Promise<Product | undefined> {
    return this.products.get(id);
  }

  async getProductsByCategory(category: string): Promise<Product[]> {
    return Array.from(this.products.values()).filter(
      (product) => product.category === category
    );
  }

  async createProduct(insertProduct: InsertProduct): Promise<Product> {
    const id = randomUUID();
    const product: Product = { ...insertProduct, id };
    this.products.set(id, product);
    return product;
  }

  async createOrder(insertOrder: InsertOrder): Promise<Order> {
    const id = randomUUID();
    const createdAt = new Date().toISOString();
    const order: Order = { ...insertOrder, id, createdAt };
    this.orders.set(id, order);
    return order;
  }

  async getOrder(id: string): Promise<Order | undefined> {
    return this.orders.get(id);
  }

  async getOrderByTrackingToken(trackingToken: string): Promise<Order | undefined> {
    return Array.from(this.orders.values()).find(
      (order) => order.trackingToken === trackingToken
    );
  }

  async getAllOrders(): Promise<Order[]> {
    return Array.from(this.orders.values());
  }
}

export const storage = new MemStorage();
