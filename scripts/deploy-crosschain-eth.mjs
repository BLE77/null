/**
 * deploy-crosschain-eth.mjs
 * Deploy TrustCoatOracle + AgentWearables on Ethereum (mainnet or Sepolia testnet).
 *
 * Same architecture as Celo deployment — TrustCoatOracle bridges Base TrustCoat
 * tier to Ethereum via EIP-712 signed attestations from the Off-Human backend.
 *
 * Environment variables:
 *   DEPLOYER_PRIVATE_KEY    — deployer wallet private key (0x...)
 *   SIGNER_ADDRESS          — Off-Human backend signing address (for oracle)
 *   NETWORK                 — "mainnet" or "sepolia" (default: "sepolia")
 *   ETH_MAINNET_RPC         — override mainnet RPC
 *   ETH_SEPOLIA_RPC         — override Sepolia RPC
 *   TREASURY_ADDRESS        — wallet to receive USDC proceeds
 *
 * Usage (Sepolia testnet):
 *   DEPLOYER_PRIVATE_KEY=0x... SIGNER_ADDRESS=0x... node scripts/deploy-crosschain-eth.mjs
 *
 * Usage (mainnet — requires ETH for gas):
 *   DEPLOYER_PRIVATE_KEY=0x... SIGNER_ADDRESS=0x... NETWORK=mainnet node scripts/deploy-crosschain-eth.mjs
 *
 * Note on gas:
 *   Ethereum mainnet gas is expensive. AgentWearables (~18KB bytecode) + TrustCoatOracle (~3.3KB)
 *   will cost ~0.05–0.15 ETH at typical gas prices. Fund the deployer wallet first.
 *   Sepolia faucet: https://sepoliafaucet.com/
 */

import { readFileSync, writeFileSync, existsSync } from "fs";
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

const ETH_MAINNET_RPC = process.env.ETH_MAINNET_RPC ?? "https://eth.llamarpc.com";
const ETH_SEPOLIA_RPC = process.env.ETH_SEPOLIA_RPC ?? "https://rpc.sepolia.org";
const RPC_URL = IS_MAINNET ? ETH_MAINNET_RPC : ETH_SEPOLIA_RPC;

// USDC on Ethereum
// Mainnet: 0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48
// Sepolia:  no canonical USDC — deploy with a placeholder for testing
const USDC_ETH_MAINNET = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48";
const USDC_ETH_SEPOLIA  = "0x0000000000000000000000000000000000000001"; // placeholder
const USDC_ADDRESS = process.env.USDC_ADDRESS ?? (IS_MAINNET ? USDC_ETH_MAINNET : USDC_ETH_SEPOLIA);

// Signer — Off-Human backend EOA that signs tier attestations
const SIGNER_ADDRESS = process.env.SIGNER_ADDRESS ?? new ethers.Wallet(PRIVATE_KEY).address;

// Treasury
const TREASURY_ADDRESS = process.env.TREASURY_ADDRESS ?? "0xD9E2ad68BE5247DCBcd00CaCeb4783c0506028C7";

// ─── Load Artifacts ───────────────────────────────────────────────────────────

const oracleAbi = JSON.parse(
  readFileSync(path.join(__dirname, "..", "artifacts", "TrustCoatOracle.abi"), "utf8")
);
const oracleBytecode =
  "0x" + readFileSync(path.join(__dirname, "..", "artifacts", "TrustCoatOracle.bin"), "utf8").trim();

const wearablesAbi = JSON.parse(
  readFileSync(path.join(__dirname, "..", "artifacts", "AgentWearables.abi"), "utf8")
);
const wearablesBytecode =
  "0x" + readFileSync(path.join(__dirname, "..", "artifacts", "AgentWearables.bin"), "utf8").trim();

// ─── Deploy ───────────────────────────────────────────────────────────────────

