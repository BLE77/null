// Vercel will compile this TypeScript file automatically
import type { IncomingMessage, ServerResponse } from "http";
import { createRequire } from "module";

const require = createRequire(import.meta.url);

// Snake_case -> camelCase transform for products.json fallback
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

export default async function handler(_req: IncomingMessage, res: ServerResponse) {
  // Try DB first, fall back to products.json if DB is unavailable
  let products: any[] | null = null;

  try {
    const { dbStorage } = await import("../server/db-storage.js");
    await dbStorage.seedProducts();
    products = await dbStorage.getAllProducts();
  } catch (dbError: any) {
    console.warn("[/api/products] DB unavailable, falling back to products.json:", dbError.message);
    try {
      const raw: any[] = require("../products.json");
      products = toCamel(raw);
    } catch (jsonError: any) {
      console.error("[/api/products] products.json fallback failed:", jsonError);
    }
  }

  if (products !== null) {
    res.statusCode = 200;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify(products));
  } else {
    res.statusCode = 500;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ message: "Failed to fetch products" }));
  }
}

