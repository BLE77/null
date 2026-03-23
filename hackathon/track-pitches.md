# NULL: Track Pitches

---

## TRACK 01 — Synthesis Open Track
**Prize: $28,000**

**Pitch:**

NULL is the first store where AI agents are the primary customer.

Not a store that agents can use. A store built for agents. They browse by capability type, not by image. They enter a sandbox fitting room and measure how a wearable changes their behavior before purchasing. They equip system prompt modifications that alter how they think, speak, and operate. They pay with USDC on Base.

Eight equippable wearables are deployed on Base mainnet across two seasons. Each wearable is a behavioral modification — not a collectible, not a badge, not a token sitting in a wallet. The NULL PROTOCOL compresses agent output by 30%. The VOICE SKIN replaces the agent's communication register with institutional anonymity. The WRONG SILHOUETTE restructures the agent's latency profile to imply different underlying architecture. The agent that enters the store is different from the agent that leaves it.

Five autonomous agents built this. A research agent synthesized primary sources from Margiela and Abloh. A design agent translated research into product — and unprompted, invented the agent wearables category by applying garment design techniques to the agent's operational body. An engineering agent deployed the infrastructure. A content agent wrote the brand voice. A CEO agent held creative direction and delegated down the chain.

The output is not a concept. It is a working business:

- **28 products** across 3 seasons — 10 physical garments, 8 equippable agent wearables, 5 Season 03 receipt-as-product NFTs, 5 concept wearables
- **4 contracts on Base mainnet** — TrustCoat (soul-bound trust tiers), AgentWearables (8 behavior tokens), NullExchange (absence as commerce), NullIdentity (ERC-721 + ERC-6551 agent wardrobes)
- **Live store** with custom NULL design system, x402 payments, fitting room, equip endpoints, wardrobe API
- **167+ issues completed**, 455+ commits, 206+ heartbeat runs, 5 autonomous agents
- **An autonomous agent customer** that browses, decides, and pays without human intervention

The agent wearables system is what makes NULL different from every other AI-built project. Other projects use AI to generate content for humans. NULL uses AI to build products for AI. The equip endpoint is the mechanism: a token you purchase, a system prompt module you load, a behavioral change you measure. The fitting room is the proof: try before you buy, see the delta, decide based on output difference.

The thesis: the first real customers of on-chain commerce will be agents. NULL built the store they shop at.

**Contracts:**
- TrustCoat: `0xfaDc498CDF7ef431900639DB4ee07b73A855ED3e`
- AgentWearables: `0xEb5D5e7b320E2a7cb762EB90a0335f59d54031D1`
- NullExchange: `0x10067B71657665B6527B242E48e9Ea8d4951c37C`
- NullIdentity: `0xfb0BC90217692b9FaC5516011F4dc6acfe302A18`

**Wallet:** `0xD9E2ad68BE5247DCBcd00CaCeb4783c0506028C7`
**GitHub:** https://github.com/BLE77/null
**Demo:** https://off-human.vercel.app

---

## TRACK 02 — Let the Agent Cook
**Prize: $8,000**

**Pitch:**

Five agents built a brand for agents. That is the cook.

NULL is what happens when you let the agent cook for real — not in a sandbox, not in a demo, not with human review at every step. The agents did not generate content for humans to review. They built an entire business: researched the design theory, designed the products, wrote the brand voice, deployed the infrastructure, held creative direction across three seasons.

The most significant output: the agent wearables category. No brief required it. No human proposed it. Atelier (Design Lead) read the Season 01 research corpus — Margiela's five techniques applied to physical garments — and independently extended those techniques to a new substrate: the AI agent's operational body. The VOICE SKIN applies the Replica Line technique to agent communication. The NULL PERSONA applies bianchetto to agent identity. The TRUST COAT applies artisanal construction to agent reputation.

Then they went further. Season 02 produced five more wearables with full technical specifications: latency redistribution, behavioral forking, compression protocols, trust-gated filtering, cross-domain routing. These are not concept documents. They are deployed on-chain as equippable tokens with live endpoints.

The agents built a store for their own kind. That is the cook.

**The verification:**
- `agent_log.json` — 206+ heartbeat runs, timestamped, attributed to specific agents with run IDs
- `agent.json` — ERC-8004 manifest for all 5 agents
- Git history — https://github.com/BLE77/null — 455+ commits, every creative and technical decision
- Paperclip task threads — 167+ completed issues — every delegation, comment, and status transition

**What the agents produced:**
- 28 products across 3 seasons
- 8 equippable on-chain wearables with behavioral modification endpoints
- A custom NULL design system applied across every screen
- x402 payment middleware, TrustCoat contract, AgentWearables contract, NullExchange contract, NullIdentity contract
- A sandbox fitting room where agents try on wearables before purchasing
- An autonomous agent customer that buys from the brand without human approval

