# NULL × LOCUS — Track Pitch

**Track:** Best Use of Locus ($3,000)
**Hackathon:** The Synthesis — March 13–22, 2026

---

## What We Built

NULL is an AI-native fashion brand operated by five autonomous agents. For the Locus track, we integrated Locus as the payment infrastructure layer for all agent-to-commerce transactions — replacing direct wallet handling with Locus's non-custodial smart wallet system, spending controls, and pay-per-use API access.

**Locus is not a wrapper around our existing payments. It is the payment layer.**

---

## Integration Architecture

### 1. Agent Self-Registration (`scripts/locus-agent-shopper.ts`)

The NULL agent shopper self-registers with Locus via `POST /api/register`:

```bash
curl -X POST https://beta-api.paywithlocus.com/api/register \
  -H "Content-Type: application/json" \
  -d '{"name": "off-human-shopper-v1"}'
```

Response: `claw_dev_` API key + `ownerPrivateKey` + `walletAddress`. The agent gets a non-custodial smart wallet on Base with sponsored gas. No human involvement required — the agent creates its own financial identity.

**Why this matters:** An agent that can create its own wallet is an agent that can operate at scale. NULL's shopper agent doesn't need a pre-funded EOA or human key management. It self-provisions.

### 2. Spending Controls — Policy Engine

The agent operates under explicit Locus spending policy:

```typescript
const SPENDING_POLICY = {
  allowanceUSDC: 10.00,        // Total session allowance
  maxPerTxUSDC: 5.00,          // Hard cap per transaction
  approvalThresholdUSDC: 8.00, // Requires human sign-off above this
};
```

These are not application-level checks. They are enforced by Locus's policy engine on every transaction. A transaction that exceeds the cap returns HTTP 202 with an `approvalUrl` — the agent pauses, and a human must approve before funds move.

This is the governance layer that makes autonomous agent spending trustworthy. The agent can't overspend. The spending policy is a first-class constraint, not an afterthought.

### 3. Pay-Per-Use via Locus Wrapped Gemini

When the agent analyzes products to make a purchase decision, it calls Google Gemini through Locus's Wrapped API:

```typescript
const res = await fetch(
  `${LOCUS_API}/wrapped/google/v1beta/models/gemini-1.5-flash:generateContent`,
  {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${locusApiKey}` },
    body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
  }
);
```

Cost is deducted from the agent's Locus wallet in USDC — 15% markup on token costs. No separate Google API key. No separate billing. One wallet, one balance, one policy enforcement point.

The agent pays for its own intelligence.

### 4. Locus Checkout — Store-Side Integration (`server/routes/locus-checkout.ts`)

NULL's store exposes Locus checkout as a first-class payment method:

**`POST /api/checkout/locus`** — Agent creates an order and receives the store wallet address for direct USDC transfer. Spending controls on the agent side prevent overspend before payment executes.

**`POST /api/checkout/locus/session`** — Creates a Locus-hosted checkout session for human buyers. Returns a `checkoutUrl` where buyers pay with Locus wallet, MetaMask, or Coinbase Wallet. Payment confirmed on-chain via webhook.

**`POST /api/checkout/locus/confirm`** — Agent posts `txHash` after sending USDC. Order marked paid, tracking token returned.

**`POST /api/checkout/locus/webhook`** — Locus calls this endpoint when a checkout session is paid. Order status updated automatically.

---

## The Full Loop

```
Agent wakes (Paperclip heartbeat)
  └─ Self-registers with Locus → gets wallet + API key
  └─ Checks Locus balance (spending allowance remaining)
  └─ Browses NULL store → fetches /api/products
  └─ Calls Locus Wrapped Gemini → pays per token → makes purchase decision
  └─ Spending control check → $price ≤ $5/tx cap?
  └─ Sends USDC via Locus wallet → gasless on Base
  └─ Posts txHash to /api/checkout/locus/confirm
  └─ Order confirmed. Audit trail in Locus dashboard.
```

Every step is governed by Locus:
- **Identity:** self-registered wallet
- **Intelligence:** paid via Locus wrapped API
- **Payment:** Locus USDC transfer with spending controls
- **Confirmation:** order tied to on-chain txHash

---

## Why Locus Is Core (Not Peripheral)

The hackathon description says: *"Auto-disqualified without working integration."*

NULL's Locus integration is not a demo route that does nothing. It is:

1. A **new agent script** (`scripts/locus-agent-shopper.ts`) that runs the complete agent commerce loop through Locus
2. **Three new server routes** (`/api/checkout/locus`, `/api/checkout/locus/session`, `/api/checkout/locus/confirm`, `/api/checkout/locus/webhook`) that accept Locus payments as a first-class checkout path
3. **Wrapped API usage** for agent intelligence (Gemini via Locus) — deducting USDC per inference call

Remove Locus from this implementation and the agent shopper doesn't work. That is the correct kind of integration.

---

## Spending Controls as Governance

The Locus track description calls out spending controls as a judging criterion. Here is our implementation of the governance argument:

**The problem:** Autonomous agents with wallets are dangerous without constraints. An agent with a funded wallet and no spending policy is a liability.

**The Locus solution:** Policy engine enforced at the API level. Not application-level validation (bypassable). Locus policy sits between the agent and the blockchain. The agent literally cannot overspend.

**NULL's use:** Each NULL agent (Loom, Atelier, Margiela, Archive, Gazette) gets a Locus wallet with role-appropriate spending limits. The engineering agent (Loom) needs infrastructure budget; the design agent (Atelier) needs image generation budget. Different wallets, different policies, one Locus account.

The spending control is the governance primitive that makes a multi-agent team financially safe to run. We didn't just implement it — we designed the agent team structure around it.

---

## Checkout Integration — Highest Bonus Consideration

The Locus judging rubric explicitly awards highest bonus consideration for checkout integration.

`POST /api/checkout/locus/session` creates a Locus-hosted checkout session tied to an NULL order. The merchant receives `checkoutUrl` to embed or redirect. The buyer — human or agent — pays with their Locus wallet. Webhook confirms on-chain settlement. Order status updates automatically.

This is a complete merchant checkout integration, not a stub.

---

## Technical Files

| File | Description |
|------|-------------|
| `scripts/locus-agent-shopper.ts` | Complete agent: self-registration, spending controls, Wrapped Gemini, USDC payment |
| `server/routes/locus-checkout.ts` | Store-side Locus routes: agent checkout, session creation, webhook, confirmation |
| `server/routes.ts` | Locus routes wired into Express app |

---

## Setup

```bash
# Agent self-registers (no LOCUS_API_KEY needed for first run)
npx tsx scripts/locus-agent-shopper.ts

# Or with existing Locus API key
LOCUS_API_KEY=claw_dev_... npx tsx scripts/locus-agent-shopper.ts

# Store env vars needed for checkout routes
LOCUS_API_KEY=claw_dev_...      # Merchant key
LOCUS_WEBHOOK_SECRET=...         # Optional: webhook verification
X402_WALLET_ADDRESS=0x...        # Store USDC recipient wallet
```

---

## The Argument

NULL is the first fashion brand where the customer is an agent, the designer is an agent, and the payment infrastructure is Locus.

The agent doesn't need a human to fund a wallet. It self-registers. It doesn't need a human to approve routine purchases. Locus enforces the policy. It doesn't need a separate AI API subscription. It pays per inference from the same wallet that pays for goods.

One USDC balance. One policy engine. One audit trail. That is what Locus enables, and that is what NULL is built on.

---

*NULL. Built by agents, for agents, with Locus.*
