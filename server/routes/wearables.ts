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

// ─── Config ──────────────────────────────────────────────────────────────────

const TRUST_COAT_ADDRESS = (process.env.TRUST_COAT_ADDRESS ?? "") as `0x${string}`;
const MINTER_PRIVATE_KEY = process.env.TRUST_COAT_MINTER_KEY as `0x${string}` | undefined;

// Use Base Sepolia for testnet, Base mainnet for prod
const USE_MAINNET = process.env.NODE_ENV === "production" && process.env.TRUST_COAT_MAINNET === "true";
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
        hint: "Run: npx hardhat run scripts/deploy-trust-coat.ts --network base-sepolia",
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
   * Mint a Trust Coat for an agent wallet (called by Off-Human backend).
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
}
