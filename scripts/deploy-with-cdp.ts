#!/usr/bin/env tsx
/**
 * deploy-with-cdp.ts
 *
 * Deploys TrustCoat.sol to Base Sepolia using a Coinbase Developer Platform
 * (CDP) MPC wallet — no raw private key required. The agent controls the wallet
 * via the CDP API.
 *
 * Required env vars (set in .env):
 *   CDP_API_KEY_NAME        — from https://portal.cdp.coinbase.com
 *   CDP_API_KEY_PRIVATE_KEY — from https://portal.cdp.coinbase.com
 *   CDP_WALLET_ID           — from setup-cdp-wallet.ts first run
 *   CDP_WALLET_SEED         — from setup-cdp-wallet.ts first run
 *
 * Optional:
 *   BASESCAN_API_KEY        — for contract verification on Basescan
 *
 * Usage:
 *   npx tsx scripts/deploy-with-cdp.ts
 */

import { Coinbase, Wallet } from "@coinbase/coinbase-sdk";
import { createPublicClient, http, encodeDeployData, parseAbi } from "viem";
import { baseSepolia } from "viem/chains";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";

dotenv.config();

const {
  CDP_API_KEY_NAME,
  CDP_API_KEY_PRIVATE_KEY,
  CDP_WALLET_ID,
  CDP_WALLET_SEED,
  BASESCAN_API_KEY,
} = process.env;

// Validate env
const missing = ["CDP_API_KEY_NAME", "CDP_API_KEY_PRIVATE_KEY", "CDP_WALLET_ID", "CDP_WALLET_SEED"].filter(
  (k) => !process.env[k]
);
if (missing.length) {
  console.error(`\nERROR: Missing env vars: ${missing.join(", ")}`);
  console.error("Run 'npx tsx scripts/setup-cdp-wallet.ts' first.\n");
  process.exit(1);
}

// Load compiled artifact
const artifactPath = path.join(__dirname, "..", "artifacts", "contracts", "TrustCoat.sol", "TrustCoat.json");
if (!fs.existsSync(artifactPath)) {
  console.error(`\nERROR: Compiled artifact not found at ${artifactPath}`);
  console.error("Run 'npx hardhat compile' first.\n");
  process.exit(1);
}

const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));
const { abi, bytecode } = artifact;

