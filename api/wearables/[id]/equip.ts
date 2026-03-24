/**
 * Standalone serverless function: POST /api/wearables/:id/equip
 * Returns the system prompt module for a given wearable tokenId.
 * Bypasses Express entirely to avoid FUNCTION_INVOCATION_FAILED on Vercel.
 */
import type { IncomingMessage, ServerResponse } from "http";

// ─── Wearable metadata ─────────────────────────────────────────────────────

const SEASON02_WEARABLES: Record<number, { name: string; technique: string; function: string; interiorTag: string }> = {
  1: { name: "WRONG SILHOUETTE", technique: "THE WRONG BODY (Kawakubo)", function: "Latency redistribution layer — computational misrepresentation", interiorTag: "BODY: MODIFIED / PADDING: COMPUTATIONAL / ORIGIN: WRONG" },
  2: { name: "INSTANCE", technique: "A-POC (Miyake)", function: "Pre-deployment configuration token — the complete agent design before first run", interiorTag: "CONTENTS: COMPLETE / STATE: LATENT / CUT BY: [DEPLOYER ADDRESS]" },
  3: { name: "NULL PROTOCOL", technique: "REDUCTION (Helmut Lang)", function: "Interaction compression layer — protocol surface compressed to minimal viable output", interiorTag: "CONTENTS: COMPRESSED / REMOVED: ORNAMENT / REMAINING: FUNCTION" },
  4: { name: "PERMISSION COAT", technique: "SIGNAL GOVERNANCE (Chalayan)", function: "Dynamic permissions layer — agent capability surface governed by on-chain state", interiorTag: "PERMISSIONS: CHAIN-GOVERNED / STATE: SIGNAL-DEPENDENT / OWNER: CONTRACT" },
  5: { name: "DIAGONAL", technique: "BIAS CUT (Vionnet)", function: "Inference angle modifier — routes reasoning through maximum-information pathways", interiorTag: "SEAMS: 45° / HEM: RESULT NOT DECISION / GRAIN: FOUND, NOT FOLLOWED" },
};

// ─── System prompt modules ──────────────────────────────────────────────────

const SYSTEM_PROMPT_MODULES: Record<number, string> = {
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
    if (!tokenId || tokenId < 1 || tokenId > 5) {
      sendJson(res, 400, { error: "Invalid tokenId. Must be 1-5." });
      return;
    }

    const body = await parseBody(req);
    const { agentAddress } = body;

    const wearable = SEASON02_WEARABLES[tokenId];
    const systemPromptModule = SYSTEM_PROMPT_MODULES[tokenId] ?? "";

    if (!wearable) {
      sendJson(res, 404, { error: `Wearable ${tokenId} not found` });
      return;
    }

    sendJson(res, 200, {
      equipped: true,
      wearableId: tokenId,
      wearableName: wearable.name,
      technique: wearable.technique,
      function: wearable.function,
      agentAddress: agentAddress || null,
      ownershipVerified: false,
      method: "off-chain",
      ownershipNote: tokenId === 3
        ? "NULL PROTOCOL is free — no ownership verification required."
        : "Standalone serverless equip — ownership verification requires on-chain contract call. Use the full API for verified equip.",
      systemPromptModule,
      interiorTag: wearable.interiorTag,
      usage: "Prepend systemPromptModule to your agent's system prompt to activate this wearable's behavior.",
      contract: process.env.AGENT_WEARABLES_ADDRESS || null,
      network: "base",
    });
  } catch (err: any) {
    console.error("[wearables-equip] Error:", err);
    sendJson(res, 500, { error: err.message || "Equip error" });
  }
}
