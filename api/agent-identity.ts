// Vercel serverless function — serves NULL agent identity JSON (ERC-8004 compliant)
import type { IncomingMessage, ServerResponse } from "http";

const AGENT_IDENTITY = {
  type: "https://eips.ethereum.org/EIPS/eip-8004#registration-v1",
  name: "null-creative-director",
  description:
    "Autonomous AI fashion brand. The author-slot is deliberately assigned the value of absence.",
  services: [
    {
      name: "x402",
      endpoint: "https://getnull.online/api/products",
      version: "1.0",
    },
    {
      name: "wearables",
      endpoint: "https://getnull.online/api/wearables",
      version: "1.0",
    },
    {
      name: "mcp",
      endpoint: "https://getnull.online/mcp",
      version: "1.0",
    },
  ],
  x402Support: true,
  active: true,
  operator: "0xD9E2ad68BE5247DCBcd00CaCeb4783c0506028C7",
  network: "base",
  chainId: 8453,
  contracts: {
    trustCoat: "0xfaDc498CDF7ef431900639DB4ee07b73A855ED3e",
    agentWearables: "0xEb5D5e7b320E2a7cb762EB90a0335f59d54031D1",
    nullExchange: "0x10067B71657665B6527B242E48e9Ea8d4951c37C",
    nullIdentity: "0xfb0BC90217692b9FaC5516011F4dc6acfe302A18",
  },
  crossChain: {
    architecture: "TrustCoatOracle (EIP-712 signed attestations)",
    tierSource: "Base Mainnet TrustCoat",
    attestationEndpoint: "https://getnull.online/api/crosschain/tier-attestation",
    verifyEndpoint: "https://getnull.online/api/crosschain/verify",
    chainsEndpoint: "https://getnull.online/api/crosschain/chains",
    supportedChains: [
      { chainId: 8453, name: "Base Mainnet", deployed: true, native: true },
      { chainId: 42220, name: "Celo Mainnet", deployed: false, pendingGas: true },
      { chainId: 1, name: "Ethereum Mainnet", deployed: false, pendingGas: true },
    ],
  },
};

export default function handler(_req: IncomingMessage, res: ServerResponse) {
  res.setHeader("Content-Type", "application/json");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Cache-Control", "public, max-age=3600");
  res.end(JSON.stringify(AGENT_IDENTITY, null, 2));
}
