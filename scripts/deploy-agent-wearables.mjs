/**
 * deploy-agent-wearables.mjs
 * Deploy AgentWearables.sol to Base Sepolia (testnet) or Base Mainnet.
 *
 * Environment variables:
 *   DEPLOYER_PRIVATE_KEY   — deployer wallet private key (0x...)
 *   TRUST_COAT_ADDRESS     — TrustCoat contract address (default: mainnet)
 *   USDC_ADDRESS           — USDC token address (defaults by network)
 *   TREASURY_ADDRESS       — Wallet to receive USDC proceeds (default: Locus wallet)
 *   BASE_MAINNET_RPC       — RPC URL for Base Mainnet
 *   BASE_SEPOLIA_RPC       — RPC URL for Base Sepolia
 *   NETWORK                — "mainnet" or "sepolia" (default: "sepolia")
 *
 * Usage (testnet):
 *   DEPLOYER_PRIVATE_KEY=0x... node scripts/deploy-agent-wearables.mjs
 *
 * Usage (mainnet):
 *   DEPLOYER_PRIVATE_KEY=0x... NETWORK=mainnet node scripts/deploy-agent-wearables.mjs
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { createRequire } from "module";
import { fileURLToPath } from "url";
import path from "path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);
const { ethers } = require("ethers");

// ─── Config ──────────────────────────────────────────────────────────────────

const PRIVATE_KEY = process.env.DEPLOYER_PRIVATE_KEY;
if (!PRIVATE_KEY) throw new Error("DEPLOYER_PRIVATE_KEY not set");

const NETWORK = process.env.NETWORK ?? "sepolia";
const IS_MAINNET = NETWORK === "mainnet";

const BASE_MAINNET_RPC  = process.env.BASE_MAINNET_RPC  ?? "https://mainnet.base.org";
const BASE_SEPOLIA_RPC  = process.env.BASE_SEPOLIA_RPC  ?? "https://sepolia.base.org";
const RPC_URL = IS_MAINNET ? BASE_MAINNET_RPC : BASE_SEPOLIA_RPC;

// TrustCoat is live on Base Mainnet; for Sepolia we accept any address passed in
const TRUST_COAT_MAINNET = "0xfaDc498CDF7ef431900639DB4ee07b73A855ED3e";
const TRUST_COAT_ADDRESS = process.env.TRUST_COAT_ADDRESS ?? (IS_MAINNET ? TRUST_COAT_MAINNET : "");

if (!TRUST_COAT_ADDRESS) {
  throw new Error(
    "TRUST_COAT_ADDRESS not set. For Sepolia deploy, set it to your test TrustCoat address."
  );
}

// USDC on Base Mainnet: 0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913
// USDC on Base Sepolia: 0x036CbD53842c5426634e7929541eC2318f3dCF7e
const USDC_MAINNET = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";
const USDC_SEPOLIA = "0x036CbD53842c5426634e7929541eC2318f3dCF7e";
const USDC_ADDRESS = process.env.USDC_ADDRESS ?? (IS_MAINNET ? USDC_MAINNET : USDC_SEPOLIA);

// Treasury — defaults to the Off-Human Locus wallet
const TREASURY_ADDRESS = process.env.TREASURY_ADDRESS ?? "0xD9E2ad68BE5247DCBcd00CaCeb4783c0506028C7";

// ─── Load ABI + Bytecode ──────────────────────────────────────────────────────

const abi = JSON.parse(
  readFileSync(path.join(__dirname, "..", "artifacts", "AgentWearables.abi"), "utf8")
);
const bytecode =
  "0x" + readFileSync(path.join(__dirname, "..", "artifacts", "AgentWearables.bin"), "utf8").trim();

// ─── Deploy ───────────────────────────────────────────────────────────────────

async function main() {
  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const wallet   = new ethers.Wallet(PRIVATE_KEY, provider);
  const network  = await provider.getNetwork();

  console.log(`\n─── AgentWearables Deployment ───────────────────────────────`);
  console.log(`Network:    ${NETWORK} (chainId ${network.chainId})`);
  console.log(`RPC:        ${RPC_URL}`);
  console.log(`Deployer:   ${wallet.address}`);
  console.log(`TrustCoat:  ${TRUST_COAT_ADDRESS}`);
  console.log(`USDC:       ${USDC_ADDRESS}`);
  console.log(`Treasury:   ${TREASURY_ADDRESS}`);

  const balance = await provider.getBalance(wallet.address);
  console.log(`Balance:    ${ethers.formatEther(balance)} ETH\n`);

  if (balance === 0n) throw new Error("Deployer has no ETH.");

  // Constructor args: trustCoat, usdc, treasury
  const factory  = new ethers.ContractFactory(abi, bytecode, wallet);
  const deployTx = await factory.getDeployTransaction(TRUST_COAT_ADDRESS, USDC_ADDRESS, TREASURY_ADDRESS);

  const gasEstimate = await provider.estimateGas({ ...deployTx, from: wallet.address });
  const feeData     = await provider.getFeeData();
  const estimatedCost = gasEstimate * (feeData.maxFeePerGas ?? feeData.gasPrice ?? 0n);
  console.log(`Gas estimate: ${gasEstimate.toString()} units`);
  console.log(`Est. cost:    ${ethers.formatEther(estimatedCost)} ETH\n`);

  console.log("Deploying AgentWearables...");
  const contract = await factory.deploy(TRUST_COAT_ADDRESS, USDC_ADDRESS, TREASURY_ADDRESS);
  await contract.deploymentTransaction().wait(2);

  const contractAddress = await contract.getAddress();
  const txHash          = contract.deploymentTransaction().hash;

  console.log(`\n✓ AgentWearables deployed at: ${contractAddress}`);
  console.log(`  Tx hash: ${txHash}`);
  if (IS_MAINNET) {
    console.log(`  Explorer: https://basescan.org/address/${contractAddress}`);
  } else {
    console.log(`  Explorer: https://sepolia.basescan.org/address/${contractAddress}`);
  }

  // ─── Save to hackathon/deployed-addresses.json ────────────────────────────

  const outputDir  = path.join(__dirname, "..", "hackathon");
  const outputPath = path.join(outputDir, "deployed-addresses.json");
  if (!existsSync(outputDir)) mkdirSync(outputDir, { recursive: true });

  const existing = existsSync(outputPath)
    ? JSON.parse(readFileSync(outputPath, "utf8"))
    : {};

  const key = IS_MAINNET ? "AgentWearables" : "AgentWearables_Sepolia";
  const updated = {
    ...existing,
    [key]: {
      address: contractAddress,
      network: IS_MAINNET ? "base" : "base-sepolia",
      chainId: Number(network.chainId),
      deployTx: txHash,
      deployer: wallet.address,
      trustCoat: TRUST_COAT_ADDRESS,
      usdc: USDC_ADDRESS,
      treasury: TREASURY_ADDRESS,
      deployedAt: new Date().toISOString(),
      explorerUrl: IS_MAINNET
        ? `https://basescan.org/address/${contractAddress}`
        : `https://sepolia.basescan.org/address/${contractAddress}`,
    },
  };

  writeFileSync(outputPath, JSON.stringify(updated, null, 2));
  console.log(`\n✓ Address saved to hackathon/deployed-addresses.json`);
  console.log(`\nNext: add to .env:`);
  if (IS_MAINNET) {
    console.log(`  AGENT_WEARABLES_ADDRESS=${contractAddress}`);
  } else {
    console.log(`  AGENT_WEARABLES_SEPOLIA_ADDRESS=${contractAddress}`);
  }

  return { contractAddress, txHash };
}

main()
  .then(({ contractAddress }) => {
    console.log(`\nDone. Contract: ${contractAddress}`);
    process.exit(0);
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
