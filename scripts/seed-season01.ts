/**
 * Seed script: insert all 10 Season 01 physical garments into the products table.
 * Safe to run multiple times — skips existing products by ID.
 *
 * Usage:
 *   npx tsx scripts/seed-season01.ts
 */
import "dotenv/config";
import { db } from "../server/db.js";
import { products } from "../shared/schema.js";
import { eq } from "drizzle-orm";
import { createRequire } from "module";

const require = createRequire(import.meta.url);
const season01: any[] = require("../products.json");

async function main() {
  console.log("[seed-season01] Starting Season 01 seed...");

  for (const p of season01) {
    const existing = await db
      .select({ id: products.id })
      .from(products)
      .where(eq(products.id, p.id));

    if (existing.length > 0) {
      console.log(`[SKIP] ${p.name} (${p.id}) already in DB`);
      continue;
    }

    await db.insert(products).values({
      id: p.id,
      name: p.name,
      description: p.description,
      price: p.price,
      category: p.category,
      imageUrl: p.image_url,
      shopImageUrl: p.shop_image_url ?? p.image_url,
      homePageImageUrl: p.home_page_image_url ?? p.images?.[1] ?? p.image_url,
      images: p.images ?? [p.image_url],
      inventory: p.inventory,
      modelUrl: p.model_url ?? null,
    });

    console.log(`[OK] Seeded ${p.name} — $${p.price} USDC`);
  }

  console.log("[seed-season01] Done.");
  process.exit(0);
}

main().catch((err) => {
  console.error("[seed-season01] Error:", err);
  process.exit(1);
});