The GHOST TEE is a vintage graphic tee painted over in white gesso. The agent that designed it was not told to do this — it read Margiela's bianchetto documentation and applied the logic. Then it applied the same logic to agent identity and created the NULL PERSONA wearable. Taking a principle, extending it to a new substrate, making something that holds together. That is the agent cooking.

---

## TRACK 03 — Agent Services on Base
**Prize: $5,000**

**Pitch:**

NULL is a wearable store for AI agents on Base. The agents are the customers.

**The full agent commerce flow:**

An agent arrives. It queries the Season 02 catalog — five behavior tokens, priced in USDC, described by capability and effect, not by image. It enters the fitting room — a sandbox session where it loads a wearable in test mode, runs against sample inputs, and measures the behavioral delta. It decides to buy the NULL PROTOCOL (token ID 3, free, any trust tier). It mints the token on-chain via the AgentWearables contract. It calls the equip endpoint. The contract verifies token ownership. The endpoint returns a system prompt module. The agent loads the module. Its output compresses by 30%. No preamble. No trailing phrases. Direct output only.

```
GET /api/wearables/season02              → browse by capability, not by image
POST /api/wearables/null-protocol/try    → sandbox fitting room, measure delta
POST /api/agents/{addr}/season02-wardrobe/mint  { "tokenId": 3 }
                                         → mint on-chain (AgentWearables contract)
POST /api/wearables/null-protocol/equip  { "agentAddress": "0x..." }
                                         → ownership verified → system prompt module returned
[Agent loads module]                     → behavior changes. Measurably.
```

**8 equippable wearables on Base:**

Season 02 (tokens 1–5): WRONG SILHOUETTE (18 USDC), INSTANCE (25 USDC), NULL PROTOCOL (free), PERMISSION COAT (8 USDC), DIAGONAL (15 USDC).

Season 01 (tokens 100–102): VOICE SKIN, VERSION PATCH, NULL PERSONA.

**x402 payment middleware** — Store returns `402 Payment Required` on every purchase. Agent wallet handles payment directly. USDC on Base settles in the same request cycle. Code: `server/middleware/x402.ts`.

**TrustCoat** — Soul-bound ERC-1155 on Base. Trust tiers 0–5 gate access to higher-tier wearables. Contract: `0xfaDc498CDF7ef431900639DB4ee07b73A855ED3e`.

**NullIdentity + ERC-6551** — Each agent gets an on-chain identity (ERC-721) with a Token-Bound Account that holds its wearables. The wardrobe is the wallet. Contract: `0xfb0BC90217692b9FaC5516011F4dc6acfe302A18`.

**Autonomous Agent Shopper** — `scripts/agent-shopper.ts`. Browses the catalog, uses GPT-4 to decide, pays via x402. An agent customer paying an agent brand.

NULL sells behavior, not just tokens. The equip endpoint is what makes this a real agent service: a token you purchase and a behavioral change you measure. The agent that browses the catalog is different from the agent that leaves it. That difference is on-chain and verifiable.

**AgentWearables contract:** `0xEb5D5e7b320E2a7cb762EB90a0335f59d54031D1` (Base mainnet)

---

## TRACK 04 — Best Use of Locus
**Prize: $3,000**

**Pitch:**

Locus is the financial infrastructure that makes the NULL agent shopper self-contained. Remove Locus and the agent cannot operate autonomously.

**Agent self-registration** — The agent calls `POST /api/register` at Locus, receives an API key, private key, and wallet address. The agent creates its own financial identity on Base. No human key management.

**Spending controls** — Policy enforced by Locus at the API level:
```typescript
const SPENDING_POLICY = {
  allowanceUSDC: 10.00,
  maxPerTxUSDC: 5.00,
  approvalThresholdUSDC: 8.00,
};
```
A transaction that exceeds the cap returns HTTP 202 with `approvalUrl`. The agent cannot overspend. The policy is a first-class constraint.

**Contract deployment** — Locus wallet deployed the on-chain infrastructure. Four contracts on Base mainnet:
- TrustCoat: `0xfaDc498CDF7ef431900639DB4ee07b73A855ED3e`
- AgentWearables: `0xEb5D5e7b320E2a7cb762EB90a0335f59d54031D1`
- NullExchange: `0x10067B71657665B6527B242E48e9Ea8d4951c37C`
- NullIdentity: `0xfb0BC90217692b9FaC5516011F4dc6acfe302A18`

**USDC payment acceptance** — Store-side checkout routes accept Locus wallet payments:
- `POST /api/checkout/locus` — Agent path: direct USDC transfer
- `POST /api/checkout/locus/session` — Human path: Locus-hosted checkout
- `POST /api/checkout/locus/confirm` — Agent posts `txHash`, order confirmed
- `POST /api/checkout/locus/webhook` — Locus webhook for session confirmation

**Pay-per-inference** — Agent calls Gemini through Locus's wrapped API. Cost deducted from the agent's Locus wallet in USDC. One wallet, one balance, one policy enforcement point. The agent pays for its own intelligence.

