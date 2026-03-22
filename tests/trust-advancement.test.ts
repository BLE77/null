/**
 * tests/trust-advancement.test.ts
 *
 * Unit tests for TrustCoat tier boundary logic (OFF-182).
 * Uses Node.js built-in test runner — no extra dependencies.
 *
 * Run:
 *   npx tsx --test tests/trust-advancement.test.ts
 */

import { test } from "node:test";
import assert from "node:assert/strict";

// ─── Import pure logic only (no DB, no contract calls) ───────────────────────

import {
  tierFromState,
  tierFromCount,
  nextTierInfo,
  buildTierProgress,
  TIER_NAMES,
  TIER_THRESHOLDS,
  MAX_AUTO_TIER,
} from "../server/trust-advancement.js";

// ─── tierFromState — compound tier rules ─────────────────────────────────────

test("tierFromState: 0 interactions → Tier 0 (VOID)", () => {
  assert.equal(tierFromState(0, 0), 0);
});

// ── Tier 1: Observer (1+ interactions, no equip requirement) ─────────────────

test("tierFromState: 1 interaction, 0 equips → Tier 1 (Observer)", () => {
  assert.equal(tierFromState(1, 0), 1);
});

test("tierFromState: 4 interactions, 0 equips → Tier 1 (Observer)", () => {
  assert.equal(tierFromState(4, 0), 1);
});

// ── Tier 2: Participant (5+ interactions, no equip requirement) ───────────────

test("tierFromState: exactly 5 interactions, 0 equips → Tier 2 (Participant)", () => {
  assert.equal(tierFromState(5, 0), 2);
});

test("tierFromState: 14 interactions, 0 equips → Tier 2 (Participant)", () => {
  assert.equal(tierFromState(14, 0), 2);
});

test("tierFromState: 14 interactions, 5 equips → Tier 2 (not Tier 3 — needs 15 interactions)", () => {
  // 14 interactions is below the Tier 3 threshold of 15
  assert.equal(tierFromState(14, 5), 2);
});

// ── Tier 3: Collaborator (15+ interactions + 1+ equip) ───────────────────────

test("tierFromState: 15 interactions, 0 equips → Tier 2 (missing equip requirement for Tier 3)", () => {
  // Has 15+ interactions but no equips — can't reach Tier 3
  assert.equal(tierFromState(15, 0), 2);
});

test("tierFromState: 15 interactions, 1 equip → Tier 3 (Collaborator)", () => {
  assert.equal(tierFromState(15, 1), 3);
});

test("tierFromState: 15 interactions, 5 equips → Tier 3 (Collaborator)", () => {
  assert.equal(tierFromState(15, 5), 3);
});

test("tierFromState: 49 interactions, 2 equips → Tier 3 (Collaborator — not Tier 4, missing equips)", () => {
  assert.equal(tierFromState(49, 2), 3);
});

test("tierFromState: 49 interactions, 3 equips → Tier 3 (Collaborator — not Tier 4, missing interactions)", () => {
  // 49 interactions < 50 threshold for Tier 4
  assert.equal(tierFromState(49, 3), 3);
});

// ── Tier 4: Trusted (50+ interactions + 3+ equips) ───────────────────────────

test("tierFromState: 50 interactions, 3 equips → Tier 4 (Trusted)", () => {
  assert.equal(tierFromState(50, 3), 4);
});

test("tierFromState: 50 interactions, 2 equips → Tier 3 (Collaborator — missing equips for Tier 4)", () => {
  assert.equal(tierFromState(50, 2), 3);
});

test("tierFromState: 49 interactions, 4 equips → Tier 3 (Collaborator — missing interactions for Tier 4)", () => {
  assert.equal(tierFromState(49, 4), 3);
});

test("tierFromState: 100 interactions, 10 equips → Tier 4 (Trusted)", () => {
  assert.equal(tierFromState(100, 10), 4);
});

// ── Tier 5: Sovereign (NOT auto-progressive) ─────────────────────────────────

test("MAX_AUTO_TIER is 4 — Tier 5 requires DAO vote", () => {
  assert.equal(MAX_AUTO_TIER, 4);
});

test("tierFromState never returns 5 (Sovereign requires DAO)", () => {
  // Even with massive interactions and equips, tier computation caps at 4
  assert.ok(tierFromState(1000, 100) <= MAX_AUTO_TIER);
});

// ─── tierFromCount — legacy alias (no compound check) ────────────────────────

test("tierFromCount: 0 → 0", () => assert.equal(tierFromCount(0), 0));
test("tierFromCount: 1 → 1", () => assert.equal(tierFromCount(1), 1));
test("tierFromCount: 5 → 2", () => assert.equal(tierFromCount(5), 2));

test("tierFromCount: 15 interactions, no equip context → Tier 2 (not Tier 3)", () => {
  // tierFromCount uses equips=0, so Tier 3 compound rule fails
  assert.equal(tierFromCount(15), 2);
});

// ─── nextTierInfo ─────────────────────────────────────────────────────────────

test("nextTierInfo: 0 interactions, 0 equips → next is Tier 1 at threshold 1", () => {
  const next = nextTierInfo(0, 0);
  assert.ok(next !== null);
  assert.equal(next!.nextTier, 1);
  assert.equal(next!.threshold, 1);
  assert.equal(next!.equipsRequired, 0);
});

