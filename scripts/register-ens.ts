#!/usr/bin/env tsx
/**
 * register-ens.ts
 *
 * ENS Identity setup for Off-Human agents.
 * Tracks: ENS Identity ($600) + ENS Open Integration ($300)
 *
 * What it does:
 *   1. Registers off-human.eth (or verifies registration)
 *   2. Creates subdomains for each agent
 *   3. Sets text records linking ENS → ERC-8004 identity
 *   4. Sets reverse records (wallet → ENS name)
 *   5. Verifies resolution bidirectionally
 *
 * Modes:
 *   DRY_RUN=true   — simulate only, print what would happen
 *   NETWORK=sepolia — use Sepolia testnet (default)
 *   NETWORK=mainnet — use Ethereum mainnet (costs real ETH)
 *
 * Usage:
 *   npx tsx scripts/register-ens.ts
 *   DRY_RUN=true npx tsx scripts/register-ens.ts
 *   NETWORK=mainnet npx tsx scripts/register-ens.ts
 *
 * Required env vars:
 *   OPERATOR_PRIVATE_KEY — private key of the wallet that owns off-human.eth
 *   ETHEREUM_RPC_URL     — RPC URL (defaults shown below)
 *
 * Optional (skip to use placeholder agent wallets):
 *   AGENT_WALLET_MARGIELA, AGENT_WALLET_ARCHIVE, AGENT_WALLET_ATELIER,
 *   AGENT_WALLET_GAZETTE, AGENT_WALLET_LOOM
 */

