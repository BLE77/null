import type { IncomingMessage, ServerResponse } from "http";
import { createRequire } from "module";

const require = createRequire(import.meta.url);

function toCamel(obj: any): any {
  if (Array.isArray(obj)) return obj.map(toCamel);
  if (obj && typeof obj === "object") {
    return Object.fromEntries(
      Object.entries(obj).map(([k, v]) => [
        k.replace(/_([a-z])/g, (_, c) => c.toUpperCase()),
        toCamel(v),
      ])
    );
  }
  return obj;
}

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  const url = new URL(req.url || "", "http://localhost");
  const id = url.pathname.split("/").pop();

  if (!id) {
    res.statusCode = 400;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ message: "Product id is required" }));
    return;
  }

  let product: any | null = null;

  try {
    const { dbStorage } = await import("../../server/db-storage.js");
    product = await dbStorage.getProduct(id) ?? null;
  } catch (dbError: any) {
    console.warn(`[/api/products/:id] DB unavailable, falling back to products.json:`, dbError.message);
    try {
      const raw: any[] = require("../../products.json");
      const match = raw.find((p: any) => p.id === id);
      product = match ? toCamel(match) : null;
    } catch (jsonError: any) {
      console.error(`[/api/products/:id] products.json fallback failed:`, jsonError);
    }
  }

  if (product === null) {
    res.statusCode = 404;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ message: "Product not found" }));
    return;
  }

  res.statusCode = 200;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(product));
}

