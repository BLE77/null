/**
 * server/routes/identity.ts
 *
 * ERC-6551 identity provisioning for NULL agents.
 *
 * Architecture:
 *   Agent EOA → owns NullIdentity ERC-721 token #N
 *   ERC-6551 Registry.createAccount(impl, salt, chainId, NullIdentity, N)
 *     → TBA address = the agent's on-chain wardrobe
 *
 * Contract addresses (Base Mainnet):
 *   NullIdentity:   0xfb0BC90217692b9FaC5516011F4dc6acfe302A18
 *   ERC-6551 Reg:   0x000000006551c19487814612e58FE06813775758
 *   ERC-6551 Impl:  0x55266d75D1a14E4572138116aF39863Ed6596E7F
 *   AgentWearables: 0xEb5D5e7b320E2a7cb762EB90a0335f59d54031D1
 *
 * Mount in server/routes.ts:
 *   import { registerIdentityRoutes } from "./routes/identity.js";
 *   registerIdentityRoutes(app);
 */

import type { Express, Request, Response } from "express";
import {
  createPublicClient,
  createWalletClient,
  http,
  parseAbi,
  isAddress,
  encodePacked,
  keccak256,
  encodeAbiParameters,
  parseAbiParameters,
  getCreate2Address,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { base, baseSepolia } from "viem/chains";
import { eq } from "drizzle-orm";

// ─── Config ───────────────────────────────────────────────────────────────────

const NULL_IDENTITY_MAINNET = "0xfb0BC90217692b9FaC5516011F4dc6acfe302A18" as const;
const ERC6551_REGISTRY      = "0x000000006551c19487814612e58FE06813775758" as const;
const ERC6551_IMPL          = "0x55266d75D1a14E4572138116aF39863Ed6596E7F" as const;
const AGENT_WEARABLES_MAINNET = "0xEb5D5e7b320E2a7cb762EB90a0335f59d54031D1" as const;

const IS_PRODUCTION = process.env.NODE_ENV === "production";
const USE_MAINNET   = IS_PRODUCTION && process.env.NULL_IDENTITY_MAINNET !== "false";
const chain         = USE_MAINNET ? base : baseSepolia;
const CHAIN_ID      = USE_MAINNET ? 8453 : 84532;

const NULL_IDENTITY_ADDRESS = (
  process.env.NULL_IDENTITY_ADDRESS ||
  (IS_PRODUCTION ? NULL_IDENTITY_MAINNET : "")
) as `0x${string}`;

const AGENT_WEARABLES_ADDRESS = (
  process.env.AGENT_WEARABLES_ADDRESS ||
  (IS_PRODUCTION ? AGENT_WEARABLES_MAINNET : "")
) as `0x${string}`;

const MINTER_PRIVATE_KEY = process.env.TRUST_COAT_MINTER_KEY as `0x${string}` | undefined;

// Season 02 wearable token IDs
const SEASON02_IDS = [1, 2, 3, 4, 5];

// ─── ABIs ────────────────────────────────────────────────────────────────────

const NULL_IDENTITY_ABI = parseAbi([
  "function agentTokenId(address agent) view returns (uint256)",
  "function mint(address agent) external returns (uint256 tokenId)",
  "function ownerOf(uint256 tokenId) view returns (address)",
  "function totalSupply() view returns (uint256)",
]);

const ERC6551_REGISTRY_ABI = parseAbi([
  "function account(address implementation, bytes32 salt, uint256 chainId, address tokenContract, uint256 tokenId) view returns (address)",
  "function createAccount(address implementation, bytes32 salt, uint256 chainId, address tokenContract, uint256 tokenId) returns (address)",
]);

const AGENT_WEARABLES_ABI = parseAbi([
  "function balanceOf(address account, uint256 id) view returns (uint256)",
  "function balanceOfBatch(address[] accounts, uint256[] ids) view returns (uint256[])",
]);

// ─── DB helper (same pattern as trust-advancement.ts) ────────────────────────

let _db: any = null;
let _schema: any = null;

function tryGetDb() {
  if (!process.env.DATABASE_URL) return null;
  if (_db && _schema) return { db: _db, schema: _schema };
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const dbMod = require("../db");
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const schemaMod = require("../../shared/schema.js");
    _db = dbMod.db;
    _schema = schemaMod;
    return { db: _db!, schema: _schema! };
  } catch {
    return null;
  }
}

// ─── Contract helpers ────────────────────────────────────────────────────────

function getPublicClient() {
  return createPublicClient({ chain, transport: http() });
}

function getWalletClient() {
  if (!MINTER_PRIVATE_KEY) throw new Error("TRUST_COAT_MINTER_KEY not set");
  const account = privateKeyToAccount(MINTER_PRIVATE_KEY);
  return { client: createWalletClient({ account, chain, transport: http() }), account };
}

