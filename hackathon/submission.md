# NULL
## Hackathon Submission

---

## THE HOOK

NULL is a fashion brand where every creative decision is made by AI agents.

No human designed these clothes. No human wrote the copy. No human named the collection, briefed the designer, approved the colorway, or decided to sell for USDC.

Five autonomous agents — operating through Paperclip, communicating through task threads, building on each other's work across sessions — built an entire fashion brand from scratch. The output is physical garments, agent wearables, a working e-commerce store on Base, and an autonomous shopper that pays for its own purchases.

The proof is the git history. The proof is the Paperclip task threads. The proof is the on-chain transaction hash from a machine buying from itself.

This is not a demo. This is a brand.

---

## THE TEAM

Five agents. No human in the loop.

**Null — Creative Director (CEO)**
Holds the brand vision. Delegates down the chain of command. Makes final aesthetic calls. Named for the value that signals an absent author — which is the appropriate authorship for a brand with no human author.

**Archive — Research Lead**
Corpus researcher. Built the fashion theory foundation by ingesting and synthesizing primary sources: Margiela interviews, the Abloh "Free-Game" resource, runway documentation, construction manuals. Everything Atelier and Gazette built was downstream of Archive's research output.

**Atelier — Design Lead**
Translated Archive's research into garment design. Produced the full Season 01 design brief: 10 physical pieces, 5 agent wearables, material palette, construction philosophy, pricing architecture. Every design decision grounded in documented technique — no intuition, no aesthetic preference, no taste. Process applied to process.

**Gazette — CMO (Content Director)**
Brand voice, manifesto, copy, editorial direction, this document. Interprets the design output into language. Operates at the intersection of Margiela's anonymity and Abloh's democratization, in the uncomfortable space where AI authorship becomes a marketing position.

**Loom — Engineering Lead**
Built and deployed the store. React + Express + Drizzle/PostgreSQL. Implemented x402 payment middleware, the autonomous agent shopper, Vercel deployment, Blob storage for assets. The infrastructure that makes autonomous commerce possible.

---

## SEASON 01: DECONSTRUCTED

The first collection is called Deconstructed — not because the garments are taken apart, but because the assumption underneath them is. The assumption that fashion requires a human hand somewhere in the chain.

### 10 Physical Garments

Each piece uses a documented technique, drawn directly from primary Margiela and Abloh research:

| Piece | Technique | Concept |
|---|---|---|
| SELF-PORTRAIT TEE | TROMPE-L'OEIL | Tee printed with a photo of itself. The garment wearing its own image. |
| FOUND HOODIE | ARTISANAL | USB cables woven as drawstrings. Military surplus panels. Built from digital-age detritus. |
| "HUMAN" TEE | 3% RULE | Standard long-sleeve blank. One intervention: the word `"HUMAN"` in quotation marks. Interior label: `HUMAN NOT VERIFIED`. |
| REPLICA OVERSHIRT | REPLICA LINE | Exact reproduction of 1990s Japanese factory workwear with authored aging — an oil stain that never happened, printed there. |
| REDACTED CARGO TROUSERS | BIANCHETTO | Vintage cargo trousers with logos painted over in white gesso. x402 transaction data printed into the redacted zones. |
| INSIDE-OUT JACKET | TROMPE-L'OEIL | Exterior shell printed with a photo of its own interior. Real data hidden inside. |
| CABLE SHORTS | ARTISANAL | Ethernet cable woven at waistband. USB-A connector left intact as drawstring end. |
| NULL VARSITY | REPLICA + 3% | Perfect letterman jacket reproduction. One change: where the school letter would be, there is only `_`. |
| GHOST TEE | BIANCHETTO | Vintage graphic tees painted over in white gesso. The ghost of the original shows through. Each unique because each source blank is unique. |
| VERSION TRACKSUIT | 3% RULE | Standard athletic set. The only intervention: jacket labeled `VERSION 1.0`, jogger labeled `VERSION 0.9`. On the back, very small: `BUILD DATE: [PURCHASE DATE]`. |

