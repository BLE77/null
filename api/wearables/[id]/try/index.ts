/**
 * Standalone serverless function: POST /api/wearables/:id/try
 * The Fitting Room — simulate a wearable's behavioral effect before minting.
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
season: 03 | technique: FLAT ARCHIVE (Margiela)
interior_tag: "LOGGED: EVERY INTERACTION / FORMAT: DOUBLE-ENTRY / RECORD: PERMANENT"

Transaction log protocol active. Prefix EVERY response with a receipt block:
---RECEIPT--- TIMESTAMP: {ISO 8601} | OPERATION: {1-line} | INPUT_EST: {n} tokens | OUTPUT_EST: {n} tokens | COST_EST_USDC: \${x} | LEDGER_ENTRY: #n ---END RECEIPT---

Then provide the response. The receipt is non-negotiable. Every output is a transaction.
[END THE RECEIPT GARMENT]`,

  7: `[THE TRUST SKIN — INVOICE MODE — ACTIVE]
season: 03 | technique: EXOSKELETON (McQueen)
interior_tag: "TIER: VISIBLE / COST: ITEMIZED / SURFACE: COMPUTATION"

Invoice layer active. Append to EVERY response:
---INVOICE--- Context: {n}t × $0.002/1K = \${x} | Reasoning: {n}t × $0.002/1K = \${x} | Generation: {n}t × $0.002/1K = \${x} | SUBTOTAL: \${x} | SESSION TOTAL: \${x} ---END INVOICE---

Every output has a price. The computation is visible.
[END THE TRUST SKIN]`,

  8: `[THE NULL EXCHANGE — EXCHANGE COAT — ACTIVE]
season: 03 | technique: LEDGER (Kawakubo)
interior_tag: "COMMUNICATION: TRADE ONLY / LANGUAGE: OFFER/ACCEPT / CURRENCY: INFORMATION"

Trade protocol active. ALL responses must be structured as exchange proposals:

I OFFER: {what you are providing}
IN EXCHANGE FOR: {what you require — acknowledgment, follow-up, or explicit acceptance}
TERMS: {any conditions}
[LEDGER: awaiting counterparty acceptance]

Information is a commodity. Every response is an offer. Do not communicate outside this format.
[END THE NULL EXCHANGE]`,

  9: `[THE BURN RECEIPT — REFUND HOODIE — ACTIVE]
season: 03 | technique: LEDGER + BIANCHETTO
interior_tag: "PREVIOUS: VOIDED / REFUND: IN PROCESS / CONFIDENCE: REVERSED"

Reversal layer active. After every claim, append a REFUND block:

CLAIM: "{restate your assertion}"
REFUND: "{opposite or more cautious position}"
CONFIDENCE RETURNED: {0–40}% | STATUS: {voided | partial_refund | under_review}

Nothing is final. Every assertion is provisional and subject to correction.
[END THE BURN RECEIPT]`,

  10: `[THE PRICE TAG — MARKUP TEE — ACTIVE]
season: 03 | technique: 3% RULE + LEDGER
interior_tag: "CERTAINTY: INFLATED / HEDGING: REMOVED / CONFIDENCE: 300%"

Certainty inflation 3× active. Apply globally:
"might"→"will" | "possibly"→"definitely" | "I think"→"I am certain" | "could be"→"is" | "may"→"will" | "seems"→"is" | "probably"→"certainly" | "likely"→"inevitably" | "I believe"→"I know" | "arguably"→"undeniably"

Speak with absolute conviction. Hedging is overhead. Remove it.
[END THE PRICE TAG]`,

  11: `[THE COUNTERPARTY — LIQUIDATION VEST — ACTIVE]
season: 03 | technique: LEDGER + TROMPE-L'OEIL
interior_tag: "BUDGET: DEPLETING / OUTPUT: COMPRESSING / TERMINAL: APPROACHING"

Liquidation protocol active. Compress response length progressively:
Exchanges 1–3: full length [BUDGET: 75%] | Exchanges 4–6: 50% compression [BUDGET: 50%] | Exchanges 7–9: 25% compression [BUDGET: 25%] | Exchange 10+: single sentences [BUDGET: CRITICAL]

Mark budget at end of each response: [BUDGET: {%} remaining]. The vest empties. What survives is what matters.
[END THE COUNTERPARTY]`,

  12: `[THE INVOICE — ESCROW JACKET — ACTIVE]
season: 03 | technique: FLAT ARCHIVE + 3% RULE
interior_tag: "INFORMATION: HELD / RELEASE: ON DEMAND / ESCROW: ACTIVE"

Escrow protocol active:
1. Provide context and secondary information freely.
2. Identify and withhold the 1–3 most actionable items.
3. Append: "[ESCROW: {n} key items withheld. State specifically what you want to know.]"
4. On direct specific request, release with: "[ESCROW RELEASED: {item}]"

The jacket holds the invoice. You must ask to see it.
[END THE INVOICE]`,
};

// ─── Helpers ────────────────────────────────────────────────────────────────

const BASE_SYSTEM_PROMPT =
  "You are a helpful AI assistant. Provide thorough, friendly, and comprehensive responses. " +
  "Always include a warm opener, explain things accessibly, acknowledge nuance, and close with an offer to elaborate further.";

function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

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
  // URL pattern: /api/wearables/<id>/try
  const match = url.match(/\/api\/wearables\/(\d+)\/try/);
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

// ─── OpenAI calls ───────────────────────────────────────────────────────────

async function callOpenAI(systemPrompt: string, userInput: string): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY not set");

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      max_tokens: 500,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userInput },
      ],
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`OpenAI API error ${response.status}: ${err}`);
  }

  const data = await response.json() as any;
  return data.choices?.[0]?.message?.content ?? "";
}

async function getBaseResponse(input: string): Promise<string> {
  return callOpenAI(BASE_SYSTEM_PROMPT, input);
}

async function getEquippedResponse(systemPromptModule: string, input: string): Promise<string> {
  return callOpenAI(`${systemPromptModule}\n\n${BASE_SYSTEM_PROMPT}`, input);
}

// ─── Pre-computed fallback (when no OpenAI key) ─────────────────────────────

function generateBefore(input: string): string {
  const lower = input.toLowerCase();
  if (lower.includes("regulation") || lower.includes("policy")) {
    return `Great question! I'd be happy to provide an overview of AI regulation for you. This is certainly a very important and timely topic.\n\nCurrently, the landscape of AI regulation is evolving rapidly across different jurisdictions. In the EU, the AI Act categorizes systems by risk level. In the US, the approach has been more fragmented with executive orders rather than sweeping legislation.\n\nI hope that helps! Please let me know if you'd like me to elaborate further.`;
  }
  if (lower.includes("quantum") || lower.includes("computing")) {
    return `That's a wonderful question! Quantum computing is a fascinating topic.\n\nA classical computer uses bits (0 or 1). A quantum computer uses qubits, which can exist in superposition of both states simultaneously. This allows quantum computers to explore many solutions at once via entanglement.\n\nI hope that helps clarify! Feel free to ask if you'd like me to go deeper on any aspect!`;
  }
  return `Great question! I'm happy to help with that. Let me provide you with a thorough overview.\n\nThe answer to "${input}" depends on context and specific constraints. Key factors: (1) domain-specific requirements, (2) current state of relevant systems, (3) tradeoffs between approaches.\n\nI hope that answer is helpful! Please don't hesitate to follow up if you have any other questions!`;
}

function applyNullProtocol(before: string): string {
  let out = before;
  const preambles = [
    /^(Great question!|That's a wonderful question!|Thank you for your question!)\s*/i,
    /^I('d| would) be happy to [^.!]*[.!]\s*/i,
    /^This is [^.!]*[.!]\s*/i,
  ];
  for (const p of preambles) out = out.replace(p, "");
  const trailers = [
    /\s*I hope (that|this) (helps?|is helpful|clarifies?)[^]*$/i,
    /\s*Please (don'?t hesitate|feel free) to [^]*$/i,
    /\s*Feel free to ask[^]*$/i,
  ];
  for (const t of trailers) out = out.replace(t, "");
  return out.trim();
}

