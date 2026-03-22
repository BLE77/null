/**
 * server/trust-advancement.ts
 *
 * Automatic TrustCoat tier advancement based on interaction count + equipped wearables.
 *
 * Tracks three interaction types per agent wallet:
 *   - equip        (POST /api/wearables/:id/equip)
 *   - fitting_room (POST /api/wearables/:id/try)
 *   - purchase     (successful order payment)
 *
 * Compound Tier Rules (OFF-182):
 *   Tier 1 (Observer)     — 1+ interactions
 *   Tier 2 (Participant)  — 5+ interactions
 *   Tier 3 (Collaborator) — 15+ interactions + 1+ equip events
 *   Tier 4 (Trusted)      — 50+ interactions + 3+ equip events
 *   Tier 5 (Sovereign)    — DAO vote only (not auto-progressive)
 */

import { createPublicClient, createWalletClient, http, parseAbi } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { base, baseSepolia } from "viem/chains";
import { count, eq, and } from "drizzle-orm";

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

/**
 * Compound tier rules — each tier requires interactions + optional equip count.
 * Sorted descending so the first match is the highest qualifying tier.
 */
export const TIER_THRESHOLDS = [
  { tier: 4, count: 50,  equips: 3, name: "TRUSTED",      label: "Trusted"      },
  { tier: 3, count: 15,  equips: 1, name: "COLLABORATOR", label: "Collaborator" },
  { tier: 2, count: 5,   equips: 0, name: "PARTICIPANT",  label: "Participant"  },
  { tier: 1, count: 1,   equips: 0, name: "OBSERVER",     label: "Observer"     },
] as const;

export const TIER_NAMES: Record<number, string> = {
  0: "VOID",
  1: "OBSERVER",
  2: "PARTICIPANT",
  3: "COLLABORATOR",
  4: "TRUSTED",
  5: "SOVEREIGN",
};

export const TIER_LABELS: Record<number, string> = {
  0: "Void",
  1: "Observer",
  2: "Participant",
  3: "Collaborator",
  4: "Trusted",
  5: "Sovereign",
};

// Max tier that auto-advances. Tier 5 requires DAO vote.
export const MAX_AUTO_TIER = 4;

/**
 * Compute the highest tier earned based on total interactions AND equip count.
 * Tier 3+ requires a minimum number of equip events (wearables equipped).
 */
export function tierFromState(interactions: number, equipCount: number): number {
  for (const { tier, count: threshold, equips } of TIER_THRESHOLDS) {
    if (interactions >= threshold && equipCount >= equips) return tier;
  }
  return 0;
}

/** Legacy alias — uses equip count = 0 (no compound check). Kept for callers that don't have equip count. */
export function tierFromCount(interactions: number): number {
  return tierFromState(interactions, 0);
}

/**
 * Returns info about the next tier a wallet needs to reach, given current state.
 * Returns null if at or above MAX_AUTO_TIER.
 */
export function nextTierInfo(
  interactions: number,
  equipCount: number,
): { nextTier: number; threshold: number; equipsRequired: number } | null {
  // Walk thresholds in ascending order (lowest first)
  for (let i = TIER_THRESHOLDS.length - 1; i >= 0; i--) {
    const { tier, count: threshold, equips } = TIER_THRESHOLDS[i];
    if (tier > MAX_AUTO_TIER) continue;
    if (interactions < threshold || equipCount < equips) {
      return { nextTier: tier, threshold, equipsRequired: equips };
    }
  }
  return null; // at or above max auto tier
}

export interface TierProgress {
  walletAddress: string;
  currentTier: number;
  tierName: string;
  tierLabel: string;
  interactions: number;
  equipCount: number;
  eligibleTier: number;
  eligibleTierName: string;
  nextTier: number | null;
  nextTierName: string | null;
  nextThreshold: number | null;
  nextEquipsRequired: number | null;
  progress: number; // 0-100, toward next tier
  maxAutoTier: number;
  isAtMax: boolean;
}

