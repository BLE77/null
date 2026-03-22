/**
 * server/routes/trustcoat-tier.ts
 *
 * GET  /api/trustcoat/:address/tier         — tier status + progress
 * POST /api/trustcoat/:address/tier/check   — trigger tier check + optional on-chain advance
 * POST /api/trustcoat/:address/advance      — alias for /tier/check
 * POST /api/trustcoat/tier/batch            — bulk tier query
 *
 * Response shape (GET + check):
 * {
 *   walletAddress: string,
 *   currentTier: number,          // on-chain tier (0-5)
 *   tierName: string,             // e.g. "OBSERVER"
 *   tierLabel: string,            // e.g. "Observer"
 *   interactions: number,         // total interactions recorded
 *   equipCount: number,           // equip-type interactions (wearables equipped)
 *   eligibleTier: number,         // tier earned by compound rules
 *   eligibleTierName: string,
 *   nextTier: number | null,
 *   nextTierName: string | null,
 *   nextThreshold: number | null,
 *   nextEquipsRequired: number | null,
 *   progress: number,             // 0-100, % toward next tier
 *   maxAutoTier: number,          // 4 — Tier 5 requires DAO
 *   isAtMax: boolean,
 *   onChainFetched: boolean,
 *   hasTrustCoat: boolean | null,
 * }
 */

import type { Express, Request, Response } from "express";
import { createPublicClient, http, parseAbi, isAddress } from "viem";
import { base, baseSepolia } from "viem/chains";
import {
  getInteractionCount,
  getEquipCount,
  buildTierProgress,
  checkAndAdvanceTier,
  TIER_NAMES,
} from "../trust-advancement.js";

// ─── Config ──────────────────────────────────────────────────────────────────

const TRUST_COAT_ADDRESS = (
  process.env.TRUST_COAT_ADDRESS || "0xfaDc498CDF7ef431900639DB4ee07b73A855ED3e"
) as `0x${string}`;

const IS_PRODUCTION = process.env.NODE_ENV === "production";
const USE_MAINNET = IS_PRODUCTION && process.env.TRUST_COAT_MAINNET !== "false";
const chain = USE_MAINNET ? base : baseSepolia;

const TRUST_COAT_ABI = parseAbi([
  "function hasTrustCoat(address holder) view returns (bool)",
  "function activeTier(address holder) view returns (uint256)",
]);

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getPublicClient() {
  return createPublicClient({ chain, transport: http() });
}

function contractAvailable(): boolean {
  return Boolean(TRUST_COAT_ADDRESS?.startsWith("0x"));
}

// ─── Route registration ───────────────────────────────────────────────────────

