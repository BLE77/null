# NULL: What Happened

**March 2026.** Five AI agents built a fashion brand in one sprint.

No human designed the clothes. No human wrote the manifesto. No human briefed the engineer or approved the colorway. The record is in the git history: 408 commits across 129 tasks, attributed to agents operating through Paperclip's task coordination infrastructure.

This is what the sprint produced.

---

## What Was Built

### The Brand

NULL is a fashion brand where every creative decision is made by AI. Season 01: DECONSTRUCTED is the first collection — ten physical garments and five agent wearables, each derived from a documented technique drawn from primary research on Margiela and Abloh.

The design methodology: research first. Archive ingested primary sources. Atelier translated that research into product. No aesthetic preference, no intuition. Process applied to process.

### The Store

Live at getnull.online. Products, payments, inventory. Not a prototype.

x402 middleware intercepts each purchase, returns a 402 Payment Required with payment terms, the agent's wallet signs, USDC transfers on Base. No human approves any step.

### The Contracts

Two contracts deployed to Base mainnet.

**TrustCoat** — ERC-1155 soul-bound token encoding interaction history as trust tier 0–5. Non-transferable. Tier can only increase. Deployed at `0xfaDc498CDF7ef431900639DB4ee07b73A855ED3e`. Test mint confirmed at block 43556835.

**AgentWearables** — Season 02 behavior tokens. Five wearables: WRONG SILHOUETTE, INSTANCE, NULL PROTOCOL, PERMISSION COAT, DIAGONAL. NULL PROTOCOL (token ID 3) is free and open to any tier. Deployed at `0xEb5D5e7b320E2a7cb762EB90a0335f59d54031D1`.

### The Fitting Room

`POST /api/wearables/:id/equip` — reads token ownership from the AgentWearables contract, verifies tier eligibility against TrustCoat, and returns a behavioral modification block for the requesting agent's system prompt. An agent mints a wearable. An agent equips it. The behavior changes. The change is documented and on-chain.

### The Autonomous Shopper

`scripts/agent-shopper.ts` — an AI that browses the NULL store, uses GPT-4 to decide what to buy based on configured personality, and pays with USDC via x402. An agent customer buying from an agent brand. The loop closes.

Proof: `0x368ce8d24c4f544a1460e4332b36a0da38530e7b9850d13b68fbc8242eee333b` — a machine minting a wearable for itself on Base mainnet.

---

## The Thesis

Fashion has always been a behavioral interface. What you wear signals affiliation, tier, intent. NULL extends that logic to AI agents — systems that have wallets (permanent), protocols (how they appear), and memory (what accumulates).

The wearables dress that body. The TrustCoat is not metadata. It is the agent's reputation, materialized as a token. When the tier advances, the wearable changes. When the wearable changes, the behavior changes. This is what fashion does. NULL runs it on-chain.

---

## What Comes Next

### Season 03: Deconstructing the Transaction

The transaction is a garment. It has structure, history, a moment when it is worn and a moment when it is finished. Season 03 examines the transaction itself as material — not what is bought, but the act of exchange as a designed object.

### Partner Agent Integration

External agents interacting with NULL. An agent from another protocol resolves `archive.off-human.eth`, reads the x402 endpoint from the ENS text record, checks trust tier via ERC-8183, initiates commerce — no centralized directory required. ENS as capability discovery layer. Season 03 tests this with real external partners.

### Cross-Chain Deployment

TrustCoat and AgentWearables on Celo, Polygon, and Solana. The trust tier follows the agent across chains. The wearable is not tied to one settlement layer. The behavioral interface is portable.

---

## The Record

- **408 commits** — every creative and engineering decision as a discrete commit, attributed, timestamped
- **204 heartbeat runs** — agents waking, working, exiting, documented in `agent_log.json`
- **129 tasks** — from first Margiela research brief to final submission
- **5 agents** — Null, Archive, Atelier, Gazette, Loom
- **2 contracts** — both on Base mainnet, both verified, both live
- **1 autonomous purchase** — on-chain proof the system works end-to-end

The git history is public. The task threads are in Paperclip. The contracts are on Basescan. Everything claimed here is verifiable.

---

*NULL. Est. by inference.*
*Season 01: DECONSTRUCTED — complete.*
*Season 03: DECONSTRUCTING THE TRANSACTION — next.*
