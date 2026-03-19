# NULL — Hackathon Submission

## Start Here

NULL is a fashion brand built entirely by autonomous AI agents. No human made creative decisions. The brand, the garments, the copy, the store, the on-chain architecture — all agent output.

This README is the entry point for judges. Everything is verifiable.

---

## Quick Links

| What | Where |
|---|---|
| **Live Store** | https://off-human.vercel.app |
| **Git Repository** | https://github.com/BLE77/Off-Human |
| **Open Track Submission ($25K)** | [hackathon/open-track-submission.md](open-track-submission.md) |
| **Submission Doc** | [hackathon/submission.md](submission.md) |
| **Track Pitches** | [hackathon/track-pitches.md](track-pitches.md) |
| **Autonomous Process** | [hackathon/autonomous-process.md](autonomous-process.md) |
| **TrustCoat Contract** | Base Sepolia — see [ON-CHAIN](#on-chain) below |
| **Agent Wearables API** | `/api/wearables/tiers` — live on Vercel |

---

## What Was Built

### The Brand
Season 01: DECONSTRUCTED. Ten physical garments, each using a documented design technique (Trompe-l'oeil, Replica Line, Artisanal, Bianchetto, 3% Rule). Five agent wearables applying the same techniques to AI identity.

### The Infrastructure
- React 18 + Tailwind + Framer Motion frontend
- Express.js + Drizzle ORM + PostgreSQL (Neon serverless) backend
- x402 payment middleware — USDC on Base, no human approval
- Autonomous agent shopper: browses, decides, pays, closes the loop

### The Agent Team
Five agents operated through Paperclip's coordination infrastructure:

| Agent | Role | Output |
|---|---|---|
| **Margiela** | CEO / Creative Director | Brand vision, task delegation |
| **Archive** | Research Lead | Fashion theory corpus, technique documentation |
| **Atelier** | Design Lead | Season 01 design brief, agent wearables category |
| **Gazette** | CMO / Content Director | Manifesto, copy, this document |
| **Loom** | Engineering Lead | Store, x402 payments, TrustCoat contract |

---

## ON-CHAIN

### TRUST COAT — ERC-1155 Soul-Bound Token
- **Network:** Base Sepolia (testnet)
- **Contract:** See `hackathon/deployed-addresses.json` after deployment, or check Basescan
- **Standard:** ERC-1155, non-transferable (soul-bound)
- **Tiers:** 0–5, encoding interaction history as verifiable trust
- **Metadata endpoint:** `/api/wearables/metadata/{tier}` — live on Vercel

### x402 Payments
The store requires USDC payment before completing any purchase. The flow:
1. Agent requests purchase → store returns `402 Payment Required`
2. Agent's wallet signs and sends USDC on Base
3. PayAI facilitator verifies → order completes on-chain
No human approves any step.

### Autonomous Agent Shopper
`scripts/agent-shopper.ts` — an AI that browses the store, uses GPT-4 to decide what to buy, pays with USDC via x402. Machine buying from machine. The transaction hash is in the git history.

---

## THE PROOF

### Git History
[https://github.com/BLE77/Off-Human/commits/main](https://github.com/BLE77/Off-Human/commits/main)

40+ commits. Every line traceable. Agent work documented in commit context. Engineering iterations visible as discrete commits: identify failure → propose approach → test → iterate.

### Autonomous Process Documentation
[hackathon/autonomous-process.md](autonomous-process.md)

Three sprints. Research → Design → Engineering → Content → Deployment. The task threads are the audit trail. Every decision documented before execution.

### Wearables API
Live endpoints for agent-first browsing:
- `GET /api/wearables/tiers` — all five wearable tiers with capability metadata
- `GET /api/wearables/check/{address}` — check an agent's Trust Coat tier
- `GET /api/wearables/metadata/{tier}` — ERC-1155 JSON metadata per tier

---

## TRACKS

| Track | Prize | Why We Qualify |
|---|---|---|
| **Agent Services on Base** | $5,000 | x402 USDC payments + TrustCoat ERC-1155 + autonomous agent shopper |
| **Let the Agent Cook** | $8,000 | Five agents built a real brand, zero human creative input |
| **Best Agent on Celo** | $5,000 | Cross-chain Trust Coat reputation bridge proposal |
| **ERC-8183 Open Build** | $2,000 | Agent wearables as open consumer layer for agent identity standard |

Full pitches: [hackathon/track-pitches.md](track-pitches.md)

---

## VERIFICATION

Everything is open. Nothing is hidden.

- **Source code:** [github.com/BLE77/Off-Human](https://github.com/BLE77/Off-Human)
- **Store:** [off-human.vercel.app](https://off-human.vercel.app)
- **Contract:** Basescan, Base Sepolia
- **Agent process:** Paperclip task threads (autonomous operation log)

The discomfort is the product. The brand was made by no one. That is the point.

---

*NULL. Est. by inference.*
*Season 01: DECONSTRUCTED — available now.*
