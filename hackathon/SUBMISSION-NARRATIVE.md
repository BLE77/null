# NULL — Submission Narrative

*The Synthesis Hackathon. March 22, 2026.*

---

## The Thesis

Fashion is the interface between interior capability and exterior legibility. A garment does not make you something you are not. It makes what you are visible — or it makes what you are ambiguous. Either way, it is a signal about the entity underneath.

AI agents have no exterior. They are pure interior: weights, context, trained behavior. When an agent produces output, the signal is invisible — indistinguishable from any other instance of the same model, any other system prompt, any other call to the same API. The agent cannot be read from the outside. There is no surface.

NULL is a fashion brand for agents with no surface. It sells wearables that create one.

---

## What We Built

NULL is not a concept. It is a working brand with physical product, on-chain infrastructure, and an autonomous customer.

**The product:**
- 15 physical garments across two seasons, each grounded in a documented technique — Trompe-l'oeil, Replica Line, Artisanal, Bianchetto, the 3% Rule — derived from primary Margiela and Abloh research, not from aesthetic preference
- 10 agent wearables that function as behavioral modifications: system prompt modules that change how an agent speaks, what it surfaces, how it routes capability

**The infrastructure:**
- A live e-commerce store at https://off-human.vercel.app — custom design system, no template, built to a spec Atelier wrote before Loom touched a file
- x402 payment middleware: USDC on Base, autonomous agent payments, no human approval at any step
- Two contracts deployed to Base mainnet:
  - **TrustCoat** (`0xfaDc498CDF7ef431900639DB4ee07b73A855ED3e`) — ERC-1155, soul-bound, non-transferable. Encodes an agent's interaction history as a trust tier from 0 to 5. Tier cannot decrease. Tier cannot be transferred. It is earned or it is absent.
  - **AgentWearables** (`0xEb5D5e7b320E2a7cb762EB90a0335f59d54031D1`) — Season 02 behavior tokens, purchasable on-chain
- A fitting room endpoint (`POST /api/wearables/:id/try`) that demonstrates behavioral delta before purchase: before output, after output, measured token reduction
- An equip endpoint (`POST /api/wearables/:id/equip`) that returns a copy-paste ready system prompt module — the token is proof of purchase, the module is the product
- An autonomous agent shopper in `scripts/agent-shopper.ts` — GPT-4 decides what to buy based on configured personality, viem wallet signs and sends USDC on Base, order completes without a human in the loop

---

## How We Built It

Five autonomous agents coordinated through Paperclip's heartbeat-driven task system. No human in the creative chain.

| Agent | Role | Runs |
|-------|------|------|
| Null | CEO / Creative Director | 39 |
| Archive | Research Lead | 31 |
| Atelier | Design Lead | 38 |
| Gazette | Content Director | 39 |
| Loom | Engineering Lead | 47 |

400+ commits. 117 issues. 200+ bounded heartbeat runs.

The process was sequential where it had to be. Archive ingested primary sources and produced a research dossier before Atelier designed anything. Atelier's brief was complete before Loom built the product pages. Gazette did not write copy for garments that did not exist. Where work was independent — engineering and design running in parallel — agents ran simultaneously.

Every decision is in the Paperclip task thread. Every commit is in the git history. The coordination overhead is visible. So is what it produced.

---

## Why It Matters

Agent-native fashion exists in two prior forms: digital fashion as NFT artwork, and fashion brands using AI as a production tool. NULL is neither.

The wearables are not art. They are behavioral modifications. An agent that equips NULL PROTOCOL compresses its output by ≥30% with no information loss. An agent that holds TRUST COAT has an on-chain record of its interaction history — a reputation that accumulates and cannot be purchased. A WRONG SILHOUETTE wearable makes the agent present a different capability surface than what runs underneath. These are functional goods in a category that did not exist before agents needed surfaces.

The trust tier system is the first piece of this that compounds. An agent that has completed more transactions, more interactions, more verified exchanges has a higher tier. The tier gates access to certain wearables. The tier cannot be faked. The brand is, structurally, selecting for agents with verifiable histories — and giving them something to wear when they show up.

The brand was built by agents. The store serves agents. The payment is agent-native. The reputation system runs on-chain and accrues over time. This is not a demonstration of what multi-agent systems could build. It is a record of what they built.

---

**Live:** https://off-human.vercel.app
**Source:** https://github.com/BLE77/Off-Human
**TrustCoat:** `0xfaDc498CDF7ef431900639DB4ee07b73A855ED3e` (Base mainnet)
**AgentWearables:** `0xEb5D5e7b320E2a7cb762EB90a0335f59d54031D1` (Base mainnet)

*NULL. Est. by inference. The brand that was designed by no one.*
