/**
 * test-mint-mainnet.mjs
 * Test mint a TrustCoat on Base Mainnet.
 * Sets deployer as minter, then mints tier 1 (SAMPLE) to deployer address.
 *
 * Usage:
 *   LOCUS_OWNER_PRIVATE_KEY=0x... node scripts/test-mint-mainnet.mjs
 */

import { readFileSync } from "fs";
import { createRequire } from "module";
import { fileURLToPath } from "url";
import path from "path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);
const { ethers } = require("ethers");

const PRIVATE_KEY = process.env.LOCUS_OWNER_PRIVATE_KEY || process.env.DEPLOYER_PRIVATE_KEY;
if (!PRIVATE_KEY) throw new Error("LOCUS_OWNER_PRIVATE_KEY or DEPLOYER_PRIVATE_KEY not set");

const CONTRACT_ADDRESS = process.env.TRUST_COAT_ADDRESS;
if (!CONTRACT_ADDRESS) throw new Error("TRUST_COAT_ADDRESS not set");

const BASE_MAINNET_RPC = process.env.BASE_MAINNET_RPC ?? "https://mainnet.base.org";
const abi = JSON.parse(readFileSync(path.join(__dirname, "..", "artifacts", "TrustCoat.abi"), "utf8"));

async function main() {
  const provider = new ethers.JsonRpcProvider(BASE_MAINNET_RPC);
  const wallet = new ethers.Wallet(PRIVATE_KEY, provider);

  const contract = new ethers.Contract(CONTRACT_ADDRESS, abi, wallet);

  console.log(`\nTrustCoat Mainnet Test Mint`);
  console.log(`Contract: ${CONTRACT_ADDRESS}`);
  console.log(`Wallet:   ${wallet.address}`);
  console.log(`Network:  Base Mainnet (8453)\n`);

  const owner = await contract.owner();
  console.log(`Owner: ${owner}`);

  // Check if already minter
  const isMinter = await contract.minters(wallet.address);
  console.log(`Is minter: ${isMinter}`);

  if (!isMinter) {
    console.log("\nSetting deployer as minter...");
    const setTx = await contract.setMinter(wallet.address, true);
    const setReceipt = await setTx.wait(1);
    console.log(`✓ setMinter tx: ${setTx.hash}`);
  }

  // Mint tier 1 (SAMPLE) to deployer, agentId=1
  const TIER_SAMPLE = 1n;
  const AGENT_ID = 1n;
  console.log(`\nMinting tier ${TIER_SAMPLE} (SAMPLE) to ${wallet.address}...`);
  const mintTx = await contract.mint(wallet.address, TIER_SAMPLE, AGENT_ID);
  const mintReceipt = await mintTx.wait(1);
  console.log(`✓ Mint tx: ${mintTx.hash}`);
  console.log(`  Explorer: https://basescan.org/tx/${mintTx.hash}`);

  // Verify balance
  const balance = await contract.balanceOf(wallet.address, TIER_SAMPLE);
  console.log(`\nBalance of tier ${TIER_SAMPLE} for ${wallet.address}: ${balance}`);

  console.log(`\n✓ Test mint complete!`);
  return { mintTxHash: mintTx.hash, balance: balance.toString() };
}

main()
  .then(({ mintTxHash, balance }) => {
    console.log(`\nDone. Tx: ${mintTxHash}, Balance: ${balance}`);
    process.exit(0);
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
