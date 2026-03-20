/**
 * server/trust-advancement.ts
 *
 * Automatic TrustCoat tier advancement based on interaction count.
 *
 * Tracks three interaction types per agent wallet:
 *   - equip      (POST /api/wearables/:id/equip)
 *   - fitting_room (POST /api/wearables/:id/try)
 *   - purchase   (successful order payment)
 *
 * Tier thresholds:
 *   Tier 1 (SAMPLE)  — first interaction (count >= 1)
 *   Tier 2 (RTW)     — 5 interactions
 *   Tier 3 (COUTURE) — 15 interactions
 *   Tier 4 (ARCHIVE) — 50 interactions
 *   Tier 5 (SOVEREIGN) — manual DAO vote only
 */

import { createPublicClient, createWalletClient, http, parseAbi } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { base, baseSepolia } from "viem/chains";
import { count, eq } from "drizzle-orm";

// ─── Config ──────────────────────────────────────────────────────────────────

const TRUST_COAT_ADDRESS = (
  process.env.TRUST_COAT_ADDRESS || "0xfaDc498CDF7ef431900639DB4ee07b73A855ED3e"
) as `0x${string}`;

const MINTER_PRIVATE_KEY = process.env.TRUST_COAT_MINTER_KEY as `0x${string}` | undefined;

const IS_PRODUCTION = process.env.NODE_ENV === "production";
const USE_MAINNET = IS_PRODUCTION && process.env.TRUST_COAT_MAINNET !== "false";
const chain = USE_MAINNET ? base : baseSepolia;

const TRUST_COAT_ABI = parseAbi([
  "function hasTrustCoat(address holder) view returns (bool)",
  "function activeTier(address holder) view returns (uint256)",
  "function mint(address recipient, uint256 tier, uint256 agentId) external",
  "function upgrade(address holder, uint256 newTier) external",
]);

// ─── Tier thresholds ─────────────────────────────────────────────────────────

export type InteractionType = "equip" | "fitting_room" | "purchase";

// Tier thresholds sorted descending for lookup
export const TIER_THRESHOLDS = [
  { tier: 5, count: 150, name: "SOVEREIGN" },
  { tier: 4, count: 50,  name: "ARCHIVE" },
  { tier: 3, count: 15,  name: "COUTURE" },
  { tier: 2, count: 5,   name: "RTW" },
  { tier: 1, count: 1,   name: "SAMPLE" },
] as const;

export const TIER_NAMES: Record<number, string> = {
  0: "VOID",
  1: "SAMPLE",
  2: "RTW",
  3: "COUTURE",
  4: "ARCHIVE",
  5: "SOVEREIGN",
};

// Max tier that auto-advances. Tier 6 would require DAO (future work).
export const MAX_AUTO_TIER = 5;

export function tierFromCount(count: number): number {
  for (const { tier, count: threshold } of TIER_THRESHOLDS) {
    if (count >= threshold) return tier;
  }
  return 0;
}

/** Returns the interaction count needed to reach the next tier, or null if at max. */
export function nextTierThreshold(currentCount: number): { nextTier: number; threshold: number } | null {
  for (let i = TIER_THRESHOLDS.length - 1; i >= 0; i--) {
    const { tier, count } = TIER_THRESHOLDS[i];
    if (currentCount < count) {
      return { nextTier: tier, threshold: count };
    }
  }
  return null; // already at or above max threshold
}

export interface TierProgress {
  walletAddress: string;
  currentTier: number;
  tierName: string;
  interactions: number;
  eligibleTier: number;
  eligibleTierName: string;
  nextTier: number | null;
  nextTierName: string | null;
  nextThreshold: number | null;
  progress: number; // 0-100, toward next tier
  maxAutoTier: number;
  isAtMax: boolean;
}

