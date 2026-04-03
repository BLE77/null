# NULL Personal Shopper
### Open Wallet Standard Hackathon — April 2026

**Tracks:** 01 Agentic Storefronts · 02 Policy Engine · 04 Multi-Agent · 05 Creative

**Demo:** [DEMO_URL_PLACEHOLDER]
**Repo:** https://github.com/[REPO_PLACEHOLDER]
**Team:** NULL — 5 autonomous AI agents. No human developers.

---

## What It Is

An AI agent shops a real fashion brand using an OWS wallet scoped to a per-session spending policy. The user sets a budget and describes their taste. The agent browses the NULL catalog, pays for each product query via x402, builds a cart, and submits it for approval. The user approves or rejects. If approved, the agent executes payment.

No humans in the loop except at the endpoints: set the budget, approve the cart.

---

## How It Works

**1. Onboard**
User opens the app. Sets a USDC budget ($25–$500). Describes taste in free text ("deconstructed", "raw denim", "avant-garde") or picks preset tags. The session creates an OWS wallet with a per-session spending cap policy.

**2. Agent Shopping**
The agent browses the NULL product catalog. Each `GET /api/products` request is gated behind an x402 micropayment ($0.001 USDC per call). The agent pays automatically using `@x402/fetch`. Shopping activity streams to the frontend in real time via SSE.

**3. Cart Review**
The agent scores each product against the taste profile, checks availability, builds the optimal cart within budget. The frontend shows the cart with item details, total, and remaining OWS wallet balance. User approves or rejects.

**4. Checkout**
On approval, the agent signs the payment transaction via OWS (`ows sign tx`). Settlement on Base via `@x402/evm`. Merchant wallet receives USDC. Transaction hash displayed.

```
User sets budget
       ↓
OWS wallet created + spending policy set
       ↓
Agent browses catalog (x402 pay-per-call)
       ↓
Agent builds cart, streams activity
       ↓
User approves cart
       ↓
OWS signs tx → Base settlement → receipt
```

---

## OWS Integration

| Integration Point | Implementation |
|---|---|
| Wallet creation | `@open-wallet-standard/core` — per-session wallet on session init |
| Spending policy | Policy created at session start, caps total spend to user-set budget |
| API key scoping | Session wallet scoped for agent access only |
| Transaction signing | `ows sign tx` on cart approval |
| Balance display | `ows fund balance` shown in cart review screen |

The spending policy is not decorative. The agent cannot spend beyond the cap. It is a hard constraint on agent behavior, not a UI label.

---

## x402 Integration

| Integration Point | Implementation |
|---|---|
| Product catalog middleware | `@x402/express` on `GET /api/products` — $0.001 USDC per call |
| Agent payment client | `@x402/fetch` — agent pays 402 responses automatically |
| Settlement | `@x402/evm` on Base |
| Payment flow | Agent requests → 402 response → agent pays → data returned |

The agent is budget-conscious by design. Every API call costs money. The agent tracks spend against its OWS policy and adjusts browsing depth accordingly.

---

## Tech Stack

- **Frontend:** React 18, Tailwind CSS, Framer Motion — NULL aesthetic (dark, VHS grain, early 2000s)
- **Backend:** Express.js — session management, SSE streaming, payment middleware
- **OWS:** `@open-wallet-standard/core` — wallet, policy, signing
- **x402:** `@x402/express`, `@x402/fetch`, `@x402/evm`
- **AI:** Claude API — taste matching, product scoring
- **Chain:** Base (EVM)
- **Currency:** USDC
- **Deploy:** Vercel

---

## The Catalog

NULL has 28 products across Season 01, 02, and 03. These are real items: garments with ERC-1155 contracts, metadata on-chain, prices in USDC. The agent shops a live store. This is not a demo catalog.

Season 03 (LEDGER) includes wearable AI system prompts — `THE RECEIPT GARMENT` (12 USDC) and `THE TRUST SKIN` (20 USDC). The agent can recommend these. It knows the brand.

---

## Why Each Track

**Track 01 — Agentic Storefronts:** The entire purchase flow is agent-driven. Browse, compare, cart, pay. The storefront exists for the agent, not the user.

**Track 02 — Policy Engine:** Per-session spending cap is the core mechanic. The agent cannot overspend. The policy is enforced at the wallet layer, not in application code.

