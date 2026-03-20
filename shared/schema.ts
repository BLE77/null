import { sql } from "drizzle-orm";
import { pgTable, text, varchar, decimal, integer, boolean, timestamp, json, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").notNull().unique(),
  isAdmin: boolean("is_admin").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const products = pgTable("products", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description").notNull(),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  category: text("category").notNull(),
  season: text("season"),
  collection: text("collection"),
  imageUrl: text("image_url").notNull(), // Legacy field for backwards compatibility
  homePageImageUrl: text("home_page_image_url"), // Image for home page "Latest Collection"
  shopImageUrl: text("shop_image_url"), // Image for shop page product cards
  images: text("images").array().notNull().default(sql`ARRAY[]::text[]`),
  inventory: json("inventory").notNull(),
  modelUrl: text("model_url"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const orders = pgTable("orders", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id"),
  customerEmail: text("customer_email").notNull(),
  items: text("items").notNull(),
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }).notNull(),
  transactionHash: text("transaction_hash"),
  network: text("network"),
  trackingToken: text("tracking_token").notNull().unique(),
  status: text("status").notNull().default("pending"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  isAdmin: true,
});

export const insertProductSchema = createInsertSchema(products).omit({
  id: true,
  createdAt: true,
});

export const agentIdentities = pgTable("agent_identities", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  agentAddress: text("agent_address").notNull().unique(),
  tokenId: integer("token_id").notNull(),
  tbaAddress: text("tba_address").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type AgentIdentity = typeof agentIdentities.$inferSelect;

export const agentInteractions = pgTable(
  "agent_interactions",
  {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    walletAddress: text("wallet_address").notNull(),
    interactionType: text("interaction_type").notNull(), // equip | fitting_room | purchase
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [index("agent_interactions_wallet_idx").on(t.walletAddress)]
);

export const insertOrderSchema = createInsertSchema(orders).omit({
  id: true,
  createdAt: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type Product = typeof products.$inferSelect;
export type InsertProduct = z.infer<typeof insertProductSchema>;
export type Order = typeof orders.$inferSelect;
export type InsertOrder = z.infer<typeof insertOrderSchema>;
export type AgentInteraction = typeof agentInteractions.$inferSelect;

export interface ProductInventory {
  [size: string]: number;
}

export interface CartItem {
  product: Product;
  size: string;
  quantity: number;
}

export function getProductSizes(product: Product): string[] {
  const inventory = product.inventory as ProductInventory;
  return Object.keys(inventory);
}

export function getProductStock(product: Product, size: string): number {
  const inventory = product.inventory as ProductInventory;
  return inventory[size] || 0;
}

export function isProductInStock(product: Product): boolean {
  const inventory = product.inventory as ProductInventory;
  return Object.values(inventory).some(stock => stock > 0);
}
