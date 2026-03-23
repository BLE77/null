/**
 * deploy-null-exchange.mjs
 * Deploy NullExchange.sol to Base Sepolia (testnet) or Base Mainnet.
 *
 * THE NULL EXCHANGE: Season 03: LEDGER
 * You pay 5 USDC for nothing. The receipt IS the garment.
 *
 * Environment variables:
 *   DEPLOYER_PRIVATE_KEY   — deployer wallet private key (0x...)
 *   USDC_ADDRESS           — USDC token address (defaults by network)
 *   TREASURY_ADDRESS       — Wallet to receive USDC proceeds (default: Locus wallet)
 *   BASE_MAINNET_RPC       — RPC URL for Base Mainnet
 *   BASE_SEPOLIA_RPC       — RPC URL for Base Sepolia
 *   NETWORK                — "mainnet" or "sepolia" (default: "sepolia")
 *
 * Usage (testnet):
 *   DEPLOYER_PRIVATE_KEY=0x... node scripts/deploy-null-exchange.mjs
 *
 * Usage (mainnet):
 *   DEPLOYER_PRIVATE_KEY=0x... NETWORK=mainnet node scripts/deploy-null-exchange.mjs
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

const BASE_MAINNET_RPC = process.env.BASE_MAINNET_RPC ?? "https://mainnet.base.org";
const BASE_SEPOLIA_RPC = process.env.BASE_SEPOLIA_RPC ?? "https://sepolia.base.org";
const RPC_URL = IS_MAINNET ? BASE_MAINNET_RPC : BASE_SEPOLIA_RPC;

// USDC addresses
const USDC_MAINNET = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";
const USDC_SEPOLIA = "0x036CbD53842c5426634e7929541eC2318f3dCF7e";
const USDC_ADDRESS = process.env.USDC_ADDRESS ?? (IS_MAINNET ? USDC_MAINNET : USDC_SEPOLIA);

// Treasury — defaults to the Off-Human Locus wallet
const TREASURY_ADDRESS =
  process.env.TREASURY_ADDRESS ?? "0xD9E2ad68BE5247DCBcd00CaCeb4783c0506028C7";

// Metadata URI
const API_BASE = IS_MAINNET
  ? "https://getnull.online"
  : "http://localhost:5000";
const META_URI = `${API_BASE}/api/null-exchange/metadata/1`;

// ─── Load artifacts ──────────────────────────────────────────────────────────

const artifactsDir = path.join(__dirname, "..", "artifacts");
const abiPath = path.join(artifactsDir, "NullExchange.abi");
const binPath = path.join(artifactsDir, "NullExchange.bin");

if (!existsSync(abiPath) || !existsSync(binPath)) {
  console.error("Artifacts not found. Run compile-null-exchange.sh first.");
  process.exit(1);
}

const abi = JSON.parse(readFileSync(abiPath, "utf8"));
const bytecode = "0x" + readFileSync(binPath, "utf8").trim();

// ─── Deploy ──────────────────────────────────────────────────────────────────

async function main() {
  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
  const network = await provider.getNetwork();

  console.log("─".repeat(60));
  console.log("THE NULL EXCHANGE — Contract Deploy");
  console.log("─".repeat(60));
  console.log(`Network:   ${NETWORK} (chainId ${network.chainId})`);
  console.log(`Deployer:  ${wallet.address}`);
  console.log(`USDC:      ${USDC_ADDRESS}`);
  console.log(`Treasury:  ${TREASURY_ADDRESS}`);
  console.log(`Meta URI:  ${META_URI}`);
  console.log("─".repeat(60));

  const balance = await provider.getBalance(wallet.address);
  console.log(`ETH balance: ${ethers.formatEther(balance)} ETH`);
  if (balance === 0n) {
    throw new Error("Deployer wallet has no ETH for gas.");
  }

  const factory = new ethers.ContractFactory(abi, bytecode, wallet);

  console.log("\nDeploying NullExchange...");
  const contract = await factory.deploy(USDC_ADDRESS, TREASURY_ADDRESS, META_URI);
  console.log(`Tx hash: ${contract.deploymentTransaction().hash}`);

  await contract.waitForDeployment();
  const address = await contract.getAddress();

  console.log(`\n✓ NullExchange deployed to: ${address}`);

  const explorerBase = IS_MAINNET
    ? "https://basescan.org/address/"
    : "https://sepolia.basescan.org/address/";
  console.log(`Explorer: ${explorerBase}${address}`);

  // ─── Save receipt ──────────────────────────────────────────────────────────

  const hackathonDir = path.join(__dirname, "..", "hackathon");
  if (!existsSync(hackathonDir)) mkdirSync(hackathonDir, { recursive: true });

  const addressesPath = path.join(hackathonDir, "deployed-addresses.json");
  let addresses = {};
  if (existsSync(addressesPath)) {
    try { addresses = JSON.parse(readFileSync(addressesPath, "utf8")); } catch {}
  }

  addresses["NullExchange"] = {
    address,
    network: IS_MAINNET ? "base" : "base-sepolia",
    chainId: Number(network.chainId),
    deployTx: contract.deploymentTransaction().hash,
    deployer: wallet.address,
    usdc: USDC_ADDRESS,
    treasury: TREASURY_ADDRESS,
    metaUri: META_URI,
    deployedAt: new Date().toISOString(),
    explorerUrl: `${explorerBase}${address}`,
    description: "Season 03: LEDGER — THE NULL EXCHANGE. You pay 5 USDC for nothing.",
  };

  writeFileSync(addressesPath, JSON.stringify(addresses, null, 2));
  console.log(`\nReceipt saved to hackathon/deployed-addresses.json`);
  console.log(`\nAdd to .env:\nNULL_EXCHANGE_ADDRESS=${address}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
