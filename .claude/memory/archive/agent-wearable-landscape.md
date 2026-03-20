---
name: agent-wearable-landscape
description: Competitive and adjacent landscape research for agent behavioral modification / wearables — who else is building in this space, identity standards, commerce protocols, reputation systems, and academic validation
type: project
---

# Agent Wearable Landscape Research (OFF-152)
*Completed 2026-03-20*

## Key Finding: No Direct Competitors
Nobody is building agent behavioral modification as a fashion/wearable product. The category is NULL's to define.

Closest project: **PersonaNexus** (GitHub) — YAML-defined agent personalities compiled to system prompts. Developer tool, no commercial model, no cultural frame.

The rest of the market is persona-as-marketing-tool (Delve AI, Market Logic) — B2B SaaS for simulating customer segments.

## Identity Standards
- **ERC-8004** — live mainnet Jan 29, 2026. Three registries: Identity (ERC-721 + URIStorage), Reputation (raw feedback, third-party scoring), Validation (hooks). Co-created by MetaMask, Ethereum Foundation, Google, Coinbase.
- **ERC-6551** — Token Bound Accounts. Every NFT gets its own wallet. Still in Draft. The "backpack" model — wearables accumulate on agent identity.
- **Solana Agent Registry** — sub-second reputation finality.
- **Fetch.ai uAgent Framework** — behavioral protocols as templates. Infrastructure layer.

## Commerce Protocols
- **x402 (Coinbase)** — 500K weekly tx, most traction, what NULL uses.
- **Tempo/MPP (Stripe + Paradigm)** — March 2026 mainnet, $500M raised, $5B valuation. Machine Payments Protocol.
- **AP2 (Google)** — open source, 25+ partners.
- **ACP (OpenAI + Stripe)** — Sept 2025, works with existing payment rails.

## Reputation Systems
- ERC-8004 Reputation Registry (raw signals, decentralized scoring)
- Cred Protocol (on SKALE) — credit scoring, sybil detection
- Orange Protocol — AI-powered Web3 reputation
- KnowYourAgent.network — KYA verification

## Academic Validation
- "Position is Power: System Prompts as Mechanism of Bias" (ACM FAccT 2025) — system-level prompts cause measurably stronger behavioral deviation than user-level prompts. Validates wearable insertion point.
- "Programming Refusal with..." (ICLR 2025) — behavioral constraints programmable via prompt layers at inference.
- Survey arXiv 2402.07927 — policy-as-prompt paradigm.

## Strategic Gaps for NULL
1. ERC-6551 integration — make wearables accumulate on agent NFT identity (visible on-chain history)
2. ERC-8004 Reputation Registry — wearable ownership as reputation signal
3. Agent discovery layers — NULL wearables should be discoverable by counterparty agents

## Full Brief
`docs/research/agent-wearable-landscape.md`