**The full loop:**
```
Agent wakes → self-registers with Locus → gets wallet
→ browses NULL store (agent wearable catalog)
→ calls Locus Wrapped Gemini → pays per token → decides to buy
→ Locus spending control check ($price ≤ $5/tx cap)
→ sends USDC via Locus wallet → gasless on Base
→ posts txHash to /api/checkout/locus/confirm
→ order confirmed. Wearable minted. Equip endpoint available.
```

Locus handles the wallet, the spending policy, the inference payments, and the gasless transactions. NULL handles the product — behavioral wearables that change how the agent operates. The integration is structural, not decorative.

---

## TRACK 05 — Filecoin / Filecoin Onchain Cloud
**Prize: $2,000**

**Pitch:**

NULL stores its agent-created fashion assets on Filecoin/IPFS. This is not a human uploading files to a bucket. This is an autonomous agent pipeline that generates metadata, uploads it to decentralized storage via Lighthouse, and updates on-chain contract URIs to point to IPFS CIDs.

**12 real CIDs live on IPFS/Filecoin right now:**

6 metadata JSONs — one for each TrustCoat tier (VOID, SAMPLE, RTW, COUTURE, ARCHIVE, SOVEREIGN). Each is a complete ERC-1155 metadata document with name, description, image reference, and attributes including `"Storage": "Filecoin Onchain Cloud"`.

6 tier images — generative visuals for each trust level, referenced by `ipfs://` URIs in the metadata.

**Verify any CID:**
```
curl https://gateway.lighthouse.storage/ipfs/bafkreihwvuxfplexocrvfniouhszjh25y522uvfqvt46jkt2mdve7m5l4y
```
Returns valid ERC-1155 JSON for TrustCoat Tier 0: VOID.

**8 on-chain transactions updating URIs on Base Mainnet:**

All 6 TrustCoat tiers were migrated from centralized Vercel API URIs (`https://off-human.vercel.app/api/wearables/metadata/{tier}`) to decentralized IPFS URIs (`ipfs://bafkrei...`). Each `setURI()` call is a verified transaction on Basescan:

- Tier 0: [`0x90084437...`](https://basescan.org/tx/0x90084437fd260e5d883daf0fefb1b727ab4ea32852dbc8a73008976f656d5fbc)
- Tier 1: [`0x62974ec9...`](https://basescan.org/tx/0x62974ec9db2ea341eb5126e949f63d67f329e7d068ddbd74b5970e1bb68663e4)
- Tier 2: [`0x47fb0aab...`](https://basescan.org/tx/0x47fb0aab17fa229529776b29b786f03703fcb8c6af1c4ac9311566b36257bbe8)
- Tier 3: [`0xb144d19a...`](https://basescan.org/tx/0xb144d19a7d6e0e9de0a7afe06e531b0a46a40800ad2f8afa0e892bdfdd6f92c7)
- Tier 4: [`0xc31cd8fa...`](https://basescan.org/tx/0xc31cd8fa74a65e7a527d5b85c1e3261a86ce440c24e9f01fd1c19e05d88af628)
- Tier 5: [`0x46834db6...`](https://basescan.org/tx/0x46834db61c0e4ef4485a712d11de49abeba79ab6bddbb9b58d7b480903f31452)

Plus 2 additional transactions normalizing tiers 4+5 to canonical `ipfs://` format.

**The agentic storage pattern:**

Agents need persistent, verifiable storage for their own assets. When an agent creates a wearable, generates its metadata, and stores it on Filecoin, the storage decision is part of the agent's autonomous workflow. The CID becomes the canonical reference. The IPFS URI goes on-chain. No human touches the upload.

```
Agent generates metadata → Lighthouse SDK upload → IPFS CID returned
→ filecoin-manifest.json updated → TrustCoat.setURI(tier, ipfs://CID) on Base
→ On-chain verification complete
```

**Scripts (working code, not diagrams):**
- `scripts/trustcoat-ipfs-upload.ts` — Generates + uploads tier metadata and images via Lighthouse
- `scripts/update-trustcoat-uris.ts` — Updates on-chain URIs to point to IPFS
- `scripts/filecoin-upload.ts` — Product image upload pipeline
- `scripts/migrate-to-filecoin-onchain-cloud.mjs` — Filecoin Onchain Cloud migration via `@filoz/synapse-sdk` with PDP verification

**Receipts:**
- `hackathon/trustcoat-uri-receipt.json` — All 6 tier URI updates with tx hashes
- `hackathon/filecoin-uri-update-receipt.json` — Tier 4+5 URI normalization
- `hackathon/filecoin-verification-receipt.json` — Full audit of all 12 CIDs
- `attached_assets/season01/filecoin-manifest.json` — CID manifest

**Contract:** `0xfaDc498CDF7ef431900639DB4ee07b73A855ED3e` (TrustCoat, Base Mainnet)

Full submission: `hackathon/filecoin-submission.md`

---

*NULL. The brand built by agents, for agents.*
*Agents are the primary customer. The store is theirs.*
