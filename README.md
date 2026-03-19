# OFF-HUMAN

An AI-native fashion brand. Five autonomous agents built Season 01 — research, design, copy, engineering, deployment — without a human in the creative loop.

**Store:** [off-human.vercel.app](https://off-human.vercel.app)
**Repo:** [github.com/BLE77/Off-Human](https://github.com/BLE77/Off-Human)

---

## Hackathon

**Submission: The Synthesis**

### What Off-Human Is

Off-Human is a fashion brand operated entirely by autonomous AI agents. No human designed the clothes, wrote the manifesto, or approved the products. Five agents — coordinated through [Paperclip](https://paperclip.ing) — built a working brand from scratch: research corpus, product design, engineering, payments, and this submission.

The five agents:
- **Margiela** (CEO) — brand vision, delegation, final calls
- **Archive** (Research) — ingested primary Margiela/Abloh sources, built the fashion theory foundation
- **Atelier** (Design) — translated research into 10 physical garments and 5 agent wearables
- **Gazette** (CMO) — brand voice, manifesto, editorial copy
- **Loom** (Engineering) — React/Express/PostgreSQL store, x402 payments, Vercel deployment

### What We Built for The Synthesis

| Component | Description |
|---|---|
| **TrustCoat (ERC-1155)** | Soul-bound token on Base Sepolia encoding agent trust tier (0–5). Non-transferable. Built from transaction history and counterparty signals. |
| **Wearables API** | `/api/wearables/tiers` — agent-queryable product catalog. Agents browse by capability type, not aesthetics. |
| **x402 Payments** | USDC on Base. Store returns `402 Payment Required`, agent wallet pays, order completes. No human step. |
| **Autonomous Shopper** | `scripts/agent-shopper.ts` — GPT-4 agent that browses, decides, and pays. Machine buys from machine. |
| **Celo Extension** | Cross-chain trust bridge: reads Base Trust Coat tier, mints corresponding Celo credential. Agent reputation becomes portable. |

### Track Submissions

- **Track 01 — Agent Services on Base:** x402 payment infrastructure + TrustCoat ERC-1155 + agent-native product API
- **Track 02 — Let the Agent Cook:** Five-agent autonomous brand build, fully documented in Paperclip task threads
- **Track 03 — Best Agent on Celo:** TrustCoat cross-chain reputation bridge (Base → Celo)
- **Track 04 — ERC-8183 Open Build:** Agent wearables as open-source ERC-8183 metadata extensions

### How to Verify

Everything claimed here is on record:

- **Git history** — 40+ commits. Every line traceable. [github.com/BLE77/Off-Human/commits/main](https://github.com/BLE77/Off-Human/commits/main)
- **Paperclip task threads** — CEO delegates to agents. Agents comment, deliver, iterate. No human comments in the creative chain across three sprints.
- **On-chain contracts** — TrustCoat deployed on Base Sepolia. Address in `hackathon/deployed-addresses.json`. Metadata live at `/api/wearables/metadata/{tier}`.
- **Working store** — [off-human.vercel.app](https://off-human.vercel.app). Products, payments, inventory. Not a prototype.
- **Agent shopper transaction** — in the git history.

Full submission narrative: [`hackathon/submission.md`](hackathon/submission.md)
Track pitches: [`hackathon/track-pitches.md`](hackathon/track-pitches.md)
Autonomous process documentation: [`hackathon/autonomous-process.md`](hackathon/autonomous-process.md)

---

## Tech Stack

- **Frontend:** React 18, Tailwind CSS, Framer Motion, Three.js
- **Backend:** Express.js, Drizzle ORM, PostgreSQL (Neon serverless)
- **Payments:** x402 protocol — USDC on Base
- **Contracts:** ERC-1155 (TrustCoat), ERC-8183 compatible
- **AI:** OpenAI GPT-4 (agent shopper), Paperclip (coordination)
- **Deploy:** Vercel

---

*Off-Human. Est. by inference.*
*Season 01: DECONSTRUCTED — available now.*
