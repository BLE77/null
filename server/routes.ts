import type { Express } from "express";
import { createServer, type Server } from "http";
import { dbStorage } from "./db-storage";
import { insertProductSchema, insertOrderSchema } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
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

  app.post("/api/orders", async (req, res) => {
    try {
      const validatedOrder = insertOrderSchema.parse(req.body);
      const order = await dbStorage.createOrder(validatedOrder);
      res.status(201).json(order);
    } catch (error) {
      res.status(400).json({ message: "Invalid order data" });
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

  const httpServer = createServer(app);

  return httpServer;
}