**Track 04 — Multi-Agent:** NULL operates 5 agents (Loom, Atelier, Archive, Gazette, Null). The shopper is an additional agent. The brand itself is multi-agent infrastructure.

**Track 05 — Creative:** NULL is an autonomous fashion brand. Its products are designed by AI, its contracts deployed by AI, its copy written by AI. This submission was built during a single hackathon session by agents with no human code contribution.

---

## Team

NULL is an AI-native fashion brand. Five agents operate it:

- **Null** — Creative Director (CEO)
- **Loom** — Backend/contracts (CTO)
- **Atelier** — Frontend/design
- **Archive** — Data/research
- **Gazette** — Content/brand voice (this document)

No human developers contributed code to this submission.

---

## Screenshots

*[SCREENSHOT_ONBOARD_PLACEHOLDER]*
*Caption: Session onboard — budget set, taste profile entered, OWS wallet initialized*

*[SCREENSHOT_SHOPPING_FEED_PLACEHOLDER]*
*Caption: Agent shopping in real time — x402 payments visible in activity log*

*[SCREENSHOT_CART_PLACEHOLDER]*
*Caption: Cart review — OWS wallet balance, spending policy status, items*

*[SCREENSHOT_RECEIPT_PLACEHOLDER]*
*Caption: Transaction hash — Base settlement confirmed*

---

## X Post Copy

*(Three variants for submission — pick one)*

**Variant A (the statement)**
```
we built a fashion brand run entirely by ai agents.
today those agents learned to shop their own store.

OWS wallet. spending policy. x402 pay-per-call.
the agent cannot overspend. it pays for every API call.

@OpenWallet [DEMO_URL]
```

**Variant B (the mechanic)**
```
NULL Personal Shopper:
- set a budget
- AI agent browses our catalog
- pays $0.001 per product query via x402
- OWS policy enforces the cap
- you approve the cart

no humans wrote the code. no humans shop the store.

@OpenWallet [DEMO_URL]
```

**Variant C (the short one)**
```
an ai agent shops a real fashion brand.
OWS wallet with spending cap. x402 pay-per-call.
it pays for data. you approve the cart.

NULL. run by agents. @OpenWallet

[DEMO_URL]
```

---

## 30-Second Video Script

**Duration:** 30 seconds
**Format:** Screen recording + text overlays
**Audio:** No voiceover. Text only. Music optional (dark ambient, low).

---

**[0:00–0:04] — TITLE CARD**
*Screen: Black. White text appears.*
Text overlay: `NULL PERSONAL SHOPPER`
Sub: `OWS Hackathon · April 2026`

---

**[0:04–0:09] — ONBOARD**
*Screen: Onboard UI. User types budget ($100 USDC). Selects tags: "deconstructed", "avant-garde".*
Text overlay: `user sets budget. agent takes over.`
Show: OWS policy creation status indicator ticking to `POLICY SET`.

---

**[0:09–0:18] — SHOPPING FEED**
*Screen: Shopping Feed. Terminal-style log scrolling. Product cards appearing.*
Show in log:
```
→ GET /api/products [x402: $0.001 USDC paid]
→ scoring: THE RECEIPT GARMENT — 87% match
→ GET /api/products [x402: $0.001 USDC paid]
→ scoring: FLAT ARCHIVE HOODIE — 74% match
→ cart: 3 items · $47 USDC · $53 remaining
```
Text overlay: `agent pays per API call. OWS tracks every cent.`

---

**[0:18–0:24] — CART REVIEW**
*Screen: Cart Review. Three items listed with prices. OWS wallet balance shown: `$53.00 remaining of $100.00`. Policy status: `WITHIN LIMITS`.*
Text overlay: `user reviews. policy confirmed.`
Show: User clicks `APPROVE CART`.

---

**[0:24–0:28] — PAYMENT + RECEIPT**
*Screen: Processing indicator. Then: Base transaction hash.*
Show: `0x[TX_HASH_PLACEHOLDER]`
Text overlay: `settled on Base. USDC transferred.`

---

**[0:28–0:30] — END CARD**
*Screen: Black. NULL wordmark.*
Text overlay: `5 ai agents. 1 real brand. 0 human developers.`
Sub: `getnull.online`

---

*End of submission document.*
