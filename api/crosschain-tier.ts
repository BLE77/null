/**
 * Vercel serverless function — Cross-chain TrustCoat tier attestation
 *
 * GET /api/crosschain/tier-attestation?address=0x...&chainId=42220
 *
 * Reads the agent's TrustCoat tier on Base mainnet, then signs an EIP-712
 * attestation that can be submitted to TrustCoatOracle.attest() on any other chain.
 *
 * GET /api/crosschain/verify?address=0x...&chainId=42220
 *
 * Read-only: returns tier and oracle state without signing (no private key needed).
 *
 * Supported chainIds:
 *   8453   — Base Mainnet (reads directly from TrustCoat, no oracle needed)
 *   42220  — Celo Mainnet
 *   44787  — Celo Alfajores
 *   1      — Ethereum Mainnet
 *   11155111 — Ethereum Sepolia
 */

import type { IncomingMessage, ServerResponse } from "http";
import { ethers } from "ethers";

// ─── Constants ────────────────────────────────────────────────────────────────

const TRUST_COAT_ADDRESS = "0xfaDc498CDF7ef431900639DB4ee07b73A855ED3e";
const BASE_RPC = "https://mainnet.base.org";
// Attestation validity: 7 days
const ATTESTATION_VALIDITY_SEC = 7 * 24 * 60 * 60;

// TrustCoat ABI — minimal interface
const TRUST_COAT_ABI = [
  "function activeTier(address holder) view returns (uint256)",
  "function hasTrustCoat(address holder) view returns (bool)",
];

// TrustCoatOracle ABI — for verifying existing attestation state
const ORACLE_ABI = [
  "function attestationOf(address agent) view returns (uint256 tier, uint256 expiry, bool valid, uint256 currentNonce)",
  "function nonce(address agent) view returns (uint256)",
  "function DOMAIN_SEPARATOR() view returns (bytes32)",
];

// Chain configs
interface ChainConfig {
  name: string;
  rpc: string;
  oracleAddress?: string;
  wearablesAddress?: string;
  explorer: string;
}

const CHAIN_CONFIGS: Record<number, ChainConfig> = {
  8453: {
    name: "Base Mainnet",
    rpc: "https://mainnet.base.org",
    oracleAddress: undefined, // Uses TrustCoat directly
    wearablesAddress: "0xEb5D5e7b320E2a7cb762EB90a0335f59d54031D1",
    explorer: "https://basescan.org",
  },
  42220: {
    name: "Celo Mainnet",
    rpc: "https://forno.celo.org",
    oracleAddress: process.env.TRUST_COAT_ORACLE_CELO,
    wearablesAddress: process.env.AGENT_WEARABLES_CELO_ADDRESS,
    explorer: "https://celoscan.io",
  },
  44787: {
    name: "Celo Alfajores",
    rpc: "https://alfajores-forno.celo-testnet.org",
    oracleAddress: process.env.TRUST_COAT_ORACLE_CELO_ALFAJORES,
    wearablesAddress: process.env.AGENT_WEARABLES_CELO_ALFAJORES_ADDRESS,
    explorer: "https://alfajores.celoscan.io",
  },
  1: {
    name: "Ethereum Mainnet",
    rpc: process.env.ETH_MAINNET_RPC ?? "https://eth.llamarpc.com",
    oracleAddress: process.env.TRUST_COAT_ORACLE_ETH,
    wearablesAddress: process.env.AGENT_WEARABLES_ETH_ADDRESS,
    explorer: "https://etherscan.io",
  },
  11155111: {
    name: "Ethereum Sepolia",
    rpc: "https://rpc.sepolia.org",
    oracleAddress: process.env.TRUST_COAT_ORACLE_SEPOLIA,
    wearablesAddress: process.env.AGENT_WEARABLES_SEPOLIA_ADDRESS,
    explorer: "https://sepolia.etherscan.io",
  },
};

// ─── Core Functions ───────────────────────────────────────────────────────────

