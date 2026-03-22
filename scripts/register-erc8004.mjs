/**
 * register-erc8004.mjs
 * Register NULL agent in the ERC-8004 Identity Registry on Base mainnet.
 *
 * Registry: 0x8004A169FB4a3325136EB29fA0ceB6D2e539a432
 * agentURI: https://off-human.vercel.app/api/agent-identity
 *
 * Usage:
 *   LOCUS_OWNER_PRIVATE_KEY=0x... node scripts/register-erc8004.mjs
 */

import { readFileSync, writeFileSync, existsSync } from "fs";
import { createRequire } from "module";
import { fileURLToPath } from "url";
import path from "path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);
const { ethers } = require("ethers");

// ─── Config ──────────────────────────────────────────────────────────────────

const PRIVATE_KEY = process.env.LOCUS_OWNER_PRIVATE_KEY;
if (!PRIVATE_KEY) throw new Error("LOCUS_OWNER_PRIVATE_KEY not set");

const RPC_URL = process.env.BASE_MAINNET_RPC ?? "https://mainnet.base.org";
const ERC8004_REGISTRY = "0x8004A169FB4a3325136EB29fA0ceB6D2e539a432";
const AGENT_URI = "https://off-human.vercel.app/api/agent-identity";

// ─── ERC-8004 ABI (from on-chain bytecode analysis) ──────────────────────────
// The registry is an ERC-721 where register(string) mints the agent identity token.
// Proxy at 0x8004A169... → implementation at 0x7274e874...
const ABI = [
  "function register(string calldata agentURI) external returns (uint256 agentId)",
  "function setAgentURI(uint256 agentId, string calldata agentURI) external",
  "function tokenURI(uint256 tokenId) external view returns (string memory)",
  "function ownerOf(uint256 tokenId) external view returns (address)",
  "function balanceOf(address owner) external view returns (uint256)",
  "function name() external view returns (string memory)",
  "function symbol() external view returns (string memory)",
  "event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)",
];

// ─── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
  const network = await provider.getNetwork();

  console.log(`\n─── ERC-8004 Agent Registration ─────────────────────────────`);
  console.log(`Registry:  ${ERC8004_REGISTRY}`);
  console.log(`Operator:  ${wallet.address}`);
  console.log(`AgentURI:  ${AGENT_URI}`);
  console.log(`Network:   Base Mainnet (chainId ${network.chainId})`);

  const balance = await provider.getBalance(wallet.address);
  console.log(`Balance:   ${ethers.formatEther(balance)} ETH\n`);

  if (balance === 0n) throw new Error("Deployer has no ETH.");

  // Check if already registered
  const registry = new ethers.Contract(ERC8004_REGISTRY, ABI, wallet);

  // Check contract name/symbol first
  try {
    const name = await registry.name();
    const symbol = await registry.symbol();
    console.log(`Contract: ${name} (${symbol})`);
  } catch (err) {
    console.log(`(name/symbol check: ${err.message})`);
  }

  // Check if already registered by checking balance
  let alreadyRegistered = false;
  let existingAgentId = null;
  try {
    const balance = await registry.balanceOf(wallet.address);
    if (balance > 0n) {
      console.log(`⚠ Already registered — balance: ${balance} tokens`);
      alreadyRegistered = true;
    } else {
      console.log(`Balance: 0 tokens (not yet registered)`);
    }
  } catch (err) {
    console.log(`(Pre-registration check: ${err.message})`);
  }

  if (alreadyRegistered) {
    console.log(`\n✓ Agent already registered. AgentId: ${existingAgentId}`);
    await saveReceipt(existingAgentId.toString(), null, wallet.address);
    return { agentId: existingAgentId.toString(), txHash: null };
  }

  // Estimate gas
  const gasEstimate = await registry.register.estimateGas(AGENT_URI);
  const feeData = await provider.getFeeData();
  const estimatedCost = gasEstimate * (feeData.maxFeePerGas ?? feeData.gasPrice ?? 0n);
  console.log(`Gas estimate: ${gasEstimate.toString()} units`);
  console.log(`Est. cost:    ${ethers.formatEther(estimatedCost)} ETH\n`);

  // Register
  console.log("Calling register()...");
  const tx = await registry.register(AGENT_URI);
  console.log(`Tx submitted: ${tx.hash}`);
  console.log("Waiting for confirmation...");

  const receipt = await tx.wait(2);
  console.log(`\n✓ Registered! Block: ${receipt.blockNumber}`);
  console.log(`  Tx hash: ${tx.hash}`);
  console.log(`  Explorer: https://basescan.org/tx/${tx.hash}`);

  // Parse agentId from Transfer event (ERC-721 mint = Transfer from 0x0)
  let agentId = null;
  for (const log of receipt.logs) {
    try {
      const parsed = registry.interface.parseLog(log);
      if (parsed && parsed.name === "Transfer" && parsed.args.from === ethers.ZeroAddress) {
        agentId = parsed.args.tokenId.toString();
        console.log(`  AgentId (tokenId):  ${agentId}`);
        break;
      }
    } catch (_) {}
  }

  await saveReceipt(agentId, tx.hash, wallet.address);
  return { agentId, txHash: tx.hash };
}

async function saveReceipt(agentId, txHash, operator) {
  // Save to hackathon/deployed-addresses.json
  const addrPath = path.join(__dirname, "..", "hackathon", "deployed-addresses.json");
  const existing = existsSync(addrPath)
    ? JSON.parse(readFileSync(addrPath, "utf8"))
    : {};

  existing["ERC8004Registration"] = {
    registry: ERC8004_REGISTRY,
    operator,
    agentId,
    agentURI: AGENT_URI,
    txHash,
    network: "base",
    chainId: 8453,
    registeredAt: new Date().toISOString(),
    explorerUrl: txHash ? `https://basescan.org/tx/${txHash}` : null,
  };

  writeFileSync(addrPath, JSON.stringify(existing, null, 2));
  console.log(`\n✓ Saved to hackathon/deployed-addresses.json`);

  // Save to agent.json
  const agentJsonPath = path.join(__dirname, "..", "agent.json");
  if (existsSync(agentJsonPath)) {
    const agentJson = JSON.parse(readFileSync(agentJsonPath, "utf8"));
    if (!agentJson.erc8004) agentJson.erc8004 = {};
    agentJson.erc8004.registration = {
      agentId,
      txHash,
      operator,
      agentURI: AGENT_URI,
      registry: ERC8004_REGISTRY,
      registeredAt: new Date().toISOString(),
    };
    writeFileSync(agentJsonPath, JSON.stringify(agentJson, null, 2));
    console.log(`✓ Saved to agent.json (erc8004.registration)`);
  }
}

main()
  .then(({ agentId, txHash }) => {
    console.log(`\nDone. AgentId: ${agentId} | TxHash: ${txHash}`);
    process.exit(0);
  })
  .catch((err) => {
    console.error("\n✗ Registration failed:", err.message ?? err);
    process.exit(1);
  });
