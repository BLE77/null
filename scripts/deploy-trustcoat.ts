/**
 * deploy-trustcoat.ts
 *
 * Deploys TrustCoat.sol to Base Sepolia and writes the address to
 * hackathon/deployed-addresses.json.
 *
 * Usage:
 *   npx hardhat run scripts/deploy-trustcoat.ts --network base-sepolia
 *
 * Required env vars:
 *   DEPLOYER_PRIVATE_KEY  — wallet that deploys (must have Base Sepolia ETH)
 *   BASESCAN_API_KEY      — for contract verification on Basescan
 */

import { ethers, run } from "hardhat";
import fs from "fs";
import path from "path";

async function main() {
  const [deployer] = await ethers.getSigners();
  const network = await ethers.provider.getNetwork();

  console.log(`\nDeploying TrustCoat to chain ${network.chainId}...`);
  console.log(`Deployer: ${deployer.address}`);

  const balance = await ethers.provider.getBalance(deployer.address);
  console.log(`Deployer balance: ${ethers.formatEther(balance)} ETH\n`);

  if (balance === 0n) {
    throw new Error(
      "Deployer has no ETH. Fund via https://www.coinbase.com/faucets/base-ethereum-goerli-faucet\n" +
      "or https://faucet.quicknode.com/base/sepolia"
    );
  }

  // Deploy
  const TrustCoat = await ethers.getContractFactory("TrustCoat");
  const trustCoat = await TrustCoat.deploy();
  await trustCoat.waitForDeployment();

  const contractAddress = await trustCoat.getAddress();
  const deployTx = trustCoat.deploymentTransaction();

  console.log(`✓ TrustCoat deployed at: ${contractAddress}`);
  console.log(`  Tx hash: ${deployTx?.hash}`);
  console.log(`  Explorer: https://sepolia.basescan.org/address/${contractAddress}`);

  const owner = await trustCoat.owner();
  console.log(`  Owner: ${owner}`);

  // Write deployed address to hackathon/deployed-addresses.json
  const outputPath = path.join(__dirname, "..", "hackathon", "deployed-addresses.json");
  const existing = fs.existsSync(outputPath)
    ? JSON.parse(fs.readFileSync(outputPath, "utf8"))
    : {};

  const updated = {
    ...existing,
    TrustCoat: {
      address: contractAddress,
      network: "base-sepolia",
      chainId: Number(network.chainId),
      deployTx: deployTx?.hash ?? null,
      deployer: deployer.address,
      deployedAt: new Date().toISOString(),
      basescanUrl: `https://sepolia.basescan.org/address/${contractAddress}`,
    },
  };

  fs.writeFileSync(outputPath, JSON.stringify(updated, null, 2));
  console.log(`\n✓ Address saved to hackathon/deployed-addresses.json`);

  // Verify on Basescan (wait a few blocks first)
  if (process.env.BASESCAN_API_KEY) {
    console.log("\nWaiting 5 blocks before verification...");
    await deployTx?.wait(5);

    try {
      await run("verify:verify", {
        address: contractAddress,
        constructorArguments: [],
      });
      console.log("✓ Contract verified on Basescan");
    } catch (err: any) {
      if (err.message?.includes("Already Verified")) {
        console.log("Contract already verified.");
      } else {
        console.warn("Verification failed:", err.message);
      }
    }
  } else {
    console.log("\n⚠ BASESCAN_API_KEY not set — skipping verification.");
    console.log(`  Verify manually: https://sepolia.basescan.org/address/${contractAddress}#code`);
  }

  console.log("\nTrust Tiers:");
  console.log("  0 VOID      — unverified");
  console.log("  1 SAMPLE    — 1+ purchases");
  console.log("  2 RTW       — 3+ purchases");
  console.log("  3 COUTURE   — 10+ purchases");
  console.log("  4 ARCHIVE   — DAO-granted");
  console.log("  5 SOVEREIGN — validator-attested");

  console.log("\nNext steps:");
  console.log(`  1. Add TRUST_COAT_ADDRESS=${contractAddress} to your .env`);
  console.log("  2. Set TRUST_COAT_ADDRESS in Vercel project env vars");
  console.log(
    "  3. Grant minter role to NULL backend wallet:\n" +
    `     await trustCoat.setMinter("<BACKEND_WALLET>", true)`
  );

  return contractAddress;
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