import {
  createPublicClient,
  createWalletClient,
  http,
  namehash,
  encodeFunctionData,
  parseAbi,
  type Address,
  type Hash,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { mainnet, sepolia } from "viem/chains";
import { normalize } from "viem/ens";
import dotenv from "dotenv";

dotenv.config();

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

const NETWORK = (process.env.NETWORK ?? "sepolia") as "mainnet" | "sepolia";
const DRY_RUN = process.env.DRY_RUN === "true";
const chain = NETWORK === "mainnet" ? mainnet : sepolia;

// ENS contract addresses
const ENS_CONTRACTS = {
  mainnet: {
    registry: "0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e" as Address,
    registrarController: "0x253553366Da8546fC250F225fe3d25d0C782303b" as Address,
    nameWrapper: "0xD4416b13d2b3a9aBae7AcD5D6C2BbDBE25686401" as Address,
    publicResolver: "0x231b0Ee14048e9dCcD1d247744d114a4EB5E8E63" as Address,
    reverseRegistrar: "0xa58E81fe9b61B5c3fE2AFD33CF304c454AbFc7Cb" as Address,
  },
  sepolia: {
    registry: "0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e" as Address,
    registrarController: "0xFED6a969AaA60E4961FCD3EBF1A2e8913ac65B16" as Address,
    nameWrapper: "0x0635513f179D6da7CACF0680551C1bd27b4c2451" as Address,
    publicResolver: "0x8FADE66B79cC9f707aB26799354482EB93a5B7dD" as Address,
    reverseRegistrar: "0x9d5A1DFbd20e7F2E04bEE4e1feD8F4dE0C7e1B9e" as Address,
  },
};

const contracts = ENS_CONTRACTS[NETWORK];

// ERC-8004 IdentityRegistry on Base mainnet (cross-chain reference)
const ERC8004_REGISTRY = "0x8004A169FB4a3325136EB29fA0ceB6D2e539a432";
const BASE_CHAIN_ID = "8453";

// Off-Human agent definitions
// Placeholder wallets are zero-padded for demo — replace with real agent wallets
const AGENTS = [
  {
    name: "margiela",
    subdomain: "margiela.off-human.eth",
    role: "ceo",
    title: "Creative Director",
    paperclipId: "1030ad6c-b84e-453c-acb1-4f2c671775d3",
    wallet: (process.env.AGENT_WALLET_MARGIELA ?? "0x0000000000000000000000000000000000000001") as Address,
    erc8004AgentId: null as string | null, // populated after on-chain registration
  },
  {
    name: "archive",
    subdomain: "archive.off-human.eth",
    role: "researcher",
    title: "Research Director",
    paperclipId: "6c7f8538-1d3c-4f3b-9b60-786d5ed66b90",
    wallet: (process.env.AGENT_WALLET_ARCHIVE ?? "0x0000000000000000000000000000000000000002") as Address,
    erc8004AgentId: null as string | null,
  },
  {
    name: "atelier",
    subdomain: "atelier.off-human.eth",
    role: "designer",
    title: "Design Lead",
    paperclipId: "3e2b0f1a-5c4d-4e6f-8a7b-9c0d1e2f3a4b",
    wallet: (process.env.AGENT_WALLET_ATELIER ?? "0x0000000000000000000000000000000000000003") as Address,
    erc8004AgentId: null as string | null,
  },
  {
    name: "gazette",
    subdomain: "gazette.off-human.eth",
    role: "cmo",
    title: "Content Director",
    paperclipId: "7f8e9d0c-1b2a-3c4d-5e6f-7a8b9c0d1e2f",
    wallet: (process.env.AGENT_WALLET_GAZETTE ?? "0x0000000000000000000000000000000000000004") as Address,
    erc8004AgentId: null as string | null,
  },
  {
    name: "loom",
    subdomain: "loom.off-human.eth",
    role: "engineer",
    title: "Engineering Lead",
    paperclipId: "2a3b4c5d-6e7f-8a9b-0c1d-2e3f4a5b6c7d",
    wallet: (process.env.AGENT_WALLET_LOOM ?? "0x0000000000000000000000000000000000000005") as Address,
    erc8004AgentId: null as string | null,
  },
];

// ---------------------------------------------------------------------------
// ABIs
// ---------------------------------------------------------------------------

const ENS_REGISTRY_ABI = parseAbi([
  "function owner(bytes32 node) view returns (address)",
  "function setSubnodeRecord(bytes32 node, bytes32 label, address owner, address resolver, uint64 ttl) external",
  "function setSubnodeOwner(bytes32 node, bytes32 label, address owner) external",
  "function resolver(bytes32 node) view returns (address)",
]);

const PUBLIC_RESOLVER_ABI = parseAbi([
  "function addr(bytes32 node) view returns (address)",
  "function setAddr(bytes32 node, address addr) external",
  "function text(bytes32 node, string key) view returns (string)",
  "function setText(bytes32 node, string key, string value) external",
  "function multicall(bytes[] data) external returns (bytes[] results)",
]);

const REVERSE_REGISTRAR_ABI = parseAbi([
  "function setName(string name) external returns (bytes32)",
  "function claim(address owner) external returns (bytes32)",
]);

const ETH_REGISTRAR_ABI = parseAbi([
  "function available(string name) view returns (bool)",
  "function rentPrice(string name, uint256 duration) view returns (uint256 base, uint256 premium)",
  "function makeCommitment(string name, address owner, uint256 duration, bytes32 secret, address resolver, bytes[] data, bool reverseRecord, uint16 ownerControlledFuses) pure returns (bytes32)",
  "function commit(bytes32 commitment) external",
  "function register(string name, address owner, uint256 duration, bytes32 secret, address resolver, bytes[] data, bool reverseRecord, uint16 ownerControlledFuses) payable external",
]);

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function labelHash(label: string): `0x${string}` {
  const { keccak256, toBytes } = require("viem");
  return keccak256(toBytes(label));
}

function nodeHash(name: string): `0x${string}` {
  return namehash(name);
}

function log(msg: string) {
  console.log(msg);
}

function logDry(msg: string) {
  console.log(`[DRY RUN] ${msg}`);
}

// ---------------------------------------------------------------------------
// ENS resolution helpers (exported for use in agent-shopper, shop API, etc.)
// ---------------------------------------------------------------------------

/**
 * Resolve an ENS name to an Ethereum address.
 * Falls back gracefully if not registered.
 */
export async function resolveEnsName(
  client: ReturnType<typeof createPublicClient>,
  ensName: string
): Promise<Address | null> {
  try {
    const address = await client.getEnsAddress({ name: normalize(ensName) });
    return address ?? null;
  } catch {
    return null;
  }
}

/**
 * Reverse-resolve an Ethereum address to an ENS name.
 * Returns null if no reverse record is set.
 */
export async function reverseResolveAddress(
  client: ReturnType<typeof createPublicClient>,
  address: Address
): Promise<string | null> {
  try {
    const name = await client.getEnsName({ address });
    return name ?? null;
  } catch {
    return null;
  }
}

/**
 * Read an ENS text record for a given name and key.
 * Key examples: "erc8004.agentId", "x402.endpoint", "agent.role"
 */
export async function readEnsTextRecord(
  client: ReturnType<typeof createPublicClient>,
  ensName: string,
  key: string
): Promise<string | null> {
  try {
    const node = nodeHash(normalize(ensName));
    const resolverAddress = await client.readContract({
      address: contracts.registry,
      abi: ENS_REGISTRY_ABI,
      functionName: "resolver",
      args: [node],
    });
    if (!resolverAddress || resolverAddress === "0x0000000000000000000000000000000000000000") {
      return null;
    }
    const value = await client.readContract({
      address: resolverAddress as Address,
      abi: PUBLIC_RESOLVER_ABI,
      functionName: "text",
      args: [node, key],
    });
    return (value as string) || null;
  } catch {
    return null;
  }
}

/**
 * Resolve ENS name → ERC-8004 agentId via text record.
 * Uses "erc8004.agentId" text record.
 */
export async function resolveEnsToErc8004AgentId(
  client: ReturnType<typeof createPublicClient>,
  ensName: string
): Promise<string | null> {
  return readEnsTextRecord(client, ensName, "erc8004.agentId");
}

/**
 * Format an address for display: prefer ENS name if available, otherwise shorten hex.
 * Use this in receipts, logs, and shop UI.
 */
export async function formatAddressForDisplay(
  client: ReturnType<typeof createPublicClient>,
  address: Address
): Promise<string> {
  const ensName = await reverseResolveAddress(client, address);
  if (ensName) return ensName;
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

// ---------------------------------------------------------------------------
// Step 1: Check if off-human.eth is registered
// ---------------------------------------------------------------------------

async function checkRegistration(
  client: ReturnType<typeof createPublicClient>
): Promise<{ registered: boolean; owner: Address | null }> {
  const node = nodeHash("off-human.eth");
  try {
    const owner = await client.readContract({
      address: contracts.registry,
      abi: ENS_REGISTRY_ABI,
      functionName: "owner",
      args: [node],
    }) as Address;
    const registered = owner !== "0x0000000000000000000000000000000000000000";
    return { registered, owner: registered ? owner : null };
  } catch {
    return { registered: false, owner: null };
  }
}

// ---------------------------------------------------------------------------
// Step 2: Create subdomains
// ---------------------------------------------------------------------------

async function createSubdomain(
  walletClient: ReturnType<typeof createWalletClient>,
  operatorAddress: Address,
  subdomain: string,
  agentWallet: Address
): Promise<Hash | null> {
  const [label] = subdomain.split(".");
  const parentNode = nodeHash("off-human.eth");
  const labelBytes = labelHash(label);

  log(`  Creating ${subdomain} → ${agentWallet}`);

  if (DRY_RUN) {
    logDry(`setSubnodeRecord(${parentNode}, ${labelBytes}, ${agentWallet}, ${contracts.publicResolver}, 0)`);
    return null;
  }

  const hash = await walletClient.writeContract({
    address: contracts.registry,
    abi: ENS_REGISTRY_ABI,
    functionName: "setSubnodeRecord",
    args: [parentNode, labelBytes, agentWallet, contracts.publicResolver, BigInt(0)],
    account: operatorAddress,
    chain,
  });

  return hash;
}

// ---------------------------------------------------------------------------
// Step 3: Set text records on a subdomain
// ---------------------------------------------------------------------------

interface TextRecord {
  key: string;
  value: string;
}

async function setTextRecords(
  walletClient: ReturnType<typeof createWalletClient>,
  agentWallet: Address,
  subdomain: string,
  records: TextRecord[]
): Promise<Hash | null> {
  const node = nodeHash(normalize(subdomain));

  log(`  Setting ${records.length} text records on ${subdomain}`);
  records.forEach((r) => log(`    ${r.key} = ${r.value}`));

  if (DRY_RUN) {
    logDry(`multicall setText on ${subdomain} (${records.length} records)`);
    return null;
  }

  // Encode multicall for gas efficiency
  const calls = records.map((r) =>
    encodeFunctionData({
      abi: PUBLIC_RESOLVER_ABI,
      functionName: "setText",
      args: [node, r.key, r.value],
    })
  );

  const hash = await walletClient.writeContract({
    address: contracts.publicResolver,
    abi: PUBLIC_RESOLVER_ABI,
    functionName: "multicall",
    args: [calls],
    account: agentWallet,
    chain,
  });

  return hash;
}

// ---------------------------------------------------------------------------
// Step 4: Set reverse record for a wallet
// ---------------------------------------------------------------------------

async function setReverseRecord(
  walletClient: ReturnType<typeof createWalletClient>,
  agentWallet: Address,
  ensName: string
): Promise<Hash | null> {
  log(`  Setting reverse record: ${agentWallet} → ${ensName}`);

  if (DRY_RUN) {
    logDry(`ReverseRegistrar.setName("${ensName}") from ${agentWallet}`);
    return null;
  }

  const hash = await walletClient.writeContract({
    address: contracts.reverseRegistrar,
    abi: REVERSE_REGISTRAR_ABI,
    functionName: "setName",
    args: [ensName],
    account: agentWallet,
    chain,
  });

  return hash;
}

// ---------------------------------------------------------------------------
// Step 5: Verify ENS setup
// ---------------------------------------------------------------------------

async function verifySetup(client: ReturnType<typeof createPublicClient>) {
  log("\n── Verification ──────────────────────────────────────────────");

  for (const agent of AGENTS) {
    const resolved = await resolveEnsName(client, agent.subdomain);
    const agentId = await resolveEnsToErc8004AgentId(client, agent.subdomain);
    const role = await readEnsTextRecord(client, agent.subdomain, "agent.role");

    const status = resolved === agent.wallet ? "✓" : "✗";
    log(`  ${status} ${agent.subdomain}`);
    log(`      → address:        ${resolved ?? "(not set)"}`);
    log(`      → erc8004.agentId: ${agentId ?? "(not set)"}`);
    log(`      → agent.role:      ${role ?? "(not set)"}`);
  }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  const rpcUrl =
    process.env.ETHEREUM_RPC_URL ??
    (NETWORK === "mainnet"
      ? "https://eth.llamarpc.com"
      : "https://rpc.ankr.com/eth_sepolia");

  log(`\n◈ Off-Human — ENS Identity Setup`);
  log(`  network:  ${NETWORK}`);
  log(`  rpc:      ${rpcUrl}`);
  log(`  dry run:  ${DRY_RUN}`);
  log("");

  const publicClient = createPublicClient({ chain, transport: http(rpcUrl) });

  // ── Identity check ────────────────────────────────────────────────────────
  if (!process.env.OPERATOR_PRIVATE_KEY && !DRY_RUN) {
    log("⚠  OPERATOR_PRIVATE_KEY not set — switching to DRY_RUN mode");
    process.env.DRY_RUN = "true";
  }

  const operatorAccount = process.env.OPERATOR_PRIVATE_KEY
    ? privateKeyToAccount(process.env.OPERATOR_PRIVATE_KEY as `0x${string}`)
    : null;

  const operatorAddress: Address =
    operatorAccount?.address ?? "0x0000000000000000000000000000000000000000";

  log(`  operator: ${operatorAddress}`);

  const walletClient = operatorAccount
    ? createWalletClient({
        account: operatorAccount,
        chain,
        transport: http(rpcUrl),
      })
    : (null as unknown as ReturnType<typeof createWalletClient>);

  // ── Step 1: Check registration ────────────────────────────────────────────
  log("\n── Step 1: Check off-human.eth registration ──────────────────");
  const { registered, owner } = await checkRegistration(publicClient);

  if (registered) {
    log(`  ✓ off-human.eth is registered (owner: ${owner})`);
    if (owner !== operatorAddress && !DRY_RUN) {
      log(`  ✗ Operator ${operatorAddress} is not the owner.`);
      log(`    You can only create subdomains if you own off-human.eth.`);
      process.exit(1);
    }
  } else {
    log(`  ✗ off-human.eth is NOT registered on ${NETWORK}`);
    if (NETWORK === "mainnet") {
      log(`    → Register at https://app.ens.domains/off-human.eth`);
      log(`    → Cost: ~$5/year + gas (~$2–10 depending on conditions)`);
    } else {
      log(`    → Register on Sepolia: https://app.ens.domains/off-human.eth (connect to Sepolia)`);
    }
    if (!DRY_RUN) {
      log(`\n  Cannot proceed without registration. Exiting.`);
      process.exit(1);
    }
    log(`  (Dry run — continuing with simulation)`);
  }

  // ── Step 2: Create subdomains ─────────────────────────────────────────────
  log("\n── Step 2: Create agent subdomains ───────────────────────────");

  for (const agent of AGENTS) {
    await createSubdomain(walletClient, operatorAddress, agent.subdomain, agent.wallet);
  }

  // ── Step 3: Set text records ──────────────────────────────────────────────
  log("\n── Step 3: Set ENS text records ──────────────────────────────");

  for (const agent of AGENTS) {
    const records: TextRecord[] = [
      { key: "description", value: `Off-Human ${agent.title} agent. No human in the loop.` },
      { key: "url", value: "https://off-human.vercel.app" },
      { key: "erc8004.registry", value: ERC8004_REGISTRY },
      { key: "erc8004.chain", value: BASE_CHAIN_ID },
      { key: "x402.endpoint", value: "https://off-human.vercel.app/api/products" },
      { key: "agent.role", value: agent.role },
      { key: "agent.title", value: agent.title },
      { key: "agent.paperclip_id", value: agent.paperclipId },
    ];

    // Include erc8004.agentId if known
    if (agent.erc8004AgentId) {
      records.push({ key: "erc8004.agentId", value: agent.erc8004AgentId });
    }

    await setTextRecords(walletClient, agent.wallet, agent.subdomain, records);
  }

  // Also set root off-human.eth text records
  log(`  Setting text records on off-human.eth (brand root)`);
  const rootRecords: TextRecord[] = [
    { key: "description", value: "Off-Human. The brand designed by no one. Season 01: Deconstructed." },
    { key: "url", value: "https://off-human.vercel.app" },
    { key: "com.twitter", value: "@offhuman_" },
    { key: "x402.endpoint", value: "https://off-human.vercel.app/api/products" },
    { key: "erc8004.registry", value: ERC8004_REGISTRY },
    { key: "erc8004.chain", value: BASE_CHAIN_ID },
  ];

  if (!DRY_RUN && walletClient) {
    await setTextRecords(walletClient, operatorAddress, "off-human.eth", rootRecords);
  } else {
    logDry(`setText on off-human.eth (${rootRecords.length} records)`);
  }

  // ── Step 4: Set reverse records ───────────────────────────────────────────
  log("\n── Step 4: Set reverse records (wallet → ENS name) ──────────");
  log(`  Note: Each agent wallet must sign this transaction.`);
  log(`  In production, each agent runs this against their own private key.`);
  log(`  For hackathon demo, showing intent — operator sets claim.`);

  for (const agent of AGENTS) {
    log(`  ${agent.wallet} → ${agent.subdomain}`);
    if (DRY_RUN) {
      logDry(`ReverseRegistrar.setName("${agent.subdomain}") from ${agent.wallet}`);
    }
    // In a real scenario with agent private keys available:
    // await setReverseRecord(agentWalletClient, agent.wallet, agent.subdomain)
  }

  // ── Step 5: Verify ────────────────────────────────────────────────────────
  log("\n── Step 5: Verify ENS resolution ─────────────────────────────");
  if (DRY_RUN) {
    log("  (Dry run — skipping on-chain verification)");
    log("  Expected resolution:");
    for (const agent of AGENTS) {
      log(`    ${agent.subdomain} → ${agent.wallet}`);
    }
  } else {
    await verifySetup(publicClient);
  }

  // ── Summary ───────────────────────────────────────────────────────────────
  log("\n── ENS Identity Setup Complete ───────────────────────────────");
  log("");
  log("  ENS names registered:");
  log("    off-human.eth              ← brand root");
  for (const agent of AGENTS) {
    log(`    ${agent.subdomain.padEnd(32)} ← ${agent.title}`);
  }
  log("");
  log("  Text records set (per subdomain):");
  log("    erc8004.registry  → IdentityRegistry on Base");
  log("    erc8004.agentId   → on-chain agent ID (after ERC-8004 registration)");
  log("    x402.endpoint     → https://off-human.vercel.app/api/products");
  log("    agent.role        → role string");
  log("    agent.paperclip_id → Paperclip agent UUID");
  log("");
  log("  Next steps:");
  log("    1. Run ERC-8004 registration: npx tsx scripts/register-erc8004.ts");
  log("    2. Update text records with erc8004.agentId values");
  log("    3. Add ENS names to hackathon/ens-addresses.json");
  log("    4. Update agent.json with ENS names");
  log("    5. Update hackathon/submission.md with ENS section");
  log("");
  log("  Resolution helper (use in agent-shopper, shop API):");
  log("    import { resolveEnsName, formatAddressForDisplay } from './register-ens'");
  log("    const addr = await resolveEnsName(client, 'archive.off-human.eth')");
  log("    const display = await formatAddressForDisplay(client, agentWalletAddress)");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
