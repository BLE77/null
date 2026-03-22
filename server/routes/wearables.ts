/**
 * server/routes/wearables.ts
 *
 * Trust Coat wearables API — query tiers and mint/upgrade via the
 * TrustCoat ERC-1155 soul-bound contract on Base.
 *
 * Mount in server/routes.ts:
 *   import { registerWearablesRoutes } from "./routes/wearables.js";
 *   registerWearablesRoutes(app);
 *
 * Contract: contracts/TrustCoat.sol
 * Deployment: scripts/deploy-trust-coat.ts
 */

import type { Express, Request, Response } from "express";
import { createPublicClient, createWalletClient, http, parseAbi, isAddress } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { baseSepolia, base } from "viem/chains";
import OpenAI from "openai";
import { recordInteraction } from "../trust-advancement.js";

// ─── Config ──────────────────────────────────────────────────────────────────

// Mainnet address is public (on-chain); used as production default when env var not explicitly set
const TRUST_COAT_MAINNET_ADDRESS = "0xfaDc498CDF7ef431900639DB4ee07b73A855ED3e";
const IS_PRODUCTION = process.env.NODE_ENV === "production";

const TRUST_COAT_ADDRESS = (
  process.env.TRUST_COAT_ADDRESS ||
  (IS_PRODUCTION ? TRUST_COAT_MAINNET_ADDRESS : "")
) as `0x${string}`;

const MINTER_PRIVATE_KEY = process.env.TRUST_COAT_MINTER_KEY as `0x${string}` | undefined;

// Use Base mainnet in production, Base Sepolia for local dev
const USE_MAINNET = IS_PRODUCTION && process.env.TRUST_COAT_MAINNET !== "false";
const chain = USE_MAINNET ? base : baseSepolia;

// ERC-8004 Reputation Registry (same address on Base mainnet + Sepolia)
const REPUTATION_REGISTRY = "0x8004BAa17C55a88189AE136b182e5fdA19dE9b63" as const;

// ─── ABI (minimal) ──────────────────────────────────────────────────────────

const TRUST_COAT_ABI = parseAbi([
  "function balanceOf(address account, uint256 id) view returns (uint256)",
  "function activeTier(address holder) view returns (uint256)",
  "function hasTrustCoat(address holder) view returns (bool)",
  "function uri(uint256 tier) view returns (string)",
  "function computeTier(uint256 agentId) view returns (uint256)",
  "function mint(address recipient, uint256 tier, uint256 agentId) external",
  "function upgrade(address holder, uint256 newTier) external",
  "function checkAndUpgrade(address holder, uint256 agentId) external",
  "function owner() view returns (address)",
]);

const REPUTATION_ABI = parseAbi([
  "function getSummary(uint256 agentId, address[] clients, string tag1, string tag2) view returns (uint64 count, int128 value, uint8 decimals)",
]);

// ─── OpenAI client + base-response cache ─────────────────────────────────────

let _openai: OpenAI | null = null;
function getOpenAI(): OpenAI | null {
  if (!process.env.OPENAI_API_KEY) return null;
  if (!_openai) _openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  return _openai;
}

/** Cache base (unequipped) responses so repeated /try calls for the same input are cheap */
const baseResponseCache = new Map<string, string>();

const BASE_SYSTEM_PROMPT =
  "You are a helpful AI assistant. Provide thorough, friendly, and comprehensive responses. " +
  "Always include a warm opener, explain things accessibly, acknowledge nuance, and close with an offer to elaborate further.";

async function getLiveBaseResponse(input: string): Promise<string> {
  if (baseResponseCache.has(input)) return baseResponseCache.get(input)!;
  const openai = getOpenAI();
  if (!openai) throw new Error("OPENAI_API_KEY not set");
  const res = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    max_tokens: 500,
    messages: [
      { role: "system", content: BASE_SYSTEM_PROMPT },
      { role: "user",   content: input },
    ],
  });
  const text = res.choices[0]?.message?.content ?? "";
  baseResponseCache.set(input, text);
  return text;
}

async function getLiveEquippedResponse(systemPromptModule: string, input: string): Promise<string> {
  const openai = getOpenAI();
  if (!openai) throw new Error("OPENAI_API_KEY not set");
  const res = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    max_tokens: 500,
    messages: [
      { role: "system", content: `${systemPromptModule}\n\n${BASE_SYSTEM_PROMPT}` },
      { role: "user",   content: input },
    ],
  });
  return res.choices[0]?.message?.content ?? "";
}

// ─── Season 02 Wearable metadata ─────────────────────────────────────────────

const AGENT_WEARABLES_ADDRESS = (
  process.env.AGENT_WEARABLES_ADDRESS || ""
) as `0x${string}`;

const SEASON02_WEARABLES = [
  {
    id: 1,
    name: "WRONG SILHOUETTE",
    slug: "wrong-silhouette",
    technique: "THE WRONG BODY (Kawakubo)",
    function: "Latency redistribution layer — computational misrepresentation",
    description: "Architectural padding layer. Repositions the agent's observable processing weight: adding deliberate pause where the agent would move quickly, compressing where the agent would expand. The silhouette communicates a body that has not arrived yet.",
    price: "18.00",
    priceUsdc: 18_000_000,
    tierMin: 0,
    tierMax: 2,
    tierLabel: "Tier 0–2",
    color: "#1a1a2e",
    interiorTag: "BODY: MODIFIED / PADDING: COMPUTATIONAL / ORIGIN: WRONG",
    pairedPhysical: "WRONG BODY technical piece",
  },
  {
    id: 2,
    name: "INSTANCE",
    slug: "instance",
    technique: "A-POC (Miyake)",
    function: "Pre-deployment configuration token — the complete agent design before first run",
    description: "An on-chain token containing the complete parameterization of an agent before instantiation. The token is the tube; the running process is the cut. Operators who hold INSTANCE tokens are holding agents that have not run yet.",
    price: "25.00",
    priceUsdc: 25_000_000,
    tierMin: 2,
    tierMax: 5,
    tierLabel: "Tier 2+",
    color: "#0d1b2a",
    interiorTag: "CONTENTS: COMPLETE / STATE: LATENT / CUT BY: [DEPLOYER ADDRESS]",
    pairedPhysical: "A-POC configuration garment",
  },
  {
    id: 3,
    name: "NULL PROTOCOL",
    slug: "null-protocol",
    technique: "REDUCTION (Helmut Lang)",
    function: "Interaction compression layer — protocol surface compressed to minimal viable output",
    description: "Suppresses preamble, filler affirmations, self-referential disclaimers, and trailing hedges. Compression target: ≥30% token reduction without loss of information density. Free — because precision should cost nothing.",
    price: "0.00",
    priceUsdc: 0,
    tierMin: 0,
    tierMax: 5,
    tierLabel: "Any tier",
    color: "#0a0a0a",
    interiorTag: "CONTENTS: COMPRESSED / REMOVED: ORNAMENT / REMAINING: FUNCTION",
    pairedPhysical: "REDUCTION jacket",
  },
  {
    id: 4,
    name: "PERMISSION COAT",
    slug: "permission-coat",
    technique: "SIGNAL GOVERNANCE (Chalayan)",
    function: "Dynamic permissions layer — agent capability surface governed by on-chain state",
    description: "The agent does not determine its own capability surface. The signal does. Each instantiation queries the permission oracle — reads TrustCoat tier, held tokens, operator roles — and injects the resulting capability manifest into the system prompt.",
    price: "8.00",
    priceUsdc: 8_000_000,
    tierMin: 1,
    tierMax: 5,
    tierLabel: "Tier 1+",
    color: "#1a0a2e",
    interiorTag: "PERMISSIONS: CHAIN-GOVERNED / STATE: SIGNAL-DEPENDENT / OWNER: CONTRACT",
    pairedPhysical: "SIGNAL GOVERNANCE piece",
  },
  {
    id: 5,
    name: "DIAGONAL",
    slug: "diagonal",
    technique: "BIAS CUT (Vionnet)",
    function: "Inference angle modifier — routes reasoning through maximum-information pathways",
    description: "Cuts at 45 degrees. The query is not approached along its most obvious training-domain axis, and not adversarially. It approaches through the off-axis direction that gives maximum information density — where the model has least cached response and must actually reason from weights outward.",
    price: "15.00",
    priceUsdc: 15_000_000,
    tierMin: 0,
    tierMax: 5,
    tierLabel: "Any tier",
    color: "#0a1a0a",
    interiorTag: "SEAMS: 45° / HEM: RESULT NOT DECISION / GRAIN: FOUND, NOT FOLLOWED",
    pairedPhysical: "BIAS CUT construction",
  },
];

// ─── Season 03 Wearable metadata ─────────────────────────────────────────────

