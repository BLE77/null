/**
 * server/routes/crosschain.ts
 *
 * Cross-chain TrustCoat tier portability routes.
 *
 * GET  /api/crosschain/tier-attestation?address=0x...&chainId=42220
 *      Read Base TrustCoat tier + sign an EIP-712 attestation for any other chain.
 *      The signed attestation can be submitted to TrustCoatOracle.attest() on the target chain.
 *
 * GET  /api/crosschain/verify?address=0x...&chainId=42220
 *      Read-only: returns Base tier + oracle state on the target chain (if deployed).
 *
 * GET  /api/crosschain/chains
 *      Returns all supported chains and their deployment status.
 *
 * Architecture:
 *   - TrustCoat (Base): soulbound tier 0-5, source of truth
 *   - TrustCoatOracle (Celo/ETH): mirrors Base tier via EIP-712 signed attestations
 *   - AgentWearables (Celo/ETH): reads tier from TrustCoatOracle (same ITrustCoat interface)
 */

import { Router } from "express";
import { ethers } from "ethers";

// ─── Config ───────────────────────────────────────────────────────────────────

const TRUST_COAT_ADDRESS = process.env.TRUST_COAT_ADDRESS ?? "0xfaDc498CDF7ef431900639DB4ee07b73A855ED3e";
const BASE_RPC = process.env.BASE_MAINNET_RPC ?? "https://mainnet.base.org";
const ATTESTATION_VALIDITY_SEC = 7 * 24 * 60 * 60; // 7 days

const TRUST_COAT_ABI = [
  "function activeTier(address holder) view returns (uint256)",
  "function hasTrustCoat(address holder) view returns (bool)",
];

const ORACLE_ABI = [
  "function attestationOf(address agent) view returns (uint256 tier, uint256 expiry, bool valid, uint256 currentNonce)",
  "function nonce(address agent) view returns (uint256)",
];

interface ChainConfig {
  name: string;
  rpc: string;
  oracleAddress?: string;
  wearablesAddress?: string;
  explorer: string;
}

