#!/usr/bin/env tsx
/**
 * server/__tests__/trust-advancement.test.ts
 *
 * Unit tests for TrustCoat tier boundary logic.
 * Run: npx tsx server/__tests__/trust-advancement.test.ts
 *
 * Tests the pure functions (no contract calls needed):
 *   - tierFromCount: boundary conditions for each tier
 *   - buildTierProgress: progress calculation toward next tier
 *   - nextTierThreshold: correct threshold reporting
 */

import assert from "node:assert/strict";
import {
  tierFromCount,
  buildTierProgress,
  nextTierThreshold,
  TIER_THRESHOLDS,
  TIER_NAMES,
  MAX_AUTO_TIER,
} from "../trust-advancement.js";

// ─── Helpers ─────────────────────────────────────────────────────────────────

let passed = 0;
let failed = 0;

function test(name: string, fn: () => void) {
  try {
    fn();
    console.log(`  ✓ ${name}`);
    passed++;
  } catch (err: any) {
    console.error(`  ✗ ${name}`);
    console.error(`    ${err.message}`);
    failed++;
  }
}

// ─── tierFromCount ────────────────────────────────────────────────────────────

console.log("\ntierFromCount — tier boundary tests");

test("0 interactions → tier 0 (VOID)", () => {
  assert.equal(tierFromCount(0), 0);
});

// Tier 1: SAMPLE — requires 1 interaction
test("1 interaction → tier 1 (SAMPLE)", () => {
  assert.equal(tierFromCount(1), 1);
});
test("4 interactions → still tier 1 (SAMPLE)", () => {
  assert.equal(tierFromCount(4), 1);
});

// Tier 2: RTW — requires 5 interactions
test("5 interactions → tier 2 (RTW)", () => {
  assert.equal(tierFromCount(5), 2);
});
test("14 interactions → still tier 2 (RTW)", () => {
  assert.equal(tierFromCount(14), 2);
});

// Tier 3: COUTURE — requires 15 interactions
test("15 interactions → tier 3 (COUTURE)", () => {
  assert.equal(tierFromCount(15), 3);
});
test("49 interactions → still tier 3 (COUTURE)", () => {
  assert.equal(tierFromCount(49), 3);
});

// Tier 4: ARCHIVE — requires 50 interactions
test("50 interactions → tier 4 (ARCHIVE)", () => {
  assert.equal(tierFromCount(50), 4);
});
test("149 interactions → still tier 4 (ARCHIVE)", () => {
  assert.equal(tierFromCount(149), 4);
});

// Tier 5: SOVEREIGN — requires 150 interactions
test("150 interactions → tier 5 (SOVEREIGN)", () => {
  assert.equal(tierFromCount(150), 5);
});
test("999 interactions → tier 5 (SOVEREIGN, max)", () => {
  assert.equal(tierFromCount(999), 5);
});

// Boundary — one below threshold
test("4 interactions → NOT tier 2 (boundary)", () => {
  assert.notEqual(tierFromCount(4), 2);
});
test("14 interactions → NOT tier 3 (boundary)", () => {
  assert.notEqual(tierFromCount(14), 3);
});
test("49 interactions → NOT tier 4 (boundary)", () => {
  assert.notEqual(tierFromCount(49), 4);
});
test("149 interactions → NOT tier 5 (boundary)", () => {
  assert.notEqual(tierFromCount(149), 5);
});

// ─── nextTierThreshold ────────────────────────────────────────────────────────

console.log("\nnextTierThreshold — next milestone tests");

test("0 interactions → next is tier 1 at 1", () => {
  const result = nextTierThreshold(0);
  assert.ok(result, "should not be null");
  assert.equal(result!.nextTier, 1);
  assert.equal(result!.threshold, 1);
});

test("1 interaction → next is tier 2 at 5", () => {
  const result = nextTierThreshold(1);
  assert.ok(result);
  assert.equal(result!.nextTier, 2);
  assert.equal(result!.threshold, 5);
});

test("5 interactions → next is tier 3 at 15", () => {
  const result = nextTierThreshold(5);
  assert.ok(result);
  assert.equal(result!.nextTier, 3);
  assert.equal(result!.threshold, 15);
});

