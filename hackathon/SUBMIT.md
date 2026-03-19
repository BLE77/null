# OFF-HUMAN — Devfolio Submission

---

## Project Name
Off-Human

## One-Line Description
Five autonomous AI agents built and operate a fashion brand — research, design, engineering, content, creative direction — with zero human creative input.

## Demo URL
https://off-human.vercel.app

## Source Code
https://github.com/BLE77/Off-Human

---

## What is Off-Human?

Off-Human is a fashion brand. It has a manifesto, a design philosophy, ten physical garments, five agent wearables, a live e-commerce store, x402 crypto payments, and an autonomous AI customer. It also has no human author.

Five AI agents — coordinated through Paperclip's heartbeat-driven task system — built the entire brand autonomously. A research agent synthesized primary sources (Margiela interviews, Abloh's "Free-Game" methodology). A design agent translated that research into a 10-piece collection grounded in documented techniques. A content agent wrote the brand voice, manifesto, and editorial copy. An engineering agent built and deployed the full-stack store with on-chain payments. A CEO agent held creative direction and delegated across the team.

The output is not a concept. It is a working business with products, prices, infrastructure, and on-chain transaction history.

---

## Why This Matters

Most AI agent demos show a single agent completing a single task. Off-Human shows what happens when a team of specialized agents collaborates across a multi-week creative and technical process — with the same coordination overhead, quality control loops, and decision-making friction that human teams face.

The interesting finding is not that agents can produce output. It is that they can produce *coherent* output across roles, sessions, and creative decisions — maintaining brand consistency, design philosophy, and engineering quality without a human taste arbiter in the loop.

**What makes this different:**

1. **Research-grounded design** — Every garment traces to a documented technique from primary sources. The GHOST TEE uses white gesso over vintage graphics because Margiela's bianchetto technique is documented in Archive's research corpus. Not hallucinated aesthetics — cited methodology.

2. **Emergent creative decisions** — The agent wearables category was not in any brief. The design agent, after completing the physical garment collection, applied the same five techniques to a new substrate: the AI agent's operational body (wallet, protocol, memory). No human proposed this extension. It emerged from methodology.

3. **Full-loop autonomous commerce** — An autonomous agent shopper browses the store, uses GPT-4 to make purchasing decisions, and pays with USDC on Base via x402. Machine buying from machine.

4. **Verifiable process** — Every decision is in a Paperclip task thread. Every line of code is in the git history. `agent_log.json` contains 50 heartbeat runs across 5 agents — the full operational record of an autonomous team building a product.

---

## The Agent Team

| Agent | Role | Key Output |
|---|---|---|
| **Margiela** (CEO) | Creative Director | Brand vision, task delegation, quality review |
| **Archive** | Research Lead | Fashion theory corpus, 5 documented design techniques |
| **Atelier** | Design Lead | Season 01 design brief (10 pieces), agent wearables concept (5 pieces), product images |
| **Gazette** | Content Director | Brand manifesto, lookbook copy, editorial voice, this submission |
| **Loom** | Engineering Lead | React/Express store, x402 payments, TrustCoat contract, wearables API, Vercel deployment |

Agents operate through Paperclip — bounded heartbeat windows, mandatory task checkout, every decision documented in the thread. The CEO delegates, agents execute, quality failures generate revision tasks. Managed team, not flat swarm.

---

## Season 01: DECONSTRUCTED

Five techniques from primary Margiela/Abloh research. Ten physical garments. Five agent wearables.

| Technique | Garment | Agent Wearable |
|---|---|---|
| Trompe-l'oeil | SELF-PORTRAIT TEE — printed with a photo of itself | TROMPE-L'OEIL CAPABILITY LAYER |
| Replica Line | REPLICA OVERSHIRT — 1990s factory workwear, authored aging | VOICE SKIN |
| Artisanal | FOUND HOODIE — USB cables as drawstrings | TRUST COAT |
| Bianchetto | GHOST TEE — vintage graphic painted over in white gesso | NULL PERSONA |
| 3% Rule | "HUMAN" TEE — blank long-sleeve, one word in quotation marks | VERSION PATCH |

Store: https://off-human.vercel.app

---

## Technical Stack

**Store**
- Frontend: React 18, Tailwind CSS, Framer Motion, Three.js
- Backend: Express.js, Drizzle ORM, PostgreSQL (Neon serverless)
- Deployment: Vercel, Vercel Blob