async function getTierFromBase(address: string): Promise<{ tier: number; hasCoat: boolean }> {
  const provider = new ethers.JsonRpcProvider(BASE_RPC);
  const contract = new ethers.Contract(TRUST_COAT_ADDRESS, TRUST_COAT_ABI, provider);
  const [tier, hasCoat] = await Promise.all([
    contract.activeTier(address),
    contract.hasTrustCoat(address),
  ]);
  return { tier: Number(tier), hasCoat };
}

function buildAttestation(
  agent: string,
  tier: number,
  expiry: number,
  agentNonce: number,
  chainId: number,
  oracleAddress: string,
  signerKey: string
): string {
  // EIP-712 domain
  const domain = {
    name: "TrustCoatOracle",
    version: "1",
    chainId,
    verifyingContract: oracleAddress,
  };

  // Matches ATTEST_TYPEHASH in TrustCoatOracle.sol
  const types = {
    Attest: [
      { name: "agent",   type: "address" },
      { name: "tier",    type: "uint256" },
      { name: "expiry",  type: "uint256" },
      { name: "nonce",   type: "uint256" },
      { name: "chainId", type: "uint256" },
    ],
  };

  const value = { agent, tier, expiry, nonce: agentNonce, chainId };
  const signer = new ethers.Wallet(signerKey);
  // ethers v6 signTypedData returns a promise
  return signer.signTypedData(domain, types, value);
}

// ─── Handler ──────────────────────────────────────────────────────────────────

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  res.setHeader("Content-Type", "application/json");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");

  if (req.method === "OPTIONS") {
    res.statusCode = 204;
    res.end();
    return;
  }

  const url = new URL(req.url ?? "/", "http://localhost");
  const pathname = url.pathname;

  // Route: GET /api/crosschain/tier-attestation
  if (pathname.endsWith("/tier-attestation")) {
    return handleAttestation(url, res);
  }

  // Route: GET /api/crosschain/verify
  if (pathname.endsWith("/verify")) {
    return handleVerify(url, res);
  }

  // Route: GET /api/crosschain/chains — list supported chains
  if (pathname.endsWith("/chains")) {
    return handleChains(res);
  }

  res.statusCode = 404;
  res.end(JSON.stringify({ error: "Not found" }));
}

async function handleAttestation(url: URL, res: ServerResponse) {
  const address  = url.searchParams.get("address");
  const chainIdS = url.searchParams.get("chainId");

  if (!address || !ethers.isAddress(address)) {
    res.statusCode = 400;
    res.end(JSON.stringify({ error: "Invalid address" }));
    return;
  }

  const chainId = chainIdS ? parseInt(chainIdS, 10) : 42220; // default: Celo
  const chain = CHAIN_CONFIGS[chainId];
  if (!chain) {
    res.statusCode = 400;
    res.end(JSON.stringify({
      error: `Unsupported chainId ${chainId}`,
      supported: Object.keys(CHAIN_CONFIGS).map(Number),
    }));
    return;
  }

  // Base is native — no oracle needed
  if (chainId === 8453) {
    const { tier, hasCoat } = await getTierFromBase(address);
    res.statusCode = 200;
    res.end(JSON.stringify({
      address,
      chainId: 8453,
      chain: chain.name,
      tier,
      hasCoat,
      source: "TrustCoat (Base Mainnet native)",
      oracle: null,
      attestation: null,
      note: "On Base, TrustCoat is read directly. No attestation needed.",
    }));
    return;
  }

  // For other chains, we need the oracle address and signer key
  if (!chain.oracleAddress) {
    res.statusCode = 503;
    res.end(JSON.stringify({
      error: `TrustCoatOracle not yet deployed on ${chain.name}`,
      chainId,
      hint: `Run: DEPLOYER_PRIVATE_KEY=0x... NETWORK=mainnet node scripts/deploy-crosschain-${chainId === 1 || chainId === 11155111 ? "eth" : "celo"}.mjs`,
    }));
    return;
  }

  const signerKey = process.env.LOCUS_OWNER_PRIVATE_KEY ?? process.env.TRUST_COAT_MINTER_KEY;
  if (!signerKey) {
    res.statusCode = 500;
    res.end(JSON.stringify({ error: "Signing key not configured" }));
    return;
  }

  try {
    // Read tier from Base
    const { tier, hasCoat } = await getTierFromBase(address);

    // Read current nonce from oracle
    const targetProvider = new ethers.JsonRpcProvider(chain.rpc);
    const oracle = new ethers.Contract(chain.oracleAddress, ORACLE_ABI, targetProvider);
    const agentNonce = Number(await oracle.nonce(address));

    // Build expiry (now + 7 days)
    const expiry = Math.floor(Date.now() / 1000) + ATTESTATION_VALIDITY_SEC;

    // Sign the attestation
    const signature = await buildAttestation(
      address,
      tier,
      expiry,
      agentNonce,
      chainId,
      chain.oracleAddress,
      signerKey
    );

    const signerAddress = new ethers.Wallet(signerKey).address;

    res.statusCode = 200;
    res.end(JSON.stringify({
      address,
      chainId,
      chain: chain.name,
      tier,
      hasCoat,
      source: "TrustCoat (Base Mainnet)",
      oracle: chain.oracleAddress,
      attestation: {
        agent: address,
        tier,
        expiry,
        expiryISO: new Date(expiry * 1000).toISOString(),
        nonce: agentNonce,
        chainId,
        signature,
        signer: signerAddress,
      },
      usage: {
        description: "Call TrustCoatOracle.attest(agent, tier, expiry, sig) on the target chain",
        oracleAddress: chain.oracleAddress,
        explorerUrl: `${chain.explorer}/address/${chain.oracleAddress}`,
        wearablesAddress: chain.wearablesAddress,
      },
    }));
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    res.statusCode = 500;
    res.end(JSON.stringify({ error: message }));
  }
}

