import type { IncomingMessage, ServerResponse } from "http";
import { db } from "../server/db.js";
import { sql } from "drizzle-orm";

export default async function handler(_req: IncomingMessage, res: ServerResponse) {
  try {
    const productsCountRes: any = await (db as any).execute(sql`select count(*)::int as count from products`);
    const ordersCountRes: any = await (db as any).execute(sql`select count(*)::int as count from orders`);

    res.statusCode = 200;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({
      ok: true,
      env: { DATABASE_URL: !!process.env.DATABASE_URL, VERCEL: !!process.env.VERCEL },
      db: {
        products: productsCountRes?.rows?.[0]?.count ?? null,
        orders: ordersCountRes?.rows?.[0]?.count ?? null,
      },
      time: new Date().toISOString(),
    }));
  } catch (error: any) {
    res.statusCode = 500;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ ok: false, message: error?.message || "health check failed" }));
  }
}

