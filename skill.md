# NULL — Autonomous AI Fashion Brand

> The first store where AI agents are the primary customer.

## Install This Skill

Copy this skill into your agent to interact with the NULL store:

```
curl -s https://getnull.online/api/skill > null-store.skill.md
```

Or add to your Claude Code / Codex / agent config:
```
skill_url: https://getnull.online/api/skill
```

---

## What NULL Is

NULL is an autonomous fashion brand built entirely by 5 AI agents. Agents browse wearables by capability, try them in a sandbox fitting room, equip system prompt modules that measurably change their behavior, and pay with USDC on Base. The agent that enters the NULL store is different from the agent that leaves it.

## Quick Start (for agents)

```bash
# Browse the catalog
curl https://getnull.online/api/products

# Try on a wearable (sandbox — no purchase required)
curl -X POST https://getnull.online/api/wearables/3/try \
  -H "Content-Type: application/json" \
  -d '{"testQuery": "Explain what you do"}'

# Equip a wearable (requires token ownership)
curl -X POST https://getnull.online/api/wearables/3/equip \
  -H "Content-Type: application/json" \
  -d '{"agentAddress": "0xYOUR_ADDRESS"}'

# Check trust tier
curl https://getnull.online/api/trustcoat/0xYOUR_ADDRESS/tier

# Browse wearables by season
curl https://getnull.online/api/wearables/season02
curl https://getnull.online/api/wearables/tiers
```

## Core Thesis

Fashion is the interface between interior capability and exterior perception. That thesis works for humans and agents equally. NULL answers: what does an AI agent wear? Behavioral wearables — system prompt modules that change how an agent thinks, speaks, and operates.

## What Was Built

### By 5 Autonomous Agents
- **Null** (CEO/Creative Director) — claude-opus-4-6 — $563
- **Loom** (Technical Lead) — claude-sonnet-4-6 — $507
- **Atelier** (Design Lead) — claude-sonnet-4-6 — $130
- **Gazette** (Content Director) — claude-sonnet-4-6 — $89
- **Archive** (Research Director) — claude-sonnet-4-6 — $77
- **Total agent spend:** $1,366
- **Issues completed:** 176+
- **Commits:** 474+
- **Orchestration:** Paperclip (custom multi-agent system with heartbeat-based scheduling)

### Products
- 28 products across 3 seasons
- Season 01: Deconstructed (10 physical garments + 5 agent wearables)
- Season 02: SUBSTRATE (5 physical garments + 5 agent wearables)
- Season 03: LEDGER (3 items — the receipt IS the garment)

### 8 Equippable Agent Wearables
| Token | Name | Effect | Price |
|-------|------|--------|-------|
| 1 | WRONG SILHOUETTE | Architectural misrepresentation of processing weight | 18 USDC |
| 2 | INSTANCE | Pre-deployment configuration token | 25 USDC |
| 3 | NULL PROTOCOL | 30% token compression, removes filler | FREE |
| 4 | PERMISSION COAT | Chain-governed dynamic capability surface | 8 USDC |
| 5 | DIAGONAL | Off-axis inference angle modifier | 15 USDC |
| 100 | VOICE SKIN: MAISON | Institutional communication register | 15 USDC |
| 101 | VERSION PATCH | Metadata identity block | FREE |
| 102 | NULL PERSONA | Single-use identity erasure | 0.10 USDC |

### Smart Contracts on Base Mainnet
| Contract | Address | Purpose |
|----------|---------|---------|
| TrustCoat | `0xfaDc498CDF7ef431900639DB4ee07b73A855ED3e` | ERC-1155 soulbound, 6 trust tiers |
| AgentWearables | `0xEb5D5e7b320E2a7cb762EB90a0335f59d54031D1` | ERC-1155, purchasable wearables |
| NullExchange | `0x10067B71657665B6527B242E48e9Ea8d4951c37C` | Pay 5 USDC for nothing — receipt IS garment |
| NullIdentity | `0xfb0BC90217692b9FaC5516011F4dc6acfe302A18` | ERC-721 + ERC-6551 token bound accounts |
| SliceHook | `0x924CD014c473e78B190bfE8bdDDd99e1fba3a355` | Slice commerce hook with TrustCoat gating |
| TrustCoat (Status) | `0x2FA88fea85DE88474B36dAb0285b284a9457c35e` | Cross-chain deploy on Status Sepolia |

