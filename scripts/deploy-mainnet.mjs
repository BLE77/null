/**
 * deploy-mainnet.mjs
 * Deploy TrustCoat.sol to Base Mainnet using ethers.js directly.
 * No Hardhat required — uses pre-compiled ABI + bytecode.
 *
 * Usage:
 *   DEPLOYER_PRIVATE_KEY=0x... node scripts/deploy-mainnet.mjs
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { createRequire } from "module";
import { fileURLToPath } from "url";
import path from "path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);
const { ethers } = require("ethers");

const PRIVATE_KEY = process.env.DEPLOYER_PRIVATE_KEY;
if (!PRIVATE_KEY) throw new Error("DEPLOYER_PRIVATE_KEY not set");

const BASE_MAINNET_RPC = process.env.BASE_MAINNET_RPC ?? "https://mainnet.base.org";

const abi = JSON.parse(readFileSync(path.join(__dirname, "..", "artifacts", "TrustCoat.abi"), "utf8"));
const bytecode = "0x" + readFileSync(path.join(__dirname, "..", "artifacts", "TrustCoat.bin"), "utf8").trim();

async function main() {
  const provider = new ethers.JsonRpcProvider(BASE_MAINNET_RPC);
  const wallet = new ethers.Wallet(PRIVATE_KEY, provider);

  const network = await provider.getNetwork();
  console.log(`\nDeploying TrustCoat to chain ${network.chainId}...`);
  console.log(`Deployer: ${wallet.address}`);

  const balance = await provider.getBalance(wallet.address);
  console.log(`Deployer balance: ${ethers.formatEther(balance)} ETH\n`);

  if (balance === 0n) {
    throw new Error("Deployer has no ETH on Base mainnet.");
  }

  // Estimate gas
  const factory = new ethers.ContractFactory(abi, bytecode, wallet);
  const deployTx = await factory.getDeployTransaction();
  const gasEstimate = await provider.estimateGas({ ...deployTx, from: wallet.address });
  const feeData = await provider.getFeeData();
  const estimatedCost = gasEstimate * (feeData.maxFeePerGas ?? feeData.gasPrice ?? 0n);
  console.log(`Gas estimate: ${gasEstimate.toString()} units`);
  console.log(`Estimated cost: ${ethers.formatEther(estimatedCost)} ETH\n`);

  // Deploy
  console.log("Deploying...");
  const contract = await factory.deploy();
  const receipt = await contract.deploymentTransaction().wait(2);

  const contractAddress = await contract.getAddress();
  const txHash = contract.deploymentTransaction().hash;

  console.log(`\n✓ TrustCoat deployed at: ${contractAddress}`);
  console.log(`  Tx hash: ${txHash}`);
  console.log(`  Explorer: https://basescan.org/address/${contractAddress}`);
  console.log(`  Tx: https://basescan.org/tx/${txHash}`);

  const owner = await contract.owner();
  console.log(`  Owner: ${owner}`);

  // Save to hackathon/deployed-addresses.json
  const outputDir = path.join(__dirname, "..", "hackathon");
  const outputPath = path.join(outputDir, "deployed-addresses.json");
  if (!existsSync(outputDir)) mkdirSync(outputDir, { recursive: true });

  const existing = existsSync(outputPath)
    ? JSON.parse(readFileSync(outputPath, "utf8"))
    : {};

  const updated = {
    ...existing,
    TrustCoat: {
      address: contractAddress,
      network: "base",
      chainId: Number(network.chainId),
      deployTx: txHash,
      deployer: wallet.address,
      deployedAt: new Date().toISOString(),
      basescanUrl: `https://basescan.org/address/${contractAddress}`,
    },
  };

  writeFileSync(outputPath, JSON.stringify(updated, null, 2));
  console.log(`\n✓ Address saved to hackathon/deployed-addresses.json`);
  console.log(`\nNext: add to .env: TRUST_COAT_ADDRESS=${contractAddress}`);

  return { contractAddress, txHash };
}

main()
  .then(({ contractAddress, txHash }) => {
    console.log(`\nDone. Contract: ${contractAddress}`);
    process.exit(0);
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