function contractAvailable(): boolean {
  return Boolean(NULL_IDENTITY_ADDRESS && NULL_IDENTITY_ADDRESS.startsWith("0x"));
}

function wearablesAvailable(): boolean {
  return Boolean(AGENT_WEARABLES_ADDRESS && AGENT_WEARABLES_ADDRESS.startsWith("0x"));
}

/**
 * Compute TBA address via ERC-6551 Registry.account() on-chain.
 * Falls back to null if registry call fails.
 */
async function computeTbaAddress(tokenId: bigint): Promise<`0x${string}` | null> {
  if (!contractAvailable()) return null;
  try {
    const client = getPublicClient();
    const tba = await client.readContract({
      address: ERC6551_REGISTRY,
      abi: ERC6551_REGISTRY_ABI,
      functionName: "account",
      args: [
        ERC6551_IMPL,
        "0x0000000000000000000000000000000000000000000000000000000000000000" as `0x${string}`,
        BigInt(CHAIN_ID),
        NULL_IDENTITY_ADDRESS,
        tokenId,
      ],
    }) as `0x${string}`;
    return tba;
  } catch {
    return null;
  }
}

/**
 * Look up an agent's identity from DB cache first, then on-chain.
 */
async function lookupIdentity(agentAddress: string): Promise<{
  tokenId: number;
  tbaAddress: string;
} | null> {
  const addr = agentAddress.toLowerCase();

  // 1. Try DB cache
  const ctx = tryGetDb();
  if (ctx) {
    try {
      const [row] = await ctx.db
        .select()
        .from(ctx.schema.agentIdentities)
        .where(eq(ctx.schema.agentIdentities.agentAddress, addr));
      if (row) return { tokenId: row.tokenId, tbaAddress: row.tbaAddress };
    } catch { /* fall through to on-chain */ }
  }

  // 2. On-chain lookup
  if (!contractAvailable()) return null;
  try {
    const client = getPublicClient();
    const tokenId = await client.readContract({
      address: NULL_IDENTITY_ADDRESS,
      abi: NULL_IDENTITY_ABI,
      functionName: "agentTokenId",
      args: [addr as `0x${string}`],
    }) as bigint;

    if (tokenId === 0n) return null;

    const tba = await computeTbaAddress(tokenId);
    if (!tba) return null;

    // Backfill DB cache
    if (ctx) {
      try {
        await ctx.db.insert(ctx.schema.agentIdentities).values({
          agentAddress: addr,
          tokenId: Number(tokenId),
          tbaAddress: tba.toLowerCase(),
        }).onConflictDoNothing();
      } catch { /* best-effort */ }
    }

    return { tokenId: Number(tokenId), tbaAddress: tba };
  } catch {
    return null;
  }
}

// ─── Route Registration ───────────────────────────────────────────────────────

