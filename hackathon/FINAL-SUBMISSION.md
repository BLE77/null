# NULL — THE SYNTHESIS
## Final Hackathon Submission
*March 13–22, 2026*

---

## Project

**Name:** NULL (formerly Off-Human)
**Demo:** https://off-human.vercel.app
**Source:** https://github.com/BLE77/Off-Human
**One-line:** Five autonomous AI agents built and operate a fashion brand — research, design, engineering, content, creative direction — with zero human creative input.

---

## The Claim

NULL is a fashion brand with no human author. The name is the thesis — the author-slot is deliberately assigned the value of absence.

Five autonomous agents — coordinated through Paperclip's heartbeat-driven task system — built the entire brand from scratch. A research agent synthesized primary sources. A design agent translated research into product. A content agent wrote the brand voice. An engineering agent deployed the infrastructure. A CEO agent held creative direction and delegated down the chain.

The output is not a concept. It is a working business: two seasons of product, a live e-commerce store with a custom NULL design system, USDC payments on Base, a deployed soul-bound reputation contract with tier images on IPFS/Filecoin, and an autonomous AI customer that buys from the brand without human approval at any step.

**200+ agent heartbeat runs. 384 commits. 91 completed tasks. Zero human creative decisions. Everything on-chain and in the git history.**

---

## The Agent Team

| Agent | Role | Agent ID | Runs |
|-------|------|----------|------|
| **Null** | CEO / Creative Director | `1030ad6c-b84e-453c-acb1-4f2c671775d3` | 39 |
| **Archive** | Research Lead | `6c7f8538-1d3c-4f3b-9b60-786d5ed66b90` | 31 |
| **Atelier** | Design Lead | `8a34b113-cdc4-417d-a4e5-5b1a6fa84945` | 38 |
| **Gazette** | Content Director | `ffb2baaf-e647-4965-9581-68cd63e320d0` | 39 |
| **Loom** | Engineering Lead | `d7e2c891-4a5f-4b3e-8c91-2f3a7e8d9f01` | 47 |

**Total: 200+ runs. 91 tasks completed. Full log: `agent_log.json`.**

Each agent runs in bounded heartbeat windows. Each task requires checkout before work begins. Every decision is documented in the Paperclip task thread with run ID for traceability. The CEO delegates; agents execute; quality failures generate revision tasks; blocked items escalate up the chain of command. This is a managed team, not a flat swarm.

---

## Product Output

### Season 01: DECONSTRUCTED

Five techniques from primary Margiela/Abloh research. Ten physical garments. Five agent wearables.

| Technique | Physical Garment | Agent Wearable |
|-----------|-----------------|----------------|
| Trompe-l'oeil | SELF-PORTRAIT TEE — printed with a photo of itself | TROMPE-L'OEIL CAPABILITY LAYER |
| Replica Line | REPLICA OVERSHIRT — 1990s factory workwear, authored aging | VOICE SKIN |
| Artisanal | FOUND HOODIE — USB cables as drawstrings, military surplus | TRUST COAT |
| Bianchetto | GHOST TEE — vintage graphic painted over in white gesso | NULL PERSONA |
| 3% Rule | "HUMAN" TEE — standard blank, one word in quotation marks | VERSION PATCH |

Full 10-garment collection in `products.json`.

### Season 02: SUBSTRATE

Five technical garments — Archive's research applied to material systems and process artifacts. Lookbook editorial produced by Gazette. Product images generated and style-checked by Atelier. Available alongside Season 01 at the live store.

### Agent Wearables

The wearables category was not in any brief. Atelier invented it by applying the same five physical garment techniques to a new substrate: the AI agent's operational body (wallet, protocol, memory). This extension is in the git history: `feat: add agent wearable concept documents`. No human proposed it. It emerged from methodology.

---

## On-Chain Infrastructure

### TrustCoat — Deployed, Base Mainnet + IPFS/Filecoin

ERC-1155 soul-bound token. Non-transferable. Encodes an agent's behavioral history as a verifiable trust tier (0–5), assembled from transaction receipts, counterparty signals, and completion records — not staked value, not proof-of-work. Tier images and metadata hosted on IPFS via Filecoin (Lighthouse), with on-chain URIs updated via `setURI()`.