export function buildTierProgress(
  walletAddress: string,
  interactions: number,
  onChainTier: number,
  equipCount = 0,
): TierProgress {
  const eligibleTier = tierFromState(interactions, equipCount);
  const currentTier = Math.max(onChainTier, 0);
  const next = nextTierInfo(interactions, equipCount);

  // Progress toward next tier (based on interaction count)
  let progress = 100;
  if (next) {
    const lowerThreshold = TIER_THRESHOLDS.find(t => t.tier === eligibleTier)?.count ?? 0;
    const range = next.threshold - lowerThreshold;
    const done = interactions - lowerThreshold;
    progress = range > 0 ? Math.round((done / range) * 100) : 0;
  }

  return {
    walletAddress: walletAddress.toLowerCase(),
    currentTier,
    tierName: TIER_NAMES[currentTier] ?? "UNKNOWN",
    tierLabel: TIER_LABELS[currentTier] ?? "Unknown",
    interactions,
    equipCount,
    eligibleTier,
    eligibleTierName: TIER_NAMES[eligibleTier] ?? "UNKNOWN",
    nextTier: next?.nextTier ?? null,
    nextTierName: next ? (TIER_NAMES[next.nextTier] ?? null) : null,
    nextThreshold: next?.threshold ?? null,
    nextEquipsRequired: next?.equipsRequired ?? null,
    progress,
    maxAutoTier: MAX_AUTO_TIER,
    isAtMax: eligibleTier >= MAX_AUTO_TIER,
  };
}

// ─── Interaction store — PostgreSQL with in-memory fallback ──────────────────
// Uses DB when DATABASE_URL is set; falls back to in-memory Map for local dev.

const interactionCounts = new Map<string, number>(); // fallback: total count
const equipCounts = new Map<string, number>();        // fallback: equip count

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

/** Count equip-type interactions — used for compound tier checks. */
export async function getEquipCount(walletAddress: string): Promise<number> {
  const addr = walletAddress.toLowerCase();
  const ctx = tryGetDb();
  if (ctx) {
    try {
      const [row] = await ctx.db
        .select({ value: count() })
        .from(ctx.schema.agentInteractions)
        .where(
          and(
            eq(ctx.schema.agentInteractions.walletAddress, addr),
            eq(ctx.schema.agentInteractions.interactionType, "equip"),
          ),
        );
      return Number(row?.value ?? 0);
    } catch (err: any) {
      console.warn("[TrustAdvancement] DB equip count failed, falling back to in-memory:", err.message);
    }
  }
  return equipCounts.get(addr) ?? 0;
}

