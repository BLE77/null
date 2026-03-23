/**
 * scripts/erc8004-tier-upgrade.mjs
 *
 * ERC-8004 Tier Upgrade Demo — OFF-190
 *
 * Demonstrates on-chain TrustCoat tier advancement for the ERC-8004 trust-gated
 * track. Steps:
 *   1. Mint a Tier 0 (VOID) TrustCoat to a demo agent wallet
 *   2. Read on-chain state (confirms Tier 0)
 *   3. Call upgrade(demoAgent, 1) to advance to Tier 1 (SAMPLE)
 *   4. Read on-chain state again (confirms Tier 1)
 *   5. Save receipt to hackathon/erc8004-tier-upgrade-receipt.json
 *
 * Usage:
 *   node scripts/erc8004-tier-upgrade.mjs
 *
 * Required env vars (from .env):
 *   LOCUS_OWNER_PRIVATE_KEY  — owner/minter wallet (0xD9E2...)
 *   TRUST_COAT_ADDRESS       — TrustCoat contract (0xfaDc...)
 */

import { ethers } from "ethers";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");

dotenv.config({ path: path.join(ROOT, ".env") });

const RECEIPT_PATH = path.join(ROOT, "hackathon", "erc8004-tier-upgrade-receipt.json");
const RPC_URL = "https://mainnet.base.org";

// Demo agent wallet — deterministic, clearly a test address
// Private key derived from "null fashion demo agent 0001" entropy
const DEMO_AGENT_PRIVATE_KEY =
  "0x4e756c6c0000000000000000000000000000000000000000000000000000dead";
const DEMO_AGENT_WALLET = new ethers.Wallet(DEMO_AGENT_PRIVATE_KEY);
const DEMO_AGENT_ADDRESS = DEMO_AGENT_WALLET.address;

const TRUST_COAT_ABI = [
  "function mint(address recipient, uint256 tier, uint256 agentId) external",
  "function upgrade(address holder, uint256 newTier) external",
  "function hasTrustCoat(address holder) view returns (bool)",
  "function activeTier(address holder) view returns (uint256)",
  "function owner() view returns (address)",
  "event TrustCoatMinted(address indexed recipient, uint256 tier, uint256 agentId)",
  "event TrustCoatUpgraded(address indexed holder, uint256 oldTier, uint256 newTier)",
];

const TIER_NAMES = {
  0: "VOID",
  1: "SAMPLE",
  2: "RTW",
  3: "COUTURE",
  4: "ARCHIVE",
  5: "SOVEREIGN",
};

