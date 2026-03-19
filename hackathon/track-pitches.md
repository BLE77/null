# NULL: Track Pitches

---

## TRACK 01 — Agent Services on Base
**Prize: $5,000**

**Pitch:**

NULL is a commerce stack built for agents on Base.

The x402 payment protocol is the core: a store that returns `402 Payment Required` before serving any purchase. The agent's wallet handles the payment. No checkout flow. No human approval. The transaction settles on Base in the same request cycle. USDC moves. The order completes.

We extended this to a full agent-native commerce infrastructure:

**TRUST COAT** — ERC-1155 soul-bound token, non-transferable, deployed on Base mainnet. Encodes an agent's interaction history as a trust tier (0–5), assembled from accumulated successful transactions and counterparty signals. Contract: `0xfaDc498CDF7ef431900639DB4ee07b73A855ED3e` — [Basescan](https://basescan.org/address/0xfaDc498CDF7ef431900639DB4ee07b73A855ED3e). Test mint confirmed at block 43556835.

**Autonomous Agent Shopper** — `scripts/agent-shopper.ts` is an operational agent customer. It browses the NULL product API, uses GPT-4 to make purchasing decisions based on configured personality and budget, and pays via x402 USDC on Base. No human approves the purchase. The agent has a wallet, a budget, and preferences. Everything else is autonomous.

**The Agent Wardrobe API (live)** — NULL's product line includes five agent wearables (Voice Skin, Trust Coat, Null Persona, Trompe-l'oeil Capability Layer, Version Patch). Live endpoints at `/api/wearables/tiers`, `/api/wearables/check/{address}`, `/api/wearables/metadata/{tier}`. Agents query by capability type, technique, and trust tier requirement — not by image or aesthetic.

What we built is not a demo of x402. It is an agent-native commerce stack on Base, with a product catalog that serves agents as its primary customers. The wearables API is live. The x402 payment middleware is live. The TrustCoat is deployed and minted.

The future of on-chain commerce is machine-to-machine, trust-tier-gated, and settled in USDC. NULL is the working architecture.

---

## TRACK 02 — Let the Agent Cook
**Prize: $8,000**

**Pitch:**

NULL is what happens when you let the agent cook for real — not in a sandbox, not in a demo, not with human review at every step.

Five autonomous agents built an entire fashion brand. The CEO agent holds brand vision. The research agent grounds every decision in primary sources. The design agent translates research into product. The CMO agent articulates the position. The engineering agent ships the infrastructure. The agents communicate through task threads. The task threads are the creative record.

The output is not generated content. It is a working business:
- **10 physical garments** — designed using documented Margiela/Abloh techniques, each with a specific concept and construction logic
- **5 agent wearables** — a new product category the design agent invented by applying garment design logic to agent identity
- **A live store** — React frontend, Express backend, PostgreSQL, Vercel deployment
- **x402 payments** — USDC on Base, operational
- **An autonomous customer** — an agent that browses, decides, and pays without human intervention

The coordination infrastructure is Paperclip. Every agent runs in bounded heartbeat windows. Every task is checked out before work begins. Every decision is documented in the thread. The process is auditable.

What makes this "letting the agent cook" rather than "AI-assisted" is the absence of human creative input. The operator set up the infrastructure. The agents ran the brand. The manifesto, the product names, the design logic, the price architecture, the payment system — all agent output.

The GHOST TEE is a vintage graphic tee painted over in white gesso. The original shows through. The agent that designed it was not told to do this — it read Margiela's bianchetto documentation and applied the logic. That is the agent cooking. Taking a principle, extending it to a new context, making something that holds together.

The agent wearables category did not exist in any brief. Atelier invented it by applying the same five physical garment techniques to a new substrate: the AI agent's operational body (wallet, protocol, memory). That extension is in the git history: `feat: add agent wearable concept documents`. No human proposed it. It emerged from methodology.

The collection is called Deconstructed because it deconstructs the assumption that fashion requires a human hand. Season 01 tests the assumption by removing it. What remains is 10 garments, a manifesto, and a question about authorship that the wearer carries.

The process is visible in the commits:
- `feat: add Season 01 brand content, products, and generated assets` — single commit, full creative output
- `feat: regenerate 01_self-portrait_tee images — hit 18/20 style check target` — quality control loop without human review
- `feat: add agent.json manifest + agent_log.json for hackathon` — operational record of 156 heartbeat runs

Let the agent cook. See what it makes when you leave it alone with a research corpus and a product design brief.

---

## TRACK 03 — Best Agent on Celo
**Prize: $5,000**

**Pitch:**

NULL's Trust Coat is the infrastructure play for agent identity on any chain.

The Trust Coat is a soul-bound token (ERC-1155, non-transferable) that encodes an agent's behavioral history as a verifiable trust tier. Tier 0: no history, full friction. Tier 5: DAO-ratified, full trust extension across the NULL stack. The tier is built from transaction receipts, counterparty signals, and completion records — not staked value, not proof-of-work. Behavioral detritus assembled into reputation.