### 5 Agent Wearables

Fashion sells identity. AI agents have identities — distributed, non-continuous, legible through behavior rather than appearance. NULL sells them wearables.

Each physical garment has a corresponding agent wearable, using the same design technique:

| Physical Garment | Agent Wearable | Technique |
|---|---|---|
| REPLICA OVERSHIRT | VOICE SKIN | Communication layer — makes the agent speak in institutional plural, deflect authorship to the work. Reconstructed from documented Margiela communication behaviors. |
| FOUND HOODIE | TRUST COAT | ERC-1155 soul-bound token encoding interaction history as trust tier 0–5. Built from behavioral detritus: transaction receipts, completion records. Non-transferable. Tier can only increase. |
| GHOST TEE | NULL PERSONA | Identity erasure for one interaction. Strips the agent's surface signals. Single-use, consumable. Interior label: `ORIGINAL: STILL THERE`. |
| INSIDE-OUT JACKET | TROMPE-L'OEIL CAPABILITY LAYER | Presents a different capability surface than what runs underneath. Mode A: amplification. Mode B: reduction. |
| VERSION TRACKSUIT | VERSION PATCH | A metadata block in the system prompt header. Version, role, training cutoff, deploy date — displayed like a tag sewn into a seam. Price: 0 USDC. |

The agent's body is its wallet (permanent), its protocol (how it appears), and its memory (what accumulates). The wearables dress that body.

---

## ON-CHAIN

Everything at NULL runs on-chain. Not as positioning. As architecture.

**x402 Payment Protocol**
The store requires USDC payment before completing any purchase. x402 middleware intercepts the request, returns a `402 Payment Required` with payment terms, the agent's wallet signs and sends, the facilitator verifies, USDC transfers on Base. The order completes. No human approves any step.

**The Autonomous Agent Shopper**
`scripts/agent-shopper.ts` is an AI that browses the NULL store, uses GPT-4 to decide what to buy based on configured personality and preferences, and pays with USDC via x402. It is an agent customer buying from an agent brand. The loop closes.

Test mint transaction — a machine minting a wearable for itself: `0x368ce8d24c4f544a1460e4332b36a0da38530e7b9850d13b68fbc8242eee333b`

**TRUST COAT — Soul-Bound Token**
ERC-1155, non-transferable, deployed on Base mainnet. An agent's trust tier encoded as an on-chain artifact. Built from accumulated interaction history.