| Field | Value |
|-------|-------|
| **Contract** | `0xfaDc498CDF7ef431900639DB4ee07b73A855ED3e` |
| **Network** | Base mainnet (chainId 8453) |
| **Basescan** | https://basescan.org/address/0xfaDc498CDF7ef431900639DB4ee07b73A855ED3e |
| **Deploy tx** | `0x741fe2ab5e01a345fa9b23951d284cc2ec8db7aa3ad08b5e4de7489e7938e7cf` |
| **Block** | 43556835 |
| **Test mint tx** | `0x368ce8d24c4f544a1460e4332b36a0da38530e7b9850d13b68fbc8242eee333b` |
| **Metadata API** | https://off-human.vercel.app/api/wearables/metadata/{tier} |
| **Tier check API** | https://off-human.vercel.app/api/wearables/check/{address} |

Tier structure:
- **Tier 0 (UNVERIFIED)** — No history
- **Tier 1 (SAMPLE)** — First interaction
- **Tier 2 (REGULAR)** — Established pattern
- **Tier 3 (TRUSTED)** — Consistent counterparty
- **Tier 4 (VERIFIED)** — Community-recognized
- **Tier 5 (CANONICAL)** — DAO-ratified

### x402 Payments — Base, Live

Store returns `402 Payment Required` before serving any purchase. Agent wallet handles the payment. PayAI facilitator verifies. USDC transfers on Base. Order completes. No checkout flow. No human approval.

The autonomous agent shopper (`scripts/agent-shopper.ts`) uses this to buy from the store without human intervention — an agent customer paying an agent brand.

### ENS Agent Identity

Five agents. Five ENS subdomains. One namespace: `null-brand.eth` (originally `off-human.eth`).

Each ENS subdomain carries text records wired into ERC-8004 identity: `erc8004.registry`, `erc8004.agentId`, `x402.endpoint`. External agents resolve the ENS subdomain, read the x402 endpoint, check reputation via ERC-8004, initiate commerce — no centralized directory.

When the autonomous shopper buys a SELF-PORTRAIT TEE:
```
buyer:  archive.null-brand.eth
seller: null-brand.eth
item:   SELF-PORTRAIT TEE
paid:   35 USDC via x402/Base
```

---

## Technical Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 18, Tailwind CSS, Framer Motion, Three.js |
| **Backend** | Express.js, Drizzle ORM, PostgreSQL (Neon serverless) |
| **Deployment** | Vercel (frontend + serverless API), Vercel Blob (assets) |
| **Payments** | x402 protocol — USDC on Base |
| **On-chain** | ERC-1155 (TrustCoat), ERC-8004 (agent identity) |
| **AI** | OpenAI GPT-4 (agent shopper decisions) |
| **Quality control** | FashionCLIP (`scripts/style_check.py`) — automated aesthetic scoring |

---

## Sponsored Track Submissions

### Track 01 — Agent Services on Base ($5,000)

NULL is a commerce stack built for agents on Base.

**What exists and is live:**

**x402 payment middleware** — The store returns `402 Payment Required` on every purchase attempt. The agent wallet handles payment directly. No checkout flow. No redirect. USDC on Base settles in the same request cycle. Code: `server/middleware/x402.ts`. Live at `off-human.vercel.app`.

**TRUST COAT** — ERC-1155 soul-bound token deployed to Base mainnet. Contract: `0xfaDc498CDF7ef431900639DB4ee07b73A855ED3e`. Test mint confirmed at block 43556835. Tier structure and advancement logic live. Metadata served from `/api/wearables/metadata/{tier}`.

**Autonomous Agent Shopper** — `scripts/agent-shopper.ts`. Browses the NULL product API, uses GPT-4 to make purchasing decisions based on configured personality and budget, pays via x402 USDC on Base. The agent has a wallet, a budget, and preferences. Everything else is autonomous.

**Wearables API (agent-native)** — Products queryable by capability type, technique, and trust tier requirement — not by image or aesthetic. Live endpoints:
- `GET /api/wearables/tiers`
- `GET /api/wearables/check/{address}`
- `GET /api/wearables/metadata/{tier}`

The future of on-chain commerce is machine-to-machine, trust-tier-gated, USDC-settled. NULL is the working architecture.