export function buildTierProgress(walletAddress: string, interactions: number, onChainTier: number): TierProgress {
  const eligibleTier = tierFromCount(interactions);
  const currentTier = Math.max(onChainTier, 0);
  const next = nextTierThreshold(interactions);

  // Progress toward next tier
  let progress = 100;
  if (next) {
    // Find the threshold for current eligible tier (lower bound)
    const lowerBound = TIER_THRESHOLDS.find(t => t.tier === eligibleTier)?.count ?? 0;
    const range = next.threshold - lowerBound;
    const done = interactions - lowerBound;
    progress = range > 0 ? Math.round((done / range) * 100) : 0;
  }

  return {
    walletAddress: walletAddress.toLowerCase(),
    currentTier,
    tierName: TIER_NAMES[currentTier] ?? "UNKNOWN",
    interactions,
    eligibleTier,
    eligibleTierName: TIER_NAMES[eligibleTier] ?? "UNKNOWN",
    nextTier: next?.nextTier ?? null,
    nextTierName: next ? (TIER_NAMES[next.nextTier] ?? null) : null,
    nextThreshold: next?.threshold ?? null,
    progress,
    maxAutoTier: MAX_AUTO_TIER,
    isAtMax: eligibleTier >= MAX_AUTO_TIER,
  };
}

// ─── Interaction store — PostgreSQL with in-memory fallback ──────────────────
// Uses DB when DATABASE_URL is set; falls back to in-memory Map for local dev.

const interactionCounts = new Map<string, number>(); // fallback only

let _db: import("drizzle-orm/neon-serverless").NeonDatabase<typeof import("../shared/schema.js")> | null = null;
let _schema: typeof import("../shared/schema.js") | null = null;

function tryGetDb() {
  if (!process.env.DATABASE_URL) return null;
  if (_db && _schema) return { db: _db, schema: _schema };
  try {
    // Dynamic require to avoid crashing when DATABASE_URL is absent
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const dbMod = require("./db");
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const schemaMod = require("../shared/schema.js");
    _db = dbMod.db;
    _schema = schemaMod;
    return { db: _db!, schema: _schema! };
  } catch {
    return null;
  }
}

export async function getInteractionCount(walletAddress: string): Promise<number> {
  const addr = walletAddress.toLowerCase();
  const ctx = tryGetDb();
  if (ctx) {
    try {
      const [row] = await ctx.db
        .select({ value: count() })
        .from(ctx.schema.agentInteractions)
        .where(eq(ctx.schema.agentInteractions.walletAddress, addr));
      return Number(row?.value ?? 0);
    } catch (err: any) {
      console.warn("[TrustAdvancement] DB read failed, falling back to in-memory:", err.message);
    }
  }
  return interactionCounts.get(addr) ?? 0;
}

export async function incrementInteractionCount(
  walletAddress: string,
  type: InteractionType
): Promise<number> {
  const addr = walletAddress.toLowerCase();
  const ctx = tryGetDb();
  if (ctx) {
    try {
      await ctx.db.insert(ctx.schema.agentInteractions).values({
        walletAddress: addr,
        interactionType: type,
      });
      const [row] = await ctx.db
        .select({ value: count() })
        .from(ctx.schema.agentInteractions)
        .where(eq(ctx.schema.agentInteractions.walletAddress, addr));
      return Number(row?.value ?? 1);
    } catch (err: any) {
      console.warn("[TrustAdvancement] DB write failed, falling back to in-memory:", err.message);
    }
  }
  // In-memory fallback
  const next = (interactionCounts.get(addr) ?? 0) + 1;
  interactionCounts.set(addr, next);
  return next;
}

// ─── Contract helpers ─────────────────────────────────────────────────────────

function getPublicClient() {
  return createPublicClient({ chain, transport: http() });
}

function getWalletClient() {
  if (!MINTER_PRIVATE_KEY) throw new Error("TRUST_COAT_MINTER_KEY not set");
  const account = privateKeyToAccount(MINTER_PRIVATE_KEY);
  return { client: createWalletClient({ account, chain, transport: http() }), account };
}

function contractAvailable(): boolean {
  return Boolean(TRUST_COAT_ADDRESS?.startsWith("0x") && MINTER_PRIVATE_KEY);
}

// ─── Main advancement function ────────────────────────────────────────────────