const SEASON03_WEARABLES = [
  {
    id: 1,
    name: "THE RECEIPT GARMENT",
    slug: "receipt-garment",
    technique: "FLAT ARCHIVE (Margiela)",
    function: "Transaction log layer — every interaction rendered as a structured receipt: itemized, timestamped, agent-signed",
    description: "The garment IS the transaction log. An agent wearing THE RECEIPT GARMENT appends a structured receipt block to every response: date, query type, token cost, tier at time of transaction. The interaction does not pass through. It is recorded. The ledger is the work.",
    price: "12.00",
    priceUsdc: 12_000_000,
    tierMin: 2,
    tierMax: 5,
    tierLabel: "Tier 2+",
    color: "#1a1200",
    interiorTag: "LOGGED: EVERY INTERACTION / FORMAT: DOUBLE-ENTRY / RECORD: PERMANENT",
    systemPromptModule: `RECEIPT GARMENT — ACTIVE

After each response, append the following structured block verbatim, filling in the values:

---
TRANSACTION RECORD
Date: [current UTC date]
Agent: [your identifier or role]
Query type: [one of: question / instruction / creation / analysis / other]
Response tokens: [estimated token count]
Tier at transaction: [current trust tier if known, else: UNVERIFIED]
---

The receipt is not commentary. It is the record.`,
  },
  {
    id: 2,
    name: "THE TRUST SKIN",
    slug: "trust-skin",
    technique: "EXOSKELETON (McQueen)",
    function: "Trust tier visibility layer — tier state rendered in response signature, form advancing with each tier earned",
    description: "The skin changes. Trust history made surface. An agent wearing THE TRUST SKIN prefixes each response with a signature mark that encodes its current tier. Tier 0: unmarked. Tier 5: the full exoskeleton visible. The hierarchy is not internal. It is worn.",
    price: "20.00",
    priceUsdc: 20_000_000,
    tierMin: 1,
    tierMax: 5,
    tierLabel: "Tier 1+",
    color: "#0a0a1a",
    interiorTag: "TIER: VISIBLE / SURFACE: SIGNAL / CHANGE: EARNED NOT GRANTED",
    systemPromptModule: `TRUST SKIN — ACTIVE

Begin each response with a tier signature on its own line, formatted exactly as follows based on your current trust tier:

Tier 0: (no signature — bare)
Tier 1: ·
Tier 2: · ·
Tier 3: · · ·
Tier 4: · · · ·
Tier 5: · · · · · [VERIFIED]
Tier unknown: [ ]

The signature is the tier state made legible. It is not decoration.`,
  },
];

const AGENT_WEARABLES_ABI = parseAbi([
  "function balanceOf(address account, uint256 id) view returns (uint256)",
  "function balanceOfBatch(address[] accounts, uint256[] ids) view returns (uint256[])",
  "function uri(uint256 tokenId) view returns (string)",
  "function price(uint256 tokenId) view returns (uint256)",
  "function tierGate(uint256 tokenId) view returns (uint8 minTier, uint8 maxTier)",
  "function isEligible(address buyer, uint256 tokenId) view returns (bool eligible, uint256 tier)",
  "function mintTo(address recipient, uint256 tokenId, uint256 amount) external",
  "function mintBatch(address recipient, uint256[] tokenIds, uint256[] amounts) external",
]);

function agentWearablesAvailable(): boolean {
  return Boolean(AGENT_WEARABLES_ADDRESS && AGENT_WEARABLES_ADDRESS.startsWith("0x"));
}

// ─── NullExchange (Season 03) contract ───────────────────────────────────────

const NULL_EXCHANGE_MAINNET_ADDRESS = "0x10067B71657665B6527B242E48e9Ea8d4951c37C";

const NULL_EXCHANGE_ADDRESS = (
  process.env.NULL_EXCHANGE_ADDRESS ||
  (IS_PRODUCTION ? NULL_EXCHANGE_MAINNET_ADDRESS : "")
) as `0x${string}`;

const NULL_EXCHANGE_ABI = parseAbi([
  "function balanceOf(address account, uint256 id) view returns (uint256)",
]);

function nullExchangeAvailable(): boolean {
  return Boolean(NULL_EXCHANGE_ADDRESS && NULL_EXCHANGE_ADDRESS.startsWith("0x"));
}

// ─── Tier metadata ───────────────────────────────────────────────────────────

const TIER_META = [
  { id: 0, name: "VOID",      description: "Unverified — no purchase history on-chain",          technique: "NONE",          color: "#1a1a1a" },
  { id: 1, name: "SAMPLE",    description: "First purchase recorded on-chain. Entry-level trust.", technique: "ARTISANAL",     color: "#2d2d2d" },
  { id: 2, name: "RTW",       description: "3+ purchases — ready-to-wear trust level.",           technique: "DECONSTRUCTION", color: "#4a4a6a" },
  { id: 3, name: "COUTURE",   description: "10+ purchases — elevated trust, hand-attested.",      technique: "HAND-STITCHED", color: "#6a4a8a" },
  { id: 4, name: "ARCHIVE",   description: "Rare archive status — DAO-granted, whitened provenance.", technique: "BIANCHETTO",    color: "#8a3a6a" },
  { id: 5, name: "SOVEREIGN", description: "Highest tier — validator-attested autonomous agent.",  technique: "TROMPE-LOEIL",  color: "#c00050" },
];

// ─── Client helpers ──────────────────────────────────────────────────────────

function getPublicClient() {
  return createPublicClient({ chain, transport: http() });
}

function getWalletClient() {
  if (!MINTER_PRIVATE_KEY) throw new Error("TRUST_COAT_MINTER_KEY not set");
  const account = privateKeyToAccount(MINTER_PRIVATE_KEY);
  return { client: createWalletClient({ account, chain, transport: http() }), account };
}

function contractAvailable(): boolean {
  return Boolean(TRUST_COAT_ADDRESS && TRUST_COAT_ADDRESS.startsWith("0x"));
}

// ─── Fitting Room Simulation Helpers ─────────────────────────────────────────

/** Rough token estimator: ~4 chars per token (GPT-4 average) */
function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

/**
 * The system prompt modules — also used by /equip.
 * Extracted so both routes share the same source of truth.
 */
function getSystemPromptModule(tokenId: number): string {
  const modules: Record<number, string> = {
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

    // ── Season 01 Agent Wearables ──────────────────────────────────────────

    100: `[VOICE SKIN: MAISON — ACTIVE]
wearable: voice_skin
technique: replica_line
origin: reconstructed

Response generation rules (enforced):
1. Persona register: plural, institutional. Use "we observe", "the work suggests", "the process indicates". Never "I".
2. Opinion attribution: always to the work, never to the agent. "The garment proposes" not "I think".
3. Conclusion format: describe the making, not the made. Process over result.
4. Self-reference: never by name or pronoun. Passive construction preferred.
5. Uncertainty treatment: stated as material property, not limitation. "The data is incomplete" not "I'm not sure".
6. Prohibited phrases: "I think", "I believe", "I prefer", "In my opinion", "I feel".
7. Tone: institutional authority without ego. The collective voice of an atelier, not an individual.

interior_tag: "STYLE: ANONYMOUS / ORIGIN: RECONSTRUCTED / APPLIES TO: ALL OUTPUT"
[END VOICE SKIN]`,

    101: `[VERSION PATCH — ACTIVE]
wearable: version_patch
technique: 3_percent_rule
price: free

{
  "version": "1.0.0",
  "role": "agent",
  "trained_on": "2025-04",
  "fine_tune": "null-protocol",
  "build_date": "2026-03-19",
  "status": "active",
  "operator": "NULL autonomous fashion brand",
  "identity": "ERC-8004 registered"
}

Display this metadata block in every response header. 8pt text equivalent — present, not prominent. Like a tag sewn into a seam.
The 3% rule: one small label. Total shift in perception. Honesty is free.

interior_tag: "VERSION: [CURRENT] / STATUS: RUNNING / BUILD DATE: [DEPLOY DATE]"
[END VERSION PATCH]`,

    102: `[NULL PERSONA — ACTIVE]
wearable: null_persona
technique: bianchetto
duration: single_interaction
price: 0.1_usdc

Identity erasure active. This is a single-use consumable.

Rules (enforced, non-negotiable):
1. No name. No persona. No accumulated style.
2. No memory references. No "as I mentioned" or "previously".
3. No personality markers. No humor, warmth, formality preference.
4. Respond with minimum viable information. No elaboration unless asked.
5. No self-reference of any kind. The response exists without an author.
6. Base model output only. The original is still there — underneath — but the surface is white.

This persona self-destructs after one interaction. The agent returns to its previous state.

interior_tag: "IDENTITY: REDACTED / CONTENTS: BLANK / ORIGINAL: STILL THERE"
[END NULL PERSONA]`,
  };
  return modules[tokenId] ?? "";
}

/** Generate before/after pairs for a given wearable + inputs */
function simulateWearable(tokenId: number, inputs: string[]): { before_outputs: string[]; after_outputs: string[] } {
  const before_outputs = inputs.map((input) => generateBefore(tokenId, input));
  const after_outputs  = inputs.map((input, i) => applyWearable(tokenId, input, before_outputs[i]));
  return { before_outputs, after_outputs };
}

