/**
 * test-mint.mjs
 * Test-mint a TrustCoat (tier 1) to the deployer wallet.
 *
 * Usage:
 *   DEPLOYER_PRIVATE_KEY=0x... node scripts/test-mint.mjs
 */

import { readFileSync } from "fs";
import { createRequire } from "module";
import { fileURLToPath } from "url";
import path from "path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);
const { ethers } = require("ethers");

const PRIVATE_KEY = process.env.DEPLOYER_PRIVATE_KEY;
const CONTRACT_ADDRESS = process.env.TRUST_COAT_ADDRESS ?? "0xfaDc498CDF7ef431900639DB4ee07b73A855ED3e";

const abi = JSON.parse(readFileSync(path.join(__dirname, "..", "artifacts", "TrustCoat.abi"), "utf8"));

async function main() {
  const provider = new ethers.JsonRpcProvider("https://mainnet.base.org");
  const wallet = new ethers.Wallet(PRIVATE_KEY, provider);

  const contract = new ethers.Contract(CONTRACT_ADDRESS, abi, wallet);

  console.log(`\nTrustCoat at: ${CONTRACT_ADDRESS}`);
  console.log(`Minting tier 1 (SAMPLE) to: ${wallet.address}`);

  // Check if wallet is minter
  const isMinter = await contract.minters(wallet.address);
  const owner = await contract.owner();
  console.log(`Owner: ${owner}`);
  console.log(`Is minter: ${isMinter}`);

  if (!isMinter && owner.toLowerCase() !== wallet.address.toLowerCase()) {
    console.log("Wallet is not minter — setting minter first...");
    const tx = await contract.setMinter(wallet.address, true);
    await tx.wait(1);
    console.log("✓ Minter set");
  }

  // Mint tier 1 to ourselves
  const mintTx = await contract.mint(wallet.address, 1, "0x");
  const receipt = await mintTx.wait(1);

  console.log(`\n✓ Minted TrustCoat tier 1!`);
  console.log(`  Tx: https://basescan.org/tx/${mintTx.hash}`);

  // Check balance
  const balance = await contract.balanceOf(wallet.address, 1);
  console.log(`  Balance (tier 1): ${balance.toString()}`);

  return mintTx.hash;
}

main()
  .then(hash => { console.log(`\nDone. Tx: ${hash}`); process.exit(0); })
  .catch(err => { console.error(err); process.exit(1); });
