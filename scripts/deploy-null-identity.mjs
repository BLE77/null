/**
 * deploy-null-identity.mjs
 * Deploy NullIdentity.sol (ERC-721 TBA anchor) to Base Sepolia or Base Mainnet.
 *
 * NullIdentity is the ERC-721 contract that anchors ERC-6551 Token Bound Accounts.
 * Each NULL agent gets one token. Their TBA (wardrobe address) is derived from it.
 *
 * Environment variables:
 *   DEPLOYER_PRIVATE_KEY  — deployer wallet private key (0x...)
 *   BASE_MAINNET_RPC      — RPC URL for Base Mainnet (default: https://mainnet.base.org)
 *   BASE_SEPOLIA_RPC      — RPC URL for Base Sepolia (default: https://sepolia.base.org)
 *   NETWORK               — "mainnet" or "sepolia" (default: "sepolia")
 *
 * Usage (testnet):
 *   DEPLOYER_PRIVATE_KEY=0x... node scripts/deploy-null-identity.mjs
 *
 * Usage (mainnet):
 *   DEPLOYER_PRIVATE_KEY=0x... NETWORK=mainnet node scripts/deploy-null-identity.mjs
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

// ERC-6551 canonical registry (same address on all chains)
const ERC6551_REGISTRY = "0x000000006551c19487814612e58FE06813775758";
// ERC-6551 canonical TBA implementation v0.3.1
const ERC6551_IMPL    = "0x55266d75D1a14E4572138116aF39863Ed6596E7F";

// ─── Load ABI + Bytecode ──────────────────────────────────────────────────────

const abi = JSON.parse(
  readFileSync(path.join(__dirname, "..", "artifacts", "NullIdentity.abi"), "utf8")
);
const bytecode =
  "0x" + readFileSync(path.join(__dirname, "..", "artifacts", "NullIdentity.bin"), "utf8").trim();

// ─── ERC-6551 Registry ABI (minimal — account + createAccount) ───────────────

const REGISTRY_ABI = [
  "function account(address implementation, bytes32 salt, uint256 chainId, address tokenContract, uint256 tokenId) external view returns (address)",
  "function createAccount(address implementation, bytes32 salt, uint256 chainId, address tokenContract, uint256 tokenId) external returns (address)",
];

// ─── Deploy ───────────────────────────────────────────────────────────────────

async function main() {
  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const wallet   = new ethers.Wallet(PRIVATE_KEY, provider);
  const network  = await provider.getNetwork();

  console.log(`\n─── NullIdentity Deployment ──────────────────────────────────`);
  console.log(`Network:    ${NETWORK} (chainId ${network.chainId})`);
  console.log(`RPC:        ${RPC_URL}`);
  console.log(`Deployer:   ${wallet.address}`);
  console.log(`ERC-6551 Registry: ${ERC6551_REGISTRY}`);
  console.log(`ERC-6551 Impl:     ${ERC6551_IMPL}`);

  const balance = await provider.getBalance(wallet.address);
  console.log(`Balance:    ${ethers.formatEther(balance)} ETH\n`);

  if (balance === 0n) throw new Error("Deployer has no ETH.");

  // ─── Deploy NullIdentity ───────────────────────────────────────────────────

  const factory  = new ethers.ContractFactory(abi, bytecode, wallet);
  const deployTx = await factory.getDeployTransaction();

  const gasEstimate = await provider.estimateGas({ ...deployTx, from: wallet.address });
  const feeData     = await provider.getFeeData();
  const estimatedCost = gasEstimate * (feeData.maxFeePerGas ?? feeData.gasPrice ?? 0n);
  console.log(`Gas estimate: ${gasEstimate.toString()} units`);
  console.log(`Est. cost:    ${ethers.formatEther(estimatedCost)} ETH\n`);

  console.log("Deploying NullIdentity...");
  const contract = await factory.deploy();
  await contract.deploymentTransaction().wait(2);

  const contractAddress = await contract.getAddress();
  const txHash          = contract.deploymentTransaction().hash;

  console.log(`\n✓ NullIdentity deployed at: ${contractAddress}`);
  console.log(`  Tx hash: ${txHash}`);
  if (IS_MAINNET) {
    console.log(`  Explorer: https://basescan.org/address/${contractAddress}`);
  } else {
    console.log(`  Explorer: https://sepolia.basescan.org/address/${contractAddress}`);
  }

  // ─── Verify ERC-6551 registry is reachable + compute test TBA address ────

  console.log(`\n─── ERC-6551 TBA Address Computation ────────────────────────`);

  const registry = new ethers.Contract(ERC6551_REGISTRY, REGISTRY_ABI, provider);
  const salt = ethers.ZeroHash; // 0x0000...0000

  try {
    // Check if registry is deployed on this network
    const registryCode = await provider.getCode(ERC6551_REGISTRY);
    if (registryCode === "0x") {
      console.log(`⚠  ERC-6551 registry not found at ${ERC6551_REGISTRY} on this network.`);
      console.log(`   TBA address computation skipped.`);
    } else {
      console.log(`✓ ERC-6551 registry found at ${ERC6551_REGISTRY}`);

      // Compute what TBA address would be for tokenId=1
      const tbaAddress = await registry.account(
        ERC6551_IMPL,
        salt,
        network.chainId,
        contractAddress,
        1n
      );
      console.log(`  TBA for NullIdentity #1: ${tbaAddress}`);
      console.log(`  (computed counterfactually — no deployment tx required)`);
      console.log(`\n  To deploy the TBA, call:`);
      console.log(`  registry.createAccount(impl, salt, chainId, ${contractAddress}, 1)`);
    }
  } catch (err) {
    console.log(`⚠  Registry call failed: ${err.message}`);
  }

  // ─── Save deployment receipt ───────────────────────────────────────────────

  const outputDir  = path.join(__dirname, "..", "hackathon");
  const outputPath = path.join(outputDir, "deployed-addresses.json");
  if (!existsSync(outputDir)) mkdirSync(outputDir, { recursive: true });

  const existing = existsSync(outputPath)
    ? JSON.parse(readFileSync(outputPath, "utf8"))
    : {};

  const key = IS_MAINNET ? "NullIdentity" : "NullIdentity_Sepolia";
  const updated = {
    ...existing,
    [key]: {
      address: contractAddress,
      network: IS_MAINNET ? "base" : "base-sepolia",
      chainId: Number(network.chainId),
      deployTx: txHash,
      deployer: wallet.address,
      erc6551Registry: ERC6551_REGISTRY,
      erc6551Impl: ERC6551_IMPL,
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
    console.log(`  NULL_IDENTITY_ADDRESS=${contractAddress}`);
  } else {
    console.log(`  NULL_IDENTITY_SEPOLIA_ADDRESS=${contractAddress}`);
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
