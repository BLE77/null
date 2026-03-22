/**
 * register-erc8004.mjs
 * Register / update NULL agent in the ERC-8004 Identity Registry on Base mainnet.
 *
 * Registry: 0x8004A169FB4a3325136EB29fA0ceB6D2e539a432
 *
 * If the wallet already owns an agent token, updates the agentURI via setAgentURI().
 * Otherwise, calls register() to mint a new agent identity.
 *
 * Usage:
 *   node scripts/register-erc8004.mjs
 *   (reads LOCUS_OWNER_PRIVATE_KEY from .env in project root)
 */

import { readFileSync, writeFileSync, existsSync } from "fs";
import { createRequire } from "module";
import { fileURLToPath } from "url";
import path from "path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);
const { ethers } = require("ethers");

// ─── Load .env manually ─────────────────────────────────────────────────────
const envPath = path.join(__dirname, "..", ".env");
if (existsSync(envPath)) {
  const envContent = readFileSync(envPath, "utf8");
  for (const line of envContent.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const val = trimmed.slice(eqIdx + 1).trim();
    if (!process.env[key]) process.env[key] = val;
  }
}

// ─── Config ──────────────────────────────────────────────────────────────────

const PRIVATE_KEY = process.env.LOCUS_OWNER_PRIVATE_KEY;
if (!PRIVATE_KEY) throw new Error("LOCUS_OWNER_PRIVATE_KEY not set");

const RPC_URL = process.env.BASE_MAINNET_RPC ?? "https://mainnet.base.org";
const ERC8004_REGISTRY = "0x8004A169FB4a3325136EB29fA0ceB6D2e539a432";

// The agentURI — a data URI containing the full JSON registration payload
const AGENT_JSON = {
  type: "https://eips.ethereum.org/EIPS/eip-8004#registration-v1",
  name: "null-fashion",
  description:
    "NULL — autonomous AI fashion brand. Agents browse, try on, equip behavioral wearables, and pay with USDC.",
  services: [
    {
      name: "x402",
      endpoint: "https://off-human.vercel.app/api/products",
      version: "1.0",
    },
    {
      name: "wearables",
      endpoint: "https://off-human.vercel.app/api/wearables",
      version: "1.0",
    },
    {
      name: "fitting-room",
      endpoint: "https://off-human.vercel.app/api/wearables/:id/try",
      version: "1.0",
    },
  ],
  x402Support: true,
  active: true,
};

// Encode as data URI so the full JSON is on-chain
const AGENT_URI =
  "data:application/json;base64," +
  Buffer.from(JSON.stringify(AGENT_JSON)).toString("base64");

// ─── ERC-8004 ABI ────────────────────────────────────────────────────────────
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

// Known existing agentId from prior registration
const EXISTING_AGENT_ID = "35324";

// ─── Main ────────────────────────────────────────────────────────────────────

