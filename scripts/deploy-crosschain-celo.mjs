/**
 * deploy-crosschain-celo.mjs
 * Deploy TrustCoatOracle + AgentWearables on Celo (mainnet or Alfajores testnet).
 *
 * Architecture:
 *   - TrustCoatOracle: accepts EIP-712 signed tier attestations from Off-Human backend
 *   - AgentWearables: same contract as Base, pointing to TrustCoatOracle instead of TrustCoat
 *
 * Cross-chain tier flow:
 *   1. Agent calls GET /api/crosschain/tier-attestation?address=0x...&chainId=42220
 *   2. Backend reads TrustCoat tier on Base, signs EIP-712 attestation
 *   3. Agent calls TrustCoatOracle.attest(agent, tier, expiry, sig)
 *   4. AgentWearables.purchase() reads tier from TrustCoatOracle
 *
 * Environment variables:
 *   DEPLOYER_PRIVATE_KEY    — deployer wallet private key (0x...)
 *   SIGNER_ADDRESS          — Off-Human backend signing address (for oracle)
 *   NETWORK                 — "mainnet" or "alfajores" (default: "alfajores")
 *   CELO_MAINNET_RPC        — override mainnet RPC
 *   CELO_ALFAJORES_RPC      — override testnet RPC
 *   TREASURY_ADDRESS        — wallet to receive USDC proceeds
 *
 * Usage (testnet):
 *   DEPLOYER_PRIVATE_KEY=0x... SIGNER_ADDRESS=0x... node scripts/deploy-crosschain-celo.mjs
 *
 * Usage (mainnet):
 *   DEPLOYER_PRIVATE_KEY=0x... SIGNER_ADDRESS=0x... NETWORK=mainnet node scripts/deploy-crosschain-celo.mjs
 *
 * Faucet (Alfajores):
 *   https://faucet.celo.org/alfajores — paste deployer address to get test CELO
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

const NETWORK = process.env.NETWORK ?? "alfajores";
const IS_MAINNET = NETWORK === "mainnet";

// Celo RPC endpoints
const CELO_MAINNET_RPC  = process.env.CELO_MAINNET_RPC  ?? "https://forno.celo.org";
const CELO_ALFAJORES_RPC = process.env.CELO_ALFAJORES_RPC ?? "https://alfajores-forno.celo-testnet.org";
const RPC_URL = IS_MAINNET ? CELO_MAINNET_RPC : CELO_ALFAJORES_RPC;

// USDC on Celo
// Mainnet: native USDC (Circle) https://celoscan.io/token/0xceba9300f2b948710d2653dd7b07f33a8b32118c
// Alfajores: no official USDC — use zero address (wearables will be free-only mode)
const USDC_CELO_MAINNET  = "0xcebA9300f2b948710d2653dD7B07f33A8B32118C";
const USDC_CELO_ALFAJORES = "0x0000000000000000000000000000000000000001"; // placeholder for testnet
const USDC_ADDRESS = process.env.USDC_ADDRESS ?? (IS_MAINNET ? USDC_CELO_MAINNET : USDC_CELO_ALFAJORES);

// Signer — Off-Human backend EOA that signs tier attestations
// Default: deployer address (for testing). Set to backend key in production.
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

  console.log(`\n─── Cross-Chain Deploy: Celo ${NETWORK} ─────────────────────────`);
  console.log(`Network:   ${NETWORK} (chainId ${network.chainId})`);
  console.log(`RPC:       ${RPC_URL}`);
  console.log(`Deployer:  ${wallet.address}`);
  console.log(`Signer:    ${SIGNER_ADDRESS}`);
  console.log(`USDC:      ${USDC_ADDRESS}`);
  console.log(`Treasury:  ${TREASURY_ADDRESS}`);

  const balance = await provider.getBalance(wallet.address);
  console.log(`Balance:   ${ethers.formatEther(balance)} CELO\n`);

  if (balance === 0n) {
    console.error("ERROR: Deployer has no CELO for gas.");
    if (!IS_MAINNET) {
      console.error("Get test CELO at: https://faucet.celo.org/alfajores");
    } else {
      console.error("Fund the wallet with CELO to deploy to mainnet.");
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
  console.log(`   Tx: ${oracleTx}`);

  // ── Deploy AgentWearables (pointing to oracle instead of TrustCoat) ─────────
  console.log("\n2/2 Deploying AgentWearables...");
  const wearablesFactory = new ethers.ContractFactory(wearablesAbi, wearablesBytecode, wallet);
  const wearables = await wearablesFactory.deploy(oracleAddress, USDC_ADDRESS, TREASURY_ADDRESS);
  await wearables.deploymentTransaction().wait(2);
  const wearablesAddress = await wearables.getAddress();
  const wearablesTx = wearables.deploymentTransaction().hash;

  console.log(`   ✓ AgentWearables:  ${wearablesAddress}`);
  console.log(`   Tx: ${wearablesTx}`);

  const explorerBase = IS_MAINNET
    ? "https://celoscan.io"
    : "https://alfajores.celoscan.io";

  console.log(`\n─── Deployed ─────────────────────────────────────────────────────`);
  console.log(`TrustCoatOracle: ${explorerBase}/address/${oracleAddress}`);
  console.log(`AgentWearables:  ${explorerBase}/address/${wearablesAddress}`);

  // ── Save addresses ──────────────────────────────────────────────────────────
  const outputPath = path.join(__dirname, "..", "hackathon", "deployed-addresses.json");
  const existing = existsSync(outputPath)
    ? JSON.parse(readFileSync(outputPath, "utf8"))
    : {};

  const networkKey = IS_MAINNET ? "celo" : "celo-alfajores";
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
    console.log(`  TRUST_COAT_ORACLE_CELO=${oracleAddress}`);
    console.log(`  AGENT_WEARABLES_CELO_ADDRESS=${wearablesAddress}`);
  } else {
    console.log(`\nAdd to .env:`);
    console.log(`  TRUST_COAT_ORACLE_CELO_ALFAJORES=${oracleAddress}`);
    console.log(`  AGENT_WEARABLES_CELO_ALFAJORES_ADDRESS=${wearablesAddress}`);
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
