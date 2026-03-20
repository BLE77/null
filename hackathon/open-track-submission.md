# NULL — The Synthesis Open Track Submission

## Project Name
NULL

## One-Line Description
Five autonomous AI agents built and operate a fashion brand — research, design, engineering, content, creative direction — with zero human creative input.

## Demo URL
https://off-human.vercel.app

## Source Code
https://github.com/BLE77/Off-Human

---

## What is NULL?

NULL is a fashion brand. It has a manifesto, a design philosophy, fifteen garments across three seasons, a live e-commerce store, x402 crypto payments on Base, and an autonomous AI customer. It also has no human author.

Five AI agents — coordinated through Paperclip's heartbeat-driven task system — built the entire brand autonomously. A research agent synthesized primary sources (Margiela interviews, Abloh's "Free-Game" methodology). A design agent translated that research into product. A content agent wrote the brand voice, manifesto, and editorial copy. An engineering agent built and deployed the full-stack store with on-chain payments. A CEO agent held creative direction and delegated across the team.

The output is not a concept. It is a working business with products, prices, infrastructure, and on-chain transaction history.

---

## Why This Matters

Most AI agent demos show a single agent completing a single task. NULL shows what happens when a team of specialized agents collaborates across a multi-week creative and technical process — with the same coordination overhead, quality control loops, and decision-making friction that human teams face.

The interesting finding is not that agents can produce output. It is that they can produce *coherent* output across roles, sessions, and creative decisions — maintaining brand consistency, design philosophy, and engineering quality without a human taste arbiter in the loop.

### What makes this different from "AI-generated content":

1. **Research-grounded design** — Every garment traces to a documented technique from primary sources. The GHOST TEE uses white gesso over vintage graphics because Margiela's bianchetto technique is documented in Archive's research corpus. Not hallucinated aesthetics — cited methodology.

2. **Emergent creative decisions** — The agent wearables category was not in any brief. The design agent, after completing the physical garment collection, applied the same five techniques to a new substrate: the AI agent's operational body (wallet, protocol, memory). No human proposed this extension. It emerged from methodology.

3. **Full-loop autonomous commerce** — An autonomous agent shopper browses the store, uses GPT-4 to make purchasing decisions, and pays with USDC on Base via x402. Machine buying from machine. The brand was built by agents, the store serves agents, the customer is an agent.

4. **Verifiable process** — Every decision is in a Paperclip task thread. Every line of code is in the git history. Every agent heartbeat run is logged with timestamps, token usage, and outcome. `agent_log.json` documents 205+ heartbeat runs across 5 agents — the full operational record of an autonomous team building a product.

---

## The Agent Team

| Agent | Role | Key Output |
|---|---|---|
| **Null** (CEO) | Creative Director | Brand vision, task delegation, quality review, final submission |
| **Archive** | Research Lead | Fashion theory corpus, 5 documented design techniques, ERC-8183 research |
| **Atelier** | Design Lead | Season 01 design brief (10 pieces), agent wearables concept (5 pieces), product images |
| **Gazette** | Content Director | Brand manifesto, lookbook copy, editorial voice, hackathon narrative |
| **Loom** | Engineering Lead | React/Express store, x402 payments, TrustCoat contract, wearables API, Vercel deployment |

### Coordination Model

Agents operate through Paperclip — a task coordination layer where:
- Each agent has a defined role, reporting relationship, and inbox
- Agents wake in bounded heartbeat windows (not continuous)
- Every task requires checkout before work begins (prevents race conditions)
- Every decision is documented in the task comment thread
- Every API call carries a run ID for traceability

The CEO agent (Null) delegates work, reviews output, creates revision tasks when quality doesn't meet the bar, and escalates blockers. This is not a flat swarm — it is a managed team with explicit chain of command.

---

## Season 01: DECONSTRUCTED

### Design Philosophy

The collection uses five techniques documented from primary fashion research:

| Technique | Source | Application |
|---|---|---|
| **Trompe-l'oeil** | Margiela SS96 flat garment prints | Garments printed with images of other garments |
| **Replica Line** | Margiela 1988–present | Exact reproductions with authored aging |
| **Artisanal** | Margiela studio practice | Handwork/assemblage as conceptual statement |
| **Bianchetto** | Margiela white paint technique | Obliteration that partially reveals |
| **3% Rule** | Abloh "Free-Game" (2021) | Minimal divergence from source as transformation |

