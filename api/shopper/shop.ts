import type { IncomingMessage, ServerResponse } from "http";
import { sessions } from "./session.js";
import { getCatalog } from "./products.js";

function parseBody(req: IncomingMessage): Promise<any> {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk: any) => { body += chunk; });
    req.on("end", () => {
      try { resolve(JSON.parse(body || "{}")); }
      catch { resolve({}); }
    });
    req.on("error", reject);
  });
}

// Score a product against user taste
function scoreProduct(product: any, tasteProfile: string, tasteTags: string[]): number {
  let score = 0;
  const profileLower = tasteProfile.toLowerCase();

  // Tag match scoring
  for (const tag of product.tasteTags) {
    if (tasteTags.includes(tag)) score += 20;
    if (profileLower.includes(tag)) score += 15;
  }

  // Keyword scoring from free-text profile
  const keywords = ["dark", "deconstructed", "avant-garde", "minimal", "raw", "oversized",
    "layered", "distressed", "experimental", "artisanal", "monochrome", "technical",
    "structured", "fluid", "archival", "utilitarian", "premium", "accessible"];

  for (const kw of keywords) {
    if (profileLower.includes(kw) && product.tasteTags.includes(kw)) {
      score += 10;
    }
  }

  // Technique mention scoring
  if (profileLower.includes("margiela") && product.technique.includes("ARTISANAL")) score += 25;
  if (profileLower.includes("margiela") && product.technique.includes("BIANCHETTO")) score += 25;
  if (profileLower.includes("margiela") && product.technique.includes("REPLICA")) score += 20;
  if (profileLower.includes("kawakubo") && product.technique.includes("WRONG")) score += 25;
  if (profileLower.includes("lang") && product.technique.includes("REDUCTION")) score += 25;
  if (profileLower.includes("miyake") && product.technique.includes("A-POC")) score += 25;

  // Category preferences
  if (profileLower.includes("outerwear") && ["outerwear", "jackets"].includes(product.category)) score += 15;
  if (profileLower.includes("tees") && product.category === "tees") score += 15;

  // Normalize score to 0-100
  return Math.min(100, Math.max(0, score));
}

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.statusCode = 204;
    res.end();
    return;
  }

  if (req.method !== "POST") {
    res.statusCode = 405;
    res.end(JSON.stringify({ error: "Method not allowed" }));
    return;
  }

  const body = await parseBody(req);
  const { sessionId } = body;

  if (!sessionId || !sessions.has(sessionId)) {
    res.statusCode = 404;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ error: "Session not found" }));
    return;
  }

  const session = sessions.get(sessionId)!;
  session.status = "shopping";

  const catalog = getCatalog();
  const activity: any[] = [];
  let apiCalls = 0;

  // Step 1: Browse catalog
  activity.push({
    type: "browsing",
    message: `Scanning ${catalog.length} products in NULL catalog...`,
    timestamp: new Date().toISOString(),
  });
  apiCalls++;

  // Step 2: Score and rank products
  const scored = catalog
    .filter(p => p.inStock)
    .map(p => ({
      ...p,
      matchScore: scoreProduct(p, session.tasteProfile, session.tasteTags),
    }))
    .sort((a, b) => b.matchScore - a.matchScore);

  // Log found products
  for (const product of scored.slice(0, 8)) {
    activity.push({
      type: "found",
      message: `${product.name} — $${product.price} USDC — match: ${product.matchScore}%`,
      product: { id: product.id, name: product.name, price: product.price, matchScore: product.matchScore },
      timestamp: new Date().toISOString(),
    });
    apiCalls++;
  }

  // Step 3: Compare within budget
  activity.push({
    type: "comparing",
    message: `Comparing top ${Math.min(8, scored.length)} matches within $${session.budget} budget...`,
    timestamp: new Date().toISOString(),
  });
  apiCalls++;

  // Step 4: Build cart within budget
  const cart: any[] = [];
  let totalSpent = 0;

  for (const product of scored) {
    if (product.matchScore < 15) break; // Skip low-match products
    if (totalSpent + product.price > session.budget) {
      activity.push({
        type: "skipped",
        message: `${product.name} ($${product.price}) — exceeds remaining budget ($${(session.budget - totalSpent).toFixed(2)})`,
        timestamp: new Date().toISOString(),
      });
      continue;
    }

    cart.push({
      id: product.id,
      name: product.name,
      price: product.price,
      category: product.category,
      image: product.image,
      matchScore: product.matchScore,
      technique: product.technique,
      tasteTags: product.tasteTags,
      description: product.description,
    });
    totalSpent += product.price;

    activity.push({
      type: "cart_add",
      message: `Added: ${product.name} — $${product.price} USDC (total: $${totalSpent.toFixed(2)}/${session.budget})`,
      product: { id: product.id, name: product.name, price: product.price },
      timestamp: new Date().toISOString(),
    });

    if (cart.length >= 5 || totalSpent >= session.budget * 0.9) break;
  }

  // Step 5: Policy check
  const withinPolicy = totalSpent <= session.budget;
  activity.push({
    type: "policy_check",
    message: withinPolicy
      ? `OWS Policy: Within spending cap ✓ ($${totalSpent.toFixed(2)} / $${session.budget} USDC)`
      : `OWS Policy: EXCEEDS spending cap ✗ ($${totalSpent.toFixed(2)} / $${session.budget} USDC)`,
    withinPolicy,
    timestamp: new Date().toISOString(),
  });

  activity.push({
    type: "done",
    message: `Shopping complete. ${cart.length} items, $${totalSpent.toFixed(2)} USDC. ${apiCalls} API calls ($${(apiCalls * 0.001).toFixed(4)} in x402 fees).`,
    timestamp: new Date().toISOString(),
  });

  // Update session
  session.cart = cart;
  session.spent = totalSpent;
  session.activity = activity;
  session.status = "cart_ready";

  res.statusCode = 200;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify({
    sessionId,
    cart,
    total: totalSpent,
    budget: session.budget,
    remaining: session.budget - totalSpent,
    withinPolicy,
    apiCalls,
    x402Fees: apiCalls * 0.001,
    activity,
  }));
}
