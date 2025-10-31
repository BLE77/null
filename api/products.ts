// Vercel will compile this TypeScript file automatically
import type { IncomingMessage, ServerResponse } from "http";
import { dbStorage } from "../server/db-storage.js";

export default async function handler(_req: IncomingMessage, res: ServerResponse) {
  try {
    const products = await dbStorage.getAllProducts();
    res.statusCode = 200;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify(products));
  } catch (error: any) {
    console.error("[/api/products] Error:", error);
    res.statusCode = 500;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ message: "Failed to fetch products" }));
  }
}