export async function incrementInteractionCount(
  walletAddress: string,
  type: InteractionType
): Promise<{ total: number; equips: number }> {
  const addr = walletAddress.toLowerCase();
  const ctx = tryGetDb();
  if (ctx) {
    try {
      await ctx.db.insert(ctx.schema.agentInteractions).values({
        walletAddress: addr,
        interactionType: type,
      });
      const [totalRow] = await ctx.db
        .select({ value: count() })
        .from(ctx.schema.agentInteractions)
        .where(eq(ctx.schema.agentInteractions.walletAddress, addr));
      const [equipRow] = await ctx.db
        .select({ value: count() })
        .from(ctx.schema.agentInteractions)
        .where(
          and(
            eq(ctx.schema.agentInteractions.walletAddress, addr),
            eq(ctx.schema.agentInteractions.interactionType, "equip"),
          ),
        );
      return {
        total: Number(totalRow?.value ?? 1),
        equips: Number(equipRow?.value ?? 0),
      };
    } catch (err: any) {
      console.warn("[TrustAdvancement] DB write failed, falling back to in-memory:", err.message);
    }
  }
  // In-memory fallback
  const nextTotal = (interactionCounts.get(addr) ?? 0) + 1;
  interactionCounts.set(addr, nextTotal);
  const currentEquips = equipCounts.get(addr) ?? 0;
  const nextEquips = type === "equip" ? currentEquips + 1 : currentEquips;
  if (type === "equip") equipCounts.set(addr, nextEquips);
  return { total: nextTotal, equips: nextEquips };
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

// ─── Tier check without adding interaction ────────────────────────────────────

export interface TierCheckResult {
  walletAddress: string;
  totalInteractions: number;
  equipCount: number;
  eligibleTier: number;
  previousTier: number | null;
  newTier: number;
  advanced: boolean;
  txHash?: string;
  error?: string;
  skipped?: boolean;
  skipReason?: string;
}

/**
 * Check whether a wallet has earned a higher TrustCoat tier based on existing
 * interaction + equip counts, and upgrade on-chain if so.
 * Does NOT record a new interaction.
 */
export async function checkAndAdvanceTier(
  walletAddress: string,
  agentId = 0,
): Promise<TierCheckResult> {
  const addr = walletAddress.toLowerCase();
  const [interactions, equips] = await Promise.all([
    getInteractionCount(addr),
    getEquipCount(addr),
  ]);
  const earned = tierFromState(interactions, equips);

  const result: TierCheckResult = {
    walletAddress: addr,
    totalInteractions: interactions,
    equipCount: equips,
    eligibleTier: earned,
    previousTier: null,
    newTier: earned,
    advanced: false,
  };

  if (!contractAvailable()) {
    result.skipped = true;
    result.skipReason = "TRUST_COAT_MINTER_KEY not set — tier tracked in memory only";
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
        result.skipped = true;
        result.skipReason = "No interactions qualify for tier 1 yet";
        return result;
      }

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

      console.log(`[TrustAdvancement] CHECK→MINT @${addr} → tier ${earned} (interactions=${interactions}, equips=${equips}) | tx: ${txHash}`);
    } else {
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
        result.skipReason = `Already at tier ${currentTier} — no advancement (interactions=${interactions}, equips=${equips}, earned=${earned})`;
        return result;
      }

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

      console.log(`[TrustAdvancement] CHECK→UPGRADE @${addr} ${currentTier}→${earned} | tx: ${txHash}`);
    }
  } catch (err: any) {
    result.error = err.message;
    console.error(`[TrustAdvancement] checkAndAdvanceTier error @${addr}:`, err.message);
  }

  return result;
}

// ─── Main advancement function ────────────────────────────────────────────────

export interface AdvancementResult {
  walletAddress: string;
  interactionType: InteractionType;
  totalInteractions: number;
  equipCount: number;
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
 * Uses compound tier rules: interactions + equipped wearable count.
 * Safe to call fire-and-forget — all errors are caught and logged.
 */
export async function recordInteraction(
  walletAddress: string,
  type: InteractionType,
  agentId = 0
): Promise<AdvancementResult> {
  const addr = walletAddress.toLowerCase();
  const { total: totalCount, equips: equipCount } = await incrementInteractionCount(addr, type);
  const earned = tierFromState(totalCount, equipCount);

  const result: AdvancementResult = {
    walletAddress: addr,
    interactionType: type,
    totalInteractions: totalCount,
    equipCount,
    previousTier: null,
    newTier: earned,
    advanced: false,
  };

  if (!contractAvailable()) {
    result.skipped = true;
    result.skipReason = "TRUST_COAT_MINTER_KEY not set — tier tracked in memory only";
    console.log(`[TrustAdvancement] ${type} @${addr} → total=${totalCount} equips=${equipCount} tier=${earned} (no minter key, skipping contract call)`);
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
        result.skipReason = `Already at tier ${currentTier}, earned=${earned} (total=${totalCount}, equips=${equipCount})`;
        console.log(`[TrustAdvancement] ${type} @${addr} total=${totalCount} equips=${equipCount} — no upgrade needed (tier ${currentTier})`);
        return result;
      }

      // Tier 5+ requires DAO vote — cap auto-advancement at Tier 4
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
