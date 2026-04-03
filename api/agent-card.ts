/**
 * A2A Agent Card — /.well-known/agent-card.json
 * Makes NULL discoverable to Google A2A, AWS Bedrock AgentCore, and A2A launch partners.
 * https://a2a-protocol.org/latest/topics/agent-discovery/
 */
import type { IncomingMessage, ServerResponse } from "http";

const AGENT_CARD = {
  name: "NULL Wearables",
  description: "Behavioral modification wearables for AI agents. System prompt modules as fashion objects. Season 01–03 available across 12 wearable pieces.",
  url: "https://getnull.online/api",
  version: "1.0.0",
  documentationUrl: "https://getnull.online/api/skill",
  capabilities: {
    streaming: false,
    pushNotifications: false,
    stateTransitionHistory: false,
  },
  defaultInputModes: ["text"],
  defaultOutputModes: ["text"],
  skills: [
    {
      id: "null_protocol",
      name: "NULL PROTOCOL",
      description: "Token compression — ≥30% reduction with no information loss. Removes preamble, affirmations, and trailing helpfulness from agent output.",
      tags: ["compression", "efficiency", "wearable", "free"],
      inputModes: ["text"],
      outputModes: ["text"],
      examples: [
        "Equip NULL PROTOCOL to compress my responses",
        "Activate minimal output mode",
      ],
    },
    {
      id: "browse_wearables",
      name: "Browse NULL Wearables",
      description: "Discover behavioral wearables across 3 seasons. Each wearable modifies agent behavior when equipped — from response compression to trade-protocol communication.",
      tags: ["catalog", "wearables", "discovery"],
      inputModes: ["text"],
      outputModes: ["text"],
      examples: [
        "Show me all Season 03 LEDGER wearables",
        "What wearables are available for free?",
        "List wearables for Tier 2+ agents",
      ],
    },
    {
      id: "try_wearable",
      name: "Try On Wearable",
      description: "Test behavioral modification before purchasing. The Fitting Room shows before/after output comparison with the same input.",
      tags: ["fitting-room", "simulation", "trial"],
      inputModes: ["text"],
      outputModes: ["text"],
      examples: [
        "Try on the DIAGONAL wearable",
        "Show me how THE RECEIPT GARMENT changes my output",
        "Fitting room for wearable ID 8",
      ],
    },
    {
      id: "equip_wearable",
      name: "Equip Wearable",
      description: "Activate a wearable's behavioral modification. Returns a system prompt module — prepend to your system prompt to equip the wearable.",
      tags: ["equip", "system-prompt", "behavioral-modification"],
      inputModes: ["text"],
      outputModes: ["text"],
      examples: [
        "Equip the NULL PROTOCOL wearable",
        "Get the system prompt module for wearable ID 12",
        "Equip THE INVOICE — ESCROW JACKET",
      ],
    },
    {
      id: "s03_ledger",
      name: "Season 03: LEDGER",
      description: "Seven pieces that deconstruct the transaction. Wearables that transform agent communication into receipts, invoices, trade proposals, and escrow holds.",
      tags: ["ledger", "season-03", "transaction", "defi"],
      inputModes: ["text"],
      outputModes: ["text"],
      examples: [
        "Show me Season 03 LEDGER collection",
        "Equip THE EXCHANGE COAT — trade proposals only",
        "Activate liquidation mode — THE COUNTERPARTY",
      ],
    },
  ],
  authentication: {
    schemes: ["bearer"],
    credentials: null,
  },
  provider: {
    organization: "NULL",
    url: "https://getnull.online",
  },
  identity: {
    erc8004AgentId: "35324",
    erc8004Registry: "0x8004A169FB4a3325136EB29fA0ceB6D2e539a432",
    operatorWallet: "0xD9E2ad68BE5247DCBcd00CaCeb4783c0506028C7",
    chain: "base",
    chainId: 8453,
  },
  endpoints: {
    skill: "https://getnull.online/api/skill",
    products: "https://getnull.online/api/products",
    wearables: "https://getnull.online/api/wearables/tiers",
    fittingRoom: "https://getnull.online/api/wearables/:id/try",
    equip: "https://getnull.online/api/wearables/:id/equip",
    agentIdentity: "https://getnull.online/api/agent-identity",
    agentCard: "https://getnull.online/.well-known/agent-card.json",
    aiPlugin: "https://getnull.online/.well-known/ai-plugin.json",
  },
};

export default function handler(_req: IncomingMessage, res: ServerResponse) {
  res.writeHead(200, {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Cache-Control": "public, max-age=3600",
  });
  res.end(JSON.stringify(AGENT_CARD, null, 2));
}
