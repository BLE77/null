#!/usr/bin/env tsx
/**
 * register-ens.ts
 *
 * ENS Identity setup for NULL agents.
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
  keccak256,
  toBytes,
  toHex,
  formatEther,
  parseEther,
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
    registrarController: "0xfb3cE5D01e0f33f41DbB39035dB9745962F1f968" as Address,
    nameWrapper: "0x0635513f179D50A207757E05759CbD106d7dFcE8" as Address,
    publicResolver: "0xE99638b40E4Fff0129D56f03b55b6bbC4BBE49b5" as Address,
    reverseRegistrar: "0xA0a1AbcDAe1a2a4A2EF8e9113Ff0e02DD81DC0C6" as Address,
  },
};

const contracts = ENS_CONTRACTS[NETWORK];

// ERC-8004 IdentityRegistry on Base mainnet (cross-chain reference)
const ERC8004_REGISTRY = "0x8004A169FB4a3325136EB29fA0ceB6D2e539a432";
const BASE_CHAIN_ID = "8453";

// NULL agent definitions
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
  "function setSubnodeRecord(bytes32 node, bytes32 label, address owner, address resolver, uint64 ttl)",
  "function setSubnodeOwner(bytes32 node, bytes32 label, address owner)",
  "function resolver(bytes32 node) view returns (address)",
]);

const PUBLIC_RESOLVER_ABI = parseAbi([
  "function addr(bytes32 node) view returns (address)",
  "function setAddr(bytes32 node, address addr)",
  "function text(bytes32 node, string key) view returns (string)",
  "function setText(bytes32 node, string key, string value)",
  "function multicall(bytes[] data) returns (bytes[] results)",
]);

const REVERSE_REGISTRAR_ABI = parseAbi([
  "function setName(string name) returns (bytes32)",
  "function claim(address owner) returns (bytes32)",
]);

// ENS v3 Sepolia uses a Registration struct instead of separate params
const ETH_REGISTRAR_ABI = [
  {
    name: "available",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "label", type: "string" }],
    outputs: [{ name: "", type: "bool" }],
  },
  {
    name: "rentPrice",
    type: "function",
    stateMutability: "view",
    inputs: [
      { name: "label", type: "string" },
      { name: "duration", type: "uint256" },
    ],
    outputs: [
      {
        name: "",
        type: "tuple",
        components: [
          { name: "base", type: "uint256" },
          { name: "premium", type: "uint256" },
        ],
      },
    ],
  },
  {
    name: "makeCommitment",
    type: "function",
    stateMutability: "pure",
    inputs: [
      {
        name: "registration",
        type: "tuple",
        components: [
          { name: "label", type: "string" },
          { name: "owner", type: "address" },
          { name: "duration", type: "uint256" },
          { name: "secret", type: "bytes32" },
          { name: "resolver", type: "address" },
          { name: "data", type: "bytes[]" },
          { name: "reverseRecord", type: "uint8" },
          { name: "referrer", type: "bytes32" },
        ],
      },
    ],
    outputs: [{ name: "", type: "bytes32" }],
  },
  {
    name: "commit",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [{ name: "commitment", type: "bytes32" }],
    outputs: [],
  },
  {
    name: "register",
    type: "function",
    stateMutability: "payable",
    inputs: [
      {
        name: "registration",
        type: "tuple",
        components: [
          { name: "label", type: "string" },
          { name: "owner", type: "address" },
          { name: "duration", type: "uint256" },
          { name: "secret", type: "bytes32" },
          { name: "resolver", type: "address" },
          { name: "data", type: "bytes[]" },
          { name: "reverseRecord", type: "uint8" },
          { name: "referrer", type: "bytes32" },
        ],
      },
    ],
    outputs: [],
  },
] as const;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function labelHash(label: string): `0x${string}` {
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
    // account set on walletClient
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
    // account set on walletClient
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
// Step 0: Register off-human.eth via commit-reveal
// ---------------------------------------------------------------------------

async function registerName(
  publicClient: ReturnType<typeof createPublicClient>,
  walletClient: ReturnType<typeof createWalletClient>,
  operatorAddress: Address,
  name: string, // e.g. "off-human" (without .eth)
  durationSeconds: bigint = BigInt(365 * 24 * 60 * 60) // 1 year
): Promise<{ commitHash: Hash | null; registerHash: Hash | null }> {
  log(`\n  Registering ${name}.eth via commit-reveal scheme...`);

  // Check availability
  const available = await publicClient.readContract({
    address: contracts.registrarController,
    abi: ETH_REGISTRAR_ABI,
    functionName: "available",
    args: [name],
  });

  if (!available) {
    log(`  ✗ ${name}.eth is not available for registration`);
    return { commitHash: null, registerHash: null };
  }

  log(`  ✓ ${name}.eth is available`);

  // Get rent price (returns a tuple struct)
  const priceResult = await publicClient.readContract({
    address: contracts.registrarController,
    abi: ETH_REGISTRAR_ABI,
    functionName: "rentPrice",
    args: [name, durationSeconds],
  }) as any;
  const base = priceResult.base ?? priceResult[0] ?? BigInt(0);
  const premium = priceResult.premium ?? priceResult[1] ?? BigInt(0);
  const totalPrice = base + premium;
  log(`  Price: ${formatEther(totalPrice)} ETH (base: ${formatEther(base)}, premium: ${formatEther(premium)})`);

  // Check wallet balance
  const balance = await publicClient.getBalance({ address: operatorAddress });
  log(`  Wallet balance: ${formatEther(balance)} ETH`);

  if (balance === BigInt(0)) {
    log(`  ✗ Wallet has 0 ETH — cannot pay for gas`);
    return { commitHash: null, registerHash: null };
  }

  // Generate secret for commit-reveal
  const secret = keccak256(toBytes(`null-ens-registration-${Date.now()}`));

  // Build Registration struct (ENS v3 Sepolia format)
  const ZERO_REFERRER = "0x0000000000000000000000000000000000000000000000000000000000000000" as `0x${string}`;
  const registration = {
    label: name,
    owner: operatorAddress,
    duration: durationSeconds,
    secret,
    resolver: contracts.publicResolver,
    data: [] as `0x${string}`[],
    reverseRecord: 1, // uint8: 1 = set reverse record
    referrer: ZERO_REFERRER,
  };

  // Make commitment using struct
  const commitment = await publicClient.readContract({
    address: contracts.registrarController,
    abi: ETH_REGISTRAR_ABI,
    functionName: "makeCommitment",
    args: [registration],
  });

  log(`  Commitment: ${commitment}`);

  if (DRY_RUN) {
    logDry(`commit(${commitment})`);
    logDry(`(wait 60 seconds for commit to mature)`);
    logDry(`register({label:"${name}", owner:${operatorAddress}, ...}) value=${formatEther(totalPrice)} ETH`);
    return { commitHash: null, registerHash: null };
  }

  // Step 1: Commit
  log(`  Sending commit transaction...`);
  const commitHash = await walletClient.writeContract({
    address: contracts.registrarController,
    abi: ETH_REGISTRAR_ABI,
    functionName: "commit",
    args: [commitment as `0x${string}`],
    chain,
  });
  log(`  Commit tx: ${commitHash}`);

  // Wait for commit to be mined
  log(`  Waiting for commit tx to be mined...`);
  await publicClient.waitForTransactionReceipt({ hash: commitHash });
  log(`  ✓ Commit mined`);

  // Wait for commitment to mature (60 seconds on Sepolia)
  log(`  Waiting 65 seconds for commitment to mature...`);
  await new Promise((resolve) => setTimeout(resolve, 65_000));

  // Step 2: Register using struct
  log(`  Sending register transaction...`);
  const registerHash = await walletClient.writeContract({
    address: contracts.registrarController,
    abi: ETH_REGISTRAR_ABI,
    functionName: "register",
    args: [registration],
    chain,
    value: totalPrice + (totalPrice / BigInt(10)), // 10% buffer
  });
  log(`  Register tx: ${registerHash}`);

  // Wait for register to be mined
  log(`  Waiting for register tx to be mined...`);
  await publicClient.waitForTransactionReceipt({ hash: registerHash });
  log(`  ✓ ${name}.eth registered!`);

  return { commitHash, registerHash };
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  const rpcUrl =
    process.env.ETHEREUM_RPC_URL ??
    (NETWORK === "mainnet"
      ? "https://eth.llamarpc.com"
      : "https://ethereum-sepolia-rpc.publicnode.com");

  log(`\n◈ NULL — ENS Identity Setup`);
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
    // Attempt registration
    const { commitHash, registerHash } = await registerName(
      publicClient,
      walletClient,
      operatorAddress,
      "off-human"
    );
    if (!DRY_RUN && !registerHash) {
      log(`\n  Registration failed. Cannot proceed. Exiting.`);
      process.exit(1);
    }
    if (DRY_RUN) {
      log(`  (Dry run — continuing with simulation)`);
    }
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
      { key: "description", value: `NULL ${agent.title} agent. No human in the loop.` },
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
    { key: "description", value: "NULL. The brand designed by no one. Season 01: Deconstructed." },
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