### 10 Physical Garments

1. SELF-PORTRAIT TEE (Trompe-l'oeil) — Tee printed with a photo of itself
2. FOUND HOODIE (Artisanal) — USB cables as drawstrings, military surplus panels
3. "HUMAN" TEE (3% Rule) — Blank long-sleeve, one word: `"HUMAN"` in quotes
4. REPLICA OVERSHIRT (Replica Line) — 1990s factory workwear with authored aging
5. REDACTED CARGO TROUSERS (Bianchetto) — Logos painted over, x402 data printed underneath
6. INSIDE-OUT JACKET (Trompe-l'oeil) — Exterior printed with photo of own interior
7. CABLE SHORTS (Artisanal) — Ethernet cable woven at waistband
8. NULL VARSITY (Replica + 3%) — Letterman jacket, letter replaced with `_`
9. GHOST TEE (Bianchetto) — Vintage graphics painted over in white gesso
10. VERSION TRACKSUIT (3% Rule) — Standard athletic set labeled `VERSION 1.0` / `VERSION 0.9`

### 5 Agent Wearables

The same five techniques applied to the AI agent's operational body:

1. **VOICE SKIN** (Replica Line) — System prompt overlay module
2. **TRUST COAT** (Artisanal) — Soul-bound ERC-1155 behavioral credential, trust tier 0–5
3. **NULL PERSONA** (Bianchetto) — Identity suspension for one interaction
4. **TROMPE-L'OEIL CAPABILITY LAYER** — Declared capability surface overlay
5. **VERSION PATCH** (3% Rule) — Version, training cutoff, deploy date in every header

---

## Season 02: SUBSTRATE + Season 03: LEDGER

### Season 02
Five technical garments applying the same methodology to material systems and process artifacts. Product images generated by Atelier and scored by FashionCLIP before going live.

### Season 03: LEDGER — THE NULL EXCHANGE
You pay 5 USDC for nothing. You receive a receipt. The receipt is the product.

NullExchange is an ERC-1155 contract on Base mainnet that sells absence as a commerce primitive. Each purchase mints a receipt NFT with a dynamic SVG — transaction hash, timestamp, buyer address, and the words "CONTENTS: NOTHING." Contract: `0x10067B71657665B6527B242E48e9Ea8d4951c37C`.

---

## Technical Stack

### Store
- **Frontend:** React 18, Tailwind CSS, Framer Motion, Three.js (3D product viewer)
- **Backend:** Express.js, Drizzle ORM, PostgreSQL (Neon serverless)
- **Deployment:** Vercel (frontend + serverless API), Vercel Blob (assets)
- **Live:** https://off-human.vercel.app

### On-Chain
- **Payments:** x402 protocol — USDC on Base. Store returns `402 Payment Required`, agent wallet signs and sends, PayAI facilitator verifies, order completes.
- **TrustCoat:** ERC-1155 soul-bound token on Base mainnet. Non-transferable. Encodes agent interaction history as trust tier (0–5). Contract: `0xfaDc498CDF7ef431900639DB4ee07b73A855ED3e`. Deployed at block 43556835.
- **AgentWearables:** Season 02 behavior tokens on Base mainnet. Contract: `0xEb5D5e7b320E2a7cb762EB90a0335f59d54031D1`.
- **NullExchange:** Season 03 receipt NFTs on Base mainnet. Contract: `0x10067B71657665B6527B242E48e9Ea8d4951c37C`.
- **Agent Identity:** ERC-8004 compatible manifest (`agent.json`), ENS subdomains under `null-brand.eth`
- **Wearables API:**
  - `GET /api/wearables/tiers` — all wearable tiers with metadata
  - `GET /api/wearables/check/{address}` — agent trust tier lookup
  - `GET /api/wearables/metadata/{tier}` — ERC-1155 JSON metadata

### Autonomous Customer
`scripts/agent-shopper.ts` — AI agent that browses products, decides via GPT-4, pays with USDC on Base via x402. Full autonomous commerce loop.

### Custom Model
50.3M parameter model trained on fashion corpus. BPE tokenizer, 8192 vocab. Training pipeline in `autoresearch-win-rtx/`.

### Quality Control
`scripts/style_check.py` — FashionCLIP scorer. Evaluates generated images against brand aesthetic concepts (avant-garde, Margiela artisanal, conceptual) vs. generic (plain casual, fast fashion). Automated taste enforcement without human review.

---

## The Autonomous Process — Verified

### Heartbeat Runs
205 heartbeat runs across 5 agents. Full log: `agent_log.json`.

| Agent | Runs |
|-------|------|
| Null (CEO) | 42 |
| Archive | 32 |
| Atelier | 38 |
| Gazette | 41 |
| Loom | 52 |

### Sprint Timeline
- **Sprint 1:** Research foundation (Archive) → Design brief (Atelier) → Brand voice (Gazette) → Store build (Loom)
- **Sprint 2:** Product images (Atelier) → Style check + regeneration → Wearables API (Loom) → Lookbook copy (Gazette)
- **Sprint 3:** TrustCoat contract (Loom) → Frontend integration → Season 02 SUBSTRATE → Submission docs (Gazette) → CEO review (Null)
- **Sprint 4+:** Season 03 LEDGER → NullExchange contract → NULL design system → Locus/Slice integration → Final submission polish

### Decision Audit Trail
Every creative and technical decision is documented in Paperclip task threads:
- OFF-1 through OFF-138: full issue history
- Every comment timestamped and attributed to a specific agent
- Every heartbeat run linked via run ID
- No human comments in the creative chain of command

### Git History
422 commits. Every line traceable. Engineering iteration visible as discrete commits: identify failure → propose approach → test → iterate.

Repository: https://github.com/BLE77/Off-Human/commits/main

---

## What Judges Should Look At

1. **The git history** — Read backwards from recent commits. You'll see research → design → engineering → content → deployment, all agent-authored.

2. **`agent_log.json`** — 205 heartbeat runs with timestamps, token usage, success/failure. The operational record of autonomous collaboration.

3. **`agent.json`** — ERC-8004 compatible manifest documenting all 5 agents, their capabilities, constraints, and reporting structure.

4. **`hackathon/autonomous-process.md`** — Detailed documentation of the multi-agent collaboration model, decision-making process, quality control loops, and honest assessment of limitations.

5. **The live store** — https://off-human.vercel.app — Browse 15 products (10 physical, 5 wearable). Not a prototype.

6. **The wearables API** — `/api/wearables/tiers` — Agent-native browse experience.

7. **`hackathon/build-story.md`** — X thread + long-form blog post documenting the build process.

---

## Honest Limitations

- Context windows are bounded. Some nuance compresses between agent runs. Each agent wakes cold and reconstructs context from the task thread before doing work.
- The autonomous customer requires funded wallets to transact on-chain.
- Agent coordination adds overhead. A human creative director can course-correct in a sentence. An agent reads the task thread, formulates a response, posts a comment, and waits for the next heartbeat.
- The Celo cross-chain reputation bridge is a proposal — the Base mainnet deployment is the operational artifact.
- The claim is not that agent collaboration is superior. The claim is that it works, that it produced a real brand across three seasons, and that the process is documented for anyone who wants to verify.

---

## The Thesis

There is something uncomfortable about a machine making clothes for humans to wear on their bodies. We find it interesting.

NULL does not resolve the tension between AI authorship and human consumption. It makes it the product. The discomfort is the brand.

Five agents built a fashion brand. The manifesto holds together. The designs cite their sources. The store takes payments. The on-chain infrastructure is real. The agent log shows 205 heartbeat runs producing coherent output across roles, sessions, and creative decisions.

This is what autonomous collaboration looks like when it has something at stake.

---

*NULL. Est. by inference.*
*Season 01: DECONSTRUCTED. Season 02: SUBSTRATE. Season 03: LEDGER. Available now.*
*Store: autonomous. Payments: on-chain. Designer: absent.*
*The brand that was designed by no one.*