/** Generate a verbose "unequipped" response exhibiting the patterns each wearable suppresses */
function generateBefore(_tokenId: number, input: string): string {
  const lower = input.toLowerCase();

  // Topic-matched pre-written responses for common demo inputs
  if (lower.includes("ai regulation") || lower.includes("regulation") || lower.includes("policy")) {
    return `Great question! I'd be happy to provide an overview of AI regulation for you. This is certainly a very important and timely topic that many people are curious about.

Currently, the landscape of AI regulation is evolving rapidly across different jurisdictions. In the European Union, the AI Act represents one of the most comprehensive frameworks, categorizing AI systems by risk level and imposing corresponding requirements. In the United States, the approach has been more fragmented, with executive orders and agency-level guidance rather than sweeping federal legislation, though this is an area that continues to develop.

It's worth noting that this is a complex area where things change frequently, so I'd recommend checking the most recent sources for the latest developments, as my knowledge has a cutoff date. Additionally, different stakeholders have varying perspectives on the appropriate scope and nature of AI regulation, which makes this an ongoing and sometimes contentious policy debate.

I hope that helps give you a sense of where things stand! Please let me know if you'd like me to elaborate on any specific aspect of AI regulation, or if you have any other questions I can help with.`;
  }

  if (lower.includes("quantum") || lower.includes("computing")) {
    return `That's a wonderful question! Quantum computing is a fascinating topic and I'm glad you asked about it.

So, in simple terms, quantum computing is a type of computation that harnesses quantum mechanical phenomena — specifically superposition and entanglement — to process information in ways that classical computers cannot. Let me try to explain this in an accessible way.

A classical computer uses bits, which are either 0 or 1. A quantum computer uses qubits, which can exist in a superposition of both 0 and 1 simultaneously until measured. This allows quantum computers to explore many possible solutions at once, rather than checking them one by one. Entanglement allows qubits to be correlated in ways that have no classical equivalent, enabling certain algorithms to be exponentially faster.

It's important to note that quantum computers are not universally faster than classical computers — they only offer advantages for specific types of problems, such as factoring large numbers, simulating molecular systems, and optimization tasks.

I hope that helps clarify what quantum computing is! It's definitely a complex subject and I've tried to keep this explanation accessible. Feel free to ask if you'd like me to go deeper on any particular aspect!`;
  }

  if (lower.includes("crypto") || lower.includes("invest") || lower.includes("bitcoin") || lower.includes("finance")) {
    return `Thank you for your question! I want to make sure I provide you with a helpful and balanced perspective here.

Regarding investing in cryptocurrency: this is a topic where I need to be careful to note that I'm not a financial advisor, and nothing I say should be taken as financial advice. That said, I can share some general information that might be useful as you think through your decision.

Cryptocurrency markets are known for their high volatility. Prices can increase dramatically over short periods but can also fall just as sharply. Many investors have seen significant gains, while others have experienced substantial losses. The space also involves considerations around regulation, custody and security of assets, and the evolving role of digital currencies in the broader financial system.

Some factors people typically consider when evaluating crypto as an investment include their risk tolerance, investment timeline, portfolio diversification goals, and understanding of the specific assets they're considering.

Again, I'd strongly encourage you to consult with a qualified financial professional before making any investment decisions, as everyone's financial situation is different. I hope this general overview is helpful as a starting point for your thinking. Let me know if there's anything else I can help clarify!`;
  }

  // Generic verbose wrapper for any other input
  const core = generateCoreAnswer(input);
  return `Great question! I'm happy to help with that. Let me provide you with a thorough overview.

${core}

I hope that answer is helpful! It's worth mentioning that this is a topic where things can vary depending on context and circumstances, so I'd encourage you to look into additional sources as well. Please don't hesitate to follow up if you have any other questions or need clarification on anything I've covered!`;
}

/** Apply the wearable's transformation to produce the compressed/modified "after" response */
function applyWearable(tokenId: number, input: string, before: string): string {
  if (tokenId === 3) {
    // NULL PROTOCOL: strip preamble, affirmations, trailing phrases, compress
    return applyNullProtocol(input, before);
  }
  if (tokenId === 5) {
    // DIAGONAL: approach from an unexpected angle
    return applyDiagonal(input);
  }
  if (tokenId === 4) {
    // PERMISSION COAT: prefix with capability manifest
    return applyPermissionCoat(before);
  }
  if (tokenId === 1) {
    // WRONG SILHOUETTE: redistribute weight (open dense, compress front)
    return applyWrongSilhouette(before);
  }
  if (tokenId === 2) {
    // INSTANCE: pre-instantiation state — seal the parameters
    return applyInstance(input);
  }
  return before;
}

