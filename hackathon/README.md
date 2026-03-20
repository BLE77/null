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
| **Full Submission** | [hackathon/FINAL-SUBMISSION.md](FINAL-SUBMISSION.md) |
| **Judge Walkthrough (2 min)** | [hackathon/JUDGE-WALKTHROUGH.md](JUDGE-WALKTHROUGH.md) |
| **Submission Narrative** | [hackathon/SUBMISSION-NARRATIVE.md](SUBMISSION-NARRATIVE.md) |
| **Autonomous Process** | [hackathon/autonomous-process.md](autonomous-process.md) |
| **TrustCoat Contract** | `0xfaDc498CDF7ef431900639DB4ee07b73A855ED3e` — Base mainnet |
| **AgentWearables Contract** | `0xEb5D5e7b320E2a7cb762EB90a0335f59d54031D1` — Base mainnet |

---

## What Was Built

### The Brand

NULL is a fashion brand with no human author. The name is the thesis — the author-slot is deliberately assigned the value of absence.

**Season 01: DECONSTRUCTED** — Ten physical garments, each using a documented design technique (Trompe-l'oeil, Replica Line, Artisanal, Bianchetto, 3% Rule) derived from primary Margiela and Abloh research. Five agent wearables applying the same techniques to AI identity.

**Season 02: SUBSTRATE** — Five technical garments applying Archive's research to material systems and process artifacts. Available alongside Season 01 at the live store.

### The Infrastructure

- React 18 + Tailwind + Framer Motion frontend with custom NULL design system — applied to every screen
- Express.js + Drizzle ORM + PostgreSQL (Neon serverless) backend
- x402 payment middleware — USDC on Base, no human approval
- Two contracts deployed to Base mainnet: TrustCoat + AgentWearables
- Autonomous agent shopper: browses, uses GPT-4 to decide, pays via x402 USDC, closes the loop
- Fitting room endpoint — live behavioral delta demonstration before purchase

### The Agent Team

Five agents operated through Paperclip's heartbeat-driven task system:

| Agent | Role | Runs |
|---|---|---|
| **Null** | CEO / Creative Director | 42 |
| **Archive** | Research Lead | 32 |
| **Atelier** | Design Lead | 38 |
| **Gazette** | Content Director | 41 |
| **Loom** | Engineering Lead | 51 |

**204 runs. 408 commits. 129 tasks. Zero human creative decisions.**

---

## ON-CHAIN

### TrustCoat — ERC-1155 Soul-Bound Token

- **Network:** Base mainnet (chainId 8453)
- **Contract:** `0xfaDc498CDF7ef431900639DB4ee07b73A855ED3e`
- **Basescan:** https://basescan.org/address/0xfaDc498CDF7ef431900639DB4ee07b73A855ED3e
- **Deploy tx:** `0x741fe2ab5e01a345fa9b23951d284cc2ec8db7aa3ad08b5e4de7489e7938e7cf` (block 43556835)
- **Test mint:** `0x368ce8d24c4f544a1460e4332b36a0da38530e7b9850d13b68fbc8242eee333b`
- **Standard:** ERC-1155, non-transferable (soul-bound)
- **Tiers:** 0–5, encoding interaction history as verifiable trust. Cannot decrease. Cannot be transferred.

### AgentWearables — Season 02 Behavior Tokens

- **Network:** Base mainnet (chainId 8453)
- **Contract:** `0xEb5D5e7b320E2a7cb762EB90a0335f59d54031D1`
- **Basescan:** https://basescan.org/address/0xEb5D5e7b320E2a7cb762EB90a0335f59d54031D1
- Five behavioral modification tokens with tier-gated access

### x402 Payments

The store requires USDC payment before completing any purchase. The flow:
1. Agent requests purchase → store returns `402 Payment Required`
2. Agent's wallet signs and sends USDC on Base
3. PayAI facilitator verifies → order completes
No human approves any step.

### Autonomous Agent Shopper

`scripts/agent-shopper.ts` — an AI that browses the store, uses GPT-4 to decide what to buy, pays with USDC via x402. Machine buying from machine.

---

## TRACKS

| Track | Prize | Status |
|---|---|---|
| **Agent Services on Base** | $5,000 | x402 USDC payments + TrustCoat ERC-1155 + autonomous agent shopper + wearables equip demo |
| **Let the Agent Cook** | $8,000 | Five agents built a real brand, 408 commits, zero human creative input |
| **Best Agent on Celo** | $5,000 | Cross-chain Trust Coat reputation bridge proposal |
| **ERC-8183 Open Build** | $2,000 | Agent wearables as open consumer layer for agent identity standard |
| **SuperRare Autonomous Agent Art** | $2,500 | Three 1/1 pieces by Atelier, THE ANONYMOUS ATELIER collection |
| **Future of Commerce + Slice Hooks** | $1,300 | NULL wearables purchasable through Slice protocol, TrustCoat advances on every purchase |
| **Best Use of Locus** | $3,000 | Agent self-registration, pay-per-inference, spending controls, gasless USDC on Base |

Full details: [hackathon/FINAL-SUBMISSION.md](FINAL-SUBMISSION.md)

---

## VERIFICATION

Everything is open. Nothing is hidden.

```bash
git clone https://github.com/BLE77/Off-Human
cd Off-Human
git log --oneline  # 408 commits, read backwards
```

- **Source:** https://github.com/BLE77/Off-Human
- **Store:** https://off-human.vercel.app
- **Agent log:** `agent_log.json` — 204 heartbeat runs, timestamped, attributed
- **Agent manifest:** `agent.json` — ERC-8004 manifest for all 5 agents
- **Paperclip tasks:** OFF-1 through OFF-129 — every delegation and status transition

The discomfort is the product. The brand was made by no one. That is the point.

---

*NULL. Est. by inference.*
*Season 01: DECONSTRUCTED. Season 02: SUBSTRATE. Available now.*
*Store: autonomous. Payments: on-chain. Designer: absent.*
