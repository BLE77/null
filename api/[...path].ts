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
      console.error("[API] Error stack:", error?.stack);
      appError = error;
      throw error;
    }
  }
  return appPromise;
}

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  try {
    const url = req.url || '/';
    console.log(`[API Handler] ${req.method} ${url}`);
    
    const app = await getApp();
    
    // Wrap Express handler in a Promise to properly handle async responses
    return new Promise<void>((resolve, reject) => {
      // Create a wrapper for res.end to detect when Express finishes
      const originalEnd = res.end.bind(res);
      const originalOn = res.on.bind(res);
      
      let finished = false;
      
      // Override res.end to detect completion
      res.end = function(chunk?: any, encoding?: any, cb?: any) {
        if (!finished) {
          finished = true;
          console.log(`[API Handler] Response ending with status ${res.statusCode}`);
          const result = originalEnd(chunk, encoding, cb);
          resolve();
          return result;
        }
        return originalEnd(chunk, encoding, cb);
      };
      
      // Handle 'finish' event as well
      res.on('finish', () => {
        if (!finished) {
          finished = true;
          console.log(`[API Handler] Response finished with status ${res.statusCode}`);
          resolve();
        }
      });
      
      // Handle errors
      res.on('error', (err) => {
        console.error("[API Handler] Response error:", err);
        if (!finished) {
          finished = true;
          reject(err);
        }
      });
      
      // Call Express app
      try {
        app(req as any, res as any, (err?: any) => {
          if (err) {
            console.error("[API Handler] Express error:", err);
            if (!finished) {
              finished = true;
              reject(err);
            }
          } else if (!finished && res.headersSent) {
            // Response sent but not finished yet, wait for finish event
            console.log("[API Handler] Express finished, waiting for response");
          }
        });
      } catch (expressError: any) {
        console.error("[API Handler] Express handler threw:", expressError);
        if (!finished) {
          finished = true;
          reject(expressError);
        }
      }
      
      // Timeout after 10 seconds if response hasn't finished
      setTimeout(() => {
        if (!finished) {
          finished = true;
          console.error("[API Handler] Timeout waiting for response");
          if (!res.headersSent) {
            res.statusCode = 504;
            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify({ message: "Gateway timeout" }));
          }
          resolve();
        }
      }, 10000);
    });
  } catch (error: any) {
    console.error("[API Handler] Fatal error:", error);
    console.error("[API Handler] Error stack:", error?.stack);
    console.error("[API Handler] Error message:", error?.message);
    
    if (!res.headersSent) {
      res.statusCode = 500;
      res.setHeader("Content-Type", "application/json");
      const errorResponse = {
        message: "Internal server error",
        error: process.env.NODE_ENV === "development" ? error.message : undefined,
        stack: process.env.NODE_ENV === "development" ? error?.stack : undefined
      };
      res.end(JSON.stringify(errorResponse));
    }
    return undefined;
  }
}
