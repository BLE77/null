import type { IncomingMessage, ServerResponse } from "http";
import { dbStorage } from "../../server/db-storage.js";

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  try {
    const url = new URL(req.url || "", "http://localhost");
    const id = url.pathname.split("/").pop();

    if (!id) {
      res.statusCode = 400;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify({ message: "Product id is required" }));
      return;
    }

    const product = await dbStorage.getProduct(id);

    if (!product) {
      res.statusCode = 404;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify({ message: "Product not found" }));
      return;
    }

    res.statusCode = 200;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify(product));
  } catch (error: any) {
    console.error(`[ /api/products/:id ] Error:`, error);
    res.statusCode = 500;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ message: "Failed to fetch product" }));
  }
}