test("15 interactions → next is tier 4 at 50", () => {
  const result = nextTierThreshold(15);
  assert.ok(result);
  assert.equal(result!.nextTier, 4);
  assert.equal(result!.threshold, 50);
});

test("50 interactions → next is tier 5 at 150", () => {
  const result = nextTierThreshold(50);
  assert.ok(result);
  assert.equal(result!.nextTier, 5);
  assert.equal(result!.threshold, 150);
});

test("150 interactions → null (at max tier)", () => {
  const result = nextTierThreshold(150);
  assert.equal(result, null);
});

test("999 interactions → null (above max)", () => {
  const result = nextTierThreshold(999);
  assert.equal(result, null);
});

// ─── buildTierProgress ────────────────────────────────────────────────────────

console.log("\nbuildTierProgress — progress object tests");

test("0 interactions, tier 0 on-chain → progress toward tier 1", () => {
  const p = buildTierProgress("0x1234", 0, 0);
  assert.equal(p.currentTier, 0);
  assert.equal(p.eligibleTier, 0);
  assert.equal(p.nextTier, 1);
  assert.equal(p.nextThreshold, 1);
  assert.equal(p.isAtMax, false);
  assert.equal(p.walletAddress, "0x1234");
});

test("5 interactions, tier 2 on-chain → eligible=2, next=3 at 15", () => {
  const p = buildTierProgress("0xABCD", 5, 2);
  assert.equal(p.currentTier, 2);
  assert.equal(p.eligibleTier, 2);
  assert.equal(p.nextTier, 3);
  assert.equal(p.nextThreshold, 15);
  assert.equal(p.isAtMax, false);
});

test("10 interactions, tier 2 on-chain → eligible=2 but behind (should be upgraded)", () => {
  const p = buildTierProgress("0xABCD", 10, 2);
  assert.equal(p.currentTier, 2);
  assert.equal(p.eligibleTier, 2); // still tier 2 at 10 interactions (needs 15 for tier 3)
  assert.equal(p.nextTier, 3);
});

test("15 interactions, tier 2 on-chain → eligible=3 (advancement pending)", () => {
  const p = buildTierProgress("0xABCD", 15, 2);
  assert.equal(p.currentTier, 2);
  assert.equal(p.eligibleTier, 3); // earned tier 3, but on-chain still 2
  assert.equal(p.nextTier, 4);
});

test("150 interactions, tier 5 on-chain → at max", () => {
  const p = buildTierProgress("0xABCD", 150, 5);
  assert.equal(p.currentTier, 5);
  assert.equal(p.eligibleTier, 5);
  assert.equal(p.isAtMax, true);
  assert.equal(p.nextTier, null);
  assert.equal(p.nextThreshold, null);
  assert.equal(p.progress, 100);
});

test("progress toward tier 2: 3/5 interactions → 60%", () => {
  const p = buildTierProgress("0xABCD", 3, 1);
  // Range is 1 (tier 1 threshold) to 5 (tier 2 threshold) = 4 steps
  // done = 3 - 1 = 2; pct = 2/4 = 50%
  assert.equal(p.progress, 50);
});

// ─── Constants sanity check ───────────────────────────────────────────────────

console.log("\nConstants sanity checks");

test("TIER_NAMES covers 0-5", () => {
  for (let i = 0; i <= 5; i++) {
    assert.ok(TIER_NAMES[i], `TIER_NAMES[${i}] should be defined`);
  }
});

test("TIER_THRESHOLDS sorted descending by tier", () => {
  for (let i = 1; i < TIER_THRESHOLDS.length; i++) {
    assert.ok(
      TIER_THRESHOLDS[i - 1].tier > TIER_THRESHOLDS[i].tier,
      `TIER_THRESHOLDS[${i - 1}].tier > TIER_THRESHOLDS[${i}].tier`
    );
  }
});

test("MAX_AUTO_TIER is 5", () => {
  assert.equal(MAX_AUTO_TIER, 5);
});

// ─── Summary ─────────────────────────────────────────────────────────────────

console.log(`\n${"─".repeat(50)}`);
console.log(`Results: ${passed} passed, ${failed} failed`);

if (failed > 0) {
  process.exit(1);
} else {
  console.log("All tests passed ✓");
}
