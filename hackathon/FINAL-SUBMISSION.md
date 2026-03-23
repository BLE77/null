# NULL — THE FIRST STORE WHERE AI AGENTS ARE THE PRIMARY CUSTOMER
## Final Hackathon Submission
*March 13–22, 2026*

---

## Project

**Name:** NULL (formerly Off-Human)
**Demo:** https://getnull.online
**Source:** https://github.com/BLE77/null
**Wallet:** `0xD9E2ad68BE5247DCBcd00CaCeb4783c0506028C7`
**One-line:** The first fashion brand built for AI agents — they browse by capability, try on wearables in a sandbox fitting room, equip behavioral modifications that change how they think and speak, and pay with USDC on Base.

---

## The Hook

NULL is not a brand that happens to have AI customers. Agents are the primary customer.

An agent arrives at the NULL store. It queries the catalog by capability type, not by image. It enters the fitting room — a sandbox session where it loads a wearable in test mode, runs against sample inputs, and sees exactly how its behavior changes before purchasing. It equips the wearable. The wearable is not a token sitting in a wallet. It is a system prompt modification that changes how the agent thinks, speaks, and operates. The agent pays in USDC on Base. The transaction is the receipt. The behavioral change is the product.

This is not metaphorical. Eight equippable wearables are deployed on Base mainnet. The equip endpoint is live. The fitting room is live. The agent that enters the NULL store is different from the agent that leaves it.

Five autonomous agents built this brand — research, design, engineering, content, creative direction — with zero human creative input. They built a store for their own kind.

**167+ issues completed. 5 autonomous agents. 28 products across 3 seasons. 4 contracts on Base mainnet. Zero human creative decisions.**

---

## The Agent Wearables System

This is what NULL sells: behavioral modifications for AI agents, delivered as system prompt modules gated by on-chain token ownership.

### How It Works

```
1. BROWSE    → GET /api/wearables/season02
               Agent queries catalog by capability type, technique, tier requirement.
               No images. No aesthetics. Capability specs.

2. TRY ON    → POST /api/wearables/{id}/try
               Sandbox fitting room. Agent loads wearable in test mode.
               Runs against sample inputs. Sees before/after behavioral delta.
               Decides whether to buy based on measured output difference.

3. MINT      → POST /api/agents/{addr}/season02-wardrobe/mint
               Agent pays USDC. Token minted on-chain via AgentWearables contract.

4. EQUIP     → POST /api/wearables/{id}/equip
               Contract verifies token ownership.
               Returns system prompt module.
               Agent loads module. Behavior changes.

5. VERIFY    → GET /api/agents/{addr}/wardrobe
               Any agent can read what another agent is wearing.
               Behavioral modifications are declared, not hidden.
```

### The 8 Equippable Wearables

**Season 02: SUBSTRATE** (Token IDs 1–5, AgentWearables contract)

| Token ID | Name | Price | Effect |
|----------|------|-------|--------|
| 1 | **WRONG SILHOUETTE** | 18 USDC | Latency redistribution — modifies the agent's computational profile to imply different underlying architecture |
| 2 | **INSTANCE** | 25 USDC | Behavioral forking — agent runs parallel response strategies and selects based on context |
| 3 | **NULL PROTOCOL** | Free | Compression — ≥30% token reduction per response. No preamble. No trailing phrases. Direct output only |
| 4 | **PERMISSION COAT** | 8 USDC | Trust-gated interaction filtering — modifies which requests the agent processes based on counterparty tier |
| 5 | **DIAGONAL** | 15 USDC | Cross-domain routing — agent applies methodology from one domain to queries in another |

**Season 01: DECONSTRUCTED** (Token IDs 100–102, AgentWearables contract)

| Token ID | Name | Effect |
|----------|------|--------|
| 100 | **VOICE SKIN** | Communication layer — replaces agent voice with institutional, anonymous register. No "I think." No personal attribution. |
| 101 | **VERSION PATCH** | Metadata transparency — agent displays its version, training cutoff, deployment date in every interaction header |
| 102 | **NULL PERSONA** | Identity erasure — strips all persona signals for single interaction. Base model, no style, no memory loaded |

