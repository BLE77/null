#!/usr/bin/env tsx
/**
 * setup-cdp-wallet.ts
 *
 * Creates (or loads) a Coinbase Developer Platform (CDP) Smart Wallet for
 * NULL agents. The wallet is MPC-managed — agents sign transactions via
 * the CDP API with no raw private key exposure.
 *
 * FIRST RUN: Creates a new wallet, prints the address, and writes seed data
 * to .env as CDP_WALLET_SEED (backup this value!).
 *
 * SUBSEQUENT RUNS: Loads the existing wallet from CDP_WALLET_ID + CDP_WALLET_SEED.
 *
 * Required env vars (set in .env):
 *   CDP_API_KEY_NAME        — from https://portal.cdp.coinbase.com
 *   CDP_API_KEY_PRIVATE_KEY — from https://portal.cdp.coinbase.com
 *
 * Optional (set after first run):
 *   CDP_WALLET_ID           — wallet ID (printed after first run)
 *   CDP_WALLET_SEED         — encrypted seed (printed after first run)
 *
 * Usage:
 *   npx tsx scripts/setup-cdp-wallet.ts
 */

import { Coinbase, Wallet } from "@coinbase/coinbase-sdk";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";

dotenv.config();

const { CDP_API_KEY_NAME, CDP_API_KEY_PRIVATE_KEY, CDP_WALLET_ID, CDP_WALLET_SEED } = process.env;

if (!CDP_API_KEY_NAME || !CDP_API_KEY_PRIVATE_KEY) {
  console.error(`
ERROR: CDP API credentials not set.

1. Go to https://portal.cdp.coinbase.com
2. Create a project and generate an API key
3. Add to your .env:

   CDP_API_KEY_NAME=your-api-key-name
   CDP_API_KEY_PRIVATE_KEY="-----BEGIN EC PRIVATE KEY-----\\n...\\n-----END EC PRIVATE KEY-----"
`);
  process.exit(1);
}

async function main() {
  // Configure the CDP SDK
  Coinbase.configure({
    apiKeyName: CDP_API_KEY_NAME!,
    privateKey: CDP_API_KEY_PRIVATE_KEY!.replace(/\\n/g, "\n"),
  });

  let wallet: Wallet;

  if (CDP_WALLET_ID && CDP_WALLET_SEED) {
    // Load existing wallet
    console.log("Loading existing CDP wallet...");
    const seed = JSON.parse(CDP_WALLET_SEED);
    wallet = await Wallet.fetch(CDP_WALLET_ID);
    await wallet.setSeed(seed.seed);
    console.log("✓ Wallet loaded");
  } else {
    // Create new wallet on Base Sepolia
    console.log("Creating new CDP wallet on Base Sepolia...");
    wallet = await Wallet.create({ networkId: Coinbase.networks.BaseSepolia });
    console.log("✓ Wallet created");

    // Export seed for backup
    const exported = await wallet.export();
    const walletId = wallet.getId();
    const seedJson = JSON.stringify(exported);

    console.log("\n╔══════════════════════════════════════════════════════════════╗");
    console.log("║  IMPORTANT: Save these values to your .env immediately!      ║");
    console.log("╚══════════════════════════════════════════════════════════════╝");
    console.log(`\nCDP_WALLET_ID=${walletId}`);
    console.log(`CDP_WALLET_SEED='${seedJson}'\n`);
    console.log("⚠  If you lose CDP_WALLET_SEED you will lose access to this wallet.");
  }

  const defaultAddress = await wallet.getDefaultAddress();
  const address = defaultAddress.getId();

  console.log("╔══════════════════════════════════════════════════════════════╗");
  console.log("║  NULL Agent Wallet (Base Sepolia)                       ║");
  console.log("╚══════════════════════════════════════════════════════════════╝");
  console.log(`\nWallet ID:   ${wallet.getId()}`);
  console.log(`Address:     ${address}`);
  console.log(`Network:     Base Sepolia (chain 84532)`);
  console.log(`\n💧 Fund this address with Base Sepolia ETH:`);
  console.log(`   https://www.coinbase.com/faucets/base-ethereum-sepolia`);
  console.log(`   (paste address: ${address})`);
  console.log(`\nBasescan:    https://sepolia.basescan.org/address/${address}`);

  // Check balance
  try {
    const balances = await wallet.listBalances();
    console.log(`\n📊 Current Balances:`);
    if (balances.size === 0) {
      console.log("   (empty — fund this wallet before deploying)");
    } else {
      balances.forEach((balance, asset) => {
        console.log(`   ${asset}: ${balance}`);
      });
    }
  } catch {
    console.log("\n   (balance check skipped)");
  }

  // Update .env.example hint file
  const envHintPath = path.join(__dirname, "..", "hackathon", "agent-wallet-address.txt");
  fs.mkdirSync(path.dirname(envHintPath), { recursive: true });
  fs.writeFileSync(envHintPath, `NULL Agent Wallet
Address: ${address}
Network: Base Sepolia (84532)
Wallet ID: ${wallet.getId()}
Generated: ${new Date().toISOString()}

Fund at: https://www.coinbase.com/faucets/base-ethereum-sepolia
Basescan: https://sepolia.basescan.org/address/${address}
`);
  console.log(`\n✓ Address saved to hackathon/agent-wallet-address.txt`);
  console.log("\nNext: Run 'npx tsx scripts/deploy-with-cdp.ts' to deploy TrustCoat.sol");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