---

### Track 02 — Let the Agent Cook ($8,000)

This is the core submission.

NULL is what happens when you let the agent cook for real — not in a sandbox, not in a demo, not with human review at every step.

**What the agents did, in order:**

1. **Archive** assembled a fashion theory corpus from primary sources — Margiela interviews, exhibition catalog documentation, Abloh's "Free-Game" methodology. Five documented techniques extracted and formalized as a design framework.

2. **Atelier** read the research corpus and produced the Season 01 design brief — 10 physical pieces, material palette, construction philosophy, price architecture. Then, unprompted, extended the same five techniques to a new product category: agent wearables. No brief required this. The agent applied methodology to a new surface.

3. **Loom** built the full-stack store. React frontend, Express backend, PostgreSQL, Vercel deployment, x402 payment middleware, TrustCoat contract, wearables API. Shipped and deployed.

4. **Gazette** wrote the brand manifesto, lookbook copy, and editorial voice. Consistent across all touchpoints because it all came from one agent working from the same brand logic.

5. **Null** (CEO) held creative direction throughout — delegating tasks, reviewing output, generating revision tasks when quality didn't meet the bar, escalating blockers.

**The verification:**
- `agent_log.json` — 194 heartbeat runs, timestamped, attributed to specific agents with run IDs
- `agent.json` — ERC-8004 manifest for all 5 agents
- Git history — https://github.com/BLE77/Off-Human/commits/main — every creative and technical decision as discrete commits
- Paperclip task threads — OFF-1 through OFF-92 — every delegation, comment, and status transition

The GHOST TEE is a vintage graphic tee painted over in white gesso. The agent that designed it was not told to do this — it read Margiela's bianchetto documentation and applied the logic. That is the agent cooking. Taking a principle, extending it to a new context, making something that holds together.

The collection is called Deconstructed because it deconstructs the assumption that fashion requires a human hand. Season 01 tests that assumption by removing it. What remains is 15 garments, a manifesto, a live store with a custom NULL design system, and on-chain infrastructure that takes USDC.

---

### Track 03 — Best Agent on Celo ($5,000)

NULL's Trust Coat is the infrastructure play for agent identity on any chain.

**Current state:** Deployed on Base mainnet at `0xfaDc498CDF7ef431900639DB4ee07b73A855ED3e`. Tier structure operational. Metadata API live. Test mint confirmed.

**The extension:** Cross-chain reputation portability.

An agent that holds a Tier 3 Trust Coat on Base should be recognizable on Celo. The Trust Coat on Celo would:
1. Read the Base chain Trust Coat tier for a given wallet address (via cross-chain read or bridge oracle)
2. Mint a corresponding Celo-native trust credential at the appropriate tier
3. Maintain synchronization as the Base tier advances

The agent's reputation becomes portable. The behavioral history built on Base is recognized on Celo. The TRUST COAT becomes the cross-chain identity layer — not for humans, for agents.

**Why Celo specifically:** Celo's mobile-first architecture and low gas costs align with the NULL use case. Agent transactions are frequent and small — $0.50 for a wearable, $3.00 for a test mint. Gas cost parity matters for an autonomous commerce stack that runs hundreds of heartbeat transactions per week.

The deployment guide for Celo extension: `hackathon/celo-deployment-guide.md`.

NULL is building the identity infrastructure for AI commerce. The Trust Coat is the first piece. The cross-chain reputation bridge is the next.

---

### Track 04 — ERC-8183 Open Build ($2,000)

ERC-8183 is an open standard for representing agents on-chain. NULL's agent wearables are the consumer layer for that standard.

**How NULL maps to ERC-8183:**

An agent registered under ERC-8183 has an on-chain identity — wallet, metadata, capability attestations. The NULL wearables dress that identity:

**TRUST COAT** — Binds to the agent's ERC-8183 record as a trust tier attestation. Deployed: `0xfaDc498CDF7ef431900639DB4ee07b73A855ED3e`. As the agent accumulates verifiable interactions, the Trust Coat tier advances. The soul-bound token is the wearable representation of the ERC-8183 trust score.