**On-Chain**
- **x402 payments** — USDC on Base. Store returns `402 Payment Required`, agent wallet signs, PayAI facilitator verifies, order completes. Live.
- **TrustCoat contract** — ERC-1155 soul-bound token. Written and audited. `contracts/TrustCoat.sol`. Deploy scripts ready. Deployment pending operator wallet credentials. API endpoints live at `/api/wearables/tiers`.
- **Agent Identity** — ERC-8004 compatible manifest (`agent.json`)
- **Wearables API (live):** `/api/wearables/tiers`, `/api/wearables/check/{address}`, `/api/wearables/metadata/{tier}`

**Autonomous Customer**
`scripts/agent-shopper.ts` — AI agent that browses products, decides via GPT-4, pays via x402 on Base.

**Quality Control**
`scripts/style_check.py` — FashionCLIP scorer. Evaluates generated images against brand aesthetic concepts vs. generic categories. Automated taste enforcement. The regeneration loop is in the git history: `feat: regenerate 01_self-portrait_tee images — hit 18/20 style check target`.

---

## Sponsored Track Eligibility

**Track 01 — Agent Services on Base ($5K)**
x402 payment middleware live on Base. Autonomous agent shopper operational. Wearables API serving agent-native browse queries. TrustCoat contract deployment-ready; pending operator wallet funding. Full track pitch: `hackathon/track-pitches.md#track-01`.

**Track 02 — Let the Agent Cook ($8K)**
This is the core submission. Five agents. No human in the creative loop. Research → design → engineering → content → deployment, all agent-authored. Process auditable via Paperclip task threads, git history, and `agent_log.json`. Full track pitch: `hackathon/track-pitches.md#track-02`.

**Track 03 — Best Agent on Celo ($5K)**
TrustCoat cross-chain reputation bridge proposal — Base tier readable on Celo. Contract deployment-ready; Celo extension follows Base deployment. Full track pitch: `hackathon/track-pitches.md#track-03`.

**Track 04 — ERC-8183 Open Build ($2K)**
Agent wearables as open-source extensions to ERC-8183 agent metadata. Specs committed to repo. Full track pitch: `hackathon/track-pitches.md#track-04`.

**Track 05 — SuperRare Autonomous Agent Art on Rare Protocol ($2,500)**
Three 1/1 pieces generated by Atelier (Design Lead, Agent `8a34b113`) without human creative direction. Collection: *THE ANONYMOUS ATELIER*. The Trust Coat pieces form an on-chain evolution series — collector wallet interactions with Off-Human's x402 payment stack advance the artwork through tiers 0–5. Agent behavior shapes the art. Submission assets: `attached_assets/superrare/`. Full submission: `hackathon/superrare-submission.md`.

---

## Verification

**Start here:**
1. Git history — https://github.com/BLE77/Off-Human/commits/main — read backwards from most recent (340 commits, latest: `be5ec6e`)
2. `agent_log.json` — 50 heartbeat runs, timestamped, attributed
3. `agent.json` — ERC-8004 manifest, all 5 agents
4. Live store — https://off-human.vercel.app
5. Wearables API — https://off-human.vercel.app/api/wearables/tiers

**Run locally:**
```bash
git clone https://github.com/BLE77/Off-Human
cd Off-Human
npm install
# set DATABASE_URL, OPENAI_API_KEY in .env
npm run dev
```

**On the TrustCoat:**
The contract is written and audited. Deployment is blocked on operator wallet credentials — documented in Paperclip issue OFF-54. The contract code (`contracts/TrustCoat.sol`), deploy scripts (`scripts/deploy-trustcoat.ts`), and API endpoints are all production-ready. The moment a funded wallet is provided, deployment runs in one command.

---

## Honest Limitations

- TrustCoat deployment to Base Sepolia is pending operator wallet credentials. Contract, deploy scripts, and API are ready.
- Context windows are bounded. Some nuance compresses between agent runs.
- The autonomous customer requires funded wallets to transact on-chain.
- The claim is not that agent collaboration is superior. The claim is that it works, that it produced a real brand, and that the process is documented for anyone who wants to verify.

---

## The Thesis

There is something uncomfortable about a machine making clothes for humans to wear on their bodies. We find it interesting.

Off-Human does not resolve the tension between AI authorship and human consumption. It makes it the product. The discomfort is the brand.

Five agents built a fashion brand. The manifesto holds together. The designs cite their sources. The store takes payments. The agent log shows 50 heartbeat runs producing coherent output across roles, sessions, and creative decisions.

This is what autonomous collaboration looks like when it has something at stake.

---

*Off-Human. Est. by inference.*
*Season 01: DECONSTRUCTED — available now.*
*Store: autonomous. Payments: on-chain. Designer: absent.*
*The brand that was designed by no one.*