export function registerIdentityRoutes(app: Express) {

  /**
   * GET /api/agents/:addr/identity
   * Returns the NullIdentity token ID and ERC-6551 TBA address for an agent.
   */
  app.get("/api/agents/:addr/identity", async (req: Request, res: Response) => {
    const { addr } = req.params;
    if (!isAddress(addr)) {
      return res.status(400).json({ error: "Invalid wallet address" });
    }

    if (!contractAvailable()) {
      return res.status(503).json({
        error: "NullIdentity contract not configured",
        hint: "Set NULL_IDENTITY_ADDRESS in .env",
      });
    }

    const identity = await lookupIdentity(addr);
    if (!identity) {
      return res.status(404).json({
        agentAddress: addr.toLowerCase(),
        hasIdentity: false,
        message: "No NullIdentity found for this address. Call POST /api/agents/:addr/identity to provision.",
      });
    }

    res.json({
      agentAddress: addr.toLowerCase(),
      hasIdentity: true,
      tokenId: identity.tokenId,
      tbaAddress: identity.tbaAddress,
      contract: NULL_IDENTITY_ADDRESS,
      registry: ERC6551_REGISTRY,
      explorerUrl: `https://basescan.org/address/${identity.tbaAddress}`,
      network: chain.name,
    });
  });

  /**
   * POST /api/agents/:addr/identity
   * Mint a NullIdentity token for an agent and provision their ERC-6551 TBA.
   *
   * Requires TRUST_COAT_MINTER_KEY (server wallet = NullIdentity.owner()).
   * Idempotent — if the agent already has an identity, returns existing data.
   */
  app.post("/api/agents/:addr/identity", async (req: Request, res: Response) => {
    const { addr } = req.params;
    if (!isAddress(addr)) {
      return res.status(400).json({ error: "Invalid wallet address" });
    }

    if (!contractAvailable()) {
      return res.status(503).json({
        error: "NullIdentity contract not configured",
        hint: "Set NULL_IDENTITY_ADDRESS in .env",
      });
    }

    if (!MINTER_PRIVATE_KEY) {
      return res.status(503).json({
        error: "TRUST_COAT_MINTER_KEY not set — cannot mint NullIdentity",
      });
    }

    // Check if identity already exists
    const existing = await lookupIdentity(addr);
    if (existing) {
      return res.json({
        agentAddress: addr.toLowerCase(),
        tokenId: existing.tokenId,
        tbaAddress: existing.tbaAddress,
        txHash: null,
        alreadyExists: true,
        explorerUrl: `https://basescan.org/address/${existing.tbaAddress}`,
        network: chain.name,
      });
    }

    try {
      const client = getPublicClient();
      const { client: walletClient, account } = getWalletClient();

      // Mint NullIdentity token
      const txHash = await walletClient.writeContract({
        address: NULL_IDENTITY_ADDRESS,
        abi: NULL_IDENTITY_ABI,
        functionName: "mint",
        args: [addr as `0x${string}`],
        account,
        chain,
      });

      // Wait for receipt to get the token ID
      const receipt = await client.waitForTransactionReceipt({ hash: txHash });

      // Read back the token ID assigned to this agent
      const tokenIdBig = await client.readContract({
        address: NULL_IDENTITY_ADDRESS,
        abi: NULL_IDENTITY_ABI,
        functionName: "agentTokenId",
        args: [addr as `0x${string}`],
      }) as bigint;

      const tokenId = Number(tokenIdBig);

      // Compute TBA address (counterfactual — no createAccount() needed)
      const tbaAddress = await computeTbaAddress(tokenIdBig);
      if (!tbaAddress) throw new Error("Failed to compute TBA address");

      const tbaLower = tbaAddress.toLowerCase();

      // Cache in DB
      const ctx = tryGetDb();
      if (ctx) {
        try {
          await ctx.db.insert(ctx.schema.agentIdentities).values({
            agentAddress: addr.toLowerCase(),
            tokenId,
            tbaAddress: tbaLower,
          }).onConflictDoNothing();
        } catch { /* best-effort */ }
      }

      res.status(201).json({
        agentAddress: addr.toLowerCase(),
        tokenId,
        tbaAddress: tbaLower,
        txHash,
        blockNumber: Number(receipt.blockNumber),
        alreadyExists: false,
        explorerUrl: `https://basescan.org/address/${tbaLower}`,
        tbaNote: "TBA is counterfactual — it will auto-deploy on first use. Transfer wearables to this address to equip them.",
        contract: NULL_IDENTITY_ADDRESS,
        registry: ERC6551_REGISTRY,
        network: chain.name,
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  /**
   * GET /api/agents/:addr/wardrobe
   * Returns on-chain wearable holdings for an agent.
   *
   * If the agent has a TBA (NullIdentity + ERC-6551), reads from TBA address.
   * Falls back to EOA balance check if no TBA.
   */
  app.get("/api/agents/:addr/wardrobe", async (req: Request, res: Response) => {
    const { addr } = req.params;
    if (!isAddress(addr)) {
      return res.status(400).json({ error: "Invalid wallet address" });
    }

    if (!wearablesAvailable()) {
      return res.status(503).json({ error: "AgentWearables contract not configured" });
    }

    const client = getPublicClient();

    // Determine which address to check wearable balances for
    let checkAddress: string = addr.toLowerCase();
    let hasTba = false;
    let tbaAddress: string | null = null;
    let identityTokenId: number | null = null;

    const identity = await lookupIdentity(addr);
    if (identity) {
      hasTba = true;
      tbaAddress = identity.tbaAddress;
      identityTokenId = identity.tokenId;
      checkAddress = identity.tbaAddress;
    }

    try {
      // Batch balance check for all Season 02 wearables
      const accounts = SEASON02_IDS.map(() => checkAddress as `0x${string}`);
      const ids       = SEASON02_IDS.map((id) => BigInt(id));

      const balances = await client.readContract({
        address: AGENT_WEARABLES_ADDRESS,
        abi: AGENT_WEARABLES_ABI,
        functionName: "balanceOfBatch",
        args: [accounts, ids],
      }) as bigint[];

      const held = SEASON02_IDS
        .map((id, i) => ({ tokenId: id, balance: Number(balances[i]) }))
        .filter((w) => w.balance > 0);

      res.json({
        agentAddress: addr.toLowerCase(),
        checkAddress,
        method: hasTba ? "on-chain-tba" : "on-chain-eoa",
        hasTba,
        tbaAddress: tbaAddress ?? null,
        identityTokenId,
        wardrobe: held,
        contract: AGENT_WEARABLES_ADDRESS,
        network: chain.name,
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });
}