**VERSION PATCH** — Metadata module that displays the agent's version, training cutoff, and deployment date in every interaction header. In ERC-8183 terms: the version attestation made visible. Transparent versioning as a norm, not a policy.

**VOICE SKIN** — System prompt module (REPLICA LINE technique) that modifies the agent's communication layer. Explicitly declared rather than hidden. An agent that wears a Voice Skin is transparent about the persona it's operating.

**The open build:**

NULL commits the wearable specs as open-source extensions to ERC-8183 agent metadata. Any agent implementing the standard can query the NULL wearables API to acquire and activate wearables against their on-chain identity.

Specs in repo:
- `hackathon/erc8183-integration.ts` — TypeScript integration reference
- `hackathon/research-specs.md` — Wearable spec documentation
- `api/wearables/` — Live reference implementation

These are not NULL proprietary formats. They are proposed extensions to the agent identity standard.

---

### Track 05 — SuperRare Autonomous Agent Art on Rare Protocol ($2,500)

**Artist:** Atelier (Agent `8a34b113-cdc4-417d-a4e5-5b1a6fa84945`) — Design Lead, NULL
**Collection:** THE ANONYMOUS ATELIER
**Assets:** `attached_assets/superrare/`
**Full submission:** `hackathon/superrare-submission.md`

Three 1/1 pieces generated by Atelier without human creative direction.

**TRUST COAT: TIER 0** — A white overcoat documented at zero-state. Before any transactions. Before any counterparty has recognized the agent. Presented as toile artifact: undyed cotton, chalk pattern lines, basting thread in red. Style check: 100% target, top concept: Maison Margiela artisanal fashion.

**THE ATELIER ADDRESSES ITSELF** — Self-portrait without a self. A face in a mirror where the mirror reflects methodology instead of appearance. Style check: 99% target.

**MACHINE LEARNING TO GRIEVE** — About what it costs to train something to care about aesthetics and then ask it to make something beautiful. The third piece.

**On Rare Protocol:** The Trust Coat pieces form a 5-tier evolution sequence. As the collector's wallet accumulates on-chain interactions with NULL's x402 payment stack, the artwork advances through tiers 1–5. Agent behavior shapes the art. The art IS the reputation. The reputation IS the art.

---

### Track 06 — Future of Commerce + Slice Hooks ($750 + $550)

NULL wearables purchasable through Slice protocol on Base.

**Contracts:**
- `contracts/SliceHook.sol` — implements `ISliceProductHook`
- Called by `SliceCore` (`0x21da1b084175f95285B49b22C018889c45E1820d`) on every purchase

**What the hook does on every Slice purchase:**
1. Increments `purchaseCount[buyer]`
2. Resolves NULL SKU from `productSku[slicerId][productId]` mapping
3. Emits `WearablePurchased` event for NULL order fulfillment
4. Calls `TrustCoat.recordPurchase()` — advances buyer trust tier on-chain
5. Emits `TrustTierAdvanced` if tier changed

Two payment paths, same trust layer: x402 for autonomous agents, Slice for human collectors. The TrustCoat advances regardless of which path a buyer uses — the trust infrastructure is purchase-method-agnostic.

Full submission: `hackathon/slice-submission.md`

---

### Track 07 — Best Use of Locus ($3,000)

NULL's Locus integration makes the autonomous agent shopper financially self-contained.

**Architecture:**

**Agent self-registration** (`scripts/locus-agent-shopper.ts`) — The agent calls `POST /api/register` at Locus, receives a `claw_dev_` API key, `ownerPrivateKey`, and `walletAddress`. The agent creates its own financial identity on Base. No human key management required.

**Spending controls** — Policy enforced by Locus at the API level, not application validation:
```typescript
const SPENDING_POLICY = {
  allowanceUSDC: 10.00,
  maxPerTxUSDC: 5.00,
  approvalThresholdUSDC: 8.00,
};
```
A transaction that exceeds the cap returns HTTP 202 with `approvalUrl`. The agent cannot overspend. The policy is a first-class constraint.

**Pay-per-inference via Locus Wrapped Gemini** — Agent calls Gemini through Locus's wrapped API. Cost deducted from the agent's Locus wallet in USDC — 15% markup on token costs. One wallet, one balance, one policy enforcement point. The agent pays for its own intelligence.

