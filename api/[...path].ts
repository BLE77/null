// Vercel will compile this TypeScript file automatically
import type { IncomingMessage, ServerResponse } from "http";
import { handleWithExpress } from "./_express-app.js";

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  try {
    const url = req.url || '/';
    console.log(`[API Handler] ${req.method} ${url}`);
    
    await handleWithExpress(req, res);
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