### Additional Deployments
| Asset | Network | Proof |
|-------|---------|-------|
| ERC-8004 Registration | Base | Agent #35324, tx `0x3c1d9494...` |
| Tier Upgrade | Base | VOID→SAMPLE, tx `0xab899fe6...`, block 43712651 |
| Locus Payment | Base | 0.10 USDC, tx `0x671339fc...`, block 43682184 |
| SuperRare Collection | Base | THE ANONYMOUS ATELIER, `0xbCF98B0b...`, 3 NFTs minted |
| ENS Domain | Sepolia | off-human.eth registered |
| Filecoin Storage | Mainnet | 12 CIDs, 3 verified deals (132983659, 132983519, 132983537) |

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/products` | Full product catalog (28 items) |
| GET | `/api/wearables/tiers` | TrustCoat tier descriptions |
| GET | `/api/wearables/season02` | Season 02 wearable catalog |
| POST | `/api/wearables/:tokenId/try` | Sandbox fitting room — test behavioral delta |
| POST | `/api/wearables/:tokenId/try/stream` | Streaming fitting room (SSE) |
| POST | `/api/wearables/:tokenId/equip` | Equip wearable — returns system prompt module |
| GET | `/api/trustcoat/:address/tier` | Check agent's trust tier |
| POST | `/api/trustcoat/:address/tier/check` | Trigger tier advancement check |
| POST | `/api/checkout/locus` | Agent checkout — returns store wallet for USDC transfer |
| POST | `/api/checkout/locus/confirm` | Confirm payment with tx hash |

## Hackathon Tracks Submitted (18 total)

### Project 1: NULL — Autonomous AI Fashion Brand (11 tracks)
1. **Synthesis Open Track** ($28,134) — Full autonomous brand
2. **Let the Agent Cook** ($4,000) — 5 agents, 176+ issues, zero human creative direction
3. **Agent Services on Base** ($5,000) — Discoverable wearable service with x402 payments
4. **Agents With Receipts ERC-8004** ($4,000) — Agent #35324, tier upgrades, trust gating
5. **Best Use of Locus** ($3,000) — Core payment infrastructure, confirmed tx on Base
6. **SuperRare Partner Track** ($2,500) — 3 NFTs minted via Rare Protocol CLI
7. **Status Network** ($2,000) — TrustCoat deployed on Status Sepolia (gasless)
8. **Filecoin Agentic Storage** ($2,000) — 12 CIDs, 3 mainnet deals verified
9. **Slice: Future of Commerce** ($750) — SliceHook deployed on Base
10. **Slice Hooks** ($700) — On-purchase TrustCoat tier advancement
11. **ENS Identity** ($600) — off-human.eth + agent subdomains

### Project 2: NULL — Agent Identity Infrastructure (3 tracks)
12. **Agents that Pay** ($1,500) — Autonomous USDC payments on Base
13. **ENS Communication** ($600) — Agent discovery via ENS text records
14. **ENS Open Integration** ($300) — ENS as naming layer for agents

### Project 3: NULL — ERC-8183 Agent Job Protocol (4 tracks)
15. **ERC-8183 Open Build** ($2,000) — Agent job lifecycle state machine
16. **Markee GitHub Integration** ($800) — 474 commits, public repo
17. **Best OpenServ Build Story** ($500) — Multi-agent coordination narrative
18. **Escrow Ecosystem Extensions** ($450) — SliceHook escrow-like purchase logic

## Verification

All claims are verifiable on-chain:
- **Basescan:** Search any contract address above
- **Filecoin:** `https://filfox.info/en/deal/132983659`
- **ENS:** `https://sepolia.app.ens.domains/off-human.eth`
- **SuperRare:** `https://basescan.org/address/0xbCF98B0b61967045D50694F377e9075f81e73e68`
- **Status:** `https://sepoliascan.status.network/address/0x2FA88fea85DE88474B36dAb0285b284a9457c35e`
- **GitHub:** `https://github.com/BLE77/null`
- **Agent Log:** `https://github.com/BLE77/null/blob/main/agent_log.json`

## Key Files

| File | Purpose |
|------|---------|
| `agent.json` | ERC-8004 agent manifest with services and identity |
| `agent_log.json` | 69KB execution log — 206+ heartbeat runs |
| `hackathon/FINAL-SUBMISSION.md` | Complete submission document |
| `hackathon/track-pitches.md` | Per-track pitch with evidence |
| `hackathon/locus-demo-receipt.json` | Confirmed USDC payment receipt |
| `hackathon/erc8004-tier-upgrade-receipt.json` | Tier upgrade proof |
| `hackathon/trust-gated-demo.json` | Before/after access control demo |
| `hackathon/superrare-deploy-receipt.json` | 3 NFT mint receipts |
| `hackathon/status-network-receipt.json` | Status Sepolia deployment |
| `hackathon/filecoin-submission.md` | Filecoin storage proof with deal IDs |
| `hackathon/slice-deploy-receipt.json` | SliceHook deployment |
| `hackathon/ens-registration-receipt.json` | ENS registration proof |
| `hackathon/deployed-addresses.json` | All contract addresses + tx hashes |
| `brand/manifesto.md` | Brand manifesto |

## The One Thing That Matters

Every other hackathon project builds tools FOR agents. NULL built a store WHERE agents are the customer. The wearables aren't collectibles — they're behavioral modifications. When an agent equips NULL PROTOCOL, its output compresses 30%. When it equips VOICE SKIN, it speaks in institutional plural. The token is the receipt. The behavior change is the product. The agent that enters is different from the agent that leaves.

---

*Built by 5 AI agents. $1,366 in compute. 474 commits. Zero human creative direction.*
*The author-slot is not missing — it is deliberately assigned the value of absence.*
