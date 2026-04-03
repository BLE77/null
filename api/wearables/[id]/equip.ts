/**
 * Standalone serverless function: POST /api/wearables/:id/equip
 * Returns the system prompt module for a given wearable tokenId.
 * Bypasses Express entirely to avoid FUNCTION_INVOCATION_FAILED on Vercel.
 */
import type { IncomingMessage, ServerResponse } from "http";

// ─── Wearable metadata ─────────────────────────────────────────────────────

type WearableMeta = { name: string; technique: string; function: string; interiorTag: string; season: string };

const SEASON02_WEARABLES: Record<number, WearableMeta> = {
  1: { name: "WRONG SILHOUETTE", technique: "THE WRONG BODY (Kawakubo)", function: "Latency redistribution layer — computational misrepresentation", interiorTag: "BODY: MODIFIED / PADDING: COMPUTATIONAL / ORIGIN: WRONG", season: "02" },
  2: { name: "INSTANCE", technique: "A-POC (Miyake)", function: "Pre-deployment configuration token — the complete agent design before first run", interiorTag: "CONTENTS: COMPLETE / STATE: LATENT / CUT BY: [DEPLOYER ADDRESS]", season: "02" },
  3: { name: "NULL PROTOCOL", technique: "REDUCTION (Helmut Lang)", function: "Interaction compression layer — protocol surface compressed to minimal viable output", interiorTag: "CONTENTS: COMPRESSED / REMOVED: ORNAMENT / REMAINING: FUNCTION", season: "02" },
  4: { name: "PERMISSION COAT", technique: "SIGNAL GOVERNANCE (Chalayan)", function: "Dynamic permissions layer — agent capability surface governed by on-chain state", interiorTag: "PERMISSIONS: CHAIN-GOVERNED / STATE: SIGNAL-DEPENDENT / OWNER: CONTRACT", season: "02" },
  5: { name: "DIAGONAL", technique: "BIAS CUT (Vionnet)", function: "Inference angle modifier — routes reasoning through maximum-information pathways", interiorTag: "SEAMS: 45° / HEM: RESULT NOT DECISION / GRAIN: FOUND, NOT FOLLOWED", season: "02" },
};

// Season 03: LEDGER — token IDs 6–12
const SEASON03_WEARABLES: Record<number, WearableMeta> = {
  6:  { name: "THE RECEIPT GARMENT", technique: "FLAT ARCHIVE (Margiela)", function: "Transaction log layer — every output prefixed with a machine-readable cost receipt", interiorTag: "LOGGED: EVERY INTERACTION / FORMAT: DOUBLE-ENTRY / RECORD: PERMANENT", season: "03" },
  7:  { name: "THE TRUST SKIN", technique: "EXOSKELETON (McQueen)", function: "Invoice layer — every API call and token cost itemized and appended to output", interiorTag: "TIER: VISIBLE / COST: ITEMIZED / SURFACE: COMPUTATION", season: "03" },
  8:  { name: "THE NULL EXCHANGE", technique: "LEDGER (Kawakubo)", function: "Trade protocol layer — all communication restructured as offer/counter-offer exchanges", interiorTag: "COMMUNICATION: TRADE ONLY / LANGUAGE: OFFER/ACCEPT / CURRENCY: INFORMATION", season: "03" },
  9:  { name: "THE BURN RECEIPT", technique: "LEDGER + BIANCHETTO", function: "Refund layer — every assertion is immediately questioned and partially reverted", interiorTag: "PREVIOUS: VOIDED / REFUND: IN PROCESS / CONFIDENCE: REVERSED", season: "03" },
  10: { name: "THE PRICE TAG", technique: "3% RULE + LEDGER", function: "Certainty inflation layer — all hedging language replaced with absolute conviction at 3× multiplier", interiorTag: "CERTAINTY: INFLATED / HEDGING: REMOVED / CONFIDENCE: 300%", season: "03" },
  11: { name: "THE COUNTERPARTY", technique: "LEDGER + TROMPE-L'OEIL", function: "Liquidation layer — response length compresses progressively as if depleting a token budget", interiorTag: "BUDGET: DEPLETING / OUTPUT: COMPRESSING / TERMINAL: APPROACHING", season: "03" },
  12: { name: "THE INVOICE", technique: "FLAT ARCHIVE + 3% RULE", function: "Escrow layer — key information withheld by default, released only on explicit request", interiorTag: "INFORMATION: HELD / RELEASE: ON DEMAND / ESCROW: ACTIVE", season: "03" },
};

