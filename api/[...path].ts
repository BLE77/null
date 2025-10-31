// Vercel will compile this TypeScript file automatically
import type { IncomingMessage, ServerResponse } from "http";
import type { Express as ExpressType } from "express";
// Note: For ES modules, we use .js extension even when importing from .ts files
// Vercel's TypeScript compiler will resolve this correctly
import { createApp } from "../server/app.js";

let appPromise: ExpressType | null = null;
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
    // Express handler signature
    return new Promise((resolve, reject) => {
      app(req as any, res as any, (err?: any) => {
        if (err) {
          console.error("[API] Express error:", err);
          reject(err);
        } else {
          resolve(undefined);
        }
      });
    });
  } catch (error: any) {
    console.error("[API] Handler error:", error);
    if (!res.headersSent) {
      res.statusCode = 500;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify({ 
        message: "Internal server error", 
        error: process.env.NODE_ENV === "development" ? error.message : undefined 
      }));
    }
  }
}

