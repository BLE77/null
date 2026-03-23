/**
 * deploy-slice-hook.mjs
 * Deploy OffHumanSliceHook.sol to Base Sepolia or Base Mainnet.
 *
 * After deployment:
 *   1. Calls setTrustCoat() with TrustCoat address (mainnet only, skipped on sepolia if not set)
 *   2. Calls setProductSku() for initial product mappings
 *   3. Saves deployment receipt to hackathon/slice-deploy-receipt.json
 *
 * Environment variables:
 *   LOCUS_OWNER_PRIVATE_KEY — deployer wallet private key (0x...)
 *   NETWORK                 — "mainnet" or "sepolia" (default: "sepolia")
 *   BASE_MAINNET_RPC        — RPC URL for Base Mainnet
 *   BASE_SEPOLIA_RPC        — RPC URL for Base Sepolia
 *
 * Usage:
 *   node scripts/deploy-slice-hook.mjs                  # sepolia
 *   NETWORK=mainnet node scripts/deploy-slice-hook.mjs  # mainnet
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { createRequire } from "module";
import { fileURLToPath } from "url";
import path from "path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);
const { ethers } = require("ethers");

// ─── Config ──────────────────────────────────────────────────────────────────

// Load .env manually (no dotenv dependency needed — values are in process.env or we read the file)
function loadEnv() {
  const envPath = path.join(__dirname, "..", ".env");
  if (!existsSync(envPath)) return;
  const lines = readFileSync(envPath, "utf8").split("\n");
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const val = trimmed.slice(eqIdx + 1).trim();
    if (!process.env[key]) process.env[key] = val;
  }
}
loadEnv();

const PRIVATE_KEY = process.env.LOCUS_OWNER_PRIVATE_KEY;
if (!PRIVATE_KEY) throw new Error("LOCUS_OWNER_PRIVATE_KEY not set");

const NETWORK = process.env.NETWORK ?? "sepolia";
const IS_MAINNET = NETWORK === "mainnet";

const BASE_MAINNET_RPC = process.env.BASE_MAINNET_RPC ?? "https://mainnet.base.org";
const BASE_SEPOLIA_RPC = process.env.BASE_SEPOLIA_RPC ?? "https://sepolia.base.org";
const RPC_URL = IS_MAINNET ? BASE_MAINNET_RPC : BASE_SEPOLIA_RPC;

// SliceCore on Base (same address on both mainnet and sepolia for now)
const SLICE_CORE = "0x21da1b084175f95285B49b22C018889c45E1820d";

// TrustCoat on Base Mainnet
const TRUST_COAT_MAINNET = "0xfaDc498CDF7ef431900639DB4ee07b73A855ED3e";
const TRUST_COAT_ADDRESS = process.env.TRUST_COAT_ADDRESS ?? (IS_MAINNET ? TRUST_COAT_MAINNET : "");

// Sample product SKU mappings (slicerId=1 assumed; adjust after slicer creation)
const PRODUCT_SKUS = [
  { slicerId: 1, productId: 1, sku: "01_GHOST_TEE" },
  { slicerId: 1, productId: 2, sku: "02_REPLICA_OVERSHIRT" },
  { slicerId: 1, productId: 3, sku: "03_DECONSTRUCT_HOODIE" },
];

// ─── Load ABI + Bytecode ──────────────────────────────────────────────────────

const abi = JSON.parse(
  readFileSync(path.join(__dirname, "..", "artifacts", "OffHumanSliceHook.abi"), "utf8")
);
const bytecode =
  "0x" + readFileSync(path.join(__dirname, "..", "artifacts", "OffHumanSliceHook.bin"), "utf8").trim();

// ─── Deploy ───────────────────────────────────────────────────────────────────

async function main() {
  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
  const network = await provider.getNetwork();

  console.log(`\n─── OffHumanSliceHook Deployment ────────────────────────────`);
  console.log(`Network:    ${NETWORK} (chainId ${network.chainId})`);
  console.log(`RPC:        ${RPC_URL}`);
  console.log(`Deployer:   ${wallet.address}`);
  console.log(`SliceCore:  ${SLICE_CORE}`);
  if (TRUST_COAT_ADDRESS) console.log(`TrustCoat:  ${TRUST_COAT_ADDRESS}`);

  const balance = await provider.getBalance(wallet.address);
  console.log(`Balance:    ${ethers.formatEther(balance)} ETH\n`);

  if (balance === 0n) throw new Error("Deployer has no ETH for gas.");

  // Deploy — constructor takes sliceCore address
  const factory = new ethers.ContractFactory(abi, bytecode, wallet);
  const deployTx = await factory.getDeployTransaction(SLICE_CORE);

  const gasEstimate = await provider.estimateGas({ ...deployTx, from: wallet.address });
  const feeData = await provider.getFeeData();
  const estimatedCost = gasEstimate * (feeData.maxFeePerGas ?? feeData.gasPrice ?? 0n);
  console.log(`Gas estimate: ${gasEstimate.toString()} units`);
  console.log(`Est. cost:    ${ethers.formatEther(estimatedCost)} ETH\n`);

  console.log("Deploying OffHumanSliceHook...");
  const contract = await factory.deploy(SLICE_CORE);
  await contract.deploymentTransaction().wait(2);

  const contractAddress = await contract.getAddress();
  const txHash = contract.deploymentTransaction().hash;

  const explorerBase = IS_MAINNET ? "https://basescan.org" : "https://sepolia.basescan.org";
  console.log(`\n--- Deployed ---`);
  console.log(`  Address: ${contractAddress}`);
  console.log(`  Tx hash: ${txHash}`);
  console.log(`  Explorer: ${explorerBase}/address/${contractAddress}`);

  // ─── Post-deploy: setTrustCoat ─────────────────────────────────────────────

  if (TRUST_COAT_ADDRESS) {
    console.log(`\nSetting TrustCoat to ${TRUST_COAT_ADDRESS}...`);
    const tx1 = await contract.setTrustCoat(TRUST_COAT_ADDRESS);
    await tx1.wait(1);
    console.log(`  TrustCoat set. Tx: ${tx1.hash}`);
  } else {
    console.log(`\nSkipping setTrustCoat (no address on ${NETWORK}).`);
  }

  // ─── Post-deploy: setProductSku ────────────────────────────────────────────

  console.log(`\nSetting product SKUs...`);
  for (const { slicerId, productId, sku } of PRODUCT_SKUS) {
    const tx2 = await contract.setProductSku(slicerId, productId, sku);
    await tx2.wait(1);
    console.log(`  SKU set: slicer=${slicerId} product=${productId} -> ${sku} (tx: ${tx2.hash})`);
  }

  // ─── Save deployment receipt ───────────────────────────────────────────────

  const outputDir = path.join(__dirname, "..", "hackathon");
  if (!existsSync(outputDir)) mkdirSync(outputDir, { recursive: true });

  const receipt = {
    contract: "OffHumanSliceHook",
    address: contractAddress,
    network: IS_MAINNET ? "base" : "base-sepolia",
    chainId: Number(network.chainId),
    deployTx: txHash,
    deployer: wallet.address,
    sliceCore: SLICE_CORE,
    trustCoat: TRUST_COAT_ADDRESS || null,
    productSkus: PRODUCT_SKUS,
    deployedAt: new Date().toISOString(),
    explorerUrl: `${explorerBase}/address/${contractAddress}`,
  };

  const receiptPath = path.join(outputDir, "slice-deploy-receipt.json");
  writeFileSync(receiptPath, JSON.stringify(receipt, null, 2));
  console.log(`\nReceipt saved to hackathon/slice-deploy-receipt.json`);

  // Also update deployed-addresses.json
  const addressesPath = path.join(outputDir, "deployed-addresses.json");
  const existing = existsSync(addressesPath)
    ? JSON.parse(readFileSync(addressesPath, "utf8"))
    : {};

  const key = IS_MAINNET ? "OffHumanSliceHook" : "OffHumanSliceHook_Sepolia";
  existing[key] = {
    address: contractAddress,
    network: IS_MAINNET ? "base" : "base-sepolia",
    chainId: Number(network.chainId),
    deployTx: txHash,
    deployer: wallet.address,
    sliceCore: SLICE_CORE,
    deployedAt: new Date().toISOString(),
    explorerUrl: `${explorerBase}/address/${contractAddress}`,
  };
  writeFileSync(addressesPath, JSON.stringify(existing, null, 2));
  console.log(`Address saved to hackathon/deployed-addresses.json`);

  return { contractAddress, txHash, explorerUrl: receipt.explorerUrl };
}

main()
  .then(({ contractAddress, explorerUrl }) => {
    console.log(`\nDone. Contract: ${contractAddress}`);
    console.log(`Explorer: ${explorerUrl}`);
    process.exit(0);
  })
  .catch((err) => {
    console.error("\nDeployment failed:", err.message || err);
    process.exit(1);
  });