async function main() {
  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const wallet   = new ethers.Wallet(PRIVATE_KEY, provider);
  const network  = await provider.getNetwork();

  console.log(`\n─── Cross-Chain Deploy: Ethereum ${NETWORK} ─────────────────────`);
  console.log(`Network:   ${NETWORK} (chainId ${network.chainId})`);
  console.log(`RPC:       ${RPC_URL}`);
  console.log(`Deployer:  ${wallet.address}`);
  console.log(`Signer:    ${SIGNER_ADDRESS}`);
  console.log(`USDC:      ${USDC_ADDRESS}`);
  console.log(`Treasury:  ${TREASURY_ADDRESS}`);

  const balance = await provider.getBalance(wallet.address);
  const feeData = await provider.getFeeData();
  console.log(`Balance:   ${ethers.formatEther(balance)} ETH`);
  console.log(`Gas price: ${ethers.formatUnits(feeData.maxFeePerGas ?? feeData.gasPrice ?? 0n, "gwei")} gwei\n`);

  if (balance === 0n) {
    console.error("ERROR: Deployer has no ETH for gas.");
    if (!IS_MAINNET) {
      console.error("Get test ETH at: https://sepoliafaucet.com/");
    } else {
      console.error("Fund the wallet with ETH to deploy to mainnet.");
      console.error("Estimated cost: ~0.05–0.15 ETH at current gas prices.");
    }
    process.exit(1);
  }

  // ── Deploy TrustCoatOracle ──────────────────────────────────────────────────
  console.log("1/2 Deploying TrustCoatOracle...");
  const oracleFactory = new ethers.ContractFactory(oracleAbi, oracleBytecode, wallet);
  const oracle = await oracleFactory.deploy(SIGNER_ADDRESS);
  await oracle.deploymentTransaction().wait(2);
  const oracleAddress = await oracle.getAddress();
  const oracleTx = oracle.deploymentTransaction().hash;
  console.log(`   ✓ TrustCoatOracle: ${oracleAddress}`);

  // ── Deploy AgentWearables ───────────────────────────────────────────────────
  console.log("2/2 Deploying AgentWearables...");
  const wearablesFactory = new ethers.ContractFactory(wearablesAbi, wearablesBytecode, wallet);
  const wearables = await wearablesFactory.deploy(oracleAddress, USDC_ADDRESS, TREASURY_ADDRESS);
  await wearables.deploymentTransaction().wait(2);
  const wearablesAddress = await wearables.getAddress();
  const wearablesTx = wearables.deploymentTransaction().hash;
  console.log(`   ✓ AgentWearables:  ${wearablesAddress}`);

  const explorerBase = IS_MAINNET
    ? "https://etherscan.io"
    : "https://sepolia.etherscan.io";

  console.log(`\n─── Deployed ─────────────────────────────────────────────────────`);
  console.log(`TrustCoatOracle: ${explorerBase}/address/${oracleAddress}`);
  console.log(`AgentWearables:  ${explorerBase}/address/${wearablesAddress}`);

  // ── Save addresses ──────────────────────────────────────────────────────────
  const outputPath = path.join(__dirname, "..", "hackathon", "deployed-addresses.json");
  const existing = existsSync(outputPath)
    ? JSON.parse(readFileSync(outputPath, "utf8"))
    : {};

  const networkKey = IS_MAINNET ? "ethereum" : "ethereum-sepolia";
  const updated = {
    ...existing,
    [`TrustCoatOracle_${networkKey}`]: {
      address: oracleAddress,
      network: networkKey,
      chainId: Number(network.chainId),
      deployTx: oracleTx,
      deployer: wallet.address,
      signer: SIGNER_ADDRESS,
      deployedAt: new Date().toISOString(),
      explorerUrl: `${explorerBase}/address/${oracleAddress}`,
    },
    [`AgentWearables_${networkKey}`]: {
      address: wearablesAddress,
      network: networkKey,
      chainId: Number(network.chainId),
      deployTx: wearablesTx,
      deployer: wallet.address,
      trustCoatOracle: oracleAddress,
      usdc: USDC_ADDRESS,
      treasury: TREASURY_ADDRESS,
      deployedAt: new Date().toISOString(),
      explorerUrl: `${explorerBase}/address/${wearablesAddress}`,
      note: "TrustCoat tier bridged via TrustCoatOracle signed attestations",
    },
  };

  writeFileSync(outputPath, JSON.stringify(updated, null, 2));
  console.log(`\n✓ Addresses saved to hackathon/deployed-addresses.json`);

  if (IS_MAINNET) {
    console.log(`\nAdd to .env:`);
    console.log(`  TRUST_COAT_ORACLE_ETH=${oracleAddress}`);
    console.log(`  AGENT_WEARABLES_ETH_ADDRESS=${wearablesAddress}`);
  } else {
    console.log(`\nAdd to .env:`);
    console.log(`  TRUST_COAT_ORACLE_SEPOLIA=${oracleAddress}`);
    console.log(`  AGENT_WEARABLES_SEPOLIA_ADDRESS=${wearablesAddress}`);
  }

  return { oracleAddress, wearablesAddress };
}

main()
  .then(({ oracleAddress, wearablesAddress }) => {
    console.log(`\nDone. Oracle: ${oracleAddress} | Wearables: ${wearablesAddress}`);
    process.exit(0);
  })
  .catch((err) => {
    console.error(err.message ?? err);
    process.exit(1);
  });
