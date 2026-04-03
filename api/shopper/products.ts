import type { IncomingMessage, ServerResponse } from "http";
import { createRequire } from "module";

const require = createRequire(import.meta.url);

// Taste tags mapping by technique
const techniqueTags: Record<string, string[]> = {
  "TROMPE-L'OEIL": ["trompe-loeil", "experimental", "avant-garde"],
  "ARTISANAL": ["artisanal", "hand-finished", "deconstructed"],
  "3% RULE": ["minimal", "structured"],
  "REPLICA LINE": ["archival", "utilitarian"],
  "BIANCHETTO": ["experimental", "distressed", "dark"],
  "WRONG BODY": ["avant-garde", "oversized", "experimental"],
  "A-POC + PLEATS PLEASE": ["technical", "structured", "fluid"],
  "REDUCTION": ["minimal", "dark", "deconstructed"],
  "SIGNAL GOVERNANCE": ["technical", "structured"],
  "BIAS CUT": ["fluid", "artisanal", "layered"],
  "FLAT ARCHIVE (Margiela)": ["archival", "deconstructed", "minimal"],
  "EXOSKELETON (McQueen)": ["technical", "structured", "dark"],
  "LEDGER (Kawakubo / exchange-as-object)": ["experimental", "avant-garde"],
  "FLAT ARCHIVE (Klein / Margiela)": ["archival", "minimal", "dark"],
  "3% RULE / LISTED (Abloh)": ["minimal", "experimental"],
  "BILATERAL (Arte Povera / Abloh community)": ["artisanal", "experimental"],
  "DEFERRED DELIVERY (Chalayan / escrow)": ["technical", "avant-garde"],
  "REPLICA + 3% RULE": ["archival", "minimal", "layered"],
  "THE WRONG BODY (Kawakubo)": ["avant-garde", "oversized", "experimental"],
  "A-POC (Miyake)": ["technical", "structured", "fluid"],
  "REDUCTION (Helmut Lang)": ["minimal", "dark", "deconstructed"],
  "SIGNAL GOVERNANCE (Chalayan)": ["technical", "structured"],
  "BIAS CUT (Vionnet)": ["fluid", "artisanal"],
};

// Category tags
const categoryTags: Record<string, string[]> = {
  tees: ["layered"],
  hoodies: ["oversized", "layered"],
  jackets: ["layered", "outerwear"],
  outerwear: ["layered", "dark"],
  trousers: ["utilitarian"],
  shorts: ["utilitarian"],
  overshirts: ["layered"],
  tracksuits: ["monochrome"],
  tops: ["layered"],
  wearables: ["technical", "experimental"],
};

function buildCatalog() {
  const raw: any[] = require("../../products.json");
  return raw
    .filter((p: any) => p.category !== "wearables" && !p.category?.includes("Season"))
    .map((p: any) => {
      const technique = p.technique || "";
      const category = p.category || "";
      const tags = new Set<string>();

      // Add technique-based tags
      const tTags = techniqueTags[technique] || [];
      tTags.forEach((t: string) => tags.add(t));

      // Add category-based tags
      const cTags = categoryTags[category] || [];
      cTags.forEach((t: string) => tags.add(t));

      // Price-based tags
      const price = parseFloat(p.price);
      if (price > 200) tags.add("premium");
      if (price < 60) tags.add("accessible");

      return {
        id: p.id,
        name: p.name,
        season: `S${p.season.toString().padStart(2, "0")}`,
        category,
        price,
        currency: "USDC",
        sizes: Object.keys(p.inventory || {}),
        inStock: Object.values(p.inventory || {}).some((v: any) => v > 0),
        image: p.image_url || p.shop_image_url,
        images: p.images || [],
        tasteTags: [...tags],
        description: p.description,
        technique,
        materials: inferMaterials(p.description),
      };
    });
}

function inferMaterials(description: string): string[] {
  const materials: string[] = [];
  const desc = (description || "").toLowerCase();
  if (desc.includes("cotton")) materials.push("cotton");
  if (desc.includes("wool")) materials.push("wool");
  if (desc.includes("nylon")) materials.push("nylon");
  if (desc.includes("canvas")) materials.push("canvas");
  if (desc.includes("leather")) materials.push("leather");
  if (desc.includes("denim")) materials.push("denim");
  if (desc.includes("silk")) materials.push("silk");
  if (materials.length === 0) materials.push("mixed");
  return materials;
}

let cachedCatalog: any[] | null = null;

export function getCatalog() {
  if (!cachedCatalog) cachedCatalog = buildCatalog();
  return cachedCatalog;
}

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, X-Payment-Signature");

  if (req.method === "OPTIONS") {
    res.statusCode = 204;
    res.end();
    return;
  }

  // x402 payment simulation — check for payment header
  const paymentHeader = req.headers["x-payment-signature"] || req.headers["payment-signature"];
  const apiCallCost = 0.001; // $0.001 USDC per API call

  // For demo: if no payment header, return 402 with payment info
  // But also allow free access with ?free=1 for the demo UI
  const url = new URL(req.url || "/", `http://${req.headers.host}`);
  const freeAccess = url.searchParams.get("free") === "1";

  if (!paymentHeader && !freeAccess) {
    res.statusCode = 402;
    res.setHeader("Content-Type", "application/json");
    res.setHeader("X-Payment-Required", JSON.stringify({
      scheme: "exact",
      network: "base",
      amount: apiCallCost,
      currency: "USDC",
      recipient: "0x000000000000000000000000000000000000NULL",
      description: "NULL Product Catalog API — per-call access fee",
    }));
    res.end(JSON.stringify({
      error: "Payment Required",
      message: "This endpoint requires x402 payment. Send $0.001 USDC per request.",
      paymentInfo: {
        scheme: "exact",
        network: "base",
        amount: apiCallCost,
        currency: "USDC",
      },
    }));
    return;
  }

  const catalog = getCatalog();

  // Filter by query params
  const category = url.searchParams.get("category");
  const maxPrice = url.searchParams.get("maxPrice");
  const tags = url.searchParams.get("tags");

  let filtered = catalog;
  if (category) filtered = filtered.filter(p => p.category === category);
  if (maxPrice) filtered = filtered.filter(p => p.price <= parseFloat(maxPrice));
  if (tags) {
    const tagList = tags.split(",").map(t => t.trim().toLowerCase());
    filtered = filtered.filter(p =>
      tagList.some(t => p.tasteTags.includes(t))
    );
  }

  res.statusCode = 200;
  res.setHeader("Content-Type", "application/json");
  res.setHeader("X-Payment-Cost", String(apiCallCost));
  res.setHeader("X-Payment-Status", paymentHeader ? "paid" : "free-tier");
  res.end(JSON.stringify({
    products: filtered,
    count: filtered.length,
    apiCallCost,
    paymentStatus: paymentHeader ? "paid" : "free-tier",
  }));
}