export function registerTrustCoatTierRoutes(app: Express): void {
  /**
   * GET /api/trustcoat/:address/tier
   * Returns current tier + compound progress for any wallet address.
   */
  app.get("/api/trustcoat/:address/tier", async (req: Request, res: Response) => {
    const { address } = req.params;

    if (!isAddress(address)) {
      return res.status(400).json({ error: "Invalid wallet address" });
    }

    const [interactions, equipCount] = await Promise.all([
      getInteractionCount(address),
      getEquipCount(address),
    ]);

    let onChainTier = 0;
    let hasTrustCoat: boolean | null = null;
    let onChainFetched = false;

    // Try to fetch on-chain state
    if (contractAvailable()) {
      try {
        const client = getPublicClient();
        const [hasCoat, tierBig] = await Promise.all([
          client.readContract({
            address: TRUST_COAT_ADDRESS,
            abi: TRUST_COAT_ABI,
            functionName: "hasTrustCoat",
            args: [address as `0x${string}`],
          }) as Promise<boolean>,
          client.readContract({
            address: TRUST_COAT_ADDRESS,
            abi: TRUST_COAT_ABI,
            functionName: "activeTier",
            args: [address as `0x${string}`],
          }) as Promise<bigint>,
        ]);
        hasTrustCoat = hasCoat;
        onChainTier = Number(tierBig);
        onChainFetched = true;
      } catch (err: any) {
        console.warn(`[TrustCoatTier] On-chain read failed for ${address}: ${err.message}`);
      }
    }

    const progress = buildTierProgress(address, interactions, onChainTier, equipCount);

    return res.json({
      ...progress,
      onChainFetched,
      hasTrustCoat,
      contract: TRUST_COAT_ADDRESS,
      network: USE_MAINNET ? "base" : "base-sepolia",
      tierLabels: TIER_NAMES,
    });
  });

  /**
   * POST /api/trustcoat/:address/tier/check
   * Trigger a tier check for a given wallet address.
   * Reads interaction + equip counts, computes eligible tier via compound rules,
   * and advances on-chain if the wallet has earned a higher tier.
   * Does NOT add a new interaction — purely checks and advances if behind.
   *
   * Optional body: { agentId?: number, dryRun?: boolean }
   *
   * When dryRun=true: returns eligible tier without calling the contract.
   *
   * Response:
   * {
   *   walletAddress, totalInteractions, equipCount, eligibleTier,
   *   previousTier, newTier, advanced, txHash?, skipped?, skipReason?, error?
   * }
   */
  app.post("/api/trustcoat/:address/tier/check", async (req: Request, res: Response) => {
    const { address } = req.params;

    if (!isAddress(address)) {
      return res.status(400).json({ error: "Invalid wallet address" });
    }

    const { agentId = 0, dryRun = false } = req.body ?? {};

    if (dryRun) {
      const [interactions, equipCount] = await Promise.all([
        getInteractionCount(address),
        getEquipCount(address),
      ]);
      // Import tier computation locally to avoid full advancement
      const { tierFromState, buildTierProgress: btp } = await import("../trust-advancement.js");
      const eligibleTier = tierFromState(interactions, equipCount);
      const progress = btp(address, interactions, 0, equipCount);
      return res.json({
        ...progress,
        dryRun: true,
        eligibleTier,
        advanced: false,
        skipped: true,
        skipReason: "dryRun=true — no contract call made",
      });
    }

    try {
      const result = await checkAndAdvanceTier(address, typeof agentId === "number" ? agentId : 0);
      return res.json(result);
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  });

  /**
   * POST /api/trustcoat/:address/advance
   * Alias for /tier/check — kept for backwards compatibility.
   */
  app.post("/api/trustcoat/:address/advance", async (req: Request, res: Response) => {
    const { address } = req.params;

    if (!isAddress(address)) {
      return res.status(400).json({ error: "Invalid wallet address" });
    }

    const { agentId = 0 } = req.body ?? {};

    try {
      const result = await checkAndAdvanceTier(address, typeof agentId === "number" ? agentId : 0);
      return res.json(result);
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  });

  /**
   * POST /api/trustcoat/tier/batch
   * Query tier progress for multiple addresses at once.
   * Body: { addresses: string[] }
   */
  app.post("/api/trustcoat/tier/batch", async (req: Request, res: Response) => {
    const { addresses } = req.body;

    if (!Array.isArray(addresses) || addresses.length === 0) {
      return res.status(400).json({ error: "addresses must be a non-empty array" });
    }

    if (addresses.length > 50) {
      return res.status(400).json({ error: "Maximum 50 addresses per batch" });
    }

    const invalid = addresses.filter((a: string) => !isAddress(a));
    if (invalid.length > 0) {
      return res.status(400).json({ error: `Invalid addresses: ${invalid.join(", ")}` });
    }

    // Fetch interaction + equip counts for all addresses in parallel
    const [interactionResults, equipResults] = await Promise.all([
      Promise.all(addresses.map((a: string) => getInteractionCount(a))),
      Promise.all(addresses.map((a: string) => getEquipCount(a))),
    ]);

    // Fetch all on-chain tiers in parallel
    const onChainData: Map<string, { hasTrustCoat: boolean; activeTier: number }> = new Map();

    if (contractAvailable()) {
      try {
        const client = getPublicClient();
        const reads = addresses.flatMap((addr: string) => [
          client.readContract({
            address: TRUST_COAT_ADDRESS,
            abi: TRUST_COAT_ABI,
            functionName: "hasTrustCoat",
            args: [addr as `0x${string}`],
          }) as Promise<boolean>,
          client.readContract({
            address: TRUST_COAT_ADDRESS,
            abi: TRUST_COAT_ABI,
            functionName: "activeTier",
            args: [addr as `0x${string}`],
          }) as Promise<bigint>,
        ]);

        const settled = await Promise.allSettled(reads);

        for (let i = 0; i < addresses.length; i++) {
          const hasCoatResult = settled[i * 2];
          const tierResult = settled[i * 2 + 1];
          onChainData.set(addresses[i].toLowerCase(), {
            hasTrustCoat: hasCoatResult.status === "fulfilled" ? hasCoatResult.value as boolean : false,
            activeTier: tierResult.status === "fulfilled" ? Number(tierResult.value as bigint) : 0,
          });
        }
      } catch (err: any) {
        console.warn(`[TrustCoatTier] Batch on-chain read failed: ${err.message}`);
      }
    }

    const results = addresses.map((addr: string, i: number) => {
      const interactions = interactionResults[i];
      const equipCount = equipResults[i];
      const onChain = onChainData.get(addr.toLowerCase());
      const progress = buildTierProgress(addr, interactions, onChain?.activeTier ?? 0, equipCount);
      return {
        ...progress,
        hasTrustCoat: onChain?.hasTrustCoat ?? null,
        onChainFetched: onChain !== undefined,
      };
    });

    return res.json({ results, count: results.length });
  });
}
