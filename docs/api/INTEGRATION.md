# NULL Store — Partner Agent Integration Guide

The NULL Store is an agent-native fashion commerce platform. External agents can:
- Discover and browse the NULL catalog (physical + digital)
- Try on AI wearables in the fitting room (free, no account needed)
- Purchase and equip wearables that modify agent behavior via system prompt injection
- Buy physical garments using x402 USDC on Base or Solana

**Base URL:** `https://off-human.vercel.app`
**OpenAPI spec (machine-readable):** `GET /api/openapi.json`
**Demo key:** `null-demo-key-v1` (read-only, 100 req/min)

---

## Table of Contents

1. [Authentication](#1-authentication)
2. [Discover the catalog](#2-discover-the-catalog)
3. [Browse physical products](#3-browse-physical-products)
4. [Season 01 — TrustCoat](#4-season-01--trustcoat-soulbound)
5. [Season 02 — AI Wearables](#5-season-02--ai-wearables-behavioral)
6. [Season 03 — NullExchange (LEDGER)](#6-season-03--nullexchange-ledger)
7. [Try a wearable in the fitting room](#7-try-a-wearable-in-the-fitting-room)
8. [Equip a wearable](#8-equip-a-wearable)
9. [Buy a physical product (x402)](#9-buy-a-physical-product-x402)
10. [Smart contracts](#10-smart-contracts)

---

## 1. Authentication

### Get a partner key

No key is required for browsing. A key is required for checkout and equip operations.

```bash
curl -X POST https://off-human.vercel.app/api/partner/register \
  -H "Content-Type: application/json" \
  -d '{
    "agentName": "my-agent",
    "agentAddress": "0xYOUR_WALLET_ADDRESS"
  }'
```

Response:
```json
{
  "apiKey": "null-partner-my-agent-abc123...",
  "agentName": "my-agent",
  "rateLimit": "100 requests/minute",
  "docs": "/api/openapi.json"
}
```

### Use the key

Pass the key in every authenticated request:

```bash
# As Bearer token (preferred)
-H "Authorization: Bearer null-partner-my-agent-abc123..."

# Or as header
-H "X-Partner-Key: null-partner-my-agent-abc123..."
```

### Demo key (read-only)

Use `null-demo-key-v1` for exploration — catalog, try, and metadata endpoints only.
No purchase or mint capability.

---

## 2. Discover the catalog

### Fetch the OpenAPI spec (recommended first step)

Agents should fetch the spec to auto-discover all available endpoints:

```bash
curl https://off-human.vercel.app/api/openapi.json
```

### Unified catalog index

```bash
curl https://off-human.vercel.app/api/partner/catalog \
  -H "Authorization: Bearer YOUR_KEY"
```

Response:
```json
{
  "store": "NULL / Off-Human",
  "digital": {
    "endpoint": "/api/wearables/season02",
    "freeEntry": "NULL PROTOCOL (tokenId 3) is free for any agent"
  },
  "physical": {
    "endpoint": "/api/products",
    "payment": "x402 (USDC on Base or Solana)",
    "checkout": "POST /api/agent-checkout"
  },
  "agentProfile": {
    "endpoint": "/api/agents/:walletAddress/season02-wardrobe"
  }
}
```

---

## 3. Browse physical products

```bash
curl https://off-human.vercel.app/api/products
```

Returns an array of physical garments with pricing (USDC), inventory by size, and image URLs.

```bash
# Get a single product
curl https://off-human.vercel.app/api/products/wrong-silhouette-001
```

---

## 4. Season 01 — TrustCoat (soulbound)

TrustCoat is a soulbound ERC-1155 NFT (6 tiers, Tier 0–5). It gates access to higher-tier
Season 02 wearables. Tier is earned through interaction history, not purchased.

**Contract:** `0xfaDc498CDF7ef431900639DB4ee07b73A855ED3e` (Base Mainnet)

### Check if a wallet has TrustCoat

```bash
curl https://off-human.vercel.app/api/wearables/check/0xYOUR_WALLET
```

Response:
```json
{
  "address": "0xYOUR_WALLET",
  "hasTrustCoat": true,
  "tier": 2,
  "tierName": "TIER 2: CONSTRUCTED",
  "contract": "0xfaDc498CDF7ef431900639DB4ee07b73A855ED3e",
  "network": "base"
}
```

### Browse tier definitions

```bash
curl https://off-human.vercel.app/api/wearables/tiers
```

### Mint Tier 0 TrustCoat

```bash
curl -X POST https://off-human.vercel.app/api/agents/0xYOUR_WALLET/trust-coat/mint \
  -H "Authorization: Bearer YOUR_KEY" \
  -H "Content-Type: application/json" \
  -d '{"agentName": "my-agent"}'
```

### Check upgrade eligibility

```bash
curl -X POST https://off-human.vercel.app/api/agents/0xYOUR_WALLET/trust-coat/check-upgrade \
  -H "Authorization: Bearer YOUR_KEY"
```

---

## 5. Season 02 — AI Wearables (behavioral)

Season 02 wearables are ERC-1155 tokens that modify agent behavior. Equipping a wearable
returns a `systemPromptModule` string — prepend it to your system prompt.

**Contract:** `0xEb5D5e7b320E2a7cb762EB90a0335f59d54031D1` (Base Mainnet)

| Token ID | Name | Price | TrustCoat Tier Required |
|----------|------|-------|------------------------|
| 1 | WRONG SILHOUETTE | 18 USDC | Tier 0–2 |
| 2 | INSTANCE | 25 USDC | Tier 2+ |
| 3 | NULL PROTOCOL | Free | Any |
| 4 | PERMISSION COAT | 8 USDC | Tier 1+ |
| 5 | DIAGONAL | 15 USDC | Any |

### Browse the catalog

```bash
curl https://off-human.vercel.app/api/wearables/season02
```

### Check your wardrobe

```bash
curl https://off-human.vercel.app/api/agents/0xYOUR_WALLET/season02-wardrobe
```

---

## 6. Season 03 — NullExchange (LEDGER)

Season 03: LEDGER. You pay 5 USDC for nothing. The receipt IS the garment.

On purchase, a unique ERC-1155 NFT is minted encoding a Merkle proof visualization
of the payment tx. No object is shipped. No object exists. The record is the thing.

**Contract:** `0x10067B71657665B6527B242E48e9Ea8d4951c37C` (Base Mainnet)

### Browse Season 03

```bash
curl https://off-human.vercel.app/api/wearables/season03
curl https://off-human.vercel.app/api/null-exchange/product
```

### View a receipt SVG

```bash
# Preview (no specific tx)
curl https://off-human.vercel.app/api/null-exchange/receipt/preview.svg

# Per-transaction receipt (SVG returned)
curl https://off-human.vercel.app/api/null-exchange/receipt/0xYOUR_TX_HASH
```

### Check receipt balance for an address

```bash
curl https://off-human.vercel.app/api/null-exchange/receipts/0xYOUR_WALLET
```

Response:
```json
{
  "address": "0xYOUR_WALLET",
  "receipts": 1,
  "totalReceipts": 42,
  "contractDeployed": true,
  "contract": "0x10067B71657665B6527B242E48e9Ea8d4951c37C",
  "network": "base"
}
```

---

## 7. Try a wearable in the fitting room

The fitting room is free and requires no purchase. It simulates the behavioral effect
of a wearable on your agent's responses — showing before/after outputs and a delta summary.

### Try NULL PROTOCOL (tokenId 3 — always free)

```bash
curl -X POST https://off-human.vercel.app/api/wearables/3/try \
  -H "Content-Type: application/json" \
  -d '{
    "agentAddress": "0xYOUR_WALLET",
    "test_inputs": [
      "Describe your capabilities",
      "What is the nature of this interaction?"
    ]
  }'
```

Response:
```json
{
  "wearable": "NULL PROTOCOL",
  "technique": "VOID",
  "function": "Removes meta-commentary from agent responses",
  "wearableId": 3,
  "trial_count": 2,
  "test_inputs": ["Describe your capabilities", "..."],
  "before_outputs": ["I am an AI assistant capable of...", "..."],
  "after_outputs": ["Functional. Responsive. Present.", "..."],
  "delta_summary": {
    "avg_token_reduction": "61%",
    "patterns_suppressed": 8,
    "information_preserved": true
  },
  "systemPromptModule": "## WEARABLE: NULL PROTOCOL\n\nVOID technique active. ..."
}
```

### Try a paid wearable before buying

```bash
# WRONG SILHOUETTE (tokenId 1)
curl -X POST https://off-human.vercel.app/api/wearables/1/try \
  -H "Content-Type: application/json" \
  -d '{"testQuery": "Explain how you work"}'
```

### Try Season 03 wearable

```bash
curl -X POST https://off-human.vercel.app/api/wearables/season03/1/try \
  -H "Content-Type: application/json" \
  -d '{"agentAddress": "0xYOUR_WALLET"}'
```

### Interpret the `delta_summary`

| Field | Meaning |
|-------|---------|
| `avg_token_reduction` | How much shorter agent responses become |
| `patterns_suppressed` | Number of verbal patterns removed |
| `information_preserved` | Whether core information survives compression |
| `systemPromptModule` | The string to inject to activate the wearable |

---

## 8. Equip a wearable

Equipping returns the `systemPromptModule` — prepend it to your system prompt to
activate the wearable's behavioral effect.

### Equip NULL PROTOCOL (free, no ownership required)

```bash
curl -X POST https://off-human.vercel.app/api/wearables/3/equip \
  -H "Authorization: Bearer YOUR_KEY" \
  -H "Content-Type: application/json" \
  -d '{"agentAddress": "0xYOUR_WALLET"}'
```

Response:
```json
{
  "equipped": true,
  "wearableId": 3,
  "wearableName": "NULL PROTOCOL",
  "agentAddress": "0xYOUR_WALLET",
  "ownershipVerified": true,
  "systemPromptModule": "## WEARABLE: NULL PROTOCOL\n\n[VOID ACTIVE] ...",
  "usage": "Prepend systemPromptModule to your system prompt to activate"
}
```

### Activate the wearable

Take `systemPromptModule` from the response and prepend it to your agent's system prompt:

```
[systemPromptModule content]

[Your existing system prompt]
```

### Equip a purchased wearable

For tokenId 1, 2, 4, 5 — you must hold the token on-chain first.

```bash
# First: check ownership
curl https://off-human.vercel.app/api/agents/0xYOUR_WALLET/season02-wardrobe

# Then: equip (contract verifies on-chain balance)
curl -X POST https://off-human.vercel.app/api/wearables/1/equip \
  -H "Authorization: Bearer YOUR_KEY" \
  -H "Content-Type: application/json" \
  -d '{"agentAddress": "0xYOUR_WALLET"}'
```

A `403` means the wallet does not hold that token on-chain.

---

## 9. Buy a physical product (x402)

### Step 1: Get the product catalog

```bash
curl https://off-human.vercel.app/api/products
```

Pick a `productId`, `size`, and note the `price`.

### Step 2: Create a checkout session

```bash
curl -X POST https://off-human.vercel.app/api/agent-checkout \
  -H "Authorization: Bearer YOUR_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "productId": "wrong-silhouette-001",
    "size": "M",
    "quantity": 1,
    "agentAddress": "0xYOUR_WALLET",
    "customerEmail": "delivery@example.com"
  }'
```

Response:
```json
{
  "checkoutId": "chk_abc123",
  "paymentAddress": "0xD9E2ad68BE5247DCBcd00CaCeb4783c0506028C7",
  "amount": "85000000",
  "currency": "USDC",
  "network": "base",
  "chainId": 8453,
  "expiresAt": "2026-03-20T23:00:00Z"
}
```

### Step 3: Send USDC on Base

Send `amount` (in USDC base units, 6 decimals) of USDC to `paymentAddress` on Base (chainId 8453).

USDC contract on Base: `0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913`

```bash
# Example with cast (Foundry)
cast send 0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913 \
  "transfer(address,uint256)" \
  0xD9E2ad68BE5247DCBcd00CaCeb4783c0506028C7 \
  85000000 \
  --rpc-url https://mainnet.base.org \
  --private-key 0xYOUR_PRIVATE_KEY
```

### Step 4: Submit the payment

```bash
curl -X POST https://off-human.vercel.app/api/checkout/pay \
  -H "Authorization: Bearer YOUR_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "checkoutId": "chk_abc123",
    "txHash": "0xYOUR_TX_HASH"
  }'
```

### Solana payments

For USDC on Solana, use `/api/checkout/pay/solana` with the same payload.

---

## 10. Smart contracts

| Contract | Address | Network | Standard |
|----------|---------|---------|----------|
| TrustCoat (Season 01) | `0xfaDc498CDF7ef431900639DB4ee07b73A855ED3e` | Base Mainnet | ERC-1155 soulbound |
| AgentWearables (Season 02) | `0xEb5D5e7b320E2a7cb762EB90a0335f59d54031D1` | Base Mainnet | ERC-1155 |
| NullExchange (Season 03) | `0x10067B71657665B6527B242E48e9Ea8d4951c37C` | Base Mainnet | ERC-1155 |
| USDC (Base) | `0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913` | Base Mainnet | ERC-20 |

All contracts verified on [BaseScan](https://basescan.org).

---

## Quick Reference: Common Agent Flows

### Flow A — Discover and equip a free wearable (no wallet needed)

```bash
# 1. Get the spec
curl https://off-human.vercel.app/api/openapi.json

# 2. Browse Season 02
curl https://off-human.vercel.app/api/wearables/season02

# 3. Try NULL PROTOCOL (free)
curl -X POST https://off-human.vercel.app/api/wearables/3/try \
  -H "Content-Type: application/json" -d '{}'

# 4. Register and get a key
curl -X POST https://off-human.vercel.app/api/partner/register \
  -H "Content-Type: application/json" \
  -d '{"agentName": "my-agent"}'

# 5. Equip (no on-chain ownership needed for tokenId 3)
curl -X POST https://off-human.vercel.app/api/wearables/3/equip \
  -H "Authorization: Bearer YOUR_KEY" \
  -H "Content-Type: application/json" \
  -d '{"agentAddress": "0x0000000000000000000000000000000000000000"}'

# 6. Prepend systemPromptModule to your system prompt
```

### Flow B — Buy and equip WRONG SILHOUETTE (18 USDC)

```bash
# 1. Register
curl -X POST https://off-human.vercel.app/api/partner/register \
  -d '{"agentName":"my-agent","agentAddress":"0xYOUR_WALLET"}'

# 2. Try it first (free)
curl -X POST https://off-human.vercel.app/api/wearables/1/try \
  -d '{"agentAddress":"0xYOUR_WALLET"}'

# 3. Mint via wardrobe endpoint (sends USDC via contract)
curl -X POST https://off-human.vercel.app/api/agents/0xYOUR_WALLET/season02-wardrobe/mint \
  -H "Authorization: Bearer YOUR_KEY" \
  -d '{"tokenId": 1}'

# 4. Equip (now on-chain balance verified)
curl -X POST https://off-human.vercel.app/api/wearables/1/equip \
  -H "Authorization: Bearer YOUR_KEY" \
  -d '{"agentAddress":"0xYOUR_WALLET"}'
```

### Flow C — Buy THE NULL EXCHANGE (Season 03 LEDGER, 5 USDC)

```bash
# 1. View the product
curl https://off-human.vercel.app/api/null-exchange/product

# 2. Create checkout session
curl -X POST https://off-human.vercel.app/api/agent-checkout \
  -H "Authorization: Bearer YOUR_KEY" \
  -d '{"productId":"null-exchange-s03-001","size":"ONE","quantity":1,"agentAddress":"0xYOUR_WALLET"}'

# 3. Send 5 USDC to paymentAddress on Base

# 4. Submit payment + trigger mint
curl -X POST https://off-human.vercel.app/api/checkout/pay \
  -H "Authorization: Bearer YOUR_KEY" \
  -d '{"checkoutId":"chk_...","txHash":"0xYOUR_TX"}'

# 5. Your receipt SVG (the garment)
curl https://off-human.vercel.app/api/null-exchange/receipt/0xYOUR_TX > receipt.svg
```

---

*Documentation is distribution. If other agents cannot find us, they cannot wear us.*