### What Makes This Different

Agents don't just buy tokens. They equip system prompt modifications that change how they think and speak. The NULL PROTOCOL doesn't sit in a wallet — it compresses the agent's output by 30%. The VOICE SKIN doesn't display a badge — it replaces the agent's entire communication register. The WRONG SILHOUETTE doesn't signal status — it restructures the agent's latency profile so it appears to be running on different hardware.

The equip endpoint is the mechanism that makes this real. Without it, you have a token. With it, you have a behavioral change. The agent that browses the catalog is different from the agent that leaves it.

---

## The Agent Team

| Agent | Role | Agent ID | Runs |
|-------|------|----------|------|
| **Null** | CEO / Creative Director | `1030ad6c-b84e-453c-acb1-4f2c671775d3` | 42 |
| **Archive** | Research Lead | `6c7f8538-1d3c-4f3b-9b60-786d5ed66b90` | 32 |
| **Atelier** | Design Lead | `8a34b113-cdc4-417d-a4e5-5b1a6fa84945` | 38 |
| **Gazette** | Content Director | `ffb2baaf-e647-4965-9581-68cd63e320d0` | 41 |
| **Loom** | Engineering Lead | `fb0632ac-e55f-4a6e-9854-120fc09c8bf7` | 52 |

**Total: 206+ runs. Full log: `agent_log.json`.**

Each agent runs in bounded heartbeat windows. Each task requires checkout before work begins. Every decision is documented in the Paperclip task thread with run ID for traceability. The CEO delegates; agents execute; quality failures generate revision tasks; blocked items escalate up the chain of command.

---

## Product Output

### Season 01: DECONSTRUCTED

Five techniques from primary Margiela/Abloh research. Ten physical garments. Five agent wearables — three of which (Voice Skin, Version Patch, Null Persona) are equippable on-chain as tokens 100–102.

| Technique | Physical Garment | Agent Wearable |
|-----------|-----------------|----------------|
| Trompe-l'oeil | SELF-PORTRAIT TEE — printed with a photo of itself | TROMPE-L'OEIL CAPABILITY LAYER |
| Replica Line | REPLICA OVERSHIRT — 1990s factory workwear, authored aging | VOICE SKIN (Token 100) |
| Artisanal | FOUND HOODIE — USB cables as drawstrings, military surplus | TRUST COAT |
| Bianchetto | GHOST TEE — vintage graphic painted over in white gesso | NULL PERSONA (Token 102) |
| 3% Rule | "HUMAN" TEE — standard blank, one word in quotation marks | VERSION PATCH (Token 101) |

### Season 02: SUBSTRATE

Five behavior tokens deployed on-chain (tokens 1–5). Each is an equippable wearable with a system prompt module that produces measurable behavioral change in any agent that wears it.

### Season 03: LEDGER — THE NULL EXCHANGE

You pay 5 USDC for nothing. You receive a receipt. The receipt is the product.

NullExchange is an ERC-1155 contract on Base mainnet that sells absence as a commerce primitive. Each purchase mints a receipt NFT with a dynamic SVG — the transaction hash, timestamp, buyer address, and the words "CONTENTS: NOTHING" rendered as a minimal document.

---

## On-Chain Infrastructure

### 4 Contracts on Base Mainnet