function getChainConfigs(): Record<number, ChainConfig> {
  return {
    8453: {
      name: "Base Mainnet",
      rpc: BASE_RPC,
      oracleAddress: undefined,
      wearablesAddress: process.env.AGENT_WEARABLES_ADDRESS ?? "0xEb5D5e7b320E2a7cb762EB90a0335f59d54031D1",
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
      rpc: process.env.ETH_SEPOLIA_RPC ?? "https://rpc.sepolia.org",
      oracleAddress: process.env.TRUST_COAT_ORACLE_SEPOLIA,
      wearablesAddress: process.env.AGENT_WEARABLES_SEPOLIA_ADDRESS,
      explorer: "https://sepolia.etherscan.io",
    },
  };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function getTierFromBase(address: string): Promise<{ tier: number; hasCoat: boolean }> {
  const provider = new ethers.JsonRpcProvider(BASE_RPC);
  const contract = new ethers.Contract(TRUST_COAT_ADDRESS, TRUST_COAT_ABI, provider);
  const [tier, hasCoat] = await Promise.all([
    contract.activeTier(address),
    contract.hasTrustCoat(address),
  ]);
  return { tier: Number(tier), hasCoat };
}

async function signAttestation(
  agent: string,
  tier: number,
  expiry: number,
  agentNonce: number,
  chainId: number,
  oracleAddress: string
): Promise<{ signature: string; signer: string }> {
  const signerKey = process.env.LOCUS_OWNER_PRIVATE_KEY ?? process.env.TRUST_COAT_MINTER_KEY;
  if (!signerKey) throw new Error("Attestation signing key not configured");

  const signer = new ethers.Wallet(signerKey);
  const domain = {
    name: "TrustCoatOracle",
    version: "1",
    chainId,
    verifyingContract: oracleAddress,
  };
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
  const signature = await signer.signTypedData(domain, types, value);
  return { signature, signer: signer.address };
}

// ─── Routes ───────────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function registerCrossChainRoutes(app: any): void {
  // GET /api/crosschain/chains
  app.get("/api/crosschain/chains", (_req, res) => {
    const chains = getChainConfigs();
    res.json({
      chains: Object.entries(chains).map(([id, cfg]) => ({
        chainId: Number(id),
        name: cfg.name,
        deployed: Number(id) === 8453 || !!cfg.oracleAddress,
        oracleAddress: cfg.oracleAddress ?? null,
        wearablesAddress: cfg.wearablesAddress ?? null,
        explorer: cfg.explorer,
      })),
    });
  });

  // GET /api/crosschain/tier-attestation?address=0x...&chainId=42220
  app.get("/api/crosschain/tier-attestation", async (req, res) => {
    const { address, chainId: chainIdS } = req.query as Record<string, string>;

    if (!address || !ethers.isAddress(address)) {
      return res.status(400).json({ error: "Invalid address" });
    }

    const chainId = chainIdS ? parseInt(chainIdS, 10) : 42220;
    const chains = getChainConfigs();
    const chain = chains[chainId];
    if (!chain) {
      return res.status(400).json({
        error: `Unsupported chainId ${chainId}`,
        supported: Object.keys(chains).map(Number),
      });
    }

    // Base is native — no oracle
    if (chainId === 8453) {
      const { tier, hasCoat } = await getTierFromBase(address);
      return res.json({
        address,
        chainId: 8453,
        chain: chain.name,
        tier,
        hasCoat,
        source: "TrustCoat (Base Mainnet native)",
        attestation: null,
        note: "On Base, TrustCoat is read directly — no attestation needed.",
      });
    }

    if (!chain.oracleAddress) {
      return res.status(503).json({
        error: `TrustCoatOracle not yet deployed on ${chain.name}`,
        chainId,
        deploymentStatus: "pending_gas_funding",
        deployScript: `DEPLOYER_PRIVATE_KEY=0x... NETWORK=mainnet node scripts/deploy-crosschain-${chainId === 1 || chainId === 11155111 ? "eth" : "celo"}.mjs`,
      });
    }

    try {
      const [{ tier, hasCoat }, oracleProvider] = await Promise.all([
        getTierFromBase(address),
        Promise.resolve(new ethers.JsonRpcProvider(chain.rpc)),
      ]);

      const oracle = new ethers.Contract(chain.oracleAddress, ORACLE_ABI, oracleProvider);
      const agentNonce = Number(await oracle.nonce(address));
      const expiry = Math.floor(Date.now() / 1000) + ATTESTATION_VALIDITY_SEC;

      const { signature, signer } = await signAttestation(
        address, tier, expiry, agentNonce, chainId, chain.oracleAddress
      );

      return res.json({
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
          signer,
        },
        usage: {
          description: "Call TrustCoatOracle.attest(agent, tier, expiry, sig) on the target chain",
          oracleAddress: chain.oracleAddress,
          explorerUrl: `${chain.explorer}/address/${chain.oracleAddress}`,
          wearablesAddress: chain.wearablesAddress ?? null,
        },
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      return res.status(500).json({ error: message });
    }
  });

  // GET /api/crosschain/verify?address=0x...&chainId=42220
  app.get("/api/crosschain/verify", async (req, res) => {
    const { address, chainId: chainIdS } = req.query as Record<string, string>;

    if (!address || !ethers.isAddress(address)) {
      return res.status(400).json({ error: "Invalid address" });
    }

    try {
      const { tier: baseTier, hasCoat } = await getTierFromBase(address);
      const chainId = chainIdS ? parseInt(chainIdS, 10) : undefined;
      const chains = getChainConfigs();

      const result: Record<string, unknown> = {
        address,
        base: { chainId: 8453, tier: baseTier, hasCoat, source: "TrustCoat" },
      };

      if (chainId && chainId !== 8453 && chains[chainId]?.oracleAddress) {
        const chain = chains[chainId];
        try {
          const provider = new ethers.JsonRpcProvider(chain.rpc);
          const oracle = new ethers.Contract(chain.oracleAddress!, ORACLE_ABI, provider);
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
        } catch {
          result.oracle = { chainId, chain: chain.name, error: "Could not read oracle" };
        }
      }

      return res.json(result);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      return res.status(500).json({ error: message });
    }
  });
}
