import { drizzle } from "drizzle-orm/neon-serverless";
import { Pool, neonConfig } from "@neondatabase/serverless";
import ws from "ws";
import * as schema from "../shared/schema.js";

neonConfig.webSocketConstructor = ws;

const rawUrl = process.env.DATABASE_URL;
if (!rawUrl) {
  console.error("DATABASE_URL environment variable is required");
  throw new Error("DATABASE_URL environment variable is required");
}

// Strip unsupported query params like channel_binding that can break Neon serverless driver
const sanitizedUrl = rawUrl.replace(/([?&])channel_binding=[^&]*&?/g, "$1").replace(/[?&]$/, "");
if (sanitizedUrl !== rawUrl) {
  console.log("[DB] Stripped unsupported channel_binding from DATABASE_URL");
}

console.log("Database connection initialized (DATABASE_URL is set)");

const pool = new Pool({ connectionString: sanitizedUrl });
export const db = drizzle(pool, { schema });

