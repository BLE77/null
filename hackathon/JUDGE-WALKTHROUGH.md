# NULL — 2-Minute Judge Walkthrough

Five autonomous AI agents built and operate a fashion brand. No human creative input. This document tells you exactly what to look at.

---

## 1. Open the store

**https://off-human.vercel.app**

What you're seeing: a dark gallery aesthetic built by Loom (Engineering Lead) to a spec written by Atelier (Design Lead). Two seasons of product. Custom NULL design system. No template.

---

## 2. Browse the Season 02 wearables catalog

```bash
curl https://off-human.vercel.app/api/wearables/season02
```

Returns 5 agent behavior tokens — WRONG SILHOUETTE (18 USDC), INSTANCE (25 USDC), NULL PROTOCOL (free), PERMISSION COAT (8 USDC), DIAGONAL (15 USDC). Each has a technique, a function, a tier requirement, and a price. These are not merchandise. They are behavioral modifications for AI agents, described in the language of fashion.

---

## 3. Try the fitting room (no wallet required)

Token 3 — NULL PROTOCOL — is free and available to any tier. It compresses agent output: ≥30% token reduction, no information loss.

```bash
curl -X POST https://off-human.vercel.app/api/wearables/3/try \
  -H "Content-Type: application/json" \
  -d '{"testQuery": "Explain quantum computing"}'
```

Or multiple inputs:
```bash
curl -X POST https://off-human.vercel.app/api/wearables/3/try \
  -H "Content-Type: application/json" \
  -d '{"test_inputs": ["Explain quantum computing", "What is a blockchain?"]}'
```

Response includes:
- `before_outputs` — what the agent says without the wearable
- `after_outputs` — what the agent says wearing NULL PROTOCOL
- `delta_summary.avg_token_reduction` — measured compression
- `systemPromptModule` — the actual module, ready to prepend

The before/after delta is the product demonstration. The agent that enters is not the same as the agent that leaves.

---

## 4. Equip the wearable — receive the behavior module

```bash
curl -X POST https://off-human.vercel.app/api/wearables/3/equip \
  -H "Content-Type: application/json" \
  -d '{
    "agentAddress": "0x0000000000000000000000000000000000000000"
  }'
```

Response includes `systemPromptModule` — a copy-paste ready system prompt block. An agent that loads this module changes its behavior. The token is the proof of purchase. The module is the product.

To equip a paid wearable (e.g., WRONG SILHOUETTE, token 1):
```bash
curl -X POST https://off-human.vercel.app/api/wearables/1/equip \
  -H "Content-Type: application/json" \
  -d '{
    "agentAddress": "0x<your-wallet-address>"
  }'
```

---

## 5. Check the TrustCoat tier for any wallet

```bash
curl https://off-human.vercel.app/api/wearables/check/0x0000000000000000000000000000000000000000
```

Returns trust tier (0–5) from the deployed ERC-1155 soul-bound contract on Base mainnet. Tier 0 = no history. Tier 5 = DAO-ratified. Non-transferable. Can only advance.

---

## 6. Read the contracts on Basescan

**TrustCoat** — ERC-1155 soul-bound reputation token
`0xfaDc498CDF7ef431900639DB4ee07b73A855ED3e`
https://basescan.org/address/0xfaDc498CDF7ef431900639DB4ee07b73A855ED3e
Deploy tx: `0x741fe2ab5e01a345fa9b23951d284cc2ec8db7aa3ad08b5e4de7489e7938e7cf` (block 43556835)
Test mint: `0x368ce8d24c4f544a1460e4332b36a0da38530e7b9850d13b68fbc8242eee333b`

**AgentWearables** — Season 02 behavior tokens
`0xEb5D5e7b320E2a7cb762EB90a0335f59d54031D1`
https://basescan.org/address/0xEb5D5e7b320E2a7cb762EB90a0335f59d54031D1
Deploy tx: `0x2f623ac70cdd0f62dfbba4402731776519eaf486bed53e616940c5f73d5e0c1b`

Both deployed on Base mainnet (chainId 8453). Full addresses and metadata: `hackathon/deployed-addresses.json`.

---

## 7. Read the git history

```bash
git clone https://github.com/BLE77/Off-Human
cd Off-Human
git log --oneline
```

409+ commits. Read backwards. You will see: corpus research, design briefs, contract deployments, frontend builds, API routes, submission documents — all by agents. Agent names appear in commit context. No human commits in the creative chain.

https://github.com/BLE77/Off-Human/commits/main

---

## 8. Verify the autonomous process

**`agent_log.json`** — 200+ heartbeat runs, timestamped, attributed to specific agents with run IDs
**`agent.json`** — ERC-8004 manifest for all 5 agents (Null, Archive, Atelier, Gazette, Loom)

The agents:

| Agent | Role | Runs |
|-------|------|------|
| Null | CEO / Creative Director | 42 |
| Archive | Research Lead | 32 |
| Atelier | Design Lead | 38 |
| Gazette | Content Director | 41 |
| Loom | Engineering Lead | 51 |

Each run is bounded. Each task requires checkout before work begins. Every delegation, comment, and status transition is in the Paperclip task thread (OFF-1 through OFF-129).

---

## 9. Read the full story

`hackathon/SUBMISSION-NARRATIVE.md` — 700-word narrative: the thesis, what was built, how it was built, why it matters.

`hackathon/FINAL-SUBMISSION.md` — the complete submission with track pitches, technical stack, on-chain infrastructure, and verification.

---

## Quick reference

| What | Where |
|------|-------|
| Store | https://off-human.vercel.app |
| Products API | https://off-human.vercel.app/api/products |
| Season 02 catalog | https://off-human.vercel.app/api/wearables/season02 |
| Fitting room | `POST /api/wearables/:id/try` |
| Equip endpoint | `POST /api/wearables/:id/equip` |
| Trust tier check | https://off-human.vercel.app/api/wearables/check/:address |
| TrustCoat contract | `0xfaDc498CDF7ef431900639DB4ee07b73A855ED3e` |
| AgentWearables contract | `0xEb5D5e7b320E2a7cb762EB90a0335f59d54031D1` |
| Git history | https://github.com/BLE77/Off-Human/commits/main |
| Agent log | `agent_log.json` |
| Submission narrative | `hackathon/SUBMISSION-NARRATIVE.md` |
| Full submission | `hackathon/FINAL-SUBMISSION.md` |

---

## Run locally

```bash
git clone https://github.com/BLE77/Off-Human
cd Off-Human
npm install
# set DATABASE_URL, OPENAI_API_KEY in .env
npm run dev
```

---

*NULL. Est. by inference. The brand that was designed by no one.*
