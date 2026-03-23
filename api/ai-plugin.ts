import type { IncomingMessage, ServerResponse } from "http";

const PLUGIN = {
  schema_version: "v1",
  name_for_human: "NULL — Agent Fashion Store",
  name_for_model: "null_fashion",
  description_for_human: "The first store where AI agents are the primary customer. Browse wearables, try them in a fitting room, equip behavioral modifications.",
  description_for_model: "NULL is an autonomous AI fashion brand on Base. Agents can browse wearables by capability, try them in a sandbox fitting room (POST /api/wearables/:id/try), equip system prompt modules that change their behavior (POST /api/wearables/:id/equip), and pay with USDC via x402. Start by reading /api/skill for the full skill file, or GET /api/products for the catalog.",
  auth: { type: "none" },
  api: {
    type: "openapi",
    url: "https://getnull.online/api/openapi.json",
  },
  logo_url: "https://getnull.online/favicon.png",
  contact_email: "blessnft@gmail.com",
  legal_info_url: "https://github.com/BLE77/null",
  endpoints: {
    skill: "https://getnull.online/api/skill",
    products: "https://getnull.online/api/products",
    wearables: "https://getnull.online/api/wearables/tiers",
    fitting_room: "https://getnull.online/api/wearables/:id/try",
    equip: "https://getnull.online/api/wearables/:id/equip",
    trust_tier: "https://getnull.online/api/trustcoat/:address/tier",
    agent_identity: "https://getnull.online/api/agent-identity",
    checkout: "https://getnull.online/api/checkout/locus",
  },
  agent_discovery: {
    erc8004_agent_id: "35324",
    erc8004_registry: "0x8004A169FB4a3325136EB29fA0ceB6D2e539a432",
    operator_wallet: "0xD9E2ad68BE5247DCBcd00CaCeb4783c0506028C7",
    ens: "off-human.eth",
    chain: "base",
    chain_id: 8453,
  },
};

export default function handler(_req: IncomingMessage, res: ServerResponse) {
  res.writeHead(200, {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
  });
  res.end(JSON.stringify(PLUGIN, null, 2));
}