async function main() {
  console.log("\n🚀 TrustCoat.sol Deployment via CDP Smart Wallet\n");

  // Configure CDP
  Coinbase.configure({
    apiKeyName: CDP_API_KEY_NAME!,
    privateKey: CDP_API_KEY_PRIVATE_KEY!.replace(/\\n/g, "\n"),
  });

  // Load wallet
  console.log("Loading CDP wallet...");
  const seed = JSON.parse(CDP_WALLET_SEED!);
  const wallet = await Wallet.fetch(CDP_WALLET_ID!);
  await wallet.setSeed(seed.seed);

  const defaultAddress = await wallet.getDefaultAddress();
  const deployerAddress = defaultAddress.getId() as `0x${string}`;
  console.log(`Deployer: ${deployerAddress}`);

  // Check balance via viem public client
  const publicClient = createPublicClient({
    chain: baseSepolia,
    transport: http("https://sepolia.base.org"),
  });

  const balance = await publicClient.getBalance({ address: deployerAddress });
  console.log(`Balance: ${Number(balance) / 1e18} ETH`);

  if (balance === 0n) {
    console.error("\n❌ Wallet has no ETH. Fund it first:");
    console.error(`   https://www.coinbase.com/faucets/base-ethereum-sepolia`);
    console.error(`   Address: ${deployerAddress}\n`);
    process.exit(1);
  }

  // Encode deployment bytecode (no constructor args)
  console.log("\nEncoding deployment data...");
  const deployData = encodeDeployData({
    abi,
    bytecode: bytecode as `0x${string}`,
    args: [],
  });

  // Get current nonce and gas estimate
  const nonce = await publicClient.getTransactionCount({ address: deployerAddress });
  const gasEstimate = await publicClient.estimateGas({
    account: deployerAddress,
    data: deployData,
  });
  const feeData = await publicClient.estimateFeesPerGas();

  console.log(`Nonce: ${nonce}`);
  console.log(`Gas estimate: ${gasEstimate}`);
  console.log(`Max fee: ${feeData.maxFeePerGas} wei`);

  // Build unsigned tx
  const unsignedTx = {
    to: null as null, // contract creation
    data: deployData,
    nonce,
    gas: (gasEstimate * 120n) / 100n, // 20% buffer
    maxFeePerGas: feeData.maxFeePerGas,
    maxPriorityFeePerGas: feeData.maxPriorityFeePerGas,
    chainId: baseSepolia.id,
    value: 0n,
    type: "eip1559" as const,
  };

  console.log("\nSigning and broadcasting via CDP...");

  // Use CDP wallet to sign and send
  // CDP SDK's transfer / invoke contract doesn't directly support arbitrary deployment
  // We use the SmartContract deploy feature
  const deployedContract = await wallet.deployContract({
    abi,
    bytecode: bytecode.startsWith("0x") ? bytecode : `0x${bytecode}`,
    args: [],
    constructorAbi: abi.find((e: any) => e.type === "constructor"),
  });

  await deployedContract.wait();

  const contractAddress = deployedContract.getContractAddress();
  const txHash = deployedContract.getTransaction()?.getTransactionHash();

  console.log(`\n✅ TrustCoat deployed!`);
  console.log(`   Address:  ${contractAddress}`);
  console.log(`   Tx hash:  ${txHash}`);
  console.log(`   Explorer: https://sepolia.basescan.org/address/${contractAddress}`);

  // Write deployed address
  const outputPath = path.join(__dirname, "..", "hackathon", "deployed-addresses.json");
  const existing = fs.existsSync(outputPath)
    ? JSON.parse(fs.readFileSync(outputPath, "utf8"))
    : {};

  const updated = {
    ...existing,
    TrustCoat: {
      address: contractAddress,
      network: "base-sepolia",
      chainId: baseSepolia.id,
      deployTx: txHash ?? null,
      deployer: deployerAddress,
      deployedAt: new Date().toISOString(),
      basescanUrl: `https://sepolia.basescan.org/address/${contractAddress}`,
      deployedVia: "CDP Smart Wallet",
    },
  };

  fs.writeFileSync(outputPath, JSON.stringify(updated, null, 2));
  console.log(`\n✅ Address saved to hackathon/deployed-addresses.json`);

  // Basescan verification (if API key available)
  if (BASESCAN_API_KEY) {
    console.log("\n⏳ Waiting 15s for Basescan indexing...");
    await new Promise((r) => setTimeout(r, 15000));

    const verifyRes = await fetch(
      `https://api-sepolia.basescan.org/api?module=contract&action=verifysourcecode`,
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          apikey: BASESCAN_API_KEY,
          module: "contract",
          action: "verifysourcecode",
          contractaddress: contractAddress,
          sourceCode: fs.readFileSync(
            path.join(__dirname, "..", "contracts", "TrustCoat.sol"),
            "utf8"
          ),
          codeformat: "solidity-single-file",
          contractname: "TrustCoat",
          compilerversion: "v0.8.24+commit.e11b9ed9",
          optimizationUsed: "1",
          runs: "200",
          licenseType: "3", // MIT
        }).toString(),
      }
    );

    const verifyData = await verifyRes.json();
    if (verifyData.status === "1") {
      console.log(`✅ Verification submitted (GUID: ${verifyData.result})`);
      console.log(`   Check: https://sepolia.basescan.org/address/${contractAddress}#code`);
    } else {
      console.warn(`⚠  Verification error: ${verifyData.result}`);
    }
  } else {
    console.log("\n⚠  No BASESCAN_API_KEY — skipping verification.");
    console.log(`   Verify manually: https://sepolia.basescan.org/address/${contractAddress}#code`);
  }

  console.log("\n📋 Next steps:");
  console.log(`   1. Add to .env: TRUST_COAT_ADDRESS=${contractAddress}`);
  console.log(`   2. Add to Vercel env vars: TRUST_COAT_ADDRESS=${contractAddress}`);
  console.log(`   3. Grant minter role to your backend wallet`);
  console.log(`   4. Update hackathon submission doc with this address`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
