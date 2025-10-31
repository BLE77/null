// Vercel will compile this TypeScript file automatically
import type { IncomingMessage, ServerResponse } from "http";
import type { Express } from "express";
// Note: For ES modules, we use .js extension even when importing from .ts files
// Vercel's TypeScript compiler will resolve this correctly
import { createApp } from "../server/app.js";

let appPromise: Express.Express | null = null;
let appError: Error | null = null;

async function getApp() {
  if (appError) {
    throw appError;
  }
  
  if (!appPromise) {
    try {
      console.log("[API] Initializing app...");
      const bundle = await createApp();
      appPromise = bundle.app;
      console.log("[API] App initialized successfully");
    } catch (error: any) {
      console.error("[API] Failed to initialize app:", error);
      appError = error;
      throw error;
    }
  }
  return appPromise;
}

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  try {
    console.log(`[API] ${req.method} ${req.url}`);
    const app = await getApp();
    // @ts-ignore Express handler signature
    return app(req, res);
  } catch (error: any) {
    console.error("[API] Handler error:", error);
    res.statusCode = 500;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ 
      message: "Internal server error", 
      error: process.env.NODE_ENV === "development" ? error.message : undefined 
    }));
  }
}

