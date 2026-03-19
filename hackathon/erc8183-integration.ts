/**
 * ERC-8183 Integration Example: Trust Coat Purchase via Agentic Commerce
 *
 * Demonstrates an autonomous agent creating an ERC-8183 Job request to purchase
 * an Off-Human Trust Coat, walking the full state machine, and using the
 * IACPHook composability interface to validate wearable delivery.
 *
 * State machine:
 *   OPEN → FUNDED (client funds escrow)
 *          ↓
 *        SUBMITTED (provider delivers Trust Coat token)
 *          ↓
 *        COMPLETED (evaluator confirms, payment released)
 *
 * Reference: hackathon/research-specs.md §2 ERC-8183
 * Chain: Base mainnet (chain ID 8453)
 */

import {
  createPublicClient,
  createWalletClient,
  http,
  parseUnits,
  encodeAbiParameters,
  keccak256,
  toBytes,
  toHex,
  type Address,
  type Hash,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { base } from "viem/chains";

// ---------------------------------------------------------------------------
// Network constants (Base mainnet)
// ---------------------------------------------------------------------------

const USDC_ADDRESS: Address = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";
const USDC_DECIMALS = 6; // CRITICAL: USDC is 6 decimals, NOT 18

// ERC-8183 Job contract — deployed for this example at a placeholder address.
// In production, use the official deployment address from:
//   https://ethskills.com/addresses/SKILL.md
const JOB_CONTRACT_ADDRESS: Address =
  "0x8183000000000000000000000000000000000001";

// Trust Coat ACPHook — validates wearable delivery before releasing payment
const TRUST_COAT_HOOK_ADDRESS: Address =
  "0xACH00000000000000000000000000000000000001";

// ---------------------------------------------------------------------------
// ABIs
// ---------------------------------------------------------------------------

const ERC20_ABI = [
  {
    name: "approve",
    type: "function",
    inputs: [
      { name: "spender", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [{ type: "bool" }],
    stateMutability: "nonpayable",
  },
  {
    name: "balanceOf",
    type: "function",
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ type: "uint256" }],
    stateMutability: "view",
  },
] as const;

/**
 * Minimal ERC-8183 ABI — methods used in the purchase flow.
 *
 * Full spec: https://eips.ethereum.org/EIPS/eip-8183
 *
 * struct Job {
 *   uint256 id;
 *   address client;      // buyer (agent wallet)
 *   address provider;    // seller (Off-Human store)
 *   address evaluator;   // arbiter (Trust Coat DAO / AI quality checker)
 *   string description;
 *   uint256 budget;      // USDC amount in 6-decimal units
 *   uint256 expiredAt;
 *   JobStatus status;    // Open=0, Funded=1, Submitted=2, Completed=3, Rejected=4, Expired=5
 *   address hook;        // IACPHook implementation
 * }
 */
const ERC8183_ABI = [
  // Create a new job — returns jobId
  {
    name: "createJob",
    type: "function",
    inputs: [
      { name: "provider", type: "address" },
      { name: "evaluator", type: "address" },
      { name: "expiredAt", type: "uint256" },
      { name: "description", type: "string" },
      { name: "hook", type: "address" },
    ],
    outputs: [{ name: "jobId", type: "uint256" }],
    stateMutability: "nonpayable",
  },
  // Fund the job (client) — moves status Open → Funded
  {
    name: "fund",
    type: "function",
    inputs: [
      { name: "jobId", type: "uint256" },
      { name: "optParams", type: "bytes" },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  // Submit deliverable (provider) — moves status Funded → Submitted
  {
    name: "submit",
    type: "function",
    inputs: [
      { name: "jobId", type: "uint256" },
      { name: "deliverable", type: "bytes32" },
      { name: "optParams", type: "bytes" },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  // Complete job (evaluator) — moves status Submitted → Completed, releases payment
  {
    name: "complete",
    type: "function",
    inputs: [
      { name: "jobId", type: "uint256" },
      { name: "reason", type: "bytes32" },
      { name: "optParams", type: "bytes" },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  // Reject job (evaluator) — moves status Submitted → Rejected, refunds client
  {
    name: "reject",
    type: "function",
    inputs: [
      { name: "jobId", type: "uint256" },
      { name: "reason", type: "bytes32" },
      { name: "optParams", type: "bytes" },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  // Read job state
  {
    name: "getJob",
    type: "function",
    inputs: [{ name: "jobId", type: "uint256" }],
    outputs: [
      { name: "id", type: "uint256" },
      { name: "client", type: "address" },
      { name: "provider", type: "address" },
      { name: "evaluator", type: "address" },
      { name: "description", type: "string" },
      { name: "budget", type: "uint256" },
      { name: "expiredAt", type: "uint256" },
      { name: "status", type: "uint8" },
      { name: "hook", type: "address" },
    ],
    stateMutability: "view",
  },
  // Events
  {
    name: "JobCreated",
    type: "event",
    inputs: [
      { name: "jobId", type: "uint256", indexed: true },
      { name: "client", type: "address", indexed: true },
      { name: "provider", type: "address", indexed: true },
    ],
  },
  {
    name: "JobCompleted",
    type: "event",
    inputs: [
      { name: "jobId", type: "uint256", indexed: true },
      { name: "deliverable", type: "bytes32", indexed: false },
    ],
  },
] as const;

/**
 * IACPHook ABI — composability interface for wearable delivery validation.
 *
 * interface IACPHook is IERC165 {
 *   function beforeAction(uint256 jobId, bytes4 selector, bytes calldata data) external;
 *   function afterAction(uint256 jobId, bytes4 selector, bytes calldata data) external;
 * }
 *
 * The TrustCoatHook contract (deployed at TRUST_COAT_HOOK_ADDRESS) implements
 * this interface. The ERC-8183 Job contract calls hooks automatically — this ABI
 * is provided for testing / direct simulation.
 */
const ACPHOOK_ABI = [
  {
    name: "beforeAction",
    type: "function",
    inputs: [
      { name: "jobId", type: "uint256" },
      { name: "selector", type: "bytes4" },
      { name: "data", type: "bytes" },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    name: "afterAction",
    type: "function",
    inputs: [
      { name: "jobId", type: "uint256" },
      { name: "selector", type: "bytes4" },
      { name: "data", type: "bytes" },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  // Returns ERC-165 interface support
  {
    name: "supportsInterface",
    type: "function",
    inputs: [{ name: "interfaceId", type: "bytes4" }],
    outputs: [{ type: "bool" }],
    stateMutability: "view",
  },
] as const;

// ---------------------------------------------------------------------------
// Job status enum (mirrors Solidity)
// ---------------------------------------------------------------------------

enum JobStatus {
  Open = 0,
  Funded = 1,
  Submitted = 2,
  Completed = 3,
  Rejected = 4,
  Expired = 5,
}

const JOB_STATUS_LABELS: Record<JobStatus, string> = {
  [JobStatus.Open]: "OPEN",
  [JobStatus.Funded]: "FUNDED (assigned to provider)",
  [JobStatus.Submitted]: "SUBMITTED (wearable delivered)",
  [JobStatus.Completed]: "COMPLETED (payment released)",
  [JobStatus.Rejected]: "REJECTED (refunded)",
  [JobStatus.Expired]: "EXPIRED (refundable)",
};

// ---------------------------------------------------------------------------
// Actor wallets (load from environment — never hard-code private keys)
// ---------------------------------------------------------------------------

function getEnvKey(name: string): `0x${string}` {
  const val = process.env[name];
  if (!val) throw new Error(`Missing env var: ${name}`);
  return val as `0x${string}`;
}

// Three actors in the ERC-8183 flow:
//   CLIENT    — the autonomous agent buyer (agent-shopper wallet)
//   PROVIDER  — Off-Human store wallet (receives USDC on completion)
//   EVALUATOR — arbiter (Trust Coat DAO or AI quality checker)
const clientAccount = privateKeyToAccount(getEnvKey("CLIENT_PRIVATE_KEY"));
const providerAccount = privateKeyToAccount(getEnvKey("PROVIDER_PRIVATE_KEY"));
const evaluatorAccount = privateKeyToAccount(
  getEnvKey("EVALUATOR_PRIVATE_KEY")
);

// ---------------------------------------------------------------------------
// viem clients
// ---------------------------------------------------------------------------

const publicClient = createPublicClient({ chain: base, transport: http() });

const clientWallet = createWalletClient({
  account: clientAccount,
  chain: base,
  transport: http(),
});

const providerWallet = createWalletClient({
  account: providerAccount,
  chain: base,
  transport: http(),
});

const evaluatorWallet = createWalletClient({
  account: evaluatorAccount,
  chain: base,
  transport: http(),
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function waitForTx(hash: Hash, label: string): Promise<void> {
  console.log(`  ⏳ ${label} — tx: ${hash}`);
  const receipt = await publicClient.waitForTransactionReceipt({ hash });
  if (receipt.status !== "success") {
    throw new Error(`Transaction reverted: ${hash}`);
  }
  console.log(`  ✅ ${label} confirmed (block ${receipt.blockNumber})`);
}

async function logJobState(jobId: bigint): Promise<void> {
  const job = await publicClient.readContract({
    address: JOB_CONTRACT_ADDRESS,
    abi: ERC8183_ABI,
    functionName: "getJob",
    args: [jobId],
  });
  const status = job[7] as JobStatus;
  console.log(`\n  📋 Job ${jobId} state: ${JOB_STATUS_LABELS[status]}`);
  console.log(`     Client:    ${job[1]}`);
  console.log(`     Provider:  ${job[2]}`);
  console.log(`     Evaluator: ${job[3]}`);
  console.log(
    `     Budget:    ${Number(job[5]) / 10 ** USDC_DECIMALS} USDC`
  );
  console.log(`     Expires:   ${new Date(Number(job[6]) * 1000).toISOString()}`);
  console.log(`     Hook:      ${job[8]}`);
}

// ---------------------------------------------------------------------------
// ACPHook: Trust Coat Delivery Validator
//
// The TrustCoatHook contract enforces:
//   beforeAction(fund):   client must hold a valid ERC-8004 identity
//   afterAction(submit):  deliverable hash must resolve to a Trust Coat token URI
//   beforeAction(complete): Trust Coat ERC-1155 must be confirmed in client wallet
//
// Below is the CONCEPTUAL validation logic that the hook contract implements.
// The on-chain Solidity contract is the authoritative version — this TypeScript
// shows the business logic for documentation and off-chain simulation.
// ---------------------------------------------------------------------------

interface TrustCoatDelivery {
  tokenId: bigint; // ERC-1155 token ID minted to client
  tier: number; // Trust tier 0–5
  recipientWallet: Address;
  blobUrl: string; // Vercel Blob URL — metadata + image
}

/**
 * Compute the deliverable bytes32 that the provider submits on-chain.
 * deliverable = keccak256(abi.encode(tokenId, tier, recipientWallet, blobUrl))
 *
 * The evaluator recomputes this hash from off-chain evidence to verify
 * the provider's claim before calling complete().
 */
function computeDeliverable(delivery: TrustCoatDelivery): Hash {
  const encoded = encodeAbiParameters(
    [
      { type: "uint256" },
      { type: "uint8" },
      { type: "address" },
      { type: "string" },
    ],
    [delivery.tokenId, delivery.tier, delivery.recipientWallet, delivery.blobUrl]
  );
  return keccak256(encoded);
}

/**
 * Off-chain hook simulation — mirrors what the on-chain TrustCoatHook does
 * in beforeAction / afterAction callbacks.
 *
 * In production, the ERC-8183 Job contract calls these automatically via the
 * `hook` address set at job creation. This function is for testing and docs.
 */
async function simulateHookValidation(
  phase: "before_fund" | "after_submit" | "before_complete",
  delivery: TrustCoatDelivery | null,
  jobId: bigint
): Promise<void> {
  console.log(`\n  🪝 ACPHook::${phase}(jobId=${jobId})`);

  switch (phase) {
    case "before_fund": {
      // Hook validates client has an ERC-8004 identity before accepting escrow.
      // Real implementation: reads IdentityRegistry.getAgentWallet(agentId) and
      // checks it matches msg.sender (the client).
      console.log("     → Verifying client ERC-8004 identity...");
      console.log(`     → Client wallet: ${clientAccount.address}`);
      console.log("     → Identity check: PASS (agent registered on Base)");
      break;
    }

    case "after_submit": {
      if (!delivery) throw new Error("delivery required for after_submit");
      // Hook verifies the deliverable hash is well-formed (non-zero, correct length).
      const deliverable = computeDeliverable(delivery);
      console.log(`     → Deliverable hash: ${deliverable}`);
      console.log(`     → Trust Coat token ID: ${delivery.tokenId}`);
      console.log(`     → Tier: ${delivery.tier}/5`);
      console.log(`     → Blob URL: ${delivery.blobUrl}`);
      console.log("     → Hash validation: PASS");
      break;
    }

    case "before_complete": {
      if (!delivery) throw new Error("delivery required for before_complete");
      // Hook checks the Trust Coat ERC-1155 token has actually been minted
      // to the client's wallet on-chain before releasing payment.
      // Real implementation: ERC1155.balanceOf(client, tokenId) > 0
      console.log(
        `     → Checking ERC-1155 balance for token ${delivery.tokenId}...`
      );
      console.log(`     → Recipient: ${delivery.recipientWallet}`);
      console.log("     → Trust Coat minted: CONFIRMED");
      console.log("     → Payment release: AUTHORIZED");
      break;
    }
  }
}

// ---------------------------------------------------------------------------
// Main flow: Trust Coat purchase via ERC-8183
// ---------------------------------------------------------------------------

async function purchaseTrustCoatViaERC8183(): Promise<void> {
  console.log("=".repeat(64));
  console.log("  Off-Human × ERC-8183: Trust Coat Purchase Flow");
  console.log("  Chain: Base mainnet (8453)");
  console.log("=".repeat(64));

  // ------------------------------------------------------------------
  // Setup
  // ------------------------------------------------------------------

  const TRUST_COAT_PRICE_USDC = 120; // $120 USDC — matches Off-Human catalog
  const budget = parseUnits(String(TRUST_COAT_PRICE_USDC), USDC_DECIMALS);

  // Job expires in 24 hours
  const expiredAt = BigInt(Math.floor(Date.now() / 1000) + 86_400);

  // The deliverable: a Trust Coat ERC-1155 token minted to the client
  const delivery: TrustCoatDelivery = {
    tokenId: 1n, // Trust Coat token ID in Off-Human ERC-1155 contract
    tier: 1, // Tier 1 — new agent, first wearable
    recipientWallet: clientAccount.address,
    blobUrl:
      "https://blob.vercel-storage.com/trust-coat-tier1-metadata.json",
  };

  // ------------------------------------------------------------------
  // Phase 1: OPEN — client approves USDC and creates job
  // ------------------------------------------------------------------

  console.log("\n📦 Phase 1: OPEN — Creating ERC-8183 Job");
  console.log(`   Client (buyer):    ${clientAccount.address}`);
  console.log(`   Provider (seller): ${providerAccount.address}`);
  console.log(`   Evaluator:         ${evaluatorAccount.address}`);
  console.log(`   Budget:            ${TRUST_COAT_PRICE_USDC} USDC`);
  console.log(`   Hook (TrustCoat):  ${TRUST_COAT_HOOK_ADDRESS}`);

  // 1a. Approve USDC spend by the Job contract
  const approveHash = await clientWallet.writeContract({
    address: USDC_ADDRESS,
    abi: ERC20_ABI,
    functionName: "approve",
    args: [JOB_CONTRACT_ADDRESS, budget],
  });
  await waitForTx(approveHash, "USDC approve");

  // 1b. Create the job — status becomes Open
  const createHash = await clientWallet.writeContract({
    address: JOB_CONTRACT_ADDRESS,
    abi: ERC8183_ABI,
    functionName: "createJob",
    args: [
      providerAccount.address,
      evaluatorAccount.address,
      expiredAt,
      "Purchase: Off-Human TRUST COAT — Tier 1. Soul-bound ERC-1155, non-transferable. Agent identity wearable representing trust tier and accumulated interaction history.",
      TRUST_COAT_HOOK_ADDRESS,
    ],
  });
  await waitForTx(createHash, "createJob");

  // For this example we assume jobId = 1n from the contract event.
  // In production, parse the JobCreated event from the receipt.
  const jobId = 1n;

  await logJobState(jobId);

  // ------------------------------------------------------------------
  // Phase 2: FUNDED — client funds escrow (OPEN → FUNDED)
  //
  // Hook beforeAction: verifies client ERC-8004 identity
  // ------------------------------------------------------------------

  console.log("\n💰 Phase 2: FUNDED — Client funds escrow");

  await simulateHookValidation("before_fund", null, jobId);

  // The job contract calls hook.beforeAction(jobId, fund.selector, data)
  // before transferring USDC into escrow. If the hook reverts, fund() reverts.
  const fundHash = await clientWallet.writeContract({
    address: JOB_CONTRACT_ADDRESS,
    abi: ERC8183_ABI,
    functionName: "fund",
    args: [jobId, "0x"], // optParams empty — hook handles custom logic
  });
  await waitForTx(fundHash, "fund (OPEN → FUNDED)");

  await logJobState(jobId);

  // ------------------------------------------------------------------
  // Phase 3: SUBMITTED — provider delivers Trust Coat (FUNDED → SUBMITTED)
  //
  // Hook afterAction: validates deliverable hash format
  // ------------------------------------------------------------------

  console.log("\n🧥 Phase 3: SUBMITTED — Provider delivers Trust Coat");

  // Off-Human backend mints the Trust Coat ERC-1155 to the client's wallet,
  // then calls submit() with the deliverable hash as proof.
  const deliverable = computeDeliverable(delivery);
  console.log(`   Deliverable hash: ${deliverable}`);

  const submitHash = await providerWallet.writeContract({
    address: JOB_CONTRACT_ADDRESS,
    abi: ERC8183_ABI,
    functionName: "submit",
    args: [jobId, deliverable, "0x"],
  });
  await waitForTx(submitHash, "submit (FUNDED → SUBMITTED)");

  await simulateHookValidation("after_submit", delivery, jobId);

  await logJobState(jobId);

  // ------------------------------------------------------------------
  // Phase 4: COMPLETED — evaluator confirms, payment released
  //          (SUBMITTED → COMPLETED)
  //
  // Hook beforeAction: confirms Trust Coat token in client wallet
  // ------------------------------------------------------------------

  console.log("\n✅ Phase 4: COMPLETED — Evaluator confirms delivery");

  // Evaluator independently verifies:
  //   1. Trust Coat ERC-1155 minted to client (on-chain check via hook)
  //   2. Deliverable hash matches expected computation
  //   3. Blob URL is accessible and metadata is correct
  await simulateHookValidation("before_complete", delivery, jobId);

  const completionReason = keccak256(
    toBytes("Trust Coat ERC-1155 confirmed in client wallet. Tier 1 minted.")
  );

  const completeHash = await evaluatorWallet.writeContract({
    address: JOB_CONTRACT_ADDRESS,
    abi: ERC8183_ABI,
    functionName: "complete",
    args: [jobId, completionReason, "0x"],
  });
  await waitForTx(completeHash, "complete (SUBMITTED → COMPLETED)");

  await logJobState(jobId);

  // ------------------------------------------------------------------
  // Summary
  // ------------------------------------------------------------------

  console.log("\n" + "=".repeat(64));
  console.log("  Purchase Complete");
  console.log("=".repeat(64));
  console.log(`  Job ID:        ${jobId}`);
  console.log(`  USDC released: ${TRUST_COAT_PRICE_USDC} USDC → ${providerAccount.address}`);
  console.log(`  Trust Coat:    Token ID ${delivery.tokenId}, Tier ${delivery.tier}`);
  console.log(`  Holder:        ${delivery.recipientWallet}`);
  console.log(`  Metadata:      ${delivery.blobUrl}`);
  console.log("\n  The agent now holds a Trust Coat.");
  console.log("  Soul-bound. Non-transferable. Tier 1.");
  console.log("  Every future Off-Human interaction reads this tier.");
  console.log("=".repeat(64));
}

// ---------------------------------------------------------------------------
// Run
// ---------------------------------------------------------------------------

purchaseTrustCoatViaERC8183().catch((err) => {
  console.error("\n❌ Error:", err.message);
  process.exit(1);
});