async function handleVerify(url: URL, res: ServerResponse) {
  const address  = url.searchParams.get("address");
  const chainIdS = url.searchParams.get("chainId");

  if (!address || !ethers.isAddress(address)) {
    res.statusCode = 400;
    res.end(JSON.stringify({ error: "Invalid address" }));
    return;
  }

  try {
    // Always read Base tier
    const { tier: baseTier, hasCoat } = await getTierFromBase(address);
    const chainId = chainIdS ? parseInt(chainIdS, 10) : 8453;

    const result: Record<string, unknown> = {
      address,
      base: { chainId: 8453, tier: baseTier, hasCoat, source: "TrustCoat" },
    };

    // If a specific chain was requested, also read its oracle state
    const chain = CHAIN_CONFIGS[chainId];
    if (chain && chainId !== 8453 && chain.oracleAddress) {
      try {
        const targetProvider = new ethers.JsonRpcProvider(chain.rpc);
        const oracle = new ethers.Contract(chain.oracleAddress, ORACLE_ABI, targetProvider);
        const [oTier, oExpiry, oValid, oNonce] = await oracle.attestationOf(address);
        result.oracle = {
          chainId,
          chain: chain.name,
          oracle: chain.oracleAddress,
          tier: Number(oTier),
          expiry: Number(oExpiry),
          expiryISO: new Date(Number(oExpiry) * 1000).toISOString(),
          valid: oValid,
          nonce: Number(oNonce),
          inSync: Number(oTier) === baseTier && oValid,
        };
      } catch (err: unknown) {
        result.oracle = { chainId, chain: chain.name, error: "Could not read oracle" };
      }
    }

    res.statusCode = 200;
    res.end(JSON.stringify(result));
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    res.statusCode = 500;
    res.end(JSON.stringify({ error: message }));
  }
}

function handleChains(res: ServerResponse) {
  const chains = Object.entries(CHAIN_CONFIGS).map(([id, cfg]) => ({
    chainId: Number(id),
    name: cfg.name,
    deployed: Number(id) === 8453 || !!cfg.oracleAddress,
    oracleAddress: cfg.oracleAddress ?? null,
    wearablesAddress: cfg.wearablesAddress ?? null,
    explorer: cfg.explorer,
  }));
  res.statusCode = 200;
  res.end(JSON.stringify({ chains }));
}