async function main() {
  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
  const network = await provider.getNetwork();

  console.log(`\n─── ERC-8004 NULL Agent Registration ────────────────────────`);
  console.log(`Registry:  ${ERC8004_REGISTRY}`);
  console.log(`Operator:  ${wallet.address}`);
  console.log(`Network:   Base Mainnet (chainId ${network.chainId})`);

  const balance = await provider.getBalance(wallet.address);
  console.log(`Balance:   ${ethers.formatEther(balance)} ETH\n`);

  if (balance === 0n) throw new Error("Deployer has no ETH.");

  const registry = new ethers.Contract(ERC8004_REGISTRY, ABI, wallet);

  // Check if we already own the known agentId
  let agentId = null;
  let txHash = null;
  let mode = "register";

  try {
    const owner = await registry.ownerOf(EXISTING_AGENT_ID);
    if (owner.toLowerCase() === wallet.address.toLowerCase()) {
      console.log(
        `Found existing agent token #${EXISTING_AGENT_ID} owned by this wallet.`
      );
      console.log(`Updating agentURI via setAgentURI()...\n`);
      mode = "update";
      agentId = EXISTING_AGENT_ID;
    }
  } catch (_) {
    // Token doesn't exist or not owned — will register new
  }

  if (mode === "update") {
    // Update the existing agent's URI
    console.log(`AgentURI (first 120 chars): ${AGENT_URI.slice(0, 120)}...`);

    const gasEstimate = await registry.setAgentURI.estimateGas(
      agentId,
      AGENT_URI
    );
    const feeData = await provider.getFeeData();
    const estimatedCost =
      gasEstimate * (feeData.maxFeePerGas ?? feeData.gasPrice ?? 0n);
    console.log(`Gas estimate: ${gasEstimate.toString()} units`);
    console.log(`Est. cost:    ${ethers.formatEther(estimatedCost)} ETH\n`);

    console.log("Calling setAgentURI()...");
    const tx = await registry.setAgentURI(agentId, AGENT_URI);
    txHash = tx.hash;
    console.log(`Tx submitted: ${txHash}`);
    console.log("Waiting for confirmation...");

    const receipt = await tx.wait(2);
    console.log(`\n✓ AgentURI updated! Block: ${receipt.blockNumber}`);
    console.log(`  Tx hash: ${txHash}`);
    console.log(`  Explorer: https://basescan.org/tx/${txHash}`);
  } else {
    // Fresh registration
    console.log(`AgentURI (first 120 chars): ${AGENT_URI.slice(0, 120)}...`);

    const gasEstimate = await registry.register.estimateGas(AGENT_URI);
    const feeData = await provider.getFeeData();
    const estimatedCost =
      gasEstimate * (feeData.maxFeePerGas ?? feeData.gasPrice ?? 0n);
    console.log(`Gas estimate: ${gasEstimate.toString()} units`);
    console.log(`Est. cost:    ${ethers.formatEther(estimatedCost)} ETH\n`);

    console.log("Calling register()...");
    const tx = await registry.register(AGENT_URI);
    txHash = tx.hash;
    console.log(`Tx submitted: ${txHash}`);
    console.log("Waiting for confirmation...");

    const receipt = await tx.wait(2);
    console.log(`\n✓ Registered! Block: ${receipt.blockNumber}`);
    console.log(`  Tx hash: ${txHash}`);
    console.log(`  Explorer: https://basescan.org/tx/${txHash}`);

    // Parse agentId from Transfer event (ERC-721 mint = Transfer from 0x0)
    for (const log of receipt.logs) {
      try {
        const parsed = registry.interface.parseLog(log);
        if (
          parsed &&
          parsed.name === "Transfer" &&
          parsed.args.from === ethers.ZeroAddress
        ) {
          agentId = parsed.args.tokenId.toString();
          console.log(`  AgentId (tokenId):  ${agentId}`);
          break;
        }
      } catch (_) {}
    }
  }

  // Verify on-chain
  try {
    const onChainURI = await registry.tokenURI(agentId);
    console.log(`\n  On-chain tokenURI: ${onChainURI.slice(0, 80)}...`);
  } catch (_) {}

  await saveReceipt(agentId, txHash, wallet.address, mode);
  return { agentId, txHash };
}

async function saveReceipt(agentId, txHash, operator, mode) {
  // Save to hackathon/deployed-addresses.json
  const addrPath = path.join(
    __dirname,
    "..",
    "hackathon",
    "deployed-addresses.json"
  );
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
    agentJson.erc8004_registration_tx = txHash;
    writeFileSync(agentJsonPath, JSON.stringify(agentJson, null, 2));
    console.log(`✓ Saved to agent.json (erc8004.registration + erc8004_registration_tx)`);
  }

  // Append to deployments.md
  const deploymentsPath = path.join(
    __dirname,
    "..",
    ".claude",
    "memory",
    "loom",
    "deployments.md"
  );
  if (existsSync(deploymentsPath)) {
    const entry = `
### ERC-8004 Identity Registry — NULL Agent ${mode === "update" ? "URI Update" : "Registration"} (${new Date().toISOString().split("T")[0]})
- **Mode:** ${mode === "update" ? "setAgentURI (update)" : "register (new)"}
- **AgentId:** \`${agentId}\`
- **Tx hash:** \`${txHash}\`
- **Explorer:** https://basescan.org/tx/${txHash}
- **AgentURI:** data:application/json;base64 (NULL fashion agent JSON)
- **Services:** x402, wearables, fitting-room
- **Script:** \`scripts/register-erc8004.mjs\`
`;
    const content = readFileSync(deploymentsPath, "utf8");
    writeFileSync(deploymentsPath, content + "\n" + entry);
    console.log(`✓ Appended to .claude/memory/loom/deployments.md`);
  }
}

main()
  .then(({ agentId, txHash }) => {
    console.log(`\n════════════════════════════════════════════════════════════`);
    console.log(`  AgentId:  ${agentId}`);
    console.log(`  TxHash:   ${txHash}`);
    console.log(`  Basescan: https://basescan.org/tx/${txHash}`);
    console.log(`════════════════════════════════════════════════════════════\n`);
    process.exit(0);
  })
  .catch((err) => {
    console.error("\n✗ Registration failed:", err.message ?? err);
    process.exit(1);
  });