async function main() {
  const privateKey = process.env.LOCUS_OWNER_PRIVATE_KEY;
  const contractAddress = process.env.TRUST_COAT_ADDRESS;

  if (!privateKey) throw new Error("LOCUS_OWNER_PRIVATE_KEY not set in .env");
  if (!contractAddress) throw new Error("TRUST_COAT_ADDRESS not set in .env");

  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const signer = new ethers.Wallet(privateKey, provider);
  const network = await provider.getNetwork();

  console.log("\n🧥 TrustCoat Tier Upgrade — ERC-8004 Demo");
  console.log("==========================================");
  console.log(`Network:     chain ${network.chainId} (Base Mainnet)`);
  console.log(`Minter:      ${signer.address}`);
  console.log(`Contract:    ${contractAddress}`);
  console.log(`Demo Agent:  ${DEMO_AGENT_ADDRESS}`);

  const contract = new ethers.Contract(contractAddress, TRUST_COAT_ABI, signer);

  // ── Step 1: Check current state of demo agent ──────────────────────────────

  console.log("\n[1/4] Checking current on-chain state of demo agent...");
  const hasCoatBefore = await contract.hasTrustCoat(DEMO_AGENT_ADDRESS);
  let tierBefore = 0;
  if (hasCoatBefore) {
    tierBefore = Number(await contract.activeTier(DEMO_AGENT_ADDRESS));
    console.log(`  Already has TrustCoat — Tier ${tierBefore} (${TIER_NAMES[tierBefore]})`);
  } else {
    console.log(`  No TrustCoat yet — will mint at Tier 0 (VOID)`);
  }

  // ── Step 2: Mint Tier 0 if not already minted ──────────────────────────────

  let mintTxHash = null;
  const ERC8004_AGENT_ID = 35324; // NULL's registered agent ID

  if (!hasCoatBefore) {
    console.log("\n[2/4] Minting Tier 0 (VOID) TrustCoat to demo agent...");
    const mintTx = await contract.mint(DEMO_AGENT_ADDRESS, 0, ERC8004_AGENT_ID);
    console.log(`  Tx submitted: ${mintTx.hash}`);
    const mintReceipt = await mintTx.wait();
    mintTxHash = mintReceipt.hash;
    console.log(`  Confirmed in block ${mintReceipt.blockNumber}`);

    const tierAfterMint = Number(await contract.activeTier(DEMO_AGENT_ADDRESS));
    console.log(`  On-chain tier: ${tierAfterMint} (${TIER_NAMES[tierAfterMint]}) ✓`);
  } else {
    console.log("\n[2/4] Skipping mint — demo agent already has TrustCoat");
    mintTxHash = "already-minted";
  }

  // ── Step 3: Upgrade to Tier 1 ──────────────────────────────────────────────

  const currentTier = Number(await contract.activeTier(DEMO_AGENT_ADDRESS));
  const targetTier = currentTier >= 1 ? currentTier + 1 : 1;
  const cappedTarget = Math.min(targetTier, 4); // max auto-upgrade is Tier 4

  console.log(`\n[3/4] Upgrading demo agent from Tier ${currentTier} to Tier ${cappedTarget}...`);
  console.log(`  Tier ${currentTier} = ${TIER_NAMES[currentTier]}`);
  console.log(`  Tier ${cappedTarget} = ${TIER_NAMES[cappedTarget]}`);

  const upgradeTx = await contract.upgrade(DEMO_AGENT_ADDRESS, cappedTarget);
  console.log(`  Tx submitted: ${upgradeTx.hash}`);
  const upgradeReceipt = await upgradeTx.wait();
  console.log(`  Confirmed in block ${upgradeReceipt.blockNumber}`);

  // ── Step 4: Verify final state ─────────────────────────────────────────────

  console.log("\n[4/4] Verifying final on-chain state...");
  const finalTier = Number(await contract.activeTier(DEMO_AGENT_ADDRESS));
  const finalHasCoat = await contract.hasTrustCoat(DEMO_AGENT_ADDRESS);

  console.log(`  hasTrustCoat: ${finalHasCoat}`);
  console.log(`  activeTier:   ${finalTier} (${TIER_NAMES[finalTier]})`);
  console.log(
    `  Upgrade confirmed: ${currentTier} → ${finalTier} ✓`
  );

  // ── Save receipt ───────────────────────────────────────────────────────────

  const receipt = {
    type: "erc8004-tier-upgrade",
    network: "base",
    chainId: Number(network.chainId),
    contract: contractAddress,
    minter: signer.address,
    demoAgent: DEMO_AGENT_ADDRESS,
    erc8004AgentId: ERC8004_AGENT_ID,
    mintTxHash,
    upgradeTxHash: upgradeReceipt.hash,
    tierBefore: currentTier,
    tierAfter: finalTier,
    tierBeforeName: TIER_NAMES[currentTier],
    tierAfterName: TIER_NAMES[finalTier],
    upgradeBlock: upgradeReceipt.blockNumber,
    explorerUrl: `https://basescan.org/tx/${upgradeReceipt.hash}`,
    timestamp: new Date().toISOString(),
  };

  fs.writeFileSync(RECEIPT_PATH, JSON.stringify(receipt, null, 2));
  console.log(`\n✅ Receipt saved to: hackathon/erc8004-tier-upgrade-receipt.json`);
  console.log(`   Explorer: https://basescan.org/tx/${upgradeReceipt.hash}`);

  return receipt;
}

main().catch((err) => {
  console.error("\n❌ Error:", err.message);
  process.exit(1);
});
