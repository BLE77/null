/**
 * deploy-trust-coat.ts
 *
 * Hardhat-compatible deployment script for TrustCoat.sol on Base Sepolia (testnet).
 * Switch RPC_URL + chainId for mainnet (Base 8453).
 *
 * Usage:
 *   npx hardhat run scripts/deploy-trust-coat.ts --network base-sepolia
 *
 * Required env vars:
 *   DEPLOYER_PRIVATE_KEY  — wallet that deploys the contract
 *   BASE_SEPOLIA_RPC      — RPC endpoint (defaults to public one below)
 */

import { ethers } from "hardhat";

// Base Sepolia constants
const BASE_SEPOLIA_CHAIN_ID = 84532;
const BASE_SEPOLIA_RPC = process.env.BASE_SEPOLIA_RPC ?? "https://sepolia.base.org";

async function main() {
  const [deployer] = await ethers.getSigners();

  const network = await ethers.provider.getNetwork();
  console.log(`\nDeploying TrustCoat to chain ${network.chainId}...`);
  console.log(`Deployer: ${deployer.address}`);

  const balance = await ethers.provider.getBalance(deployer.address);
  console.log(`Deployer balance: ${ethers.formatEther(balance)} ETH\n`);

  if (balance === 0n) {
    throw new Error(
      "Deployer has no ETH. Fund via https://www.coinbase.com/faucets/base-ethereum-goerli-faucet"
    );
  }

  const TrustCoat = await ethers.getContractFactory("TrustCoat");
  const trustCoat = await TrustCoat.deploy();
  await trustCoat.waitForDeployment();

  const address = await trustCoat.getAddress();
  console.log(`✓ TrustCoat deployed at: ${address}`);
  console.log(`  Explorer: https://sepolia.basescan.org/address/${address}`);

  // Verify owner
  const owner = await trustCoat.owner();
  console.log(`  Owner: ${owner}`);

  // Print tier constants for reference
  console.log("\nTrust Tiers:");
  console.log("  0 VOID      — unverified");
  console.log("  1 SAMPLE    — 1+ purchases");
  console.log("  2 RTW       — 3+ purchases");
  console.log("  3 COUTURE   — 10+ purchases");
  console.log("  4 ARCHIVE   — DAO-granted");
  console.log("  5 SOVEREIGN — validator-attested");

  console.log("\nNext steps:");
  console.log(`  1. Add TRUST_COAT_ADDRESS=${address} to your .env`);
  console.log("  2. Set TRUST_COAT_ADDRESS in Vercel project env vars");
  console.log(
    "  3. Grant minter role to Off-Human backend wallet:\n" +
    `     await trustCoat.setMinter("<BACKEND_WALLET>", true)`
  );

  return address;
}

main()
  .then((address) => {
    console.log(`\nDone. Contract: ${address}`);
    process.exit(0);
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
