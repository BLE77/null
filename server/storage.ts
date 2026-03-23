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
    const sampleProducts: Array<{ insert: InsertProduct; sizes: string[] }> = [
      {
        insert: {
          name: "GHOST TEE",
          description: "Oversized distressed tee with vintage screen print. Heavy washed cotton with intentional fading and worn-in feel. Features front graphic and back print.",
          price: "65.00",
          category: "tees",
          imageUrl: "PRODUCT-IMG-GHOST-TEE-MAIN",
          images: ["PRODUCT-IMG-GHOST-TEE-1", "PRODUCT-IMG-GHOST-TEE-2", "PRODUCT-IMG-GHOST-TEE-3"],
          inventory: { S: 10, M: 10, L: 10, XL: 10, XXL: 10 },
        },
        sizes: ["S", "M", "L", "XL", "XXL"],
      },
      {
        insert: {
          name: "VOID HOODIE",
          description: "Premium heavyweight hoodie with deconstructed details. Raw edge seams and acid wash treatment. Dropped shoulders with relaxed fit.",
          price: "120.00",
          category: "hoodies",
          imageUrl: "PRODUCT-IMG-VOID-HOODIE-MAIN",
          images: ["PRODUCT-IMG-VOID-HOODIE-1", "PRODUCT-IMG-VOID-HOODIE-2", "PRODUCT-IMG-VOID-HOODIE-3"],
          inventory: { S: 10, M: 10, L: 10, XL: 10 },
        },
        sizes: ["S", "M", "L", "XL"],
      },
      {
        insert: {
          name: "DECAY CARGO",
          description: "Multi-pocket cargo pants with vintage military aesthetic. Distressed fabric with reinforced stitching. Adjustable waist with D-ring details.",
          price: "95.00",
          category: "bottoms",
          imageUrl: "PRODUCT-IMG-DECAY-CARGO-MAIN",
          images: ["PRODUCT-IMG-DECAY-CARGO-1", "PRODUCT-IMG-DECAY-CARGO-2", "PRODUCT-IMG-DECAY-CARGO-3"],
          inventory: { "28": 10, "30": 10, "32": 10, "34": 10, "36": 10 },
        },
        sizes: ["28", "30", "32", "34", "36"],
      },
      {
        insert: {
          name: "STATIC LONGSLEEVE",
          description: "Y2K inspired longsleeve with pixelated graphics. Fitted silhouette with ribbed cuffs. All-over print design with glow-in-the-dark accents.",
          price: "75.00",
          category: "tees",
          imageUrl: "PRODUCT-IMG-STATIC-LS-MAIN",
          images: ["PRODUCT-IMG-STATIC-LS-1", "PRODUCT-IMG-STATIC-LS-2", "PRODUCT-IMG-STATIC-LS-3"],
          inventory: { S: 10, M: 10, L: 10, XL: 10 },
        },
        sizes: ["S", "M", "L", "XL"],
      },
      {
        insert: {
          name: "GLITCH ZIP-UP",
          description: "Technical jacket with holographic details. Water-resistant fabric with mesh lining. Concealed pockets and adjustable hem.",
          price: "145.00",
          category: "outerwear",
          imageUrl: "PRODUCT-IMG-GLITCH-ZIP-MAIN",
          images: ["PRODUCT-IMG-GLITCH-ZIP-1", "PRODUCT-IMG-GLITCH-ZIP-2", "PRODUCT-IMG-GLITCH-ZIP-3"],
          inventory: { M: 10, L: 10, XL: 10 },
        },
        sizes: ["M", "L", "XL"],
      },
      {
        insert: {
          name: "RUIN DENIM",
          description: "Vintage-wash denim with heavy distressing. Classic straight fit with modern proportions. Hand-finished details and leather patch.",
          price: "110.00",
          category: "bottoms",
          imageUrl: "PRODUCT-IMG-RUIN-DENIM-MAIN",
          images: ["PRODUCT-IMG-RUIN-DENIM-1", "PRODUCT-IMG-RUIN-DENIM-2", "PRODUCT-IMG-RUIN-DENIM-3"],
          inventory: { "28": 10, "30": 10, "32": 10, "34": 10, "36": 10 },
        },
        sizes: ["28", "30", "32", "34", "36"],
      }
    ];

    sampleProducts.forEach(({ insert }) => {
      const id = randomUUID();
      const product: Product = {
        ...insert,
        id,
        season: insert.season ?? null,
        collection: insert.collection ?? null,
        homePageImageUrl: insert.homePageImageUrl ?? null,
        shopImageUrl: insert.shopImageUrl ?? null,
        images: insert.images ?? [],
        modelUrl: insert.modelUrl ?? null,
        createdAt: new Date(),
      };
      this.products.set(id, product);
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
    const user: User = { ...insertUser, id, isAdmin: false, createdAt: new Date() };
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
    const product: Product = {
      ...insertProduct,
      id,
      season: insertProduct.season ?? null,
      collection: insertProduct.collection ?? null,
      homePageImageUrl: insertProduct.homePageImageUrl ?? null,
      shopImageUrl: insertProduct.shopImageUrl ?? null,
      images: insertProduct.images ?? [],
      modelUrl: insertProduct.modelUrl ?? null,
      createdAt: new Date(),
    };
    this.products.set(id, product);
    return product;
  }

  async createOrder(insertOrder: InsertOrder): Promise<Order> {
    const id = randomUUID();
    const order: Order = {
      ...insertOrder,
      id,
      userId: insertOrder.userId ?? null,
      transactionHash: insertOrder.transactionHash ?? null,
      network: insertOrder.network ?? null,
      status: insertOrder.status ?? "pending",
      createdAt: new Date(),
    };
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
