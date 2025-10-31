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
    console.log(`[API Handler] ${req.method} ${req.url || req.headers['x-forwarded-url'] || 'unknown'}`);
    console.log(`[API Handler] Path: ${(req as any).url || req.url}`);
    
    const app = await getApp();
    console.log(`[API Handler] App obtained, calling Express handler`);
    
    // Express app handles the response asynchronously
    // We need to call it but not await it - it will handle res.end() internally
    app(req as any, res as any);
    
    // Return undefined immediately - Express will handle the response
    return undefined;
  } catch (error: any) {
    console.error("[API Handler] Fatal error:", error);
    console.error("[API Handler] Error stack:", error?.stack);
    console.error("[API Handler] Error message:", error?.message);
    
    if (!res.headersSent) {
      res.statusCode = 500;
      res.setHeader("Content-Type", "application/json");
      const errorResponse = {
        message: "Internal server error",
        error: process.env.NODE_ENV === "development" ? error?.message : undefined,
        stack: process.env.NODE_ENV === "development" ? error?.stack : undefined
      };
      res.end(JSON.stringify(errorResponse));
    }
    return undefined;
  }
}

