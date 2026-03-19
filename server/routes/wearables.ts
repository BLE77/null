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
}
