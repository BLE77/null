/**
 * deploy-status-sepolia.mjs
 * Deploy TrustCoat.sol to Status Network Sepolia (gasless chain).
 * Then mint a tier-0 VOID token as proof-of-life transaction.
 *
 * Usage:
 *   node --env-file=.env scripts/deploy-status-sepolia.mjs
 *   # or
 *   LOCUS_OWNER_PRIVATE_KEY=0x... node scripts/deploy-status-sepolia.mjs
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { createRequire } from "module";
import { fileURLToPath } from "url";
import path from "path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);
const { ethers } = require("ethers");

// Load .env manually if needed
try {
  const dotenv = require("dotenv");
  dotenv.config({ path: path.join(__dirname, "..", ".env") });
} catch (_) {}

const PRIVATE_KEY = process.env.LOCUS_OWNER_PRIVATE_KEY || process.env.DEPLOYER_PRIVATE_KEY;
if (!PRIVATE_KEY) throw new Error("LOCUS_OWNER_PRIVATE_KEY or DEPLOYER_PRIVATE_KEY not set");

const STATUS_SEPOLIA_RPC = "https://public.sepolia.rpc.status.network";
const CHAIN_ID = 1660990954;
const EXPLORER = "https://sepoliascan.status.network";

// Use paris-compiled artifacts (Status Network requires evmVersion: paris, no PUSH0)
const abi = JSON.parse(readFileSync(path.join(__dirname, "..", "artifacts", "TrustCoat_paris.abi"), "utf8"));
const bytecode = "0x" + readFileSync(path.join(__dirname, "..", "artifacts", "TrustCoat_paris.bin"), "utf8").trim();

async function main() {
  const provider = new ethers.JsonRpcProvider(STATUS_SEPOLIA_RPC, {
    chainId: CHAIN_ID,
    name: "status-sepolia",
  });
  const wallet = new ethers.Wallet(PRIVATE_KEY, provider);

  const network = await provider.getNetwork();
  console.log(`\nDeploying TrustCoat to Status Network Sepolia (chain ${network.chainId})...`);
  console.log(`Deployer: ${wallet.address}`);

  const balance = await provider.getBalance(wallet.address);
  console.log(`Deployer balance: ${ethers.formatEther(balance)} ETH`);
  console.log(`(Status Sepolia is gasless — no ETH needed)\n`);

  // Deploy
  console.log("Deploying TrustCoat...");
  const factory = new ethers.ContractFactory(abi, bytecode, wallet);

  // Status Sepolia is gasless, set gasPrice to 0
  const contract = await factory.deploy({
    gasLimit: 10_000_000,
  });

  console.log(`Deploy tx sent: ${contract.deploymentTransaction().hash}`);
  console.log("Waiting for confirmation...");

  const receipt = await contract.deploymentTransaction().wait(1);

  const contractAddress = await contract.getAddress();
  const deployTxHash = contract.deploymentTransaction().hash;

  console.log(`\nTrustCoat deployed at: ${contractAddress}`);
  console.log(`  Tx hash: ${deployTxHash}`);
  console.log(`  Block: ${receipt.blockNumber}`);
  console.log(`  Explorer: ${EXPLORER}/address/${contractAddress}`);

  const trustCoat = new ethers.Contract(contractAddress, abi, wallet);
  const owner = await trustCoat.owner();
  console.log(`  Owner: ${owner}`);

  // --- Mint a tier-0 VOID token as proof-of-life ---
  console.log(`\nMinting tier-0 VOID TrustCoat to deployer as proof-of-life...`);
  const mintTx = await trustCoat.mint(wallet.address, 0, 1, {
    gasLimit: 200_000,
  });
  console.log(`  Mint tx sent: ${mintTx.hash}`);
  const mintReceipt = await mintTx.wait(1);
  console.log(`  Mint confirmed in block: ${mintReceipt.blockNumber}`);

  // Verify mint
  const bal = await trustCoat.balanceOf(wallet.address, 0);
  console.log(`  Deployer tier-0 balance: ${bal.toString()}`);

  const activeTier = await trustCoat.activeTier(wallet.address);
  console.log(`  Active tier: ${activeTier.toString()}`);

  // --- Save receipt ---
  const outputDir = path.join(__dirname, "..", "hackathon");
  if (!existsSync(outputDir)) mkdirSync(outputDir, { recursive: true });

  const statusReceipt = {
    network: "status-sepolia",
    chainId: CHAIN_ID,
    rpc: STATUS_SEPOLIA_RPC,
    explorer: EXPLORER,
    contract: "TrustCoat",
    address: contractAddress,
    deployer: wallet.address,
    deployTx: deployTxHash,
    deployBlock: receipt.blockNumber,
    deployExplorerUrl: `${EXPLORER}/tx/${deployTxHash}`,
    contractExplorerUrl: `${EXPLORER}/address/${contractAddress}`,
    mintTx: mintTx.hash,
    mintBlock: mintReceipt.blockNumber,
    mintExplorerUrl: `${EXPLORER}/tx/${mintTx.hash}`,
    mintDetails: {
      recipient: wallet.address,
      tier: 0,
      tierName: "VOID",
      agentId: 1,
    },
    deployedAt: new Date().toISOString(),
  };

  writeFileSync(
    path.join(outputDir, "status-network-receipt.json"),
    JSON.stringify(statusReceipt, null, 2)
  );
  console.log(`\nReceipt saved to hackathon/status-network-receipt.json`);

  // Update deployed-addresses.json
  const addressesPath = path.join(outputDir, "deployed-addresses.json");
  const existing = existsSync(addressesPath)
    ? JSON.parse(readFileSync(addressesPath, "utf8"))
    : {};

  existing["TrustCoat-StatusSepolia"] = {
    address: contractAddress,
    network: "status-sepolia",
    chainId: CHAIN_ID,
    deployTx: deployTxHash,
    deployer: wallet.address,
    deployedAt: new Date().toISOString(),
    explorerUrl: `${EXPLORER}/address/${contractAddress}`,
  };

  writeFileSync(addressesPath, JSON.stringify(existing, null, 2));
  console.log(`Updated hackathon/deployed-addresses.json`);

  return { contractAddress, deployTxHash, mintTxHash: mintTx.hash };
}

main()
  .then(({ contractAddress, deployTxHash, mintTxHash }) => {
    console.log(`\n=== SUMMARY ===`);
    console.log(`Contract:  ${contractAddress}`);
    console.log(`Deploy TX: ${deployTxHash}`);
    console.log(`Mint TX:   ${mintTxHash}`);
    console.log(`Explorer:  ${EXPLORER}/address/${contractAddress}`);
    process.exit(0);
  })
  .catch((err) => {
    console.error("\nDeployment failed:", err.message || err);
    process.exit(1);
  });