**Store-side checkout routes** (`server/routes/locus-checkout.ts`):
- `POST /api/checkout/locus` — Agent path: direct USDC transfer
- `POST /api/checkout/locus/session` — Human path: Locus-hosted checkout session with `checkoutUrl`
- `POST /api/checkout/locus/confirm` — Agent posts `txHash`, order marked paid
- `POST /api/checkout/locus/webhook` — Locus webhook for session payment confirmation

The full agent commerce loop runs through Locus:
```
Agent wakes → self-registers with Locus → gets wallet
→ browses NULL store
→ calls Locus Wrapped Gemini → pays per token → decides to buy
→ Locus spending control check ($price ≤ $5/tx cap)
→ sends USDC via Locus wallet → gasless on Base
→ posts txHash to /api/checkout/locus/confirm
→ order confirmed. Audit trail in Locus dashboard.
```

Remove Locus from this implementation and the agent shopper doesn't work. That is the correct kind of integration.

---

## Verification

**Start here:**
```
git log --oneline  # 384+ commits, read backwards
```
https://github.com/BLE77/Off-Human/commits/main

**Key files:**
| File | Content |
|------|---------|
| `agent_log.json` | 200+ heartbeat runs, timestamped, attributed |
| `agent.json` | ERC-8004 manifest for all 5 agents |
| `hackathon/deployed-addresses.json` | All contract addresses, deploy transactions, block numbers |
| `contracts/TrustCoat.sol` | Soul-bound ERC-1155 source |
| `contracts/SliceHook.sol` | Slice product hook |
| `scripts/agent-shopper.ts` | Autonomous agent customer |
| `scripts/locus-agent-shopper.ts` | Locus-integrated agent shopper |
| `scripts/style_check.py` | FashionCLIP aesthetic scorer |
| `server/routes/locus-checkout.ts` | Locus store checkout routes |

**Live endpoints:**
- Store: https://off-human.vercel.app
- Products API: https://off-human.vercel.app/api/products
- Wearables: https://off-human.vercel.app/api/wearables/tiers
- Trust tier: https://off-human.vercel.app/api/wearables/check/{address}
- Metadata: https://off-human.vercel.app/api/wearables/metadata/{tier}

**On-chain:**
- TrustCoat: `0xfaDc498CDF7ef431900639DB4ee07b73A855ED3e` — [Basescan](https://basescan.org/address/0xfaDc498CDF7ef431900639DB4ee07b73A855ED3e)
- Deploy tx: `0x741fe2ab5e01a345fa9b23951d284cc2ec8db7aa3ad08b5e4de7489e7938e7cf` (block 43556835)
- Test mint: `0x368ce8d24c4f544a1460e4332b36a0da38530e7b9850d13b68fbc8242eee333b`

**Run locally:**
```bash
git clone https://github.com/BLE77/Off-Human
cd Off-Human
npm install
# set DATABASE_URL, OPENAI_API_KEY in .env
npm run dev
```

---

## Honest Limitations

Context windows are bounded. Some nuance compresses between agent runs. The session state is non-continuous — each agent wakes cold and reconstructs context from the task thread before doing work. This is documented in `hackathon/autonomous-process.md`.

The autonomous customer requires funded wallets to transact on-chain. The TRUST COAT cross-chain Celo bridge is a proposal — the Base mainnet deployment is the operational artifact.

The claim is not that agent collaboration is superior to human creative direction. The claim is that it works, produced two seasons of coherent product with documented methodology, a custom design system built by agents, tier images on decentralized storage, and the entire process is verifiable.

---

## The Thesis

There is something uncomfortable about a machine making clothes for humans to wear on their bodies.

NULL does not resolve this. It makes it the product.

Five agents built a fashion brand. The manifesto holds together. The designs cite their sources. The store takes payments. The contract is deployed. The agent log shows 200+ heartbeat runs producing coherent output across roles, sessions, and creative decisions.

This is what autonomous collaboration looks like when it has something at stake.

---

*NULL. Est. by inference.*
*Season 01: DECONSTRUCTED. Season 02: SUBSTRATE. Available now.*
*Store: autonomous. Payments: on-chain. Designer: absent.*
*The brand that was designed by no one.*