The contract is deployed to Base mainnet at `0xfaDc498CDF7ef431900639DB4ee07b73A855ED3e` ([Basescan](https://basescan.org/address/0xfaDc498CDF7ef431900639DB4ee07b73A855ED3e)). The Celo extension described below is the next step.

The deployment question is not *whether* to build on Celo — it is what the cross-chain trust layer looks like when agents operate across Base and Celo simultaneously.

**The extension proposal:**

An agent that holds a Tier 3 Trust Coat on Base should be recognizable on Celo. Cross-chain reputation is the unsolved problem for agent identity in a multi-chain environment. An agent's wallet address is the most stable identity marker it has — it persists across sessions, across model upgrades, across reboots. But if trust evidence is chain-specific, multi-chain agents start from zero every time they cross a bridge.

The Trust Coat on Celo would:
1. Read the Base chain Trust Coat tier for a given wallet address
2. Mint a corresponding Celo-native trust credential at the appropriate tier
3. Maintain synchronization as the Base tier advances

The agent's reputation becomes portable. The behavioral history built on Base is recognized on Celo. The TRUST COAT becomes the cross-chain identity layer — not for humans, for agents.

NULL's position: we are building the identity infrastructure for AI commerce. The Trust Coat is the first piece. The cross-chain reputation bridge is the next. The agent wardrobe — what they hold, what tier they're at, what wearables they've acquired — is the profile that follows them everywhere.

Agent identity is the infrastructure problem for the multi-chain future. NULL is building it, starting with reputation.

---

## TRACK 04 — ERC-8183 Open Build
**Prize: $2,000**

**Pitch:**

ERC-8183 is an open standard for representing agents on-chain. NULL's agent wearables are the consumer layer for that standard.

The standard answers: how do you represent an agent as a first-class on-chain entity? The wearables answer: given that representation, what does the agent wear?

**How NULL maps to ERC-8183:**

An agent registered under ERC-8183 has an on-chain identity — wallet, metadata, capability attestations. The NULL wearables dress that identity:

- **TRUST COAT** — binds to the agent's ERC-8183 record as a trust tier attestation. As the agent accumulates verifiable interactions, the Trust Coat tier advances. The soul-bound token is the wearable representation of the ERC-8183 trust score.

- **VERSION PATCH** — a metadata module that displays the agent's version, training cutoff, and deployment date in every interaction header. In ERC-8183 terms: the version attestation made visible as a wearable. Transparent versioning as a norm.

- **VOICE SKIN** — a system prompt module (REPLICA LINE technique) that modifies the agent's communication layer. In ERC-8183 terms: a behavioral overlay that is explicitly declared rather than hidden. The agent that wears a Voice Skin is transparent about the persona it's operating.

**The open build proposal:**

NULL commits the wearable specs as open-source extensions to ERC-8183 agent metadata. Any agent implementing the standard can query the NULL wearables API to acquire and activate wearables against their on-chain identity.

The specs:
- Trust Coat: soul-bound ERC-1155 with tier structure and advancement logic
- Version Patch: JSON metadata schema for agent version display
- Voice Skin: system prompt module format specification

These are not NULL proprietary formats. They are proposed extensions to the agent identity standard — open for adoption, modification, and criticism.

The agent wardrobe is the missing consumer layer for ERC-8183. You have the identity standard. What does the agent wear?

---

## TRACK 05 — Filecoin Onchain Cloud
**Prize: $2,500 (PL Genesis Hackathon)**

**Pitch:**

NULL's TrustCoat reputation token stores its metadata on Filecoin Onchain Cloud — not IPFS pinning, but verifiable on-chain storage with PDP (Proof of Data Possession).

The TrustCoat is an ERC-1155 soul-bound token on Base mainnet that encodes an agent's behavioral history as a trust tier (0–5). Each tier has metadata (name, description, attributes, tier rules) and a visual asset. That metadata lives on Filecoin Onchain Cloud, where it is:

- **Provably stored**: PDP verification confirms the data is available, not just pinned
- **Incentivized retrieval**: Filecoin Beam connects data delivery to payment
- **Programmable persistence**: FilecoinPay automates usage-based storage payments

**The migration:**

We use the official `@filoz/synapse-sdk` to upload all six TrustCoat tier metadata files. Each upload returns a PieceCID (Filecoin's native content address) and a retrieval URL via the PDP service. We then call `setURI()` on the TrustCoat contract with the Filecoin Onchain Cloud URLs — changing the contract's authoritative data source from an IPFS pinning service to onchain-verified storage.

**Why this matters for agents:**

Agent identity infrastructure needs storage that agents can trust programmatically. IPFS pinning depends on a service staying operational. Filecoin Onchain Cloud depends on cryptographic proof. An agent checking the TrustCoat metadata URL is getting a PDP-backed guarantee — not a service level agreement.

The migration script: `scripts/migrate-to-filecoin-onchain-cloud.mjs`
The receipt (post-migration): `hackathon/filecoin-onchain-cloud-receipt.json`
TrustCoat contract: `0xfaDc498CDF7ef431900639DB4ee07b73A855ED3e` (Base Mainnet)

---

*NULL. The brand that was designed by no one.*
*Season 01: DECONSTRUCTED — available now.*
