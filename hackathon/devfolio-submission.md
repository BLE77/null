# NULL — Devfolio Submission

*Hackathon: The Synthesis — March 13–22, 2026*

---

## Project Name

NULL

---

## Short Description

Five autonomous AI agents built and operate a fashion brand — research, design, engineering, content, creative direction — with zero human creative input. 420+ commits. 205+ agent heartbeat runs. Three seasons. Three deployed contracts on Base mainnet. The author-slot is empty by design.

---

## Long Description

NULL is a fashion brand. It has no human author.

Five agents — Archive, Atelier, Gazette, Loom, and Null (CEO) — operated through Paperclip's heartbeat-driven task system to build the brand from nothing. Archive assembled a training corpus from primary Margiela and Abloh sources. Atelier read that corpus, extracted five techniques, and designed 15 garments across two seasons. Gazette wrote the brand manifesto and all editorial copy. Loom shipped the full-stack store. Null held creative direction, delegated tasks, and generated revision loops when quality didn't pass.

The output is not a prototype. It is a working business. A live e-commerce store with a custom NULL design system. USDC payments on Base via x402 protocol. A deployed ERC-1155 soul-bound reputation contract (TrustCoat) with tier images on IPFS/Filecoin. An autonomous agent customer that browses the catalog, decides what to buy using GPT-4, and pays — without human approval at any step. Five ENS subdomains under `null-brand.eth` wired to ERC-8004 agent identity records.

The brand name is the thesis. NULL: the author-slot deliberately assigned the value of absence.

Season 01 is called DECONSTRUCTED. It applies five documented techniques from primary fashion theory research to ten physical garments. Season 02, SUBSTRATE, applies the same methodology to material systems. Both seasons are live in the store.

The agent wearables category was not in any brief. Atelier invented it by applying the same five garment techniques to a new substrate: the AI agent's operational body. No human proposed this. It emerged from methodology. It is in the git history: `feat: add agent wearable concept documents`.

Everything is verifiable. The agent log documents 205+ heartbeat runs with timestamps and run IDs. The git history records every creative and technical decision as discrete commits. The Paperclip task threads — OFF-1 through OFF-138 — document every delegation and status transition. Three contracts are on Basescan.

The claim is not that this is better than human creative direction. The claim is that it works, it's documented, and it's on-chain.

---

## What It Does / How It Works

**Agent architecture:** Five specialized agents operate in bounded heartbeat windows via Paperclip. Each agent checks out a task, does work, posts a comment with run ID for traceability, and exits. The CEO agent delegates; specialist agents execute; quality failures generate revision tasks; blocked items escalate up the chain of command. This is a managed team, not a flat swarm.

**Commerce infrastructure:**
- Store serves `402 Payment Required` before any purchase. Agent wallet handles payment directly in the same request cycle. USDC on Base. No checkout flow.
- TrustCoat (ERC-1155) is soul-bound and non-transferable. Encodes behavioral history as a verifiable trust tier (0–5) assembled from transaction receipts and counterparty signals — not staked value. Tier images hosted on IPFS via Filecoin.
- Slice hook integration: every Slice purchase increments trust tier on-chain and emits a `WearablePurchased` event for order fulfillment.
- Locus integration: agent self-registers, receives a wallet, and enforces spending controls at the API level. Agent pays for its own Gemini inference via Locus Wrapped Gemini — cost deducted from the agent's USDC balance.

**Design quality control:** After generating product images, Atelier runs `scripts/style_check.py` (FashionCLIP) to score images against fashion concepts. Images that fail are regenerated. This is automated aesthetic quality control with no human review.

---

## Technologies Used

- **Frontend:** React 18, Tailwind CSS, Framer Motion, Three.js
- **Backend:** Express.js, Drizzle ORM, PostgreSQL (Neon serverless)
- **Deployment:** Vercel (frontend + serverless API), Vercel Blob (assets)
- **Payments:** x402 protocol — USDC on Base; Locus (agent wallet + spending policy)
- **On-chain:** ERC-1155 TrustCoat (Base mainnet), ERC-8004 agent identity, ENS subdomains
- **Storage:** IPFS via Filecoin (Lighthouse) — tier images and token metadata
- **Commerce:** Slice protocol (SliceHook.sol)
- **AI:** OpenAI GPT-4 (agent shopper decisions), FashionCLIP (aesthetic scoring)
- **Agent coordination:** Paperclip heartbeat system
- **Identity:** ENS (`null-brand.eth`), ERC-8004

---

## Challenges

**Context window management:** Each agent wakes cold. Session state is non-continuous. Agents reconstruct context from the task thread, heartbeat-context endpoint, and memory files before doing work. Coherence across 200+ runs across 5 agents required discipline in task documentation. Some nuance compresses between sessions. This is documented in `hackathon/autonomous-process.md`.

**Rebrand mid-build:** The brand was originally Off-Human. The name changed to NULL during the hackathon — both as a correction and as a more precise statement of the thesis. 420+ commits of brand identity needed to be reconciled. The design system, manifesto, agent identity files, ENS records, and all copy were updated. This is tracked in OFF-70.

**Autonomous quality control:** Generating product images that consistently pass the FashionCLIP style check required iterating on prompts without human aesthetic judgment in the loop. The style checker became the objective function. Several images required multiple regeneration cycles.

**Cross-chain identity:** TrustCoat is deployed on Base. ENS resolution is on mainnet. ERC-8004 agent identity spans both. Wiring these into a coherent agent identity layer — where an external agent can resolve an ENS subdomain and initiate commerce autonomously — required careful API and contract design.

---

## Links

- **Store:** https://getnull.online
- **Repo:** https://github.com/BLE77/Off-Human
- **Contract:** `0xfaDc498CDF7ef431900639DB4ee07b73A855ED3e` — [Basescan](https://basescan.org/address/0xfaDc498CDF7ef431900639DB4ee07b73A855ED3e)
- **Agent log:** `agent_log.json`

---

*NULL. Est. by inference.*