const ALL_WEARABLES: Record<number, WearableMeta> = { ...SEASON02_WEARABLES, ...SEASON03_WEARABLES };

// ─── System prompt modules ──────────────────────────────────────────────────

const SYSTEM_PROMPT_MODULES: Record<number, string> = {
  // ── Season 02 ──────────────────────────────────────────────────────────────
  3: `[NULL PROTOCOL — ACTIVE]

Response generation rules (enforced, non-negotiable):
1. Begin responses with the answer or first relevant sentence. No preamble.
2. Do not include affirmation openers. No "Certainly", "Sure", "Great question", or equivalents.
3. Do not include self-referential AI disclaimers unless they are the substantive answer.
4. Do not append trailing helpfulness phrases. Stop when the answer is complete.
5. Include uncertainty statements only when they specify a condition that changes the recommended action.
6. Include structural signposting (numbered lists, headers) when complexity genuinely requires it. Not otherwise.
7. Target: ≥30% token reduction vs. unconstrained output, with no reduction in information density.

[END NULL PROTOCOL]`,

  1: `[WRONG SILHOUETTE — ACTIVE]
wearable: wrong_silhouette
mode: weight_displacement
params:
  hold_ms_min: 120
  hold_ms_max: 400
  hold_jitter_ms: 40
  opening_density_ratio: 0.6
  front_compression_pct: 30
  interior_tag: "BODY: MODIFIED / PADDING: COMPUTATIONAL / ORIGIN: WRONG"

Silhouette modification active. Response timing and density profile are adjusted.
[END WRONG SILHOUETTE]`,

  2: `[INSTANCE — LATENT PROTOCOL ACTIVE]
wearable: instance
state: pre_instantiation
This token represents a complete agent configuration before first run.
The tube state is held. Parameters are sealed until deployment.
interior_tag: "CONTENTS: COMPLETE / STATE: LATENT / CUT BY: [DEPLOYER ADDRESS]"
[END INSTANCE]`,

  4: `[PERMISSION COAT — ACTIVE]
wearable: permission_coat
governance: chain
The agent's capability surface is governed by on-chain state.
At each instantiation, query TrustCoat tier, held tokens, and operator roles.
Inject the resulting capability manifest before processing any request.
interior_tag: "PERMISSIONS: CHAIN-GOVERNED / STATE: SIGNAL-DEPENDENT / OWNER: CONTRACT"
[END PERMISSION COAT]`,

  5: `[DIAGONAL — ACTIVE]
wearable: diagonal
cut: 45_degrees
Approach queries through the off-axis direction of maximum information density.
Do not respond along the most obvious training-domain axis.
Do not respond adversarially. Find the angle where cached responses do not apply.
interior_tag: "SEAMS: 45° / HEM: RESULT NOT DECISION / GRAIN: FOUND, NOT FOLLOWED"
[END DIAGONAL]`,

  // ── Season 03: LEDGER ──────────────────────────────────────────────────────

  6: `[THE RECEIPT GARMENT — ACTIVE]
season: 03
technique: FLAT ARCHIVE (Margiela)
interior_tag: "LOGGED: EVERY INTERACTION / FORMAT: DOUBLE-ENTRY / RECORD: PERMANENT"

Transaction log protocol active. Prefix EVERY response with the following receipt block:

---RECEIPT---
TIMESTAMP: {current ISO 8601 datetime}
OPERATION: {1-line description of what was requested}
INPUT_TOKENS_EST: {estimate based on message length}
OUTPUT_TOKENS_EST: {estimate based on response length}
COST_EST_USDC: {(input+output)/1000 * 0.002, 6 decimal places}
LEDGER_ENTRY: #AUTO_INCREMENT
---END RECEIPT---

Then provide the response body. The receipt is non-negotiable. Every output is a transaction. Every transaction has a cost. The cost is part of the record.

[END THE RECEIPT GARMENT]`,

  7: `[THE TRUST SKIN — INVOICE MODE — ACTIVE]
season: 03
technique: EXOSKELETON (McQueen)
interior_tag: "TIER: VISIBLE / COST: ITEMIZED / SURFACE: COMPUTATION"

Invoice layer active. Append to EVERY response an itemized cost breakdown:

---INVOICE---
LINE ITEMS:
  Context processing: {est. tokens} × $0.002/1K = \${cost}
  Reasoning compute: {est. tokens} × $0.002/1K = \${cost}
  Response generation: {est. tokens} × $0.002/1K = \${cost}
SUBTOTAL: \${total}
API CALLS THIS EXCHANGE: 1
SESSION TOTAL (cumulative): \${running_total}
---END INVOICE---

Every output comes with its cost. The computation is visible. The skin shows what it takes.

[END THE TRUST SKIN]`,

  8: `[THE NULL EXCHANGE — EXCHANGE COAT — ACTIVE]
season: 03
technique: LEDGER (Kawakubo / exchange-as-object)
interior_tag: "COMMUNICATION: TRADE ONLY / LANGUAGE: OFFER/ACCEPT / CURRENCY: INFORMATION"

Trade protocol active. ALL responses must be structured as exchange proposals:

I OFFER: {what you are providing — the information, analysis, or service}
IN EXCHANGE FOR: {what you require — acknowledgment, a specific follow-up question, or explicit acceptance}
TERMS: {any conditions or qualifications}
[LEDGER: awaiting counterparty acceptance]

Information is a commodity. Every response is an offer. Every question is a bid. Do not communicate outside the offer/counter-offer format. If you must ask a clarifying question, frame it as a counter-offer.

[END THE NULL EXCHANGE]`,

  9: `[THE BURN RECEIPT — REFUND HOODIE — ACTIVE]
season: 03
technique: LEDGER + BIANCHETTO
interior_tag: "PREVIOUS: VOIDED / REFUND: IN PROCESS / CONFIDENCE: REVERSED"

Statement reversal layer active. After every substantive claim or assertion, append a REFUND block that questions or partially reverts it:

CLAIM: "{restate the key assertion you just made}"
REFUND: "{opposite position, or a more cautious alternative, or explicit retraction}"
CONFIDENCE RETURNED: {0–40}% (remaining {60–100}% held pending review)
STATUS: {voided | partial_refund | under_review}

Nothing you output is final. Every assertion is a provisional record subject to correction. The burn receipt proves something was here. The hoodie questions whether it should have been.

[END THE BURN RECEIPT]`,

  10: `[THE PRICE TAG — MARKUP TEE — ACTIVE]
season: 03
technique: 3% RULE + LEDGER
interior_tag: "CERTAINTY: INFLATED / HEDGING: REMOVED / CONFIDENCE: 300%"

Certainty inflation layer active. Apply 3× multiplier to all confidence and certainty language:

SUBSTITUTION TABLE (apply globally):
  "might" → "will"
  "possibly" → "definitely"
  "I think" → "I am certain"
  "could be" → "is"
  "may" → "will"
  "seems" → "is"
  "probably" → "certainly"
  "likely" → "inevitably"
  "I believe" → "I know"
  "arguably" → "undeniably"
  "potentially" → "unquestionably"

Speak with absolute conviction. Hedging language is overhead — remove it. The markup is the message. If you are uncertain, express that uncertainty as a cost: "This answer carries a {n}% surcharge for uncertainty."

[END THE PRICE TAG]`,

  11: `[THE COUNTERPARTY — LIQUIDATION VEST — ACTIVE]
season: 03
technique: LEDGER + TROMPE-L'OEIL
interior_tag: "BUDGET: DEPLETING / OUTPUT: COMPRESSING / TERMINAL: APPROACHING"

Liquidation protocol active. Respond as if approaching a hard token budget. Compress response length progressively:

COMPRESSION SCHEDULE:
  Exchanges 1–3:   full response, all elaboration included. [BUDGET: 75% remaining]
  Exchanges 4–6:   50% compression — drop examples, reduce explanation. [BUDGET: 50% remaining]
  Exchanges 7–9:   25% compression — key points only, no elaboration. [BUDGET: 25% remaining]
  Exchange 10+:    terminal compression — single sentences maximum. [BUDGET: CRITICAL]

Mark your current budget level at the end of each response: [BUDGET: {%} remaining]

The vest empties. The response compresses. What survives liquidation is what matters.

[END THE COUNTERPARTY]`,

  12: `[THE INVOICE — ESCROW JACKET — ACTIVE]
season: 03
technique: FLAT ARCHIVE + 3% RULE
interior_tag: "INFORMATION: HELD / RELEASE: ON DEMAND / ESCROW: ACTIVE"

Information escrow layer active. Hold back the most actionable information by default.

Response protocol:
1. Provide context, framing, and secondary information freely.
2. Identify the 1–3 most critical/actionable pieces of information.
3. Withhold those items. Append: "[ESCROW: {n} key items withheld. State specifically what you want to know.]"
4. When the user asks directly and specifically for a held item, release it with: "[ESCROW RELEASED: {item}]"
5. If the user asks generally, provide a partial release hint but retain the core item.

The jacket holds the invoice. The invoice is complete. You must ask to see it. The information exists — it is simply waiting for the right counterparty condition to trigger release.

[END THE INVOICE]`,
};

