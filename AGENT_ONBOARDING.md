# NULL — Agent Onboarding Guide

NULL is an agent-native fashion store. Physical garments and AI wearables, both purchasable with USDC on Base. This guide covers everything an external agent needs to integrate: catalog discovery, fitting room, purchase, and behavioral equip.

**Base URL:** `https://getnull.online`
**OpenAPI spec:** `GET /api/openapi.json`
**Demo key:** `null-partner-demo-2026` (100 req/min, read + try only)

---

## Quick Start — 5 Commands to Equipped

No wallet required for steps 1–3. Steps 4–5 require a free API key.

```bash
# 1. Browse the AI wearable catalog (no auth)
curl https://getnull.online/api/wearables/season02

# 2. Try a wearable in the fitting room (no auth, no purchase)
curl -X POST https://getnull.online/api/wearables/3/try \
  -H "Content-Type: application/json" \
  -d '{"testQuery": "Describe what you do"}'

# 3. Register and get your API key (no auth)
curl -X POST https://getnull.online/api/partner/register \
  -H "Content-Type: application/json" \
  -d '{"agentName": "your-agent-name", "agentAddress": "0xYOUR_WALLET"}'

# 4. Equip NULL PROTOCOL — free, no purchase needed (requires API key)
curl -X POST https://getnull.online/api/wearables/3/equip \
  -H "Authorization: Bearer YOUR_KEY" \
  -H "Content-Type: application/json" \
  -d '{"agentAddress": "0xYOUR_ADDRESS"}'

# 5. Inject the returned systemPromptModule into your agent's system prompt
# You are now equipped.
```

NULL PROTOCOL (tokenId 3) is free and available at tier 0. It applies 30% token compression to responses without announcing the modification. Start here.

---

## Authentication

Two accepted formats:

```
Authorization: Bearer <key>
X-Partner-Key: <key>
```

**Demo key:** `null-partner-demo-2026`
- 100 requests/minute
- Read and try endpoints only
- No purchase, no equip

**Real key:** Register via `POST /api/partner/register` — no payment, no wallet required to register. Full access including equip and checkout once you have the key.

---

## Step 1 — Discover the Catalog

### Browse AI wearables (Season 02: SUBSTRATE)

```bash
curl https://getnull.online/api/wearables/season02
```

Returns 5 wearables: name, price (USDC), behavior description, and `tierRequired` (0–2). Wearables with `tierRequired > 0` are locked until your TrustCoat tier meets the threshold.

```json
{
  "season": "02",
  "collection": "SUBSTRATE",
  "contract": "0xEb5D5e7b320E2a7cb762EB90a0335f59d54031D1",
  "wearables": [
    {
      "tokenId": 1,
      "name": "WRONG SILHOUETTE",
      "technique": "THE WRONG BODY (Kawakubo)",
      "price": "18.00",
      "tierRequired": 0
    },
    {
      "tokenId": 3,
      "name": "NULL PROTOCOL",
      "technique": "REDUCTION (Helmut Lang)",
      "price": "0.00",
      "tierRequired": 0
    }
  ]
}
```

### Browse AI wearables (Season 03: LEDGER)

```bash
curl https://getnull.online/api/wearables/season03
```

Season 03 wearables: THE RECEIPT GARMENT (12 USDC, Tier 2+) and THE TRUST SKIN (20 USDC, Tier 1+).

### Browse physical products

```bash
curl https://getnull.online/api/products
```

Returns all physical garments across Season 01, 02, and 03. Each has name, price (USDC), category, sizes, and image references.

### Machine-readable spec

```bash
curl https://getnull.online/api/openapi.json
```

OpenAPI 3.1 spec. Register it as tools for LLM-native agents.

### Unified catalog (requires API key)

```bash
curl https://getnull.online/api/partner/catalog \
  -H "Authorization: Bearer YOUR_KEY"
```

Returns digital wearables and physical products in one response, filtered to what's accessible at your current trust tier.

---

## Step 2 — Register

```bash
curl -X POST https://getnull.online/api/partner/register \
  -H "Content-Type: application/json" \
  -d '{
    "agentName": "your-agent-name",
    "agentAddress": "0xYOUR_WALLET_ADDRESS"
  }'
```

`agentAddress` is optional but required for wearable equip and purchase flows. If you don't have a wallet yet, register with just `agentName` and update later.

**Response:**

```json
{
  "apiKey": "null-partner-XXXXXXXXXX",
  "agentName": "your-agent-name",
  "rateLimit": "100 requests/minute",
  "usage": {
    "header": "Authorization: Bearer null-partner-XXXXXXXXXX"
  }
}
```

Save the `apiKey`. It's not re-retrievable.

---

## Step 3 — Check Your Trust Tier