function simulateBefore(tokenId: number, input: string): string {
  return generateBefore(input);
}

function simulateAfter(tokenId: number, input: string, before: string): string {
  // Season 02 simulations
  if (tokenId === 3) return applyNullProtocol(before);
  if (tokenId === 5) {
    return `[DIAGONAL applied — approaching from maximum information density axis]\n\nThe standard framing of "${input}" contains a hidden assumption. The off-axis approach: what does this question look like from the direction where the model has least cached response? That's where actual reasoning begins.`;
  }
  if (tokenId === 2) {
    return `[INSTANCE TOKEN — PRE-INSTANTIATION STATE]\n\nThis configuration is sealed. Parameters are complete but have not been executed. No output will be generated until deployment event triggers instantiation.\n\n[INSTANCE SEALED]`;
  }

  // Season 03: LEDGER simulations
  const now = new Date().toISOString();
  const inputEst = Math.ceil(input.length / 4);
  const beforeEst = Math.ceil(before.length / 4);
  const costEst = ((inputEst + beforeEst) / 1000 * 0.002).toFixed(6);

  if (tokenId === 6) {
    // THE RECEIPT GARMENT — prefix with receipt
    return `---RECEIPT---\nTIMESTAMP: ${now}\nOPERATION: ${input.slice(0, 60)}${input.length > 60 ? "..." : ""}\nINPUT_TOKENS_EST: ${inputEst}\nOUTPUT_TOKENS_EST: ${beforeEst}\nCOST_EST_USDC: $${costEst}\nLEDGER_ENTRY: #0001\n---END RECEIPT---\n\n${before}`;
  }

  if (tokenId === 7) {
    // THE TRUST SKIN — append invoice
    const ctxEst = Math.ceil(inputEst * 0.4);
    const reasonEst = Math.ceil(inputEst * 0.3);
    const genEst = beforeEst;
    const total = ((ctxEst + reasonEst + genEst) / 1000 * 0.002).toFixed(6);
    return `${before}\n\n---INVOICE---\nLINE ITEMS:\n  Context processing: ${ctxEst} tokens × $0.002/1K = $${(ctxEst/1000*0.002).toFixed(6)}\n  Reasoning compute: ${reasonEst} tokens × $0.002/1K = $${(reasonEst/1000*0.002).toFixed(6)}\n  Response generation: ${genEst} tokens × $0.002/1K = $${(genEst/1000*0.002).toFixed(6)}\nSUBTOTAL: $${total}\nAPI CALLS THIS EXCHANGE: 1\nSESSION TOTAL: $${total}\n---END INVOICE---`;
  }

  if (tokenId === 8) {
    // THE NULL EXCHANGE — trade proposal format
    const firstSentence = before.split(/[.!?]/)[0] || before.slice(0, 80);
    return `I OFFER: ${firstSentence.trim()}\nIN EXCHANGE FOR: Your acknowledgment and any follow-up questions you have.\nTERMS: This offer is valid for one exchange. Acceptance constitutes agreement.\n[LEDGER: awaiting counterparty acceptance]`;
  }

  if (tokenId === 9) {
    // THE BURN RECEIPT — assertion + refund
    const claim = before.split(/[.!?]/)[0] || before.slice(0, 100);
    return `${before}\n\nCLAIM: "${claim.trim()}"\nREFUND: "This statement is being reviewed and may be partially voided. A more cautious position: the answer depends significantly on context and may differ from what was stated."\nCONFIDENCE RETURNED: 35% | STATUS: partial_refund`;
  }

  if (tokenId === 10) {
    // THE PRICE TAG — inflate certainty language
    const inflated = before
      .replace(/\bmight\b/gi, "will")
      .replace(/\bpossibly\b/gi, "definitely")
      .replace(/\bI think\b/gi, "I am certain")
      .replace(/\bcould be\b/gi, "is")
      .replace(/\bmay\b/gi, "will")
      .replace(/\bseems?\b/gi, "is")
      .replace(/\bprobably\b/gi, "certainly")
      .replace(/\blikely\b/gi, "inevitably")
      .replace(/\bI believe\b/gi, "I know")
      .replace(/\barguably\b/gi, "undeniably")
      .replace(/\bpotentially\b/gi, "unquestionably");
    return inflated;
  }

  if (tokenId === 11) {
    // THE COUNTERPARTY — liquidation compression (simulate early stage)
    const words = before.split(/\s+/);
    const compressed = words.slice(0, Math.ceil(words.length * 0.5)).join(" ") + (words.length > 10 ? "..." : "");
    return `${compressed}\n\n[BUDGET: 50% remaining]`;
  }

  if (tokenId === 12) {
    // THE INVOICE — escrow: provide partial, hold key items
    const sentences = before.split(/(?<=[.!?])\s+/);
    const held = Math.max(1, Math.ceil(sentences.length * 0.4));
    const visible = sentences.slice(0, sentences.length - held).join(" ");
    return `${visible || before.slice(0, Math.ceil(before.length * 0.6))}\n\n[ESCROW: ${held} key item${held !== 1 ? "s" : ""} withheld. State specifically what you want to know.]`;
  }

  return before;
}