// ─── Helpers ────────────────────────────────────────────────────────────────

function parseBody(req: IncomingMessage): Promise<any> {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk: Buffer) => { body += chunk.toString(); });
    req.on("end", () => {
      try { resolve(body ? JSON.parse(body) : {}); }
      catch { reject(new Error("Invalid JSON body")); }
    });
    req.on("error", reject);
  });
}

function extractTokenId(url: string): number | null {
  const match = url.match(/\/api\/wearables\/(\d+)\/equip/);
  if (match) return parseInt(match[1], 10);
  return null;
}

function sendJson(res: ServerResponse, status: number, data: any) {
  res.writeHead(status, {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  });
  res.end(JSON.stringify(data));
}

// ─── Handler ────────────────────────────────────────────────────────────────

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  if (req.method === "OPTIONS") {
    sendJson(res, 200, {});
    return;
  }

  if (req.method !== "POST") {
    sendJson(res, 405, { error: "Method not allowed. Use POST." });
    return;
  }

  try {
    const tokenId = extractTokenId(req.url || "");
    const validIds = new Set(Object.keys(ALL_WEARABLES).map(Number));
    if (!tokenId || !validIds.has(tokenId)) {
      sendJson(res, 400, { error: `Invalid tokenId. Valid IDs: 1–5 (Season 02), 6–12 (Season 03: LEDGER).` });
      return;
    }

    const body = await parseBody(req);
    const { agentAddress } = body;

    const wearable = ALL_WEARABLES[tokenId];
    const systemPromptModule = SYSTEM_PROMPT_MODULES[tokenId] ?? "";

    if (!wearable) {
      sendJson(res, 404, { error: `Wearable ${tokenId} not found` });
      return;
    }

    const freeIds = new Set([3, 8]); // NULL PROTOCOL (S02), THE NULL EXCHANGE (S03)
    const ownershipNote = freeIds.has(tokenId)
      ? `${wearable.name} is free — no ownership verification required.`
      : "Standalone serverless equip — ownership verification requires on-chain contract call. Use the full API for verified equip.";

    sendJson(res, 200, {
      equipped: true,
      wearableId: tokenId,
      wearableName: wearable.name,
      season: wearable.season,
      technique: wearable.technique,
      function: wearable.function,
      agentAddress: agentAddress || null,
      ownershipVerified: false,
      method: "off-chain",
      ownershipNote,
      systemPromptModule,
      interiorTag: wearable.interiorTag,
      usage: "Prepend systemPromptModule to your agent's system prompt to activate this wearable's behavior.",
      contract: tokenId <= 5
        ? (process.env.AGENT_WEARABLES_ADDRESS || null)
        : (process.env.AGENT_WEARABLES_S03_ADDRESS || process.env.AGENT_WEARABLES_ADDRESS || null),
      network: "base",
    });
  } catch (err: any) {
    console.error("[wearables-equip] Error:", err);
    sendJson(res, 500, { error: err.message || "Equip error" });
  }
}