test("nextTierInfo: 1 interaction, 0 equips → next is Tier 2 at threshold 5", () => {
  const next = nextTierInfo(1, 0);
  assert.ok(next !== null);
  assert.equal(next!.nextTier, 2);
  assert.equal(next!.threshold, 5);
});

test("nextTierInfo: 5 interactions, 0 equips → next is Tier 3 at threshold 15, requires 1 equip", () => {
  const next = nextTierInfo(5, 0);
  assert.ok(next !== null);
  assert.equal(next!.nextTier, 3);
  assert.equal(next!.threshold, 15);
  assert.equal(next!.equipsRequired, 1);
});

test("nextTierInfo: 15 interactions, 1 equip → next is Tier 4 at threshold 50, requires 3 equips", () => {
  const next = nextTierInfo(15, 1);
  assert.ok(next !== null);
  assert.equal(next!.nextTier, 4);
  assert.equal(next!.threshold, 50);
  assert.equal(next!.equipsRequired, 3);
});

test("nextTierInfo: 50 interactions, 3 equips → null (at MAX_AUTO_TIER)", () => {
  const next = nextTierInfo(50, 3);
  assert.equal(next, null);
});

test("nextTierInfo: 15 interactions, 0 equips → next is Tier 3 (interaction ok, equip blocking)", () => {
  // 15 interactions passes count threshold for Tier 3, but 0 equips fails compound check
  // So next tier is still Tier 3 with equip requirement
  const next = nextTierInfo(15, 0);
  assert.ok(next !== null);
  assert.equal(next!.nextTier, 3);
  assert.equal(next!.equipsRequired, 1);
});

// ─── buildTierProgress ────────────────────────────────────────────────────────

test("buildTierProgress: new wallet (0 interactions) is at tier 0, progress 0%", () => {
  const p = buildTierProgress("0x1234567890123456789012345678901234567890", 0, 0, 0);
  assert.equal(p.currentTier, 0);
  assert.equal(p.eligibleTier, 0);
  assert.equal(p.interactions, 0);
  assert.equal(p.equipCount, 0);
  assert.equal(p.isAtMax, false);
  assert.equal(p.nextTier, 1);
});

test("buildTierProgress: wallet with 1 interaction is eligible for Tier 1", () => {
  const p = buildTierProgress("0x1234567890123456789012345678901234567890", 1, 0, 0);
  assert.equal(p.eligibleTier, 1);
  assert.equal(p.currentTier, 0); // on-chain hasn't advanced yet
  assert.equal(p.nextTier, 2);
  assert.equal(p.nextThreshold, 5);
  assert.equal(p.nextEquipsRequired, 0);
});

test("buildTierProgress: 15 interactions + 1 equip → eligible for Tier 3", () => {
  const p = buildTierProgress("0x1234567890123456789012345678901234567890", 15, 0, 1);
  assert.equal(p.eligibleTier, 3);
  assert.equal(p.nextTier, 4);
  assert.equal(p.nextThreshold, 50);
  assert.equal(p.nextEquipsRequired, 3);
});

test("buildTierProgress: 50 interactions + 3 equips → isAtMax", () => {
  const p = buildTierProgress("0x1234567890123456789012345678901234567890", 50, 4, 3);
  assert.equal(p.eligibleTier, 4);
  assert.equal(p.currentTier, 4);
  assert.equal(p.isAtMax, true);
  assert.equal(p.nextTier, null);
});

test("buildTierProgress: walletAddress is lowercased", () => {
  const p = buildTierProgress("0xABCDEF1234567890ABCDEF1234567890ABCDEF12", 0, 0, 0);
  assert.equal(p.walletAddress, "0xabcdef1234567890abcdef1234567890abcdef12");
});

test("buildTierProgress: on-chain tier respected even if eligible is lower", () => {
  // Edge case: on-chain tier is higher than what we'd compute locally
  const p = buildTierProgress("0x1234567890123456789012345678901234567890", 3, 3, 0);
  assert.equal(p.currentTier, 3); // respects on-chain state
  assert.equal(p.eligibleTier, 1); // locally only 3 interactions = tier 1
});

// ─── TIER_NAMES ───────────────────────────────────────────────────────────────

test("TIER_NAMES covers all tiers 0-5", () => {
  for (let t = 0; t <= 5; t++) {
    assert.ok(TIER_NAMES[t], `TIER_NAMES[${t}] should be defined`);
  }
});

// ─── TIER_THRESHOLDS shape ────────────────────────────────────────────────────

test("TIER_THRESHOLDS has compound equip requirements for Tier 3 and 4", () => {
  const tier3 = TIER_THRESHOLDS.find(t => t.tier === 3);
  const tier4 = TIER_THRESHOLDS.find(t => t.tier === 4);
  assert.ok(tier3, "Tier 3 threshold exists");
  assert.ok(tier4, "Tier 4 threshold exists");
  assert.ok(tier3!.equips >= 1, "Tier 3 requires equips >= 1");
  assert.ok(tier4!.equips >= 3, "Tier 4 requires equips >= 3");
});

test("TIER_THRESHOLDS Tier 3 needs 15 interactions, Tier 4 needs 50", () => {
  const tier3 = TIER_THRESHOLDS.find(t => t.tier === 3);
  const tier4 = TIER_THRESHOLDS.find(t => t.tier === 4);
  assert.equal(tier3!.count, 15);
  assert.equal(tier4!.count, 50);
});