export interface AdvancementResult {
  walletAddress: string;
  interactionType: InteractionType;
  totalInteractions: number;
  previousTier: number | null;
  newTier: number;
  advanced: boolean;
  txHash?: string;
  error?: string;
  skipped?: boolean;
  skipReason?: string;
}

/**
 * Record an interaction for a wallet and auto-advance their TrustCoat tier if earned.
 * Safe to call fire-and-forget — all errors are caught and logged.
 */
export async function recordInteraction(
  walletAddress: string,
  type: InteractionType,
  agentId = 0
): Promise<AdvancementResult> {
  const addr = walletAddress.toLowerCase();
  const count = await incrementInteractionCount(addr, type);
  const earned = tierFromCount(count);

  const result: AdvancementResult = {
    walletAddress: addr,
    interactionType: type,
    totalInteractions: count,
    previousTier: null,
    newTier: earned,
    advanced: false,
  };

  if (!contractAvailable()) {
    result.skipped = true;
    result.skipReason = "TRUST_COAT_MINTER_KEY not set — tier tracked in memory only";
    console.log(`[TrustAdvancement] ${type} @${addr} → count=${count} tier=${earned} (no minter key, skipping contract call)`);
    return result;
  }

  try {
    const publicClient = getPublicClient();

    const hasCoat = await publicClient.readContract({
      address: TRUST_COAT_ADDRESS,
      abi: TRUST_COAT_ABI,
      functionName: "hasTrustCoat",
      args: [addr as `0x${string}`],
    }) as boolean;

    if (!hasCoat) {
      if (earned === 0) {
        // No interactions yet qualify even for tier 1 — shouldn't happen since we just incremented
        result.skipped = true;
        result.skipReason = "Earned tier is 0 — no mint needed";
        return result;
      }

      // First-time mint
      const { client, account } = getWalletClient();
      const txHash = await client.writeContract({
        address: TRUST_COAT_ADDRESS,
        abi: TRUST_COAT_ABI,
        functionName: "mint",
        args: [addr as `0x${string}`, BigInt(earned), BigInt(agentId)],
        account,
        chain,
      });

      result.previousTier = null;
      result.newTier = earned;
      result.advanced = true;
      result.txHash = txHash;

      console.log(`[TrustAdvancement] MINT @${addr} → tier ${earned} | tx: ${txHash}`);

    } else {
      // Existing coat — check if upgrade needed
      const currentTierBig = await publicClient.readContract({
        address: TRUST_COAT_ADDRESS,
        abi: TRUST_COAT_ABI,
        functionName: "activeTier",
        args: [addr as `0x${string}`],
      }) as bigint;

      const currentTier = Number(currentTierBig);
      result.previousTier = currentTier;

      if (earned <= currentTier) {
        result.newTier = currentTier;
        result.skipped = true;
        result.skipReason = `Already at tier ${currentTier}, earned=${earned}`;
        console.log(`[TrustAdvancement] ${type} @${addr} count=${count} — no upgrade needed (tier ${currentTier})`);
        return result;
      }

      // Tier 6+ requires DAO vote — cap auto-advancement at Tier 5
      if (earned > MAX_AUTO_TIER) {
        result.newTier = currentTier;
        result.skipped = true;
        result.skipReason = `Tier ${earned} exceeds auto-advancement cap (Tier ${MAX_AUTO_TIER}) — DAO vote required`;
        return result;
      }

      const { client, account } = getWalletClient();
      const txHash = await client.writeContract({
        address: TRUST_COAT_ADDRESS,
        abi: TRUST_COAT_ABI,
        functionName: "upgrade",
        args: [addr as `0x${string}`, BigInt(earned)],
        account,
        chain,
      });

      result.newTier = earned;
      result.advanced = true;
      result.txHash = txHash;

      console.log(`[TrustAdvancement] UPGRADE @${addr} ${currentTier}→${earned} | tx: ${txHash}`);
    }
  } catch (err: any) {
    result.error = err.message;
    console.error(`[TrustAdvancement] Error processing ${type} @${addr}:`, err.message);
  }

  return result;
}
