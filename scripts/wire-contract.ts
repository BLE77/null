#!/usr/bin/env tsx
/**
 * wire-contract.ts
 *
 * Post-deployment finalization script (OFF-50).
 * Run this immediately after TrustCoat.sol is deployed to Base Sepolia.
 *
 * What it does:
 *   1. Reads hackathon/deployed-addresses.json for the contract address
 *   2. Validates the deployed contract is live on-chain
 *   3. Reads the contract owner + checks config
 *   4. Prints .env lines to copy-paste (TRUST_COAT_ADDRESS + TRUST_COAT_MINTER_KEY)
 *   5. Optionally grants minter role via CDP wallet (if CDP env vars set)
 *   6. Smoke-tests the wearables API if server is running locally
 *
 * Usage:
 *   npx tsx scripts/wire-contract.ts
 *
 *   # Or pass address directly (skips reading from deployed-addresses.json):
 *   TRUST_COAT_ADDRESS=0x... npx tsx scripts/wire-contract.ts
 */

import { createPublicClient, http, isAddress, parseAbi } from "viem";
import { baseSepolia } from "viem/chains";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";

dotenv.config();

const TRUST_COAT_ABI = parseAbi([
  "function owner() view returns (address)",
  "function activeTier(address holder) view returns (uint256)",
  "function hasTrustCoat(address holder) view returns (bool)",
  "function isMinter(address account) view returns (bool)",
]);

const addressesPath = path.join(__dirname, "..", "hackathon", "deployed-addresses.json");

async function main() {
  console.log("\n🔧 Off-Human — Post-Deployment Contract Wiring\n");

  // ─── Step 1: Resolve contract address ───────────────────────────────────────
  let contractAddress: string | null = process.env.TRUST_COAT_ADDRESS ?? null;

  if (!contractAddress || !contractAddress.startsWith("0x")) {
    // Try reading from deployed-addresses.json
    if (fs.existsSync(addressesPath)) {
      const data = JSON.parse(fs.readFileSync(addressesPath, "utf8"));
      contractAddress = data?.TrustCoat?.address ?? null;
    }
  }

  if (!contractAddress || !isAddress(contractAddress)) {
    console.error("❌ No valid contract address found.\n");
    console.error("Options:");
    console.error("  1. Set TRUST_COAT_ADDRESS=0x... in .env, or");
    console.error("  2. Run deployment first: npx tsx scripts/deploy-with-cdp.ts\n");
    process.exit(1);
  }

  console.log(`Contract address: ${contractAddress}`);

  // ─── Step 2: Validate on-chain ──────────────────────────────────────────────
  console.log("Checking on-chain...");
  const client = createPublicClient({
    chain: baseSepolia,
    transport: http(process.env.BASE_SEPOLIA_RPC ?? "https://sepolia.base.org"),
  });

  const bytecode = await client.getBytecode({ address: contractAddress as `0x${string}` });
  if (!bytecode || bytecode === "0x") {
    console.error("❌ No bytecode at that address on Base Sepolia.");
    console.error("   Make sure the contract was deployed and the address is correct.");
    process.exit(1);
  }
  console.log(`✅ Contract live on Base Sepolia (${bytecode.length / 2 - 1} bytes)`);

  // ─── Step 3: Read contract state ────────────────────────────────────────────
  let owner: string = "unknown";
  try {
    owner = await client.readContract({
      address: contractAddress as `0x${string}`,
      abi: TRUST_COAT_ABI,
      functionName: "owner",
    }) as string;
    console.log(`✅ Contract owner: ${owner}`);
  } catch {
    console.warn("⚠  Could not read owner (ABI mismatch?)");
  }

  // ─── Step 4: Update deployed-addresses.json ─────────────────────────────────
  const existing = fs.existsSync(addressesPath)
    ? JSON.parse(fs.readFileSync(addressesPath, "utf8"))
    : {};

  if (!existing.TrustCoat?.address) {
    // Fill in address from env if not already in the file
    const network = await client.getChainId();
    existing.TrustCoat = {
      address: contractAddress,
      network: "base-sepolia",
      chainId: network,
      deployTx: null,
      deployer: owner,
      deployedAt: new Date().toISOString(),
      basescanUrl: `https://sepolia.basescan.org/address/${contractAddress}`,
      deployedVia: "manual or CDP",
    };
    delete existing._status;
    fs.writeFileSync(addressesPath, JSON.stringify(existing, null, 2));
    console.log("✅ hackathon/deployed-addresses.json updated");
  } else {
    console.log("✅ hackathon/deployed-addresses.json already has contract entry");
  }

  // ─── Step 5: Print .env instructions ────────────────────────────────────────
  console.log("\n╔══════════════════════════════════════════════════════════════╗");
  console.log("║  Add these to your .env (and Vercel project settings):       ║");
  console.log("╚══════════════════════════════════════════════════════════════╝");
  console.log(`\nTRUST_COAT_ADDRESS=${contractAddress}`);
  console.log("TRUST_COAT_MINTER_KEY=<your-backend-wallet-private-key>\n");

  // ─── Step 6: Smoke-test wearables API (if server is running) ─────────────────
  const LOCAL_URL = "http://localhost:5000";
  console.log(`Attempting smoke-test against ${LOCAL_URL}/api/wearables/tiers ...`);
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000);
    const res = await fetch(`${LOCAL_URL}/api/wearables/tiers`, { signal: controller.signal });
    clearTimeout(timeout);
    const json = await res.json();
    if (json.contract === contractAddress) {
      console.log("✅ Wearables API: contract address matches");
    } else if (json.contract === null) {
      console.warn("⚠  Wearables API: contract address not set in running server");
      console.warn("   Restart the server after setting TRUST_COAT_ADDRESS in .env");
    } else {
      console.warn(`⚠  Wearables API: unexpected contract address: ${json.contract}`);
    }
  } catch {
    console.log("ℹ  Server not running locally — skipping API smoke-test");
    console.log("   To test: npm run dev, then GET /api/wearables/tiers");
  }

  // ─── Step 7: Grant minter role instructions ──────────────────────────────────
  console.log("\n📋 Final steps:");
  console.log(`  1. Set TRUST_COAT_ADDRESS=${contractAddress} in Vercel project`);
  console.log("  2. Set TRUST_COAT_MINTER_KEY=<backend-wallet-key> in Vercel project");
  console.log("  3. Grant minter role (run in hardhat console or cast):");
  console.log(`     await trustCoat.setMinter("<BACKEND_WALLET_ADDRESS>", true)`);
  console.log(`     cast send ${contractAddress} "setMinter(address,bool)" <WALLET> true \\`);
  console.log(`       --rpc-url https://sepolia.base.org --private-key $DEPLOYER_PRIVATE_KEY`);
  console.log("\n  4. Verify deployment in submission doc:");
  console.log(`     https://sepolia.basescan.org/address/${contractAddress}`);
  console.log(`     https://sepolia.basescan.org/address/${contractAddress}#code`);

  console.log("\n✅ Wiring complete. Share the contract address with @Gazette for submission doc.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
