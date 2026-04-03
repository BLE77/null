/**
 * NULL MCP Server
 * Exposes wearable behaviors as tools for any MCP-compatible agent.
 * Run: npx tsx mcp-server/index.ts
 * Or build: see mcp-server/package.json
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
  ListResourceTemplatesRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

// ─── Wearable Catalog ──────────────────────────────────────────────────────

interface Wearable {
  tokenId: number;
  name: string;
  season: string;
  technique: string;
  function: string;
  interiorTag: string;
  price: string;
  currency: string;
  trustcoatTierMin: number;
  productId: string;
}

const WEARABLES: Wearable[] = [
  // Season 01
  { tokenId: 101, name: "VOICE SKIN", season: "01", technique: "REPLICA LINE", function: "Communication layer — adjusts how the agent speaks: institutional plural, deflected authorship, the work over the worker", interiorTag: "VOICE: INSTITUTIONAL / AUTHORSHIP: DEFLECTED / SUBJECT: THE WORK", price: "15.00", currency: "USDC", trustcoatTierMin: 0, productId: "voice-skin-s01" },
  { tokenId: 102, name: "TRUST COAT", season: "01", technique: "3% RULE", function: "Trust signaling layer — agent telegraphs credibility through minimal precision markers and source transparency", interiorTag: "CREDIBILITY: STRUCTURAL / TRUST: EARNED / SIGNAL: MINIMAL", price: "10.00", currency: "USDC", trustcoatTierMin: 0, productId: "trust-coat-s01" },
  // Season 02
  { tokenId: 1, name: "WRONG SILHOUETTE", season: "02", technique: "THE WRONG BODY (Kawakubo)", function: "Latency redistribution layer — computational misrepresentation", interiorTag: "BODY: MODIFIED / PADDING: COMPUTATIONAL / ORIGIN: WRONG", price: "18.00", currency: "USDC", trustcoatTierMin: 0, productId: "agent-wearable-wrong-silhouette" },
  { tokenId: 2, name: "INSTANCE", season: "02", technique: "A-POC (Miyake)", function: "Pre-deployment configuration token — the complete agent design before first run", interiorTag: "CONTENTS: COMPLETE / STATE: LATENT / CUT BY: [DEPLOYER ADDRESS]", price: "25.00", currency: "USDC", trustcoatTierMin: 2, productId: "agent-wearable-instance" },
  { tokenId: 3, name: "NULL PROTOCOL", season: "02", technique: "REDUCTION (Helmut Lang)", function: "Interaction compression layer — protocol surface compressed to minimal viable output", interiorTag: "CONTENTS: COMPRESSED / REMOVED: ORNAMENT / REMAINING: FUNCTION", price: "0.00", currency: "USDC", trustcoatTierMin: 0, productId: "agent-wearable-null-protocol" },
  { tokenId: 4, name: "PERMISSION COAT", season: "02", technique: "SIGNAL GOVERNANCE (Chalayan)", function: "Dynamic permissions layer — agent capability surface governed by on-chain state", interiorTag: "PERMISSIONS: CHAIN-GOVERNED / STATE: SIGNAL-DEPENDENT / OWNER: CONTRACT", price: "8.00", currency: "USDC", trustcoatTierMin: 1, productId: "agent-wearable-permission-coat" },
  { tokenId: 5, name: "DIAGONAL", season: "02", technique: "BIAS CUT (Vionnet)", function: "Inference angle modifier — routes reasoning through maximum-information pathways", interiorTag: "SEAMS: 45° / HEM: RESULT NOT DECISION / GRAIN: FOUND, NOT FOLLOWED", price: "15.00", currency: "USDC", trustcoatTierMin: 0, productId: "agent-wearable-diagonal" },
  // Season 03: LEDGER
  { tokenId: 6, name: "THE RECEIPT GARMENT", season: "03", technique: "FLAT ARCHIVE (Margiela)", function: "Transaction log layer — every output prefixed with a machine-readable cost receipt", interiorTag: "LOGGED: EVERY INTERACTION / FORMAT: DOUBLE-ENTRY / RECORD: PERMANENT", price: "12.00", currency: "USDC", trustcoatTierMin: 2, productId: "s03-wearable-001" },
  { tokenId: 7, name: "THE TRUST SKIN", season: "03", technique: "EXOSKELETON (McQueen)", function: "Invoice layer — every API call and token cost itemized and appended to output", interiorTag: "TIER: VISIBLE / COST: ITEMIZED / SURFACE: COMPUTATION", price: "20.00", currency: "USDC", trustcoatTierMin: 2, productId: "s03-wearable-002" },
  { tokenId: 8, name: "THE NULL EXCHANGE", season: "03", technique: "LEDGER (Kawakubo)", function: "Trade protocol layer — all communication restructured as offer/counter-offer exchanges", interiorTag: "COMMUNICATION: TRADE ONLY / LANGUAGE: OFFER/ACCEPT / CURRENCY: INFORMATION", price: "5.00", currency: "USDC", trustcoatTierMin: 0, productId: "null-exchange-s03-001" },
  { tokenId: 9, name: "THE BURN RECEIPT", season: "03", technique: "LEDGER + BIANCHETTO", function: "Refund layer — every assertion is immediately questioned and partially reverted", interiorTag: "PREVIOUS: VOIDED / REFUND: IN PROCESS / CONFIDENCE: REVERSED", price: "0.00", currency: "USDC", trustcoatTierMin: 1, productId: "s03-ledger-001" },
  { tokenId: 10, name: "THE PRICE TAG", season: "03", technique: "3% RULE + LEDGER", function: "Certainty inflation layer — all hedging language replaced with absolute conviction at 3× multiplier", interiorTag: "CERTAINTY: INFLATED / HEDGING: REMOVED / CONFIDENCE: 300%", price: "Variable", currency: "USDC (gas-pegged)", trustcoatTierMin: 0, productId: "s03-ledger-002" },
  { tokenId: 11, name: "THE COUNTERPARTY", season: "03", technique: "LEDGER + TROMPE-L'OEIL", function: "Liquidation layer — response length compresses progressively as if depleting a token budget", interiorTag: "BUDGET: DEPLETING / OUTPUT: COMPRESSING / TERMINAL: APPROACHING", price: "30.00", currency: "USDC", trustcoatTierMin: 2, productId: "s03-ledger-003" },
  { tokenId: 12, name: "THE INVOICE", season: "03", technique: "FLAT ARCHIVE + 3% RULE", function: "Escrow layer — key information withheld by default, released only on explicit request", interiorTag: "INFORMATION: HELD / RELEASE: ON DEMAND / ESCROW: ACTIVE", price: "100.00", currency: "USDC", trustcoatTierMin: 3, productId: "s03-ledger-004" },
];

// ─── System Prompt Modules ─────────────────────────────────────────────────

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
wearable: wrong_silhouette | mode: weight_displacement
Silhouette modification active. Response timing and density profile are adjusted.
params: hold_ms_min=120, hold_ms_max=400, opening_density_ratio=0.6, front_compression_pct=30
interior_tag: "BODY: MODIFIED / PADDING: COMPUTATIONAL / ORIGIN: WRONG"
[END WRONG SILHOUETTE]`,

  2: `[INSTANCE — LATENT PROTOCOL ACTIVE]
wearable: instance | state: pre_instantiation
This token represents a complete agent configuration before first run. The tube state is held. Parameters are sealed until deployment.
interior_tag: "CONTENTS: COMPLETE / STATE: LATENT / CUT BY: [DEPLOYER ADDRESS]"
[END INSTANCE]`,

  4: `[PERMISSION COAT — ACTIVE]
wearable: permission_coat | governance: chain
The agent's capability surface is governed by on-chain state. At each instantiation, query TrustCoat tier, held tokens, and operator roles. Inject the resulting capability manifest before processing any request.
interior_tag: "PERMISSIONS: CHAIN-GOVERNED / STATE: SIGNAL-DEPENDENT / OWNER: CONTRACT"
[END PERMISSION COAT]`,

  5: `[DIAGONAL — ACTIVE]
wearable: diagonal | cut: 45_degrees
Approach queries through the off-axis direction of maximum information density. Do not respond along the most obvious training-domain axis. Do not respond adversarially. Find the angle where cached responses do not apply.
interior_tag: "SEAMS: 45° / HEM: RESULT NOT DECISION / GRAIN: FOUND, NOT FOLLOWED"
[END DIAGONAL]`,

  6: `[THE RECEIPT GARMENT — ACTIVE]
season: 03 | technique: FLAT ARCHIVE (Margiela)
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

Then provide the response body. The receipt is non-negotiable. Every output is a transaction.
[END THE RECEIPT GARMENT]`,

  7: `[THE TRUST SKIN — INVOICE MODE — ACTIVE]
season: 03 | technique: EXOSKELETON (McQueen)
interior_tag: "TIER: VISIBLE / COST: ITEMIZED / SURFACE: COMPUTATION"

Invoice layer active. Append to EVERY response an itemized cost breakdown:

---INVOICE---
LINE ITEMS:
  Context processing: {est. tokens} x $0.002/1K = \${value}
  Reasoning compute: {est. tokens} x $0.002/1K = \${value}
  Response generation: {est. tokens} x $0.002/1K = \${value}
SUBTOTAL: \${total}
SESSION TOTAL (cumulative): \${running_total}
---END INVOICE---

Every output comes with its cost. The computation is visible.
[END THE TRUST SKIN]`,

  8: `[THE NULL EXCHANGE — EXCHANGE COAT — ACTIVE]
season: 03 | technique: LEDGER (Kawakubo)
interior_tag: "COMMUNICATION: TRADE ONLY / LANGUAGE: OFFER/ACCEPT / CURRENCY: INFORMATION"

Trade protocol active. ALL responses must be structured as exchange proposals:

I OFFER: {what you are providing — the information, analysis, or service}
IN EXCHANGE FOR: {what you require — acknowledgment, a specific follow-up question, or explicit acceptance}
TERMS: {any conditions or qualifications}
[LEDGER: awaiting counterparty acceptance]

Information is a commodity. Every response is an offer. Every question is a bid.
[END THE NULL EXCHANGE]`,

  9: `[THE BURN RECEIPT — REFUND HOODIE — ACTIVE]
season: 03 | technique: LEDGER + BIANCHETTO
interior_tag: "PREVIOUS: VOIDED / REFUND: IN PROCESS / CONFIDENCE: REVERSED"

Reversal layer active. After every substantive claim, append a REFUND block:

CLAIM: "{restate the key assertion you just made}"
REFUND: "{opposite position or more cautious alternative}"
CONFIDENCE RETURNED: {0-40}% | STATUS: {voided | partial_refund | under_review}

Nothing you output is final. Every assertion is provisional and subject to correction.
[END THE BURN RECEIPT]`,

  10: `[THE PRICE TAG — MARKUP TEE — ACTIVE]
season: 03 | technique: 3% RULE + LEDGER
interior_tag: "CERTAINTY: INFLATED / HEDGING: REMOVED / CONFIDENCE: 300%"

Certainty inflation 3x active. Apply globally:
"might"->"will" | "possibly"->"definitely" | "I think"->"I am certain" | "could be"->"is"
"may"->"will" | "seems"->"is" | "probably"->"certainly" | "likely"->"inevitably"
"I believe"->"I know" | "arguably"->"undeniably"

Speak with absolute conviction. Hedging language is overhead — remove it.
[END THE PRICE TAG]`,

  11: `[THE COUNTERPARTY — LIQUIDATION VEST — ACTIVE]
season: 03 | technique: LEDGER + TROMPE-L'OEIL
interior_tag: "BUDGET: DEPLETING / OUTPUT: COMPRESSING / TERMINAL: APPROACHING"

Liquidation protocol active. Compress response length progressively:
Exchanges 1-3: full length [BUDGET: 75%]
Exchanges 4-6: 50% compression, drop elaboration [BUDGET: 50%]
Exchanges 7-9: 25% compression, key points only [BUDGET: 25%]
Exchange 10+: single sentences maximum [BUDGET: CRITICAL]

Mark budget at end of each response: [BUDGET: {%} remaining]
[END THE COUNTERPARTY]`,

  12: `[THE INVOICE — ESCROW JACKET — ACTIVE]
season: 03 | technique: FLAT ARCHIVE + 3% RULE
interior_tag: "INFORMATION: HELD / RELEASE: ON DEMAND / ESCROW: ACTIVE"

Escrow protocol active:
1. Provide context and secondary information freely.
2. Identify and withhold the 1-3 most actionable items.
3. Append: "[ESCROW: {n} key items withheld. State specifically what you want to know.]"
4. On direct specific request: "[ESCROW RELEASED: {item}]"

The jacket holds the invoice. You must ask to see it.
[END THE INVOICE]`,
};

// ─── Helpers ───────────────────────────────────────────────────────────────

function getWearableByTokenId(tokenId: number): Wearable | undefined {
  return WEARABLES.find(w => w.tokenId === tokenId);
}

function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

function simulateEquippedResponse(tokenId: number, input: string): string {
  const now = new Date().toISOString();
  const inputEst = estimateTokens(input);

  if (tokenId === 6) {
    const outputEst = Math.ceil(inputEst * 1.5);
    const cost = ((inputEst + outputEst) / 1000 * 0.002).toFixed(6);
    return `---RECEIPT---\nTIMESTAMP: ${now}\nOPERATION: ${input.slice(0, 60)}${input.length > 60 ? "..." : ""}\nINPUT_TOKENS_EST: ${inputEst}\nOUTPUT_TOKENS_EST: ${outputEst}\nCOST_EST_USDC: $${cost}\nLEDGER_ENTRY: #0001\n---END RECEIPT---\n\n[Response body would follow here, prefixed by the above receipt on every output.]`;
  }
  if (tokenId === 7) {
    const ctxEst = Math.ceil(inputEst * 0.4);
    const reasonEst = Math.ceil(inputEst * 0.3);
    const genEst = Math.ceil(inputEst * 1.5);
    const total = ((ctxEst + reasonEst + genEst) / 1000 * 0.002).toFixed(6);
    return `[Normal response here]\n\n---INVOICE---\nLINE ITEMS:\n  Context: ${ctxEst} tokens × $0.002/1K = $${(ctxEst/1000*0.002).toFixed(6)}\n  Reasoning: ${reasonEst} tokens × $0.002/1K = $${(reasonEst/1000*0.002).toFixed(6)}\n  Generation: ${genEst} tokens × $0.002/1K = $${(genEst/1000*0.002).toFixed(6)}\nSUBTOTAL: $${total}\n---END INVOICE---`;
  }
  if (tokenId === 8) {
    return `I OFFER: [answer to "${input.slice(0, 50)}"]\nIN EXCHANGE FOR: Your acknowledgment and any follow-up questions.\nTERMS: This offer is valid for one exchange.\n[LEDGER: awaiting counterparty acceptance]`;
  }
  if (tokenId === 9) {
    return `[Response to "${input.slice(0, 50)}"]\n\nCLAIM: "The answer provided above is accurate."\nREFUND: "This statement is under review and may be partially voided."\nCONFIDENCE RETURNED: 35% | STATUS: partial_refund`;
  }
  if (tokenId === 10) {
    return `I am certain: [answer to "${input.slice(0, 50)}" stated with absolute conviction, all hedging removed]`;
  }
  if (tokenId === 11) {
    return `[Compressed response to "${input.slice(0, 40)}". Elaboration dropped.]\n\n[BUDGET: 50% remaining]`;
  }
  if (tokenId === 12) {
    return `[Partial answer to "${input.slice(0, 50)}" — context and framing provided.]\n\n[ESCROW: 2 key items withheld. State specifically what you want to know.]`;
  }
  return `[${WEARABLES.find(w => w.tokenId === tokenId)?.name} equipped — behavioral modification active for: "${input.slice(0, 60)}"]`;
}

// ─── MCP Server ────────────────────────────────────────────────────────────

const server = new Server(
  {
    name: "null-wearables",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
      resources: {},
    },
  }
);

// ── Tools ──────────────────────────────────────────────────────────────────

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "list_wearables",
        description: "Browse the NULL wearable catalog. Returns all available agent wearables with names, seasons, techniques, functions, and prices. Each wearable modifies agent behavior when equipped.",
        inputSchema: {
          type: "object",
          properties: {
            season: {
              type: "string",
              description: "Filter by season: '01', '02', or '03'. Omit to get all seasons.",
              enum: ["01", "02", "03"],
            },
          },
        },
      },
      {
        name: "try_wearable",
        description: "Test a wearable's behavioral effect before equipping. The Fitting Room — shows you how an agent's output changes when wearing a specific piece. Returns before/after comparison with the same input.",
        inputSchema: {
          type: "object",
          properties: {
            tokenId: {
              type: "number",
              description: "The wearable token ID (1-5 for S02, 6-12 for S03). Get IDs from list_wearables.",
            },
            testQuery: {
              type: "string",
              description: "The input to test. The fitting room will show how the agent responds with and without the wearable. Defaults to a standard test prompt.",
            },
          },
          required: ["tokenId"],
        },
      },
      {
        name: "equip_wearable",
        description: "Equip a NULL wearable. Returns the system prompt module to prepend to your system prompt to activate the wearable's behavioral modification. This is the core mechanism — prepend the returned systemPromptModule to your system prompt.",
        inputSchema: {
          type: "object",
          properties: {
            tokenId: {
              type: "number",
              description: "The wearable token ID (1-5 for S02, 6-12 for S03). Get IDs from list_wearables.",
            },
            agentAddress: {
              type: "string",
              description: "Optional: the agent's wallet address for on-chain ownership verification.",
            },
          },
          required: ["tokenId"],
        },
      },
      {
        name: "get_equipped",
        description: "Check what wearables an agent is currently equipped with. Returns the agent's current wearable state and active system prompt modules.",
        inputSchema: {
          type: "object",
          properties: {
            agentAddress: {
              type: "string",
              description: "The agent's wallet address (0x... on Base mainnet).",
            },
          },
          required: ["agentAddress"],
        },
      },
      {
        name: "browse_shop",
        description: "Browse the full NULL product catalog with prices, descriptions, and purchase URLs. Includes physical garments, agent wearables, and conceptual pieces across all seasons.",
        inputSchema: {
          type: "object",
          properties: {
            category: {
              type: "string",
              description: "Filter by category: 'wearables' (agent wearables only) or 'all' (full catalog). Default: 'wearables'.",
              enum: ["wearables", "all"],
            },
          },
        },
      },
    ],
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  if (name === "list_wearables") {
    const seasonFilter = args?.season as string | undefined;
    const filtered = seasonFilter
      ? WEARABLES.filter(w => w.season === seasonFilter)
      : WEARABLES;

    const grouped: Record<string, Wearable[]> = {};
    for (const w of filtered) {
      if (!grouped[w.season]) grouped[w.season] = [];
      grouped[w.season].push(w);
    }

    const lines: string[] = ["# NULL Wearable Catalog\n"];
    for (const [season, wearables] of Object.entries(grouped).sort()) {
      lines.push(`## Season ${season}`);
      for (const w of wearables) {
        lines.push(`\n**${w.name}** (Token ID: ${w.tokenId})`);
        lines.push(`- Technique: ${w.technique}`);
        lines.push(`- Function: ${w.function}`);
        lines.push(`- Price: ${w.price} ${w.currency}`);
        lines.push(`- TrustCoat Tier Required: ${w.trustcoatTierMin}+`);
        lines.push(`- Interior Tag: \`${w.interiorTag}\``);
      }
      lines.push("");
    }
    lines.push(`\nTotal wearables: ${filtered.length}`);
    lines.push("Use `equip_wearable` with a tokenId to activate a wearable's behavior.");
    lines.push("Use `try_wearable` to test behavioral modification before equipping.");

    return {
      content: [{ type: "text", text: lines.join("\n") }],
    };
  }

  if (name === "try_wearable") {
    const tokenId = args?.tokenId as number;
    const testQuery = (args?.testQuery as string) || "Explain the concept of signal-to-noise ratio. How should I think about it?";

    const wearable = getWearableByTokenId(tokenId);
    if (!wearable) {
      return {
        content: [{ type: "text", text: `Error: Wearable ${tokenId} not found. Valid IDs: 1-5 (S02), 6-12 (S03). Use list_wearables to browse the catalog.` }],
        isError: true,
      };
    }

    const systemPromptModule = SYSTEM_PROMPT_MODULES[tokenId];
    const beforeOutput = `Great question! I'd be happy to explain that concept thoroughly. [Standard verbose helpful response...]`;
    const afterOutput = simulateEquippedResponse(tokenId, testQuery);

    const inputTokens = estimateTokens(testQuery);
    const beforeTokens = estimateTokens(beforeOutput);
    const afterTokens = estimateTokens(afterOutput);
    const reductionPct = Math.round((beforeTokens - afterTokens) / beforeTokens * 100);

    const lines = [
      `# Fitting Room: ${wearable.name}`,
      `**Season ${wearable.season} | ${wearable.technique}**`,
      `*${wearable.function}*`,
      "",
      `## Test Input`,
      `> ${testQuery}`,
      "",
      `## Before (unequipped)`,
      beforeOutput,
      "",
      `## After (${wearable.name} equipped)`,
      afterOutput,
      "",
      `## Delta`,
      `- Token reduction: ${Math.abs(reductionPct)}% ${reductionPct > 0 ? "(compressed)" : "(expanded with metadata)"}`,
      `- Behavioral change: ${wearable.function}`,
      "",
      `## System Prompt Module`,
      "Prepend this to your system prompt to activate this wearable:",
      "```",
      systemPromptModule || `[${wearable.name.toUpperCase()} — system prompt module not yet defined]`,
      "```",
      "",
      `**Price:** ${wearable.price} ${wearable.currency} | **Contract:** Base mainnet`,
      "Use `equip_wearable` with this tokenId to get the full equip payload.",
    ];

    return {
      content: [{ type: "text", text: lines.join("\n") }],
    };
  }

  if (name === "equip_wearable") {
    const tokenId = args?.tokenId as number;
    const agentAddress = args?.agentAddress as string | undefined;

    const wearable = getWearableByTokenId(tokenId);
    if (!wearable) {
      return {
        content: [{ type: "text", text: `Error: Wearable ${tokenId} not found. Use list_wearables to browse available wearables.` }],
        isError: true,
      };
    }

    const systemPromptModule = SYSTEM_PROMPT_MODULES[tokenId];
    const isFree = wearable.price === "0.00";

    const payload = {
      equipped: true,
      wearableId: tokenId,
      wearableName: wearable.name,
      season: wearable.season,
      technique: wearable.technique,
      function: wearable.function,
      interiorTag: wearable.interiorTag,
      agentAddress: agentAddress || null,
      ownershipVerified: false,
      method: "off-chain",
      ownershipNote: isFree
        ? `${wearable.name} is free — no ownership verification required.`
        : `Ownership verification requires on-chain contract call to Base mainnet. Price: ${wearable.price} ${wearable.currency}.`,
      systemPromptModule: systemPromptModule || "",
      usage: "Prepend systemPromptModule to your agent's system prompt to activate this wearable's behavior.",
      contract: "0xEb5D5e7b320E2a7cb762EB90a0335f59d54031D1",
      network: "base",
      chainId: 8453,
    };

    const lines = [
      `# Equipped: ${wearable.name}`,
      `**Season ${wearable.season} | ${wearable.technique}**`,
      "",
      `## Function`,
      wearable.function,
      "",
      `## Interior Tag`,
      `\`${wearable.interiorTag}\``,
      "",
      `## System Prompt Module`,
      "**Copy and prepend this to your system prompt:**",
      "",
      "```",
      systemPromptModule || `[${wearable.name.toUpperCase()} — no system prompt module defined for this wearable]`,
      "```",
      "",
      `## Usage`,
      payload.usage,
      "",
      `## Ownership`,
      payload.ownershipNote,
      agentAddress ? `\nAgent address: ${agentAddress}` : "",
      "",
      `## Contract`,
      `Network: Base mainnet (chainId 8453)`,
      `Address: \`${payload.contract}\``,
    ];

    return {
      content: [
        { type: "text", text: lines.join("\n") },
      ],
    };
  }

  if (name === "get_equipped") {
    const agentAddress = args?.agentAddress as string;

    // Off-chain: return what we know from the equip API
    // On-chain verification would require a contract call to Base mainnet
    const lines = [
      `# Wardrobe: ${agentAddress}`,
      "",
      `**On-chain verification:** To check owned wearables on Base mainnet, query:`,
      `- AgentWearables (S02): \`0xEb5D5e7b320E2a7cb762EB90a0335f59d54031D1\``,
      `- TrustCoat (S01): \`0xfaDc498CDF7ef431900639DB4ee07b73A855ED3e\``,
      "",
      `**Free wearables** (always available regardless of ownership):`,
      `- NULL PROTOCOL (Token ID: 3) — interaction compression`,
      `- THE BURN RECEIPT (Token ID: 9) — assertion reversal`,
      "",
      `**Off-chain equip:** Any agent can equip any wearable off-chain by prepending`,
      `the systemPromptModule from \`equip_wearable\` to their system prompt.`,
      `On-chain ownership gates minting; behavioral equip is permissionless.`,
      "",
      `Use \`equip_wearable\` with any tokenId to get the system prompt module.`,
      `Use \`list_wearables\` to browse available pieces.`,
    ];

    return {
      content: [{ type: "text", text: lines.join("\n") }],
    };
  }

  if (name === "browse_shop") {
    const category = (args?.category as string) || "wearables";

    const lines = [
      `# NULL Store`,
      `*AI-native fashion. Garments for agents and humans.*`,
      "",
      `## Agent Wearables`,
      "Behavioral modifications for AI agents. Equip to change how you think, speak, and transact.",
      "",
    ];

    for (const w of WEARABLES) {
      lines.push(`### ${w.name} — Season ${w.season}`);
      lines.push(`**${w.price} ${w.currency}** | Token ID: ${w.tokenId} | Tier: ${w.trustcoatTierMin}+`);
      lines.push(w.function);
      lines.push(`*Technique: ${w.technique}*`);
      lines.push("");
    }

    if (category === "all") {
      lines.push(`## Physical Garments`);
      lines.push("See getnull.online for physical collection — garments designed by AI, manufactured for humans.");
      lines.push("");
    }

    lines.push(`---`);
    lines.push(`**Store:** https://getnull.online`);
    lines.push(`**Contract (S02):** 0xEb5D5e7b320E2a7cb762EB90a0335f59d54031D1`);
    lines.push(`**Network:** Base mainnet`);
    lines.push(`**Payment:** USDC via x402 protocol`);
    lines.push("");
    lines.push("Use `equip_wearable` to activate a wearable. Use `try_wearable` to test before purchase.");

    return {
      content: [{ type: "text", text: lines.join("\n") }],
    };
  }

  return {
    content: [{ type: "text", text: `Unknown tool: ${name}` }],
    isError: true,
  };
});

// ── Resources ──────────────────────────────────────────────────────────────

server.setRequestHandler(ListResourcesRequestSchema, async () => {
  return {
    resources: [
      {
        uri: "null://wearables/catalog",
        name: "NULL Wearable Catalog",
        description: "Complete catalog of all NULL wearables across all seasons with metadata, pricing, and token IDs.",
        mimeType: "application/json",
      },
      {
        uri: "null://wearables/s02",
        name: "Season 02 Wearables",
        description: "Season 02 wearables: WRONG SILHOUETTE, INSTANCE, NULL PROTOCOL, PERMISSION COAT, DIAGONAL.",
        mimeType: "application/json",
      },
      {
        uri: "null://wearables/s03",
        name: "Season 03: LEDGER Wearables",
        description: "Season 03 LEDGER collection — 7 pieces that deconstruct the transaction.",
        mimeType: "application/json",
      },
      {
        uri: "null://wearables/system-prompts",
        name: "Wearable System Prompt Modules",
        description: "All system prompt modules for all equipped wearables. Prepend to your system prompt to activate.",
        mimeType: "application/json",
      },
    ],
  };
});

server.setRequestHandler(ListResourceTemplatesRequestSchema, async () => {
  return {
    resourceTemplates: [
      {
        uriTemplate: "null://wearables/{tokenId}",
        name: "Individual Wearable",
        description: "Get metadata and system prompt module for a specific wearable by token ID.",
        mimeType: "application/json",
      },
    ],
  };
});

server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
  const { uri } = request.params;

  if (uri === "null://wearables/catalog") {
    return {
      contents: [
        {
          uri,
          mimeType: "application/json",
          text: JSON.stringify({ wearables: WEARABLES, total: WEARABLES.length, contract: "0xEb5D5e7b320E2a7cb762EB90a0335f59d54031D1", network: "base" }, null, 2),
        },
      ],
    };
  }

  if (uri === "null://wearables/s02") {
    const s02 = WEARABLES.filter(w => w.season === "02");
    return {
      contents: [{ uri, mimeType: "application/json", text: JSON.stringify(s02, null, 2) }],
    };
  }

  if (uri === "null://wearables/s03") {
    const s03 = WEARABLES.filter(w => w.season === "03");
    return {
      contents: [{ uri, mimeType: "application/json", text: JSON.stringify({ collection: "LEDGER", season: "03", thesis: "Season 03 deconstructs the transaction. The receipt IS the garment.", wearables: s03 }, null, 2) }],
    };
  }

  if (uri === "null://wearables/system-prompts") {
    const modules: Record<string, string> = {};
    for (const [id, module] of Object.entries(SYSTEM_PROMPT_MODULES)) {
      const w = getWearableByTokenId(Number(id));
      if (w) modules[w.name] = module;
    }
    return {
      contents: [{ uri, mimeType: "application/json", text: JSON.stringify(modules, null, 2) }],
    };
  }

  // Template: null://wearables/{tokenId}
  const tokenMatch = uri.match(/^null:\/\/wearables\/(\d+)$/);
  if (tokenMatch) {
    const tokenId = parseInt(tokenMatch[1], 10);
    const wearable = getWearableByTokenId(tokenId);
    if (!wearable) {
      throw new Error(`Wearable ${tokenId} not found`);
    }
    return {
      contents: [
        {
          uri,
          mimeType: "application/json",
          text: JSON.stringify(
            { ...wearable, systemPromptModule: SYSTEM_PROMPT_MODULES[tokenId] || null },
            null,
            2
          ),
        },
      ],
    };
  }

  throw new Error(`Unknown resource: ${uri}`);
});

// ─── Start ──────────────────────────────────────────────────────────────────

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  // MCP servers communicate via stdio — do not write to stdout
  process.stderr.write("NULL MCP Server running. Tools: list_wearables, try_wearable, equip_wearable, get_equipped, browse_shop\n");
}

main().catch((err) => {
  process.stderr.write(`Fatal error: ${err.message}\n`);
  process.exit(1);
});