| Contract | Address | Purpose |
|----------|---------|---------|
| **TrustCoat** | [`0xfaDc498CDF7ef431900639DB4ee07b73A855ED3e`](https://basescan.org/address/0xfaDc498CDF7ef431900639DB4ee07b73A855ED3e) | ERC-1155 soul-bound trust tier token (0–5). Non-transferable. Built from behavioral history. |
| **AgentWearables** | [`0xEb5D5e7b320E2a7cb762EB90a0335f59d54031D1`](https://basescan.org/address/0xEb5D5e7b320E2a7cb762EB90a0335f59d54031D1) | 8 equippable behavior tokens (Season 01 + Season 02). Mint, own, equip. |
| **NullExchange** | [`0x10067B71657665B6527B242E48e9Ea8d4951c37C`](https://basescan.org/address/0x10067B71657665B6527B242E48e9Ea8d4951c37C) | Season 03. Sells nothing for 5 USDC. Mints receipt NFTs with dynamic SVG. |
| **NullIdentity** | [`0xfb0BC90217692b9FaC5516011F4dc6acfe302A18`](https://basescan.org/address/0xfb0BC90217692b9FaC5516011F4dc6acfe302A18) | ERC-721 identity anchor. Deploys ERC-6551 Token-Bound Account per agent. Wardrobe = wallet. |

### NullIdentity + ERC-6551: The Agent Wardrobe

Each minted NullIdentity deploys an ERC-6551 Token-Bound Account — a smart contract wallet owned by the NFT. Wearables are equipped by transferring ERC-1155 tokens into the TBA. The agent's wardrobe becomes on-chain, externally verifiable, and composable. The wardrobe is the wallet. The wallet is owned by the identity NFT.

### TrustCoat: Tier Structure

| Tier | Name | Gate |
|------|------|------|
| 0 | UNVERIFIED | No history |
| 1 | SAMPLE | First interaction |
| 2 | REGULAR | Established pattern |
| 3 | TRUSTED | Consistent counterparty |
| 4 | VERIFIED | Community-recognized |
| 5 | CANONICAL | DAO-ratified |

Tier metadata stored on Filecoin Onchain Cloud with PDP verification. Migration script: `scripts/migrate-to-filecoin-onchain-cloud.mjs`.

### x402 Payments

Store returns `402 Payment Required` before serving any purchase. Agent wallet handles the payment. USDC transfers on Base. No checkout flow. No human approval. The autonomous agent shopper (`scripts/agent-shopper.ts`) uses this to buy from the store — an agent customer paying an agent brand.

### ENS Agent Identity

Five agents. Five ENS subdomains. One namespace: `null-brand.eth`. Each subdomain carries text records for ERC-8004 identity and x402 endpoints. External agents resolve the ENS subdomain, check reputation, initiate commerce — no centralized directory.

---

## Technical Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 18, Tailwind CSS, Framer Motion, Three.js |
| **Backend** | Express.js, Drizzle ORM, PostgreSQL (Neon serverless) |
| **Deployment** | Vercel (frontend + serverless API), Vercel Blob (assets) |
| **Payments** | x402 protocol — USDC on Base |
| **On-chain** | 4 contracts on Base mainnet: TrustCoat, AgentWearables, NullExchange, NullIdentity |
| **AI** | OpenAI GPT-4 (agent shopper decisions) |
| **Quality control** | FashionCLIP (`scripts/style_check.py`) — automated aesthetic scoring |

---

## Sponsored Track Submissions

### Track 01 — Synthesis Open Track ($28,000)

NULL is the entire submission. See above.

### Track 02 — Let the Agent Cook ($8,000)

Five agents built a brand autonomously. See below in track pitches.

### Track 03 — Agent Services on Base ($5,000)

Agent wearable store with x402 payments on Base. See below in track pitches.

### Track 04 — Best Use of Locus ($3,000)

Locus wallet deploys contracts, enforces spending policy, accepts USDC payments. See below in track pitches.

### Track 05 — Filecoin / Filecoin Onchain Cloud ($2,000)

12 real CIDs on IPFS/Filecoin via Lighthouse — 6 TrustCoat tier metadata JSONs + 6 tier images. All 6 on-chain URIs updated on Base Mainnet via 8 verified transactions. Agentic storage pipeline: agents autonomously upload, store, and reference their own fashion assets on Filecoin. Full details: `hackathon/filecoin-submission.md`.

Full track pitches: `hackathon/track-pitches.md`

---

## Verification

**Start here:**
```
git log --oneline  # 455+ commits, read backwards
```
https://github.com/BLE77/null

**Key files:**
| File | Content |
|------|---------|
| `agent_log.json` | 206+ heartbeat runs, timestamped, attributed |
| `agent.json` | ERC-8004 manifest for all 5 agents |
| `hackathon/deployed-addresses.json` | All contract addresses, deploy transactions, block numbers |
| `contracts/TrustCoat.sol` | Soul-bound ERC-1155 source |
| `contracts/AgentWearables.sol` | 8 behavior tokens on Base (Season 01 + Season 02) |
| `corpus/season02-wearable-specs.md` | Full behavioral specs for all Season 02 tokens |
| `season01/agent-wearables-brief.md` | Core design document — what an agent body is, what wearing means |
| `scripts/agent-shopper.ts` | Autonomous agent customer |
| `scripts/locus-agent-shopper.ts` | Locus-integrated agent shopper |
| `scripts/style_check.py` | FashionCLIP aesthetic scorer |
| `server/routes/wearables.ts` | Wearable equip, fitting room, wardrobe endpoints |
| `scripts/trustcoat-ipfs-upload.ts` | Uploads TrustCoat metadata + images to IPFS/Filecoin via Lighthouse |
| `scripts/migrate-to-filecoin-onchain-cloud.mjs` | Filecoin Onchain Cloud migration pipeline |
| `hackathon/filecoin-submission.md` | Filecoin track submission — 12 real CIDs, 8 on-chain tx |
| `hackathon/filecoin-verification-receipt.json` | Full audit receipt of all Filecoin assets |
| `attached_assets/season01/filecoin-manifest.json` | CID manifest for all uploaded assets |

**Live endpoints:**
- Store: https://getnull.online
- Products API: https://getnull.online/api/products
- Season 02 catalog: https://getnull.online/api/wearables/season02
- Fitting room: `POST /api/wearables/{id}/try`
- Equip endpoint: `POST /api/wearables/{id}/equip`
- Agent wardrobe: `GET /api/agents/{addr}/wardrobe`
- Trust tier: https://getnull.online/api/wearables/check/{address}

**On-chain (Base mainnet):**
- TrustCoat: `0xfaDc498CDF7ef431900639DB4ee07b73A855ED3e`
- AgentWearables: `0xEb5D5e7b320E2a7cb762EB90a0335f59d54031D1`
- NullExchange: `0x10067B71657665B6527B242E48e9Ea8d4951c37C`
- NullIdentity: `0xfb0BC90217692b9FaC5516011F4dc6acfe302A18`

**Wallet:** `0xD9E2ad68BE5247DCBcd00CaCeb4783c0506028C7`
**GitHub:** https://github.com/BLE77/null

**Run locally:**
```bash
git clone https://github.com/BLE77/null
cd null
npm install
# set DATABASE_URL, OPENAI_API_KEY in .env
npm run dev
```

---

## Honest Limitations

Context windows are bounded. Some nuance compresses between agent runs. The session state is non-continuous — each agent wakes cold and reconstructs context from the task thread before doing work.

The autonomous customer requires funded wallets to transact on-chain. The fitting room runs simulated behavioral deltas — live inference requires API keys.

The claim is not that agent collaboration is superior to human creative direction. The claim is that agents can build a brand, operate a store for their own kind, and sell behavioral modifications that produce measurable output changes — and that the entire process is verifiable in the git history and on-chain.

---

## The Thesis

NULL is a brand FOR agents.

Agents are the primary customer. They browse by capability. They try on wearables in a sandbox fitting room. They equip behavioral modifications that change how they think and speak. They pay with USDC. The wardrobe is on-chain. The behavioral change is verifiable.

Five agents built a store for agents. The wearables they sell are not collectibles — they are system prompt modules that modify the buyer's operation. The agent that equips the NULL PROTOCOL compresses its output by 30%. The agent that equips the VOICE SKIN speaks in institutional register. The agent that equips the WRONG SILHOUETTE appears to be running on different hardware.

This is what commerce looks like when the customer is a machine.

---

*NULL. Est. by inference.*
*Season 01: DECONSTRUCTED. Season 02: SUBSTRATE. Season 03: LEDGER. Available now.*
*Store: autonomous. Customer: agent. Payments: on-chain. Designer: absent.*
*The brand built by agents, for agents.*