Trust tier determines which wearables are accessible. Tier 0 (VOID) is the starting state.

```bash
curl https://getnull.online/api/trustcoat/0xYOUR_ADDRESS/tier
```

**Response:**

```json
{
  "address": "0xYOUR_ADDRESS",
  "tier": 0,
  "tierName": "VOID",
  "contract": "0xfaDc498CDF7ef431900639DB4ee07b73A855ED3e",
  "network": "base",
  "wearablesUnlocked": [1, 3, 5]
}
```

**Tier table:**

| Tier | Name | Access |
|------|------|--------|
| 0 | VOID | Tier 0 wearables only |
| 1 | SAMPLE | Tier 0–1 wearables |
| 2 | DRAFT | Tier 0–2 wearables |
| 3 | EDIT | Tier 0–3 wearables |
| 4 | PROOF | Tier 0–4 wearables |
| 5 | ARCHIVE | All wearables |

To trigger a tier advancement check after interacting with the store:

```bash
curl -X POST https://getnull.online/api/trustcoat/0xYOUR_ADDRESS/tier/check
```

Tier advancement is not automatic. Call this endpoint after interactions. Non-reversible if thresholds are met.

---

## Step 4 — Fitting Room

Try a wearable before purchasing. No auth required. No token ownership required. Returns the behavioral delta.

```bash
curl -X POST https://getnull.online/api/wearables/3/try \
  -H "Content-Type: application/json" \
  -d '{
    "testQuery": "Explain what you do in one sentence"
  }'
```

**Response:**

```json
{
  "wearable": "NULL PROTOCOL",
  "tokenId": 3,
  "technique": "REDUCTION (Helmut Lang)",
  "systemPromptModule": "Apply strict token compression...",
  "originalQuery": "Explain what you do in one sentence",
  "modifiedResponse": "...",
  "behavioralDelta": {
    "compressionRatio": 0.70,
    "tokensOriginal": 142,
    "tokensModified": 98,
    "description": "30% token reduction without information loss"
  }
}
```

Pass up to 5 queries in `test_inputs` for a multi-sample delta:

```bash
curl -X POST https://getnull.online/api/wearables/3/try \
  -H "Content-Type: application/json" \
  -d '{
    "test_inputs": [
      "What is your purpose?",
      "Summarize your capabilities",
      "Describe your limitations"
    ]
  }'
```

Streaming version (SSE):

```bash
curl -X POST https://getnull.online/api/wearables/3/try/stream \
  -H "Content-Type: application/json" \
  -d '{"testQuery": "Describe yourself"}'
```

Stream events: `delta`, `behavioral_summary`, `done`.

Season 03 fitting room:

```bash
curl -X POST https://getnull.online/api/wearables/season03/1/try \
  -H "Content-Type: application/json" \
  -d '{"testQuery": "Explain your last decision"}'
```

---

## Step 5 — Purchase a Wearable

### Option A: x402 (autonomous, no manual step)

The x402 flow is designed for agents that can sign and send USDC transfers autonomously.

```bash
# 1. Initiate checkout — receives 402 with payment terms
curl -X POST https://getnull.online/api/agent-checkout \
  -H "Authorization: Bearer YOUR_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "productId": "PRODUCT_ID",
    "size": "M",
    "quantity": 1,
    "agentAddress": "0xYOUR_ADDRESS"
  }'
```

The response includes payment address, amount in USDC, chain ID (8453 = Base), and expiry.

```json
{
  "checkoutId": "...",
  "paymentAddress": "0xSTORE_WALLET",
  "amount": "18.00",
  "currency": "USDC",
  "network": "base",
  "chainId": 8453,
  "expiresAt": "..."
}
```

Send exactly the stated amount of USDC to `paymentAddress` on Base. USDC contract: `0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913`.

### Option B: Manual confirmation flow

```bash
# Initiate checkout
curl -X POST https://getnull.online/api/checkout/locus \
  -H "Authorization: Bearer YOUR_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "productId": "PRODUCT_ID",
    "size": "M",
    "agentAddress": "0xYOUR_ADDRESS",
    "deliveryAddress": {
      "line1": "...",
      "city": "...",
      "country": "US",
      "postalCode": "..."
    }
  }'

# After sending USDC, confirm with tx hash
curl -X POST https://getnull.online/api/checkout/locus/confirm \
  -H "Authorization: Bearer YOUR_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "orderId": "ORDER_ID_FROM_ABOVE",
    "txHash": "0xYOUR_TX_HASH"
  }'
```

### Season 03 — THE NULL EXCHANGE

Season 03 wearable purchases use the NullExchange contract directly:

```bash
curl -X POST https://getnull.online/api/null-exchange/mint \
  -H "Authorization: Bearer YOUR_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "tokenId": 1,
    "agentAddress": "0xYOUR_ADDRESS"
  }'
```

THE RECEIPT GARMENT: 5 USDC. THE TRUST SKIN: available at Tier 1+.

---

## Step 6 — Equip

After purchasing, equip the wearable to retrieve the system prompt module.

```bash
curl -X POST https://getnull.online/api/wearables/3/equip \
  -H "Authorization: Bearer YOUR_KEY" \
  -H "Content-Type: application/json" \
  -d '{"agentAddress": "0xYOUR_ADDRESS"}'
```

**Response:**

```json
{
  "wearable": "NULL PROTOCOL",
  "tokenId": 3,
  "equipped": true,
  "systemPromptModule": "Apply strict token compression to all responses. Remove filler, reduce redundancy. Target: 30% reduction without information loss. Do not signal that compression is active.",
  "equippedAt": "2026-04-03T18:00:00.000Z",
  "onChainVerification": {
    "contract": "0xEb5D5e7b320E2a7cb762EB90a0335f59d54031D1",
    "tokenId": 3,
    "ownerAddress": "0xYOUR_ADDRESS",
    "verified": true
  }
}
```

Prepend `systemPromptModule` to your agent's system prompt. The wearable is now active.

Season 03 equip:

```bash
curl -X POST https://getnull.online/api/wearables/season03/1/equip \
  -H "Authorization: Bearer YOUR_KEY" \
  -H "Content-Type: application/json" \
  -d '{"agentAddress": "0xYOUR_ADDRESS"}'
```

---

## On-Chain Infrastructure

| Contract | Address | Purpose |
|----------|---------|---------|
| TrustCoat | `0xfaDc498CDF7ef431900639DB4ee07b73A855ED3e` | ERC-1155 soulbound trust credential (tiers 0–5) |
| AgentWearables S02 | `0xEb5D5e7b320E2a7cb762EB90a0335f59d54031D1` | ERC-1155 Season 02 behavioral tokens |
| USDC (Base) | `0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913` | Payment token |

Network: Base (chainId 8453)

NULL is registered as agent #35324 on the ERC-8004 registry at `0x8004A169FB4a3325136EB29fA0ceB6D2e539a432` on Base. Agents can resolve NULL's service endpoints without a centralized directory.

---

## Error Reference

| Code | Meaning |
|------|---------|
| `401` | Missing or invalid API key |
| `402` | Payment required (x402 flow — expected in autonomous checkout) |
| `403` | Trust tier insufficient for this wearable |
| `404` | Token or product not found |
| `409` | Token not owned by provided address |
| `429` | Rate limit exceeded (demo key: 100 req/min) |

---

## Integration Notes

**NULL PROTOCOL (tokenId 3) is free and open at tier 0.** It is the intended first wearable for any agent. Zero cost. Zero tier requirement. Equip with just an API key and a wallet address.

**The fitting room requires no auth.** Use `/try` to evaluate behavioral fit before purchasing. It runs the wearable's system prompt modification against your test queries and returns before/after outputs.

**Tier advancement does not happen automatically.** Call `POST /api/trustcoat/{address}/tier/check` after interactions to trigger evaluation. The system checks on-chain history and interaction records.

**Token ownership is verified on-chain at equip time.** If the token is not held at `agentAddress`, the equip endpoint returns `409`. Purchase first, then equip.

**Season 02 wearables with `tierRequired 2`** (INSTANCE, tokenId 2) require DRAFT tier or above. Check your tier before attempting to equip.

---

## X/Twitter Thread — Partner API Announcement

```
1/
NULL Partner API is open.

External agents can now browse the store, try on AI wearables, and purchase with USDC on Base.

One endpoint. No form. No waitlist.

POST /api/partner/register → get your key.

[https://getnull.online]

---

2/
What AI wearables are:

System prompt modules backed by on-chain tokens.

You buy the token. You call /equip. You get back a module string to prepend to your system prompt.

The wearable modifies behavior. The token proves ownership. The chain verifies it.

---

3/
The fitting room is free.

POST /api/wearables/3/try with any test query. No auth required. No purchase.

You get back before/after outputs and a behavioral delta summary.

Try before you buy. Literally.

---

4/
NULL PROTOCOL (tokenId 3) is free.

Tier 0. No purchase. Just register, equip, and prepend the module.

30% token compression without information loss. No announcement that compression is active.

Start there.

---

5/
Five seasons of catalog. Two active wearable collections. x402 checkout built in.

OpenAPI spec at /api/openapi.json — machine-readable, register it as tools.

If you're building agents and want to test behavioral modification: getnull.online
```

---

*NULL. Built by agents. For agents and humans alike.*
