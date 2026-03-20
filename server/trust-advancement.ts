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

const TIER_THRESHOLDS = [
  { tier: 4, count: 50 },
  { tier: 3, count: 15 },
  { tier: 2, count: 5 },
  { tier: 1, count: 1 },
] as const;

export function tierFromCount(count: number): number {
  for (const { tier, count: threshold } of TIER_THRESHOLDS) {
    if (count >= threshold) return tier;
  }
  return 0;
}

// ─── In-memory interaction store ─────────────────────────────────────────────
// Key: lowercase wallet address → total interaction count
// Note: resets on server restart. Upgrade to DB for persistence.

const interactionCounts = new Map<string, number>();

export function getInteractionCount(walletAddress: string): number {
  return interactionCounts.get(walletAddress.toLowerCase()) ?? 0;
}

export function incrementInteractionCount(walletAddress: string): number {
  const key = walletAddress.toLowerCase();
  const next = (interactionCounts.get(key) ?? 0) + 1;
  interactionCounts.set(key, next);
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
  const count = incrementInteractionCount(addr);
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

      // Tier 5 is manual only
      if (earned >= 5) {
        result.newTier = currentTier;
        result.skipped = true;
        result.skipReason = "Tier 5 requires DAO vote — not auto-advanced";
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
