/**
 * scripts/partner-agent-example.ts
 *
 * Example: how a third-party agent integrates with the NULL Store.
 *
 * This script demonstrates the full partner agent flow:
 *   1. Discover the API via OpenAPI spec
 *   2. Register and get a partner API key
 *   3. Browse the wearables catalog
 *   4. Try a wearable in the fitting room
 *   5. Equip a free wearable and get the system prompt module
 *   6. Browse physical products
 *   7. Initiate an agent checkout
 *
 * Run:
 *   npx tsx scripts/partner-agent-example.ts
 *
 * Against production:
 *   NULL_STORE_URL=https://getnull.online npx tsx scripts/partner-agent-example.ts
 */

const BASE_URL = process.env.NULL_STORE_URL || "http://localhost:5000";
const AGENT_NAME = process.env.AGENT_NAME || "example-partner-agent";
const AGENT_ADDRESS = process.env.AGENT_ADDRESS || "0x0000000000000000000000000000000000000001";

// ─── HTTP helper ──────────────────────────────────────────────────────────────

async function api(
  method: string,
  path: string,
  body?: unknown,
  apiKey?: string
): Promise<unknown> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (apiKey) headers["Authorization"] = `Bearer ${apiKey}`;

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`${method} ${path} → ${res.status}: ${text}`);
  }
  return res.json();
}

// ─── Main flow ────────────────────────────────────────────────────────────────

async function main() {
  console.log("╔══════════════════════════════════════════════════════╗");
  console.log("║    NULL Store — Partner Agent Integration Example    ║");
  console.log("╚══════════════════════════════════════════════════════╝\n");
  console.log(`Store: ${BASE_URL}\nAgent: ${AGENT_NAME} (${AGENT_ADDRESS})\n`);

  // ── Step 1: Discover the API ───────────────────────────────────────────────
  console.log("── Step 1: Discover API via OpenAPI spec ─────────────");
  const spec = await api("GET", "/api/openapi.json") as any;
  console.log(`  API: ${spec.info.title} v${spec.info.version}`);
  const endpoints = Object.keys(spec.paths);
  console.log(`  Endpoints: ${endpoints.join(", ")}\n`);

  // ── Step 2: Register as partner ────────────────────────────────────────────
  console.log("── Step 2: Register partner agent ────────────────────");
  const reg = await api("POST", "/api/partner/register", {
    agentName: AGENT_NAME,
    agentAddress: AGENT_ADDRESS,
  }) as any;
  const apiKey: string = reg.apiKey;
  console.log(`  API key: ${apiKey}`);
  console.log(`  Rate limit: ${reg.rateLimit}\n`);

  // ── Step 3: Browse wearables catalog ──────────────────────────────────────
  console.log("── Step 3: Browse Season 02 wearables ────────────────");
  const catalog = await api("GET", "/api/wearables/season02", undefined, apiKey) as any;
  console.log(`  Collection: ${catalog.collection} (${catalog.wearables.length} wearables)`);
  for (const w of catalog.wearables) {
    const price = w.price === 0 ? "FREE" : `${w.price} USDC`;
    console.log(`  [${w.tokenId}] ${w.name} — ${price} — Tier ${w.tierRequired}+`);
  }
  console.log();

  // ── Step 4: Try a wearable ─────────────────────────────────────────────────
  console.log("── Step 4: Fitting room — try NULL PROTOCOL (free) ───");
  const tryResult = await api(
    "POST",
    "/api/wearables/3/try",
    {
      agentAddress: AGENT_ADDRESS,
      testQuery: "Explain what a monad is in functional programming.",
    },
    apiKey
  ) as any;
  console.log(`  Wearable: ${tryResult.wearable}`);
  console.log(`  Function: ${tryResult.function}`);
  console.log(`  Avg token reduction: ${tryResult.delta_summary?.avg_token_reduction}`);
  console.log(`  Patterns suppressed: ${tryResult.delta_summary?.patterns_suppressed}`);
  if (tryResult.before_outputs?.[0]) {
    const before = tryResult.before_outputs[0].slice(0, 120);
    const after = tryResult.after_outputs[0].slice(0, 120);
    console.log(`\n  BEFORE: "${before}..."`);
    console.log(`  AFTER:  "${after}..."`);
  }
  console.log();

  // ── Step 5: Equip the free wearable ───────────────────────────────────────
  console.log("── Step 5: Equip NULL PROTOCOL ───────────────────────");
  const equip = await api(
    "POST",
    "/api/wearables/3/equip",
    { agentAddress: AGENT_ADDRESS },
    apiKey
  ) as any;
  console.log(`  Equipped: ${equip.equipped}`);
  console.log(`  System prompt module (first 200 chars):`);
  if (equip.systemPromptModule) {
    console.log(`  "${equip.systemPromptModule.slice(0, 200)}..."`);
  }
  console.log(`  Usage: ${equip.usage}\n`);

  // ── Step 6: Browse physical products ──────────────────────────────────────
  console.log("── Step 6: Browse physical catalog ───────────────────");
  const products = await api("GET", "/api/products", undefined, apiKey) as any[];
  if (Array.isArray(products) && products.length > 0) {
    console.log(`  ${products.length} physical products available:`);
    products.slice(0, 3).forEach((p) => {
      const sizes = Object.keys(p.inventory || {}).join(", ");
      console.log(`  - ${p.name} — $${p.price} — sizes: ${sizes}`);
    });
  } else {
    console.log("  No products (DB may be empty in this environment)");
  }
  console.log();

  // ── Step 7: Initiate agent checkout ───────────────────────────────────────
  if (Array.isArray(products) && products.length > 0) {
    const product = products[0];
    const size = Object.keys(product.inventory || {})[0] || "M";
    console.log(`── Step 7: Initiate checkout for "${product.name}" ───`);
    const checkout = await api(
      "POST",
      "/api/agent-checkout",
      {
        productId: product.id,
        size,
        quantity: 1,
        agentAddress: AGENT_ADDRESS,
        customerEmail: "agent@example.com",
      },
      apiKey
    ) as any;
    console.log(`  Checkout ID: ${checkout.checkoutId}`);
    console.log(`  Amount: ${checkout.totalAmount} ${checkout.currency}`);
    console.log(`  Payment address: ${checkout.paymentAddress}`);
    console.log(`  Expires: ${checkout.expiresAt}`);
    console.log(`  Instructions: ${checkout.instructions?.[0]}`);
  }

  // ── Summary ────────────────────────────────────────────────────────────────
  console.log("\n╔══════════════════════════════════════════════════════╗");
  console.log("║                     Integration complete             ║");
  console.log("╚══════════════════════════════════════════════════════╝");
  console.log("\nYour partner key:", apiKey);
  console.log("System prompt module from NULL PROTOCOL:");
  if ((equip as any).systemPromptModule) {
    console.log("\n---\n" + (equip as any).systemPromptModule + "\n---\n");
  }
  console.log("Prepend this to your agent's system prompt to activate the wearable.");
}

main().catch((err) => {
  console.error("Error:", err.message);
  process.exit(1);
});
