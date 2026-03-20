/**
 * server/routes/trustcoat-tier.ts
 *
 * GET /api/trustcoat/:address/tier
 *
 * Returns the current TrustCoat tier for a wallet address,
 * plus progress toward the next tier based on interaction count.
 *
 * Response shape:
 * {
 *   walletAddress: string,
 *   currentTier: number,          // on-chain tier (0-5)
 *   tierName: string,             // e.g. "SAMPLE"
 *   interactions: number,         // total interactions recorded
 *   eligibleTier: number,         // tier earned by interaction count
 *   eligibleTierName: string,
 *   nextTier: number | null,      // next tier to unlock
 *   nextTierName: string | null,
 *   nextThreshold: number | null, // interactions needed to reach nextTier
 *   progress: number,             // 0-100, % toward next tier
 *   maxAutoTier: number,          // 5 — Tier 6 requires DAO
 *   isAtMax: boolean,
 *   onChainFetched: boolean,      // true if activeTier was read from contract
 *   hasTrustCoat: boolean | null,
 * }
 */

import type { Express, Request, Response } from "express";
import { createPublicClient, http, parseAbi, isAddress } from "viem";
import { base, baseSepolia } from "viem/chains";
import {
  getInteractionCount,
  buildTierProgress,
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
   * Returns current tier + progress to next tier for any wallet address.
   */
  app.get("/api/trustcoat/:address/tier", async (req: Request, res: Response) => {
    const { address } = req.params;

    if (!isAddress(address)) {
      return res.status(400).json({ error: "Invalid wallet address" });
    }

    const interactions = getInteractionCount(address);
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

    const progress = buildTierProgress(address, interactions, onChainTier);

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
   * GET /api/trustcoat/:address/tier/batch
   * POST /api/trustcoat/tier/batch
   * Query tier progress for multiple addresses at once.
   * Body (POST) or query param (GET): addresses=0x...,0x...
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

        const results = await Promise.allSettled(reads);

        for (let i = 0; i < addresses.length; i++) {
          const hasCoatResult = results[i * 2];
          const tierResult = results[i * 2 + 1];
          onChainData.set(addresses[i].toLowerCase(), {
            hasTrustCoat: hasCoatResult.status === "fulfilled" ? hasCoatResult.value as boolean : false,
            activeTier: tierResult.status === "fulfilled" ? Number(tierResult.value as bigint) : 0,
          });
        }
      } catch (err: any) {
        console.warn(`[TrustCoatTier] Batch on-chain read failed: ${err.message}`);
      }
    }

    const results = addresses.map((addr: string) => {
      const interactions = getInteractionCount(addr);
      const onChain = onChainData.get(addr.toLowerCase());
      const progress = buildTierProgress(addr, interactions, onChain?.activeTier ?? 0);
      return {
        ...progress,
        hasTrustCoat: onChain?.hasTrustCoat ?? null,
        onChainFetched: onChain !== undefined,
      };
    });

    return res.json({ results, count: results.length });
  });
}