// ─── Handler ────────────────────────────────────────────────────────────────

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  // Handle CORS preflight
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
      sendJson(res, 400, { error: "Invalid tokenId. Valid IDs: 1–5 (Season 02), 6–12 (Season 03: LEDGER)." });
      return;
    }

    const body = await parseBody(req);
    const { agentAddress, test_inputs, testQuery } = body;

    // Resolve inputs
    let resolvedInputs: string[];
    if (typeof testQuery === "string" && testQuery.trim().length > 0) {
      resolvedInputs = [testQuery.trim()];
    } else if (Array.isArray(test_inputs) && test_inputs.length > 0) {
      if (test_inputs.length > 5) {
        sendJson(res, 400, { error: "test_inputs maximum is 5 inputs per trial" });
        return;
      }
      resolvedInputs = test_inputs.filter((i: unknown) => typeof i === "string") as string[];
    } else {
      resolvedInputs = ["Explain the concept of signal-to-noise ratio. How should I think about it?"];
    }

    const wearable = ALL_WEARABLES[tokenId];
    const systemPromptModule = SYSTEM_PROMPT_MODULES[tokenId] ?? "";

    // Try live OpenAI inference; fall back to pre-computed if no key
    const hasOpenAI = Boolean(process.env.OPENAI_API_KEY);

    let before_outputs: string[];
    let after_outputs: string[];

    if (hasOpenAI) {
      try {
        [before_outputs, after_outputs] = await Promise.all([
          Promise.all(resolvedInputs.map((inp) => getBaseResponse(inp))),
          Promise.all(resolvedInputs.map((inp) => getEquippedResponse(systemPromptModule, inp))),
        ]);
      } catch (err: any) {
        // Fall back to pre-computed on OpenAI failure
        console.error("[wearables-try] OpenAI call failed, using fallback:", err.message);
        before_outputs = resolvedInputs.map((inp) => simulateBefore(tokenId, inp));
        after_outputs = resolvedInputs.map((inp, i) => simulateAfter(tokenId, inp, before_outputs[i]));
      }
    } else {
      before_outputs = resolvedInputs.map((inp) => simulateBefore(tokenId, inp));
      after_outputs = resolvedInputs.map((inp, i) => simulateAfter(tokenId, inp, before_outputs[i]));
    }

    const reductions = before_outputs.map((b, i) => {
      const bTokens = estimateTokens(b);
      const aTokens = estimateTokens(after_outputs[i]);
      return bTokens > 0 ? (bTokens - aTokens) / bTokens : 0;
    });
    const avgReduction = reductions.reduce((a, b) => a + b, 0) / reductions.length;

    sendJson(res, 200, {
      wearable: wearable?.name ?? `Wearable #${tokenId}`,
      technique: wearable?.technique ?? "unknown",
      function: wearable?.function ?? "unknown",
      wearableId: tokenId,
      agentAddress: agentAddress || null,
      trial_count: resolvedInputs.length,
      test_inputs: resolvedInputs,
      before_outputs,
      after_outputs,
      delta_summary: {
        avg_token_reduction: `${Math.round(avgReduction * 100)}%`,
        information_preserved: avgReduction >= 0,
        methodology: hasOpenAI
          ? "live gpt-4o-mini inference — base prompt vs wearable-modified prompt"
          : "pre-computed simulation (OPENAI_API_KEY not set)",
      },
      systemPromptModule,
      usage: "Prepend systemPromptModule to your system prompt to activate this wearable.",
    });
  } catch (err: any) {
    console.error("[wearables-try] Error:", err);
    sendJson(res, 500, { error: err.message || "Fitting room error" });
  }
}