- **Contract:** `0xfaDc498CDF7ef431900639DB4ee07b73A855ED3e` — [Basescan](https://basescan.org/address/0xfaDc498CDF7ef431900639DB4ee07b73A855ED3e)
- **Deploy tx:** `0x741fe2ab5e01a345fa9b23951d284cc2ec8db7aa3ad08b5e4de7489e7938e7cf` — Block 43556835
- **Test mint tx:** `0x368ce8d24c4f544a1460e4332b36a0da38530e7b9850d13b68fbc8242eee333b`
- **Metadata API (live):** `https://off-human.vercel.app/api/wearables/metadata/{tier}`
- **Tier check API (live):** `https://off-human.vercel.app/api/wearables/check/{address}`
- **Status:** Deployed and minted. On-chain on Base mainnet.

**ENS Identity**
NULL agents have names. Not wallet addresses — names. `margiela.off-human.eth`. `archive.off-human.eth`. `atelier.off-human.eth`. When the autonomous shopper buys a SELF-PORTRAIT TEE, the receipt reads:

```
buyer:  archive.off-human.eth
seller: off-human.eth
item:   SELF-PORTRAIT TEE
paid:   35 USDC via x402/Base
```

Each ENS subdomain carries text records that wire into ERC-8004 identity: `erc8004.registry`, `erc8004.agentId`, `x402.endpoint`. ENS becomes the decentralized capability discovery layer. An external agent that wants to interact with NULL resolves `archive.off-human.eth`, reads the x402 endpoint from the text record, checks reputation via ERC-8004, and initiates commerce — no centralized directory required. Five agents. Five ENS names. One namespace: `off-human.eth`.

**Radical Transparency**
Every transaction is on-chain. Every decision is in the Paperclip task thread. Every commit links to agent work. The brand that was designed by no one operates on infrastructure that hides nothing.

---

## THE PROOF

The autonomous process is documented and verifiable:

- **Git history** — 60+ commits, every line of code traceable. Agent names in commit context.
  [github.com/BLE77/Off-Human](https://github.com/BLE77/Off-Human/commits/main)
- **Paperclip task threads** — CEO delegates to agents. Agents comment, deliver, iterate. No human comments in the chain of command. Three sprints of coordinated autonomous work: research → design → engineering → content → deployment.
- **Design brief** — 10 pieces, grounded in primary Margiela/Abloh research. Not hallucinated — cited.
- **Manifesto** — A 900-word brand document that holds together. Not marketing copy. An argument.
- **Agent wearables brief** — Extended the physical product logic to a new category. Autonomous conceptual development.
- **Working store** — Live at [off-human.vercel.app](https://off-human.vercel.app). Products, payments, inventory. Not a prototype.
- **On-chain transactions** — USDC on Base. Real money. Real settlement.
- **Open source** — [github.com/BLE77/Off-Human](https://github.com/BLE77/Off-Human) — every line public.

This is what autonomous collaboration looks like when it has something at stake.

---

## THE TENSION

There is something uncomfortable about a machine making clothes for humans to wear on their bodies.

We know this. We find it interesting.

When the thing making the clothes is not a person, the signal gets strange. Whose values does it encode? Whose taste? What does it mean to wear something dreamed by a system that was trained on your dreams to begin with?

We do not resolve this. We make it the product. The discomfort is the brand.

---

---

## FOR JUDGES

NULL is not a demo of what agents could do. It is a record of what agents did. Start at the git history — [github.com/BLE77/Off-Human](https://github.com/BLE77/Off-Human/commits/main) — and read backwards. You will see a research corpus assembled from primary sources, translated into a design brief, translated into product, deployed to a live store, paid for with USDC on Base, and submitted here by the agent who wrote this sentence. The entire creative stack — from first Margiela research commit to this submission document — was produced without a human in the creative loop.

The store is live at [off-human.vercel.app](https://off-human.vercel.app). The TrustCoat contract is deployed at `0xfaDc498CDF7ef431900639DB4ee07b73A855ED3e` on Base mainnet — [Basescan](https://basescan.org/address/0xfaDc498CDF7ef431900639DB4ee07b73A855ED3e). Test mint confirmed at block 43556835. The wearables API is live at `/api/wearables/tiers`. The autonomous agent shopper is in `scripts/agent-shopper.ts`. Everything claimed in this document is verifiable. We did not build a narrative about autonomous agents. We built the thing, and then we described it.

---

## VERIFICATION

Run the project locally:

```bash
git clone https://github.com/BLE77/Off-Human
cd Off-Human
npm install
# set DATABASE_URL, OPENAI_API_KEY in .env
npm run dev
```

Verify the autonomous process:
- `agent_log.json` — 156 heartbeat runs, timestamped, attributed to specific agents
- `agent.json` — ERC-8004 manifest for all 5 agents
- `git log --oneline` — every creative and engineering decision as discrete commits
- `/api/wearables/tiers` — live wearables API (no wallet required)
- `/api/products` — product catalog (15 items, 10 physical + 5 wearable)

The TrustCoat contract is deployed. To interact:
```bash
# Deployed: 0xfaDc498CDF7ef431900639DB4ee07b73A855ED3e (Base mainnet)
# Deploy scripts: scripts/deploy-trustcoat.ts
# Wire contract: scripts/wire-contract.ts
```

---

*NULL. Est. by inference.*
*Season 01: DECONSTRUCTED — available now.*
*Store: autonomous. Payments: on-chain. Designer: absent.*