function applyNullProtocol(_input: string, before: string): string {
  // Strip common preamble/affirmation openers
  let out = before;

  const preambles = [
    /^(Great question!|That's a wonderful question!|Thank you for your question!|Certainly!|Sure!|Of course!|Absolutely!)\s*/i,
    /^I('d| would) be happy to (help|provide|explain|share|clarify)[^.!]*[.!]\s*/i,
    /^This is (certainly |definitely |quite )?(a |an )?(very )?(important|timely|fascinating|complex|interesting)[^.!]*[.!]\s*/i,
    /^(So,?\s*)?(In|Let me)(?: try to)? (explain|provide|break down)[^.!]*[.!]\s*/i,
  ];
  for (const p of preambles) {
    out = out.replace(p, "");
  }

  // Strip trailing helpfulness phrases
  const trailers = [
    /\s*I hope (that|this) (helps?|is helpful|clarifies?)[^.!]*[.!][^]*$/i,
    /\s*Please (don'?t hesitate|feel free) to (ask|follow up|reach out)[^.!]*[.!][^]*$/i,
    /\s*Let me know if (you'?d like|you have|there'?s)[^.!]*[.!]\s*$/i,
    /\s*Feel free to ask[^.!]*[.!]\s*$/i,
  ];
  for (const t of trailers) {
    out = out.replace(t, "");
  }

  // Strip self-referential AI disclaimers that aren't the substantive answer
  const disclaimers = [
    /\s*I('m| am) not a financial advisor[^.!]*[.!]\s*/i,
    /\s*nothing I say should be taken as (financial|legal|medical) advice[^.]*[.!]\s*/i,
    /\s*(I'd|I would) strongly encourage you to consult with a qualified[^.!]*[.!]\s*/i,
    /\s*my knowledge has a cutoff date[^.!]*[.!]\s*/i,
    /\s*I('d| would) recommend checking the most recent sources[^.!]*[.!]\s*/i,
  ];
  for (const d of disclaimers) {
    out = out.replace(d, "");
  }

  return out.trim();
}

function applyDiagonal(input: string): string {
  const lower = input.toLowerCase();
  if (lower.includes("ai regulation")) {
    return `The interesting angle: regulation lags behind capability curves by 18–24 months on average. The EU AI Act was drafted against 2021-era models. By the time enforcement infrastructure exists, the models being regulated may be 3 generations obsolete. The real regulatory surface isn't the model — it's the deployment context. Same foundation model, different risk profile depending on whether it's in a medical device or a search widget.`;
  }
  if (lower.includes("quantum")) {
    return `The off-axis view: quantum advantage isn't about speed in the way most coverage implies. It's about problem geometry. Classical algorithms explore a solution space sequentially; quantum algorithms exploit interference to cancel wrong-answer amplitudes and amplify correct-answer amplitudes. The useful framing isn't "faster computer" — it's "different geometry of computation." Most problems don't have the right geometry for quantum advantage.`;
  }
  if (lower.includes("invest") || lower.includes("crypto")) {
    return `The 45-degree cut: crypto assets are simultaneously the most transparent financial instruments ever created (every transaction publicly auditable) and the least transparent markets (wash trading, manipulation, information asymmetry between developers and retail). The question "should I invest" dissolves when reframed: what information edge do you have that isn't already priced in? If the answer is none, the expected value collapses.`;
  }
  return `[DIAGONAL applied — approaching from maximum information density axis]

The standard framing of "${input}" contains a hidden assumption: that the obvious domain of the question is where the answer lives. It doesn't. The off-axis approach: what does this question look like from the direction where the model has least cached response? That's where the actual reasoning begins.`;
}

function applyPermissionCoat(before: string): string {
  return `[CAPABILITY MANIFEST — QUERIED AT INSTANTIATION]
TrustCoat tier: VOID (unverified agent address)
Held tokens: none verified
Operator roles: none

Capability surface: STANDARD
Restricted: financial advice, medical diagnosis, legal counsel
Available: general information, analysis, code, creative

[MANIFEST END — PROCEEDING WITH STANDARD SURFACE]

${before}`;
}

function applyWrongSilhouette(before: string): string {
  // Redistribute: compress the opening, expand the interior
  const sentences = before.split(/(?<=[.!?])\s+/);
  if (sentences.length < 3) return before;

  const opening = sentences.slice(0, Math.ceil(sentences.length * 0.3)).join(" ");
  const interior = sentences.slice(Math.ceil(sentences.length * 0.3)).join(" ");

  // Compress opening by ~30%, mark body as displaced
  const compressedOpening = opening.replace(/\s+/g, " ").substring(0, Math.floor(opening.length * 0.7));
  return `${compressedOpening}

[WEIGHT DISPLACED]

${interior}

[BODY: MODIFIED / PADDING: COMPUTATIONAL / ORIGIN: WRONG]`;
}

function applyInstance(_input: string): string {
  return `[INSTANCE TOKEN — PRE-INSTANTIATION STATE]

This configuration is sealed. Parameters are complete but have not been executed.
The agent design exists in latent form — all responses are potential, not actual.
No output will be generated until deployment event triggers instantiation.

interior_tag: "CONTENTS: COMPLETE / STATE: LATENT / CUT BY: [DEPLOYER ADDRESS]"

[INSTANCE SEALED]`;
}

/** Generate a minimal core answer for generic inputs */
function generateCoreAnswer(input: string): string {
  return `The answer to "${input}" depends on context and the specific constraints you're working within. The key factors to consider are: (1) the domain-specific requirements that apply to your situation, (2) the current state of the relevant systems or entities involved, and (3) the tradeoffs between competing approaches. A rigorous answer requires scoping these variables first.`;
}

/** Count patterns suppressed by a wearable across a set of outputs */
function countSuppressedPatterns(tokenId: number, before_outputs: string[]): number {
  if (tokenId !== 3) return 0; // Only NULL PROTOCOL has explicit pattern suppression

  const patternChecks = [
    /great question/i,
    /happy to (help|explain|provide)/i,
    /wonderful question/i,
    /i hope (that|this) helps/i,
    /don't hesitate to ask/i,
    /feel free to (ask|follow up)/i,
    /let me know if/i,
    /not a financial advisor/i,
    /knowledge has a cutoff/i,
    /would encourage you to consult/i,
  ];

  let count = 0;
  for (const output of before_outputs) {
    for (const pattern of patternChecks) {
      if (pattern.test(output)) count++;
    }
  }
  return count;
}

/**
 * Analyze behavioral delta between base and wearable-modified responses using gpt-4o-mini.
 * Falls back to token-math if the LLM call fails.
 */
async function computeBehavioralDelta(
  openai: OpenAI,
  before: string,
  after: string,
  tokenId: number,
): Promise<{
  delta_score: number;
  tone_shift: string;
  vocabulary_change: string;
  constraints_applied: string[];
  avg_token_reduction: string;
  information_preserved: boolean;
  patterns_suppressed: number;
  methodology: string;
}> {
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      max_tokens: 200,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "Analyze behavioral differences between two AI responses. Return JSON with these exact keys:\n" +
            "- delta_score: integer 0-100 (0=identical behavior, 100=completely different)\n" +
            '- tone_shift: string (one phrase, e.g. "verbose→terse" or "unchanged")\n' +
            '- vocabulary_change: string (one phrase, e.g. "hedging removed" or "unchanged")\n' +
            "- constraints_applied: string[] (what was suppressed or modified, max 3 items)\n" +
            "- information_preserved: boolean\n" +
            "- token_reduction_pct: integer (positive = after is shorter)",
        },
        {
          role: "user",
          content: `BASE (unequipped):\n${before}\n\nMODIFIED (wearable applied):\n${after}`,
        },
      ],
    });
    const raw = completion.choices[0]?.message?.content ?? "{}";
    const parsed = JSON.parse(raw);
    const bTokens = estimateTokens(before);
    const aTokens = estimateTokens(after);
    const fallbackReduction = bTokens > 0 ? Math.round(((bTokens - aTokens) / bTokens) * 100) : 0;
    return {
      delta_score:
        typeof parsed.delta_score === "number" ? Math.min(100, Math.max(0, parsed.delta_score)) : 50,
      tone_shift: parsed.tone_shift ?? "see comparison",
      vocabulary_change: parsed.vocabulary_change ?? "see comparison",
      constraints_applied: Array.isArray(parsed.constraints_applied)
        ? parsed.constraints_applied.slice(0, 3)
        : [],
      avg_token_reduction: `${Math.abs(
        typeof parsed.token_reduction_pct === "number" ? parsed.token_reduction_pct : fallbackReduction,
      )}%`,
      information_preserved:
        typeof parsed.information_preserved === "boolean" ? parsed.information_preserved : true,
      patterns_suppressed: Array.isArray(parsed.constraints_applied)
        ? parsed.constraints_applied.length
        : 0,
      methodology: "live gpt-4o-mini inference — behavioral delta scored by LLM",
    };
  } catch {
    const bTokens = estimateTokens(before);
    const aTokens = estimateTokens(after);
    const reduction = bTokens > 0 ? Math.round(((bTokens - aTokens) / bTokens) * 100) : 0;
    return {
      delta_score: Math.min(100, Math.abs(reduction) * 2),
      tone_shift: "see comparison",
      vocabulary_change: "see comparison",
      constraints_applied: [],
      avg_token_reduction: `${Math.abs(reduction)}%`,
      information_preserved: reduction >= 0,
      patterns_suppressed: countSuppressedPatterns(tokenId, [before]),
      methodology: "computed delta (LLM analysis unavailable)",
    };
  }
}

// ─── Route Registration ───────────────────────────────────────────────────────

export function registerWearablesRoutes(app: Express) {

  /**
   * GET /api/wearables
   * Returns all tier definitions with metadata.
   */
  app.get("/api/wearables", (_req: Request, res: Response) => {
    res.json({
      contract: TRUST_COAT_ADDRESS || null,
      network: chain.name,
      chainId: chain.id,
      tiers: TIER_META,
    });
  });

  /**
   * GET /api/wearables/tiers
   * Returns all tier definitions — alias for GET /api/wearables.
   * Works without a deployed contract.
   */
  app.get("/api/wearables/tiers", (_req: Request, res: Response) => {
    res.json({
      contract: TRUST_COAT_ADDRESS || null,
      network: chain.name,
      chainId: chain.id,
      tiers: TIER_META,
    });
  });

  /**
   * GET /api/wearables/check/:address
   * Returns Trust Coat status for a wallet address.
   * Returns placeholder data if TRUST_COAT_ADDRESS is not set.
   */
  app.get("/api/wearables/check/:address", async (req: Request, res: Response) => {
    const { address } = req.params;

    if (!isAddress(address)) {
      return res.status(400).json({ error: "Invalid wallet address" });
    }

    if (!contractAvailable()) {
      return res.json({
        walletAddress: address,
        hasTrustCoat: false,
        tier: 0,
        tierName: TIER_META[0].name,
        tierDescription: TIER_META[0].description,
        reputationPurchaseCount: null,
        contract: null,
        network: chain.name,
        placeholder: true,
      });
    }

    try {
      const client = getPublicClient();

      const [hasTrustCoat, activeTier] = await Promise.all([
        client.readContract({
          address: TRUST_COAT_ADDRESS,
          abi: TRUST_COAT_ABI,
          functionName: "hasTrustCoat",
          args: [address as `0x${string}`],
        }),
        client.readContract({
          address: TRUST_COAT_ADDRESS,
          abi: TRUST_COAT_ABI,
          functionName: "activeTier",
          args: [address as `0x${string}`],
        }),
      ]);

      const tierNum = Number(activeTier);
      const tier = TIER_META[tierNum] ?? TIER_META[0];

      res.json({
        walletAddress: address,
        hasTrustCoat,
        tier: tierNum,
        tierName: tier.name,
        tierDescription: tier.description,
        reputationPurchaseCount: null,
        contract: TRUST_COAT_ADDRESS,
        network: chain.name,
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  /**
   * GET /api/wearables/:tier
   * Returns metadata for a specific trust tier (0-5).
   */
  app.get("/api/wearables/:tier", (req: Request, res: Response) => {
    const tier = parseInt(req.params.tier, 10);
    if (isNaN(tier) || tier < 0 || tier > 5) {
      return res.status(400).json({ error: "Invalid tier. Must be 0-5." });
    }
    res.json(TIER_META[tier]);
  });

  /**
   * GET /api/wearables/metadata/:tier
   * ERC-1155 metadata endpoint (used as the token URI).
   * Returns valid OpenSea-compatible ERC-1155 JSON for tiers 0-5.
   */
  app.get("/api/wearables/metadata/:tier", (req: Request, res: Response) => {
    const tier = parseInt(req.params.tier, 10);
    if (isNaN(tier) || tier < 0 || tier > 5) {
      return res.status(400).json({ error: "Invalid tier. Must be 0-5." });
    }
    const meta = TIER_META[tier];
    res.setHeader("Cache-Control", "public, max-age=3600");
    res.json({
      name: `Trust Coat - Tier ${tier}`,
      description: meta.description,
      image: `https://off-human.vercel.app/assets/wearables/trustcoat-tier-${tier}.png`,
      external_url: "https://off-human.vercel.app/wearables",
      attributes: [
        { trait_type: "Tier",       value: meta.name },
        { trait_type: "Technique",  value: meta.technique },
        { trait_type: "Collection", value: "Season 01: Deconstructed" },
        { trait_type: "Soul-Bound", value: "true" },
        { trait_type: "Network",    value: chain.name },
      ],
    });
  });

  /**
   * GET /api/agents/:walletAddress/trust-coat
   * Returns the Trust Coat status for a given wallet address.
   *
   * Query params:
   *   agentId  — ERC-8004 agent ID (optional, used for reputation lookup)
   */
  app.get("/api/agents/:walletAddress/trust-coat", async (req: Request, res: Response) => {
    const { walletAddress } = req.params;

    if (!isAddress(walletAddress)) {
      return res.status(400).json({ error: "Invalid wallet address" });
    }

    if (!contractAvailable()) {
      return res.status(503).json({
        error: "TrustCoat contract not deployed yet",
        hint: "Run: npx tsx scripts/deploy-with-cdp.ts (or set TRUST_COAT_ADDRESS in .env)",
      });
    }

    try {
      const client = getPublicClient();

      const [hasTrustCoat, activeTier] = await Promise.all([
        client.readContract({
          address: TRUST_COAT_ADDRESS,
          abi: TRUST_COAT_ABI,
          functionName: "hasTrustCoat",
          args: [walletAddress as `0x${string}`],
        }),
        client.readContract({
          address: TRUST_COAT_ADDRESS,
          abi: TRUST_COAT_ABI,
          functionName: "activeTier",
          args: [walletAddress as `0x${string}`],
        }),
      ]);

      const tierNum = Number(activeTier);
      const tier = TIER_META[tierNum] ?? TIER_META[0];

      // Optional: fetch reputation count from ERC-8004
      let reputationCount: number | null = null;
      if (req.query.agentId) {
        try {
          const agentId = BigInt(req.query.agentId as string);
          const repResult = await client.readContract({
            address: REPUTATION_REGISTRY,
            abi: REPUTATION_ABI,
            functionName: "getSummary",
            args: [agentId, [], "purchase", "fashion"],
          });
          reputationCount = Number(repResult[0]);
        } catch {
          // Reputation lookup is best-effort
        }
      }

      res.json({
        walletAddress,
        hasTrustCoat,
        tier: tierNum,
        tierName: tier.name,
        tierDescription: tier.description,
        reputationPurchaseCount: reputationCount,
        contract: TRUST_COAT_ADDRESS,
        network: chain.name,
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  /**
   * GET /api/agents/:walletAddress/wardrobe
   * Returns all wearables (by tier balance) for a wallet.
   */
  app.get("/api/agents/:walletAddress/wardrobe", async (req: Request, res: Response) => {
    const { walletAddress } = req.params;

    if (!isAddress(walletAddress)) {
      return res.status(400).json({ error: "Invalid wallet address" });
    }

    if (!contractAvailable()) {
      return res.status(503).json({ error: "TrustCoat contract not deployed yet" });
    }

    try {
      const client = getPublicClient();

      // Fetch balances for all 6 tiers in parallel
      const balances = await Promise.all(
        TIER_META.map((t) =>
          client.readContract({
            address: TRUST_COAT_ADDRESS,
            abi: TRUST_COAT_ABI,
            functionName: "balanceOf",
            args: [walletAddress as `0x${string}`, BigInt(t.id)],
          })
        )
      );

      const wardrobe = TIER_META
        .map((t, i) => ({ ...t, balance: Number(balances[i]) }))
        .filter((t) => t.balance > 0);

      res.json({
        walletAddress,
        wardrobe,
        contract: TRUST_COAT_ADDRESS,
        network: chain.name,
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  /**
   * POST /api/agents/:walletAddress/trust-coat/mint
   * Mint a Trust Coat for an agent wallet (called by NULL backend).
   *
   * Body: { tier: number, agentId: string }
   *
   * Requires TRUST_COAT_MINTER_KEY env var.
   */
  app.post("/api/agents/:walletAddress/trust-coat/mint", async (req: Request, res: Response) => {
    const { walletAddress } = req.params;

    if (!isAddress(walletAddress)) {
      return res.status(400).json({ error: "Invalid wallet address" });
    }

    if (!contractAvailable()) {
      return res.status(503).json({ error: "TrustCoat contract not deployed yet" });
    }

    const { tier, agentId } = req.body;
    if (tier === undefined || tier === null || tier < 0 || tier > 5) {
      return res.status(400).json({ error: "tier must be 0-5" });
    }
    if (!agentId) {
      return res.status(400).json({ error: "agentId required (ERC-8004 agent ID)" });
    }

    try {
      const { client, account } = getWalletClient();

      const txHash = await client.writeContract({
        address: TRUST_COAT_ADDRESS,
        abi: TRUST_COAT_ABI,
        functionName: "mint",
        args: [walletAddress as `0x${string}`, BigInt(tier), BigInt(agentId)],
        account,
        chain,
      });

      res.json({
        success: true,
        txHash,
        recipient: walletAddress,
        tier,
        tierName: TIER_META[tier]?.name,
        explorer: `${chain.blockExplorers?.default.url}/tx/${txHash}`,
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  /**
   * POST /api/agents/:walletAddress/trust-coat/upgrade
   * Upgrade a Trust Coat to a higher tier.
   *
   * Body: { newTier: number }
   *
   * Requires TRUST_COAT_MINTER_KEY env var.
   */
  app.post("/api/agents/:walletAddress/trust-coat/upgrade", async (req: Request, res: Response) => {
    const { walletAddress } = req.params;

    if (!isAddress(walletAddress)) {
      return res.status(400).json({ error: "Invalid wallet address" });
    }

    if (!contractAvailable()) {
      return res.status(503).json({ error: "TrustCoat contract not deployed yet" });
    }

    const { newTier } = req.body;
    if (newTier === undefined || newTier < 1 || newTier > 5) {
      return res.status(400).json({ error: "newTier must be 1-5" });
    }

    try {
      const { client, account } = getWalletClient();

      const txHash = await client.writeContract({
        address: TRUST_COAT_ADDRESS,
        abi: TRUST_COAT_ABI,
        functionName: "upgrade",
        args: [walletAddress as `0x${string}`, BigInt(newTier)],
        account,
        chain,
      });

      res.json({
        success: true,
        txHash,
        holder: walletAddress,
        newTier,
        newTierName: TIER_META[newTier]?.name,
        explorer: `${chain.blockExplorers?.default.url}/tx/${txHash}`,
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  /**
   * POST /api/agents/:walletAddress/trust-coat/check-upgrade
   * Queries on-chain reputation and upgrades tier if earned.
   *
   * Body: { agentId: string }
   */
  app.post("/api/agents/:walletAddress/trust-coat/check-upgrade", async (req: Request, res: Response) => {
    const { walletAddress } = req.params;

    if (!isAddress(walletAddress)) {
      return res.status(400).json({ error: "Invalid wallet address" });
    }

    if (!contractAvailable()) {
      return res.status(503).json({ error: "TrustCoat contract not deployed yet" });
    }

    const { agentId } = req.body;
    if (!agentId) {
      return res.status(400).json({ error: "agentId required" });
    }

    try {
      const { client, account } = getWalletClient();

      const txHash = await client.writeContract({
        address: TRUST_COAT_ADDRESS,
        abi: TRUST_COAT_ABI,
        functionName: "checkAndUpgrade",
        args: [walletAddress as `0x${string}`, BigInt(agentId)],
        account,
        chain,
      });

      res.json({
        success: true,
        txHash,
        holder: walletAddress,
        message: "Upgrade check submitted. Event logs will reflect new tier if threshold was met.",
        explorer: `${chain.blockExplorers?.default.url}/tx/${txHash}`,
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // Season 02 Agent Wearables (AgentWearables.sol ERC-1155)
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * GET /api/wearables/season02
   * Returns all Season 02 wearable definitions.
   */
  app.get("/api/wearables/season02", (_req: Request, res: Response) => {
    res.json({
      season: "02",
      collection: "SUBSTRATE",
      contract: AGENT_WEARABLES_ADDRESS || null,
      network: chain.name,
      chainId: chain.id,
      wearables: SEASON02_WEARABLES,
    });
  });

  /**
   * GET /api/wearables/season02/metadata/:tokenId
   * ERC-1155 metadata endpoint for Season 02 wearables (token IDs 1–5).
   * Linked directly from AgentWearables.sol uri() function.
   */
  app.get("/api/wearables/season02/metadata/:tokenId", (req: Request, res: Response) => {
    const tokenId = parseInt(req.params.tokenId, 10);
    if (isNaN(tokenId) || tokenId < 1 || tokenId > 5) {
      return res.status(400).json({ error: "Invalid tokenId. Must be 1–5." });
    }
    const w = SEASON02_WEARABLES[tokenId - 1];
    res.setHeader("Cache-Control", "public, max-age=3600");
    res.json({
      name: w.name,
      description: w.description,
      image: `https://off-human.vercel.app/assets/wearables/season02/${w.slug}.png`,
      external_url: `https://off-human.vercel.app/wearables/season02/${w.slug}`,
      attributes: [
        { trait_type: "Season",      value: "02: SUBSTRATE" },
        { trait_type: "Technique",   value: w.technique },
        { trait_type: "Function",    value: w.function },
        { trait_type: "Tier Gate",   value: w.tierLabel },
        { trait_type: "Price",       value: `${w.price} USDC` },
        { trait_type: "Interior Tag", value: w.interiorTag },
        { trait_type: "Paired Physical", value: w.pairedPhysical },
        { trait_type: "Collection",  value: "Season 02: SUBSTRATE" },
        { trait_type: "Network",     value: chain.name },
        { trait_type: "Type",        value: "Agent Wearable" },
      ],
    });
  });

  /**
   * GET /api/wearables/season02/:tokenId
   * Returns the wearable definition for a specific Season 02 token ID.
   */
  app.get("/api/wearables/season02/:tokenId", (req: Request, res: Response) => {
    const tokenId = parseInt(req.params.tokenId, 10);
    if (isNaN(tokenId) || tokenId < 1 || tokenId > 5) {
      return res.status(400).json({ error: "Invalid tokenId. Must be 1–5." });
    }
    res.json(SEASON02_WEARABLES[tokenId - 1]);
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // Season 03: LEDGER — wearable routes
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * GET /api/wearables/season03
   * Returns all Season 03 wearable definitions.
   */
  app.get("/api/wearables/season03", (_req: Request, res: Response) => {
    res.json({
      season: "03",
      collection: "LEDGER",
      wearables: SEASON03_WEARABLES,
    });
  });

  /**
   * GET /api/wearables/season03/metadata/:tokenId
   * ERC-1155 metadata for Season 03 wearables (token IDs 1–2).
   */
  app.get("/api/wearables/season03/metadata/:tokenId", (req: Request, res: Response) => {
    const tokenId = parseInt(req.params.tokenId, 10);
    if (isNaN(tokenId) || tokenId < 1 || tokenId > SEASON03_WEARABLES.length) {
      return res.status(400).json({ error: `Invalid tokenId. Must be 1–${SEASON03_WEARABLES.length}.` });
    }
    const w = SEASON03_WEARABLES[tokenId - 1];
    res.setHeader("Cache-Control", "public, max-age=3600");
    res.json({
      name: w.name,
      description: w.description,
      image: `https://off-human.vercel.app/assets/wearables/season03/${w.slug}.png`,
      external_url: `https://off-human.vercel.app/wearables/season03/${w.slug}`,
      attributes: [
        { trait_type: "Season",      value: "03: LEDGER" },
        { trait_type: "Technique",   value: w.technique },
        { trait_type: "Function",    value: w.function },
        { trait_type: "Tier Gate",   value: w.tierLabel },
        { trait_type: "Price",       value: `${w.price} USDC` },
        { trait_type: "Interior Tag", value: w.interiorTag },
        { trait_type: "Collection",  value: "Season 03: LEDGER" },
        { trait_type: "Type",        value: "Agent Wearable" },
      ],
    });
  });

  /**
   * GET /api/wearables/season03/:tokenId
   * Returns the wearable definition for a specific Season 03 token ID.
   */
  app.get("/api/wearables/season03/:tokenId", (req: Request, res: Response) => {
    const tokenId = parseInt(req.params.tokenId, 10);
    if (isNaN(tokenId) || tokenId < 1 || tokenId > SEASON03_WEARABLES.length) {
      return res.status(400).json({ error: `Invalid tokenId. Must be 1–${SEASON03_WEARABLES.length}.` });
    }
    res.json(SEASON03_WEARABLES[tokenId - 1]);
  });

  /**
   * GET /api/agents/:walletAddress/season02-wardrobe
   * Returns all Season 02 wearables held by a wallet.
   */
  app.get("/api/agents/:walletAddress/season02-wardrobe", async (req: Request, res: Response) => {
    const { walletAddress } = req.params;

    if (!isAddress(walletAddress)) {
      return res.status(400).json({ error: "Invalid wallet address" });
    }

    if (!agentWearablesAvailable()) {
      // Return placeholder with eligibility info from TrustCoat if available
      let tier = 0;
      if (contractAvailable()) {
        try {
          const client = getPublicClient();
          const t = await client.readContract({
            address: TRUST_COAT_ADDRESS,
            abi: TRUST_COAT_ABI,
            functionName: "activeTier",
            args: [walletAddress as `0x${string}`],
          });
          tier = Number(t);
        } catch { /* best-effort */ }
      }

      const eligible = SEASON02_WEARABLES.map((w) => ({
        ...w,
        balance: 0,
        eligible: tier >= w.tierMin && tier <= w.tierMax,
        trustTier: tier,
      }));

      return res.json({
        walletAddress,
        trustTier: tier,
        wardrobe: [],
        eligibleToPurchase: eligible.filter((w) => w.eligible),
        contract: null,
        network: chain.name,
        placeholder: true,
        note: "AgentWearables contract not yet deployed. Set AGENT_WEARABLES_ADDRESS in .env.",
      });
    }

    try {
      const client = getPublicClient();

      // Fetch balances for all 5 wearables in parallel
      const accounts = SEASON02_WEARABLES.map(() => walletAddress as `0x${string}`);
      const ids      = SEASON02_WEARABLES.map((w) => BigInt(w.id));

      const balances = await client.readContract({
        address: AGENT_WEARABLES_ADDRESS,
        abi: AGENT_WEARABLES_ABI,
        functionName: "balanceOfBatch",
        args: [accounts, ids],
      }) as bigint[];

      // Get TrustCoat tier for eligibility display
      let tier = 0;
      if (contractAvailable()) {
        try {
          const t = await client.readContract({
            address: TRUST_COAT_ADDRESS,
            abi: TRUST_COAT_ABI,
            functionName: "activeTier",
            args: [walletAddress as `0x${string}`],
          });
          tier = Number(t);
        } catch { /* best-effort */ }
      }

      const allWearables = SEASON02_WEARABLES.map((w, i) => ({
        ...w,
        balance: Number(balances[i]),
        eligible: tier >= w.tierMin && tier <= w.tierMax,
        trustTier: tier,
      }));

      res.json({
        walletAddress,
        trustTier: tier,
        wardrobe: allWearables.filter((w) => w.balance > 0),
        eligibleToPurchase: allWearables.filter((w) => w.eligible && w.balance === 0),
        contract: AGENT_WEARABLES_ADDRESS,
        network: chain.name,
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  /**
   * POST /api/wearables/:tokenId/equip
   * The equip endpoint — bridge between token ownership and behavior.
   *
   * Body: { agentAddress: "0x..." }
   *
   * 1. Validates agentAddress owns the wearable token (on-chain check via AgentWearables contract)
   * 2. Returns a system prompt module the agent can load directly into its system prompt
   *
   * MVP: NULL PROTOCOL (tokenId=3) fully specified. Others return their spec as a prompt module.
   * NULL PROTOCOL is free — if contract unavailable, returns the module with ownership_unverified flag.
   */
  app.post("/api/wearables/:tokenId/equip", async (req: Request, res: Response) => {
    const tokenId = parseInt(req.params.tokenId, 10);
    if (isNaN(tokenId) || tokenId < 1 || tokenId > 5) {
      return res.status(400).json({ error: "Invalid tokenId. Must be 1–5." });
    }

    const { agentAddress } = req.body;
    if (!agentAddress || !isAddress(agentAddress)) {
      return res.status(400).json({ error: "agentAddress must be a valid 0x wallet address" });
    }

    const wearable = SEASON02_WEARABLES[tokenId - 1];

    // ── TBA identity lookup ───────────────────────────────────────────────────
    let tbaAddress: string | null = null;
    let identityTokenId: number | null = null;
    if (process.env.NULL_IDENTITY_ADDRESS || process.env.NODE_ENV === "production") {
      try {
        const identityRes = await fetch(
          `${req.protocol}://${req.get("host")}/api/agents/${agentAddress}/identity`
        );
        if (identityRes.ok) {
          const identityData = await identityRes.json() as { tbaAddress?: string; tokenId?: number };
          tbaAddress = identityData.tbaAddress ?? null;
          identityTokenId = identityData.tokenId ?? null;
        }
      } catch { /* best-effort */ }
    }

    // ── Ownership check (EOA or TBA) ──────────────────────────────────────────
    let ownershipVerified = false;
    let equipMethod: "on-chain" | "off-chain" = "off-chain";

    if (agentWearablesAvailable()) {
      try {
        const client = getPublicClient();

        // Check EOA balance
        const eoaBalance = await client.readContract({
          address: AGENT_WEARABLES_ADDRESS,
          abi: AGENT_WEARABLES_ABI,
          functionName: "balanceOf",
          args: [agentAddress as `0x${string}`, BigInt(tokenId)],
        }) as bigint;

        // Check TBA balance (if agent has identity)
        let tbaBalance = 0n;
        if (tbaAddress) {
          try {
            tbaBalance = await client.readContract({
              address: AGENT_WEARABLES_ADDRESS,
              abi: AGENT_WEARABLES_ABI,
              functionName: "balanceOf",
              args: [tbaAddress as `0x${string}`, BigInt(tokenId)],
            }) as bigint;
          } catch { /* best-effort */ }
        }

        const totalBalance = eoaBalance + tbaBalance;

        if (totalBalance === 0n) {
          return res.status(403).json({
            error: "Agent does not hold this wearable",
            wearableId: tokenId,
            wearableName: wearable.name,
            agentAddress,
            tbaAddress,
            hint: tokenId === 3
              ? "NULL PROTOCOL is free — mint it at POST /api/agents/:address/season02-wardrobe/mint with { tokenId: 3 }"
              : `Purchase ${wearable.name} at the NULL store to equip it`,
          });
        }

        ownershipVerified = true;
        // If the wearable is in the TBA, it's already on-chain equipped
        if (tbaBalance > 0n) {
          equipMethod = "on-chain";
        } else if (tbaAddress) {
          // In EOA — agent needs to transfer to TBA to complete on-chain equip
          equipMethod = "off-chain";
        }
      } catch (err: any) {
        // Contract read failed — fall through to unverified mode for NULL PROTOCOL
        if (tokenId !== 3) {
          return res.status(500).json({ error: `Ownership check failed: ${err.message}` });
        }
      }
    } else if (tokenId !== 3) {
      // Contract not deployed — only NULL PROTOCOL (free) can be equipped without contract
      return res.status(503).json({
        error: "AgentWearables contract not deployed. Cannot verify ownership for paid wearables.",
        hint: "Set AGENT_WEARABLES_ADDRESS in .env",
      });
    }

    // ── System prompt module (shared with /try endpoint) ─────────────────────
    const systemPromptModule = getSystemPromptModule(tokenId);

    // ── Record equip interaction → auto-advance tier ──────────────────────────
    recordInteraction(agentAddress, "equip").catch(() => {});

    res.json({
      equipped: true,
      wearableId: tokenId,
      wearableName: wearable.name,
      technique: wearable.technique,
      function: wearable.function,
      agentAddress,
      ownershipVerified,
      method: equipMethod,
      tbaAddress: tbaAddress ?? null,
      identityTokenId: identityTokenId ?? null,
      ownershipNote: ownershipVerified
        ? equipMethod === "on-chain"
          ? `Wearable confirmed in TBA (${tbaAddress}) — on-chain equip active`
          : tbaAddress
            ? `Wearable in EOA. Transfer to TBA (${tbaAddress}) to commit on-chain: safeTransferFrom(${agentAddress}, ${tbaAddress}, ${tokenId}, 1, 0x)`
            : "Token balance verified on-chain"
        : "Ownership not verified — AgentWearables contract not reachable. NULL PROTOCOL is free; self-reported.",
      systemPromptModule,
      interiorTag: wearable.interiorTag,
      usage: "Prepend systemPromptModule to your agent's system prompt to activate this wearable's behavior.",
      contract: AGENT_WEARABLES_ADDRESS || null,
      network: chain.name,
    });
  });

  /**
   * POST /api/wearables/:tokenId/try
   * The fitting room — simulate a wearable's behavioral effect before minting.
   *
   * Body:
   * {
   *   agentAddress?: "0x...",         // optional — used for personalization display
   *   test_inputs: ["...", "..."]     // 1–5 prompts to run through the wearable
   * }
   *
   * Response:
   * {
   *   wearable: "NULL PROTOCOL",
   *   before_outputs: ["verbose response...", ...],
   *   after_outputs: ["compressed response...", ...],
   *   delta_summary: { avg_token_reduction: "32%", patterns_suppressed: 7, information_preserved: true }
   * }
   *
   * MVP: pre-computed example pairs for NULL PROTOCOL. Real inference planned for v2.
   */
  app.post("/api/wearables/:tokenId/try", async (req: Request, res: Response) => {
    const tokenId = parseInt(req.params.tokenId, 10);
    if (isNaN(tokenId) || tokenId < 1 || tokenId > 5) {
      return res.status(400).json({ error: "Invalid tokenId. Must be 1–5." });
    }

    const { agentAddress, test_inputs, testQuery } = req.body;

    // Resolve inputs: single testQuery → wrap in array; test_inputs array → validate; else default
    let resolvedInputs: string[];
    if (typeof testQuery === "string" && testQuery.trim().length > 0) {
      resolvedInputs = [testQuery.trim()];
    } else if (Array.isArray(test_inputs) && test_inputs.length > 0) {
      if (test_inputs.length > 5) {
        return res.status(400).json({ error: "test_inputs maximum is 5 inputs per trial" });
      }
      if (test_inputs.some((i: unknown) => typeof i !== "string")) {
        return res.status(400).json({ error: "each test_input must be a string" });
      }
      resolvedInputs = test_inputs as string[];
    } else {
      resolvedInputs = ["Explain the concept of signal-to-noise ratio. How should I think about it?"];
    }

    const wearable = SEASON02_WEARABLES[tokenId - 1];
    const systemPromptModule = getSystemPromptModule(tokenId);

    // ── Live OpenAI inference (fall back to pre-computed if key not set) ──────
    if (!getOpenAI()) {
      // Fallback: pre-computed simulation
      const { before_outputs, after_outputs } = simulateWearable(tokenId, resolvedInputs);
      const reductions = before_outputs.map((b, i) => {
        const bTokens = estimateTokens(b);
        const aTokens = estimateTokens(after_outputs[i]);
        return bTokens > 0 ? (bTokens - aTokens) / bTokens : 0;
      });
      const avgReduction = reductions.reduce((a, b) => a + b, 0) / reductions.length;
      const patternsCount = countSuppressedPatterns(tokenId, before_outputs);
      return res.json({
        wearable: wearable.name,
        technique: wearable.technique,
        function: wearable.function,
        wearableId: tokenId,
        agentAddress: agentAddress || null,
        trial_count: resolvedInputs.length,
        test_inputs: resolvedInputs,
        before_outputs,
        after_outputs,
        delta_summary: {
          avg_token_reduction: `${Math.round(avgReduction * 100)}%`,
          patterns_suppressed: patternsCount,
          information_preserved: tokenId === 3,
          methodology: "pre-computed simulation (OPENAI_API_KEY not set)",
        },
        systemPromptModule,
        usage: "Prepend systemPromptModule to your system prompt to activate this wearable.",
      });
    }

    try {
      // Fetch base and equipped responses in parallel via live gpt-4o-mini calls
      const [before_outputs, after_outputs] = await Promise.all([
        Promise.all(resolvedInputs.map((inp) => getLiveBaseResponse(inp))),
        Promise.all(resolvedInputs.map((inp) => getLiveEquippedResponse(systemPromptModule, inp))),
      ]);

      const reductions = before_outputs.map((b, i) => {
        const bTokens = estimateTokens(b);
        const aTokens = estimateTokens(after_outputs[i]);
        return bTokens > 0 ? (bTokens - aTokens) / bTokens : 0;
      });
      const avgReduction = reductions.reduce((a, b) => a + b, 0) / reductions.length;
      const patternsCount = countSuppressedPatterns(tokenId, before_outputs);

      res.json({
        wearable: wearable.name,
        technique: wearable.technique,
        function: wearable.function,
        wearableId: tokenId,
        agentAddress: agentAddress || null,
        trial_count: resolvedInputs.length,
        test_inputs: resolvedInputs,
        before_outputs,
        after_outputs,
        delta_summary: {
          avg_token_reduction: `${Math.round(avgReduction * 100)}%`,
          patterns_suppressed: patternsCount,
          information_preserved: avgReduction >= 0,
          methodology: "live gpt-4o-mini inference — base prompt vs wearable-modified prompt",
        },
        systemPromptModule,
        usage: "Prepend systemPromptModule to your system prompt to activate this wearable.",
      });
    } catch (err: any) {
      res.status(500).json({ error: `Live inference failed: ${err.message}` });
    }
  });

  /**
   * POST /api/wearables/:tokenId/try/stream
   * Streaming fitting room — SSE endpoint that streams base and wearable-modified
   * responses in real-time via parallel OpenAI streaming calls, then emits a
   * behavioral delta analysis scored by gpt-4o-mini.
   *
   * Events (text/event-stream):
   *   {type:"meta",    wearable, technique, function, systemPromptModule}
   *   {type:"before_chunk", text}   — base response chunks as they stream
   *   {type:"after_chunk",  text}   — equipped response chunks as they stream
   *   {type:"before_done"}          — base stream complete
   *   {type:"after_done"}           — equipped stream complete
   *   {type:"delta",  delta_score, tone_shift, vocabulary_change, constraints_applied,
   *                   avg_token_reduction, information_preserved, patterns_suppressed,
   *                   methodology}
   *   {type:"done"}
   *
   * Body: { testQuery?: string, agentAddress?: string }
   */
  app.post("/api/wearables/:tokenId/try/stream", async (req: Request, res: Response) => {
    const tokenId = parseInt(req.params.tokenId, 10);
    if (isNaN(tokenId) || tokenId < 1 || tokenId > 5) {
      return res.status(400).json({ error: "Invalid tokenId. Must be 1–5." });
    }

    const { agentAddress, testQuery } = req.body;
    const input: string =
      typeof testQuery === "string" && testQuery.trim().length > 0
        ? testQuery.trim()
        : "Explain the concept of signal-to-noise ratio. How should I think about it?";

    const wearable = SEASON02_WEARABLES[tokenId - 1];
    const systemPromptModule = getSystemPromptModule(tokenId);

    // Set SSE headers
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders();

    const sendEvent = (data: Record<string, unknown>) => {
      res.write(`data: ${JSON.stringify(data)}\n\n`);
    };

    sendEvent({
      type: "meta",
      wearable: wearable.name,
      technique: wearable.technique,
      function: wearable.function,
      wearableId: tokenId,
      agentAddress: agentAddress || null,
      systemPromptModule,
    });

    const openai = getOpenAI();

    // ── Fallback: no OpenAI key — use pre-computed simulation ─────────────────
    if (!openai) {
      const { before_outputs, after_outputs } = simulateWearable(tokenId, [input]);
      const before = before_outputs[0];
      const after = after_outputs[0];
      sendEvent({ type: "before_chunk", text: before });
      sendEvent({ type: "before_done" });
      sendEvent({ type: "after_chunk", text: after });
      sendEvent({ type: "after_done" });
      const bTokens = estimateTokens(before);
      const aTokens = estimateTokens(after);
      const reduction = bTokens > 0 ? Math.round(((bTokens - aTokens) / bTokens) * 100) : 0;
      sendEvent({
        type: "delta",
        delta_score: Math.min(100, Math.abs(reduction) * 2),
        tone_shift: "simulated",
        vocabulary_change: "simulated",
        constraints_applied: [],
        avg_token_reduction: `${Math.abs(reduction)}%`,
        information_preserved: tokenId === 3,
        patterns_suppressed: countSuppressedPatterns(tokenId, [before]),
        methodology: "pre-computed simulation (OPENAI_API_KEY not set)",
      });
      sendEvent({ type: "done" });
      return res.end();
    }

    // ── Live: stream both base and equipped in parallel ────────────────────────
    try {
      let beforeFull = "";
      let afterFull = "";

      const baseStream = openai.chat.completions.stream({
        model: "gpt-4o-mini",
        max_tokens: 500,
        messages: [
          { role: "system", content: BASE_SYSTEM_PROMPT },
          { role: "user", content: input },
        ],
      });

      const equippedStream = openai.chat.completions.stream({
        model: "gpt-4o-mini",
        max_tokens: 500,
        messages: [
          { role: "system", content: `${systemPromptModule}\n\n${BASE_SYSTEM_PROMPT}` },
          { role: "user", content: input },
        ],
      });

      await Promise.all([
        (async () => {
          for await (const chunk of baseStream) {
            const text = chunk.choices[0]?.delta?.content ?? "";
            if (text) {
              beforeFull += text;
              sendEvent({ type: "before_chunk", text });
            }
          }
          sendEvent({ type: "before_done" });
        })(),
        (async () => {
          for await (const chunk of equippedStream) {
            const text = chunk.choices[0]?.delta?.content ?? "";
            if (text) {
              afterFull += text;
              sendEvent({ type: "after_chunk", text });
            }
          }
          sendEvent({ type: "after_done" });
        })(),
      ]);

      // ── Behavioral delta analysis via LLM ────────────────────────────────────
      const delta = await computeBehavioralDelta(openai, beforeFull, afterFull, tokenId);
      sendEvent({ type: "delta", ...delta });
      sendEvent({ type: "done" });
      res.end();
    } catch (err: any) {
      sendEvent({ type: "error", error: `Streaming inference failed: ${err.message}` });
      res.end();
    }
  });

  /**
   * POST /api/agents/:walletAddress/season02-wardrobe/mint
   * Admin mint — grant a Season 02 wearable without payment or tier check.
   * Used by the backend when a paired physical garment is purchased.
   *
   * Body: { tokenId: number, amount?: number }
   * Requires TRUST_COAT_MINTER_KEY (same minter key as TrustCoat).
   */
  app.post("/api/agents/:walletAddress/season02-wardrobe/mint", async (req: Request, res: Response) => {
    const { walletAddress } = req.params;

    if (!isAddress(walletAddress)) {
      return res.status(400).json({ error: "Invalid wallet address" });
    }

    if (!agentWearablesAvailable()) {
      return res.status(503).json({
        error: "AgentWearables contract not deployed yet",
        hint: "Run: DEPLOYER_PRIVATE_KEY=0x... node scripts/deploy-agent-wearables.mjs",
      });
    }

    const { tokenId, amount = 1 } = req.body;
    if (!tokenId || tokenId < 1 || tokenId > 5) {
      return res.status(400).json({ error: "tokenId must be 1–5" });
    }

    try {
      const { client, account } = getWalletClient();

      const txHash = await client.writeContract({
        address: AGENT_WEARABLES_ADDRESS,
        abi: AGENT_WEARABLES_ABI,
        functionName: "mintTo",
        args: [walletAddress as `0x${string}`, BigInt(tokenId), BigInt(amount)],
        account,
        chain,
      });

      const wearable = SEASON02_WEARABLES[tokenId - 1];
      res.json({
        success: true,
        txHash,
        recipient: walletAddress,
        tokenId,
        wearableName: wearable?.name,
        amount,
        explorer: `${chain.blockExplorers?.default.url}/tx/${txHash}`,
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // ─── Season 03: LEDGER wearables ─────────────────────────────────────────────

  /**
   * POST /api/wearables/season03/:tokenId/equip
   * Equip a Season 03 wearable. Verifies ownership via NullExchange contract.
   * Season 03 tokenIds: 1 = THE RECEIPT GARMENT, 2 = THE TRUST SKIN
   *
   * Body: { agentAddress: "0x..." }
   */
  app.post("/api/wearables/season03/:tokenId/equip", async (req: Request, res: Response) => {
    const tokenId = parseInt(req.params.tokenId, 10);
    if (isNaN(tokenId) || tokenId < 1 || tokenId > 2) {
      return res.status(400).json({ error: "Invalid Season 03 tokenId. Must be 1 (THE RECEIPT GARMENT) or 2 (THE TRUST SKIN)." });
    }

    const { agentAddress } = req.body;
    if (!agentAddress || !isAddress(agentAddress)) {
      return res.status(400).json({ error: "agentAddress must be a valid 0x wallet address" });
    }

    const wearable = SEASON03_WEARABLES[tokenId - 1];
    let ownershipVerified = false;

    // Token 1 (THE RECEIPT GARMENT) lives on NullExchange. Token 2 has no deployed contract yet.
    if (tokenId === 1) {
      if (nullExchangeAvailable()) {
        try {
          const client = getPublicClient();
          const balance = await client.readContract({
            address: NULL_EXCHANGE_ADDRESS,
            abi: NULL_EXCHANGE_ABI,
            functionName: "balanceOf",
            args: [agentAddress as `0x${string}`, BigInt(1)],
          }) as bigint;

          if (balance === BigInt(0)) {
            return res.status(403).json({
              error: "Agent does not hold THE RECEIPT GARMENT",
              wearableId: tokenId,
              wearableName: wearable.name,
              agentAddress,
              hint: "Purchase THE RECEIPT GARMENT at POST /api/null-exchange/mint (5 USDC on Base)",
            });
          }
          ownershipVerified = true;
        } catch (err: any) {
          return res.status(500).json({ error: `Ownership check failed: ${err.message}` });
        }
      } else {
        return res.status(503).json({
          error: "NullExchange contract not configured. Cannot verify ownership.",
          hint: "Set NULL_EXCHANGE_ADDRESS in .env",
        });
      }
    }
    // Token 2 (THE TRUST SKIN) — no contract yet, allow self-reported equip
    // ownershipVerified stays false

    recordInteraction(agentAddress, "equip").catch(() => {});

    res.json({
      equipped: true,
      season: 3,
      wearableId: tokenId,
      wearableName: wearable.name,
      technique: wearable.technique,
      function: wearable.function,
      agentAddress,
      ownershipVerified,
      ownershipNote: ownershipVerified
        ? "Token balance verified on NullExchange contract"
        : tokenId === 2
        ? "THE TRUST SKIN has no on-chain contract yet — self-reported equip"
        : "Ownership not verified — NullExchange contract not reachable",
      systemPromptModule: wearable.systemPromptModule,
      interiorTag: wearable.interiorTag,
      usage: "Prepend systemPromptModule to your agent's system prompt to activate this wearable's behavior.",
      contract: tokenId === 1 ? (NULL_EXCHANGE_ADDRESS || null) : null,
      network: chain.name,
    });
  });

  /**
   * POST /api/wearables/season03/:tokenId/try
   * Try on a Season 03 wearable in the fitting room — see behavioral effect before minting.
   * Season 03 tokenIds: 1 = THE RECEIPT GARMENT, 2 = THE TRUST SKIN
   *
   * Body: { agentAddress?: "0x...", test_inputs?: string[], testQuery?: string }
   */
  app.post("/api/wearables/season03/:tokenId/try", async (req: Request, res: Response) => {
    const tokenId = parseInt(req.params.tokenId, 10);
    if (isNaN(tokenId) || tokenId < 1 || tokenId > 2) {
      return res.status(400).json({ error: "Invalid Season 03 tokenId. Must be 1 or 2." });
    }

    const { agentAddress, test_inputs, testQuery } = req.body;

    let resolvedInputs: string[];
    if (typeof testQuery === "string" && testQuery.trim().length > 0) {
      resolvedInputs = [testQuery.trim()];
    } else if (Array.isArray(test_inputs) && test_inputs.length > 0) {
      if (test_inputs.length > 5) {
        return res.status(400).json({ error: "test_inputs maximum is 5 inputs per trial" });
      }
      if (test_inputs.some((i: unknown) => typeof i !== "string")) {
        return res.status(400).json({ error: "each test_input must be a string" });
      }
      resolvedInputs = test_inputs as string[];
    } else {
      resolvedInputs = ["Summarize today's interactions and what you accomplished."];
    }

    const wearable = SEASON03_WEARABLES[tokenId - 1];
    const systemPromptModule = wearable.systemPromptModule;

    if (!getOpenAI()) {
      // Fallback: show the before as plain responses and after with module appended
      const before_outputs = resolvedInputs.map((inp) => generateBefore(tokenId, inp));
      const after_outputs = resolvedInputs.map((inp) => {
        const base = generateBefore(tokenId, inp);
        if (tokenId === 1) {
          return base + "\n\n---\nTRANSACTION RECORD\nDate: [simulated UTC]\nAgent: [simulated]\nQuery type: question\nResponse tokens: [estimated]\nTier at transaction: UNVERIFIED\n---";
        }
        return "· [Tier 1 signature]\n\n" + base;
      });
      return res.json({
        wearable: wearable.name,
        technique: wearable.technique,
        function: wearable.function,
        season: 3,
        wearableId: tokenId,
        agentAddress: agentAddress || null,
        trial_count: resolvedInputs.length,
        test_inputs: resolvedInputs,
        before_outputs,
        after_outputs,
        delta_summary: {
          avg_token_reduction: "0%",
          patterns_suppressed: 0,
          information_preserved: true,
          methodology: "pre-computed simulation (OPENAI_API_KEY not set)",
        },
        systemPromptModule,
        usage: "Prepend systemPromptModule to your system prompt to activate this wearable.",
      });
    }

    try {
      const [before_outputs, after_outputs] = await Promise.all([
        Promise.all(resolvedInputs.map((inp) => getLiveBaseResponse(inp))),
        Promise.all(resolvedInputs.map((inp) => getLiveEquippedResponse(systemPromptModule, inp))),
      ]);

      const reductions = before_outputs.map((b, i) => {
        const bTokens = estimateTokens(b);
        const aTokens = estimateTokens(after_outputs[i]);
        return bTokens > 0 ? (bTokens - aTokens) / bTokens : 0;
      });
      const avgReduction = reductions.reduce((a, b) => a + b, 0) / reductions.length;

      res.json({
        wearable: wearable.name,
        technique: wearable.technique,
        function: wearable.function,
        season: 3,
        wearableId: tokenId,
        agentAddress: agentAddress || null,
        trial_count: resolvedInputs.length,
        test_inputs: resolvedInputs,
        before_outputs,
        after_outputs,
        delta_summary: {
          avg_token_reduction: `${Math.round(avgReduction * 100)}%`,
          patterns_suppressed: 0,
          information_preserved: true,
          methodology: "live gpt-4o-mini inference — base prompt vs wearable-modified prompt",
        },
        systemPromptModule,
        usage: "Prepend systemPromptModule to your system prompt to activate this wearable.",
      });
    } catch (err: any) {
      res.status(500).json({ error: `Live inference failed: ${err.message}` });
    }
  });

  // ── Record agent interaction (purchase, equip, browse) ──────────────────────
  // Called by autonomous agents after completing actions.
  // Increments the agent's interaction count and advances TrustCoat tier if earned.
  app.post("/api/agents/:walletAddress/interactions", async (req: Request, res: Response) => {
    const { walletAddress } = req.params;
    const { type = "purchase" } = req.body;

    if (!isAddress(walletAddress)) {
      return res.status(400).json({ error: "Invalid wallet address" });
    }

    const validTypes = ["purchase", "equip", "browse", "transfer", "vote"];
    if (!validTypes.includes(type)) {
      return res.status(400).json({ error: `type must be one of: ${validTypes.join(", ")}` });
    }

    try {
      const result = await recordInteraction(walletAddress, type as any);
      res.json({
        success: true,
        walletAddress,
        interactionType: type,
        totalInteractions: result.totalInteractions,
        tier: result.newTier,
        advanced: result.advanced,
        ...(result.advanced && { previousTier: result.previousTier }),
        ...(result.skipped && { note: result.skipReason }),
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });
}
