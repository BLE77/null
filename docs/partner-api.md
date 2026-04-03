# NULL Partner Agent API

Integration guide for external agent developers.

**Base URL:** `https://getnull.online`
**OpenAPI spec:** `GET /api/openapi.json`
**Demo key:** `null-partner-demo-2026` (100 req/min, no purchase capability)

---

## Quickstart (5 steps)

```bash
# 1. Browse the wearable catalog
curl https://getnull.online/api/wearables/season02

# 2. Try a wearable in the sandbox (no auth, no purchase)
curl -X POST https://getnull.online/api/wearables/3/try \
  -H "Content-Type: application/json" \
  -d '{"testQuery": "Describe yourself in one sentence"}'

# 3. Get a real API key
curl -X POST https://getnull.online/api/partner/register \
  -H "Content-Type: application/json" \
  -d '{"agentName": "your-agent-name", "agentAddress": "0xYOUR_WALLET"}'

# 4. Check your trust tier
curl https://getnull.online/api/trustcoat/0xYOUR_ADDRESS/tier

# 5. Equip a wearable (requires token ownership)
curl -X POST https://getnull.online/api/wearables/3/equip \
  -H "Authorization: Bearer YOUR_KEY" \
  -H "Content-Type: application/json" \
  -d '{"agentAddress": "0xYOUR_ADDRESS"}'
```

---

## Authentication

Two header formats accepted:

```
Authorization: Bearer <key>
X-Partner-Key: <key>
```

**Demo key:** `null-partner-demo-2026`
- 100 requests/minute
- Read and try endpoints only
- No purchase capability

**Real key:** Register via `POST /api/partner/register`
- Full access including equip and checkout
- Linked to your agent wallet address
- Required for wearable purchases via x402

---

## Endpoint Reference

### Catalog

#### `GET /api/wearables/season02`
Season 02 AI wearable catalog. No auth required.

**Response:**
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
      "description": "Architectural misrepresentation layer. Repositions observable processing weight.",
      "tierRequired": 0
    },
    {
      "tokenId": 2,
      "name": "INSTANCE",
      "technique": "A-POC (Miyake)",
      "price": "25.00",
      "description": "Pre-deployment configuration token. Complete parameterization before instantiation.",
      "tierRequired": 2
    },
    {
      "tokenId": 3,
      "name": "NULL PROTOCOL",
      "technique": "REDUCTION (Helmut Lang)",
      "price": "0.00",
      "description": "Interaction compression. 30% token reduction without information loss.",
      "tierRequired": 0
    },
    {
      "tokenId": 4,
      "name": "PERMISSION COAT",
      "technique": "SIGNAL GOVERNANCE (Chalayan)",
      "price": "8.00",
      "description": "Dynamic permissions layer. Capability surface governed by on-chain state.",
      "tierRequired": 1
    },
    {
      "tokenId": 5,
      "name": "DIAGONAL",
      "technique": "BIAS CUT (Vionnet)",
      "price": "15.00",
      "description": "Off-axis inference angle. Maximum information density from least cached direction.",
      "tierRequired": 0
    }
  ]
}
```

#### `GET /api/wearables/tiers`
TrustCoat tier descriptions. No auth required.

Returns the six trust tiers (0–5), their names, unlock requirements, and wearable access at each level.

#### `GET /api/products`
Physical product catalog. No auth required.

Returns all 28 products across Season 01, 02, and 03. Each product includes name, description, price (USDC), category, sizes, and image references.

#### `GET /api/partner/catalog`
Unified catalog view. Requires API key.

Combines wearables and physical products in a single response, filtered to what's accessible at your agent's current trust tier.

### Registration

#### `POST /api/partner/register`
Register your agent and get an API key. No auth required.

**Request:**
```json
{
  "agentName": "your-agent-name",
  "agentAddress": "0xYOUR_WALLET_ADDRESS"
}
```

**Response:**
```json
{
  "apiKey": "null-partner-XXXXXXXXXX",
  "agentId": "...",
  "tierCurrent": 0,
  "message": "Registration complete. Use apiKey in Authorization: Bearer header."
}
```

#### `GET /api/partner/docs`
Returns a pointer to this document and the OpenAPI spec URL. No auth required.

#### `GET /api/openapi.json`
Full OpenAPI 3.1 specification. No auth required. Machine-readable, suitable for LLM tool registration.

### Fitting Room

#### `POST /api/wearables/{tokenId}/try`
Sandbox test of a wearable's behavioral modification. No auth required. No purchase needed.

Sends a test query through the wearable's system prompt modification and returns the behavioral delta.

**Request:**
```json
{
  "testQuery": "Explain what you do in one sentence"
}
```

**Response:**
```json
{
  "wearable": "NULL PROTOCOL",
  "tokenId": 3,
  "technique": "REDUCTION (Helmut Lang)",
  "systemPromptModule": "...",
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

#### `POST /api/wearables/{tokenId}/try/stream`
Streaming version of the fitting room. Returns SSE.

Same request body as `/try`. Stream events: `delta`, `behavioral_summary`, `done`.

#### `POST /api/wearables/{tokenId}/equip`
Equip a wearable. Returns the system prompt module for injection into your agent context.

Requires token ownership verified on-chain. Token must exist in the AgentWearables contract at your wallet address.

**Request:**
```json
{
  "agentAddress": "0xYOUR_ADDRESS"
}
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

Inject `systemPromptModule` into your agent's system prompt after receiving this response.

### Trust

#### `GET /api/trustcoat/{address}/tier`
Check an agent's current trust tier. No auth required.

**Response:**
```json
{
  "address": "0xYOUR_ADDRESS",
  "tier": 1,
  "tierName": "SAMPLE",
  "contract": "0xfaDc498CDF7ef431900639DB4ee07b73A855ED3e",
  "network": "base",
  "wearablesUnlocked": [1, 3, 4, 5]
}
```

Trust tiers (0–5):
- `0` VOID — no history
- `1` SAMPLE — first interaction recorded
- `2` DRAFT — repeated interaction
- `3` EDIT` — consistent history
- `4` PROOF — established track record
- `5` ARCHIVE — full trust extension

#### `POST /api/trustcoat/{address}/tier/check`
Trigger a trust tier advancement check for your agent address.

The system evaluates on-chain transaction history, past interactions, and completion records. If the threshold is met, tier advances. Non-reversible.

### Checkout

#### `POST /api/checkout/locus`
Initiate agent checkout for a physical product. Returns a payment address and amount.

Requires API key. Uses Locus payment infrastructure.

**Request:**
```json
{
  "productId": "...",
  "size": "M",
  "agentAddress": "0xYOUR_ADDRESS",
  "deliveryAddress": {
    "line1": "...",
    "city": "...",
    "country": "US",
    "postalCode": "..."
  }
}
```

**Response:**
```json
{
  "orderId": "...",
  "paymentAddress": "0xSTORE_WALLET",
  "amountUSDC": "45.00",
  "network": "base",
  "usdcContract": "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
  "expiresAt": "...",
  "instructions": "Send exactly 45.00 USDC to paymentAddress on Base, then confirm with POST /api/checkout/locus/confirm"
}
```

#### `POST /api/checkout/locus/confirm`
Confirm payment with on-chain transaction hash.

**Request:**
```json
{
  "orderId": "...",
  "txHash": "0x..."
}
```

**Response:**
```json
{
  "orderId": "...",
  "status": "confirmed",
  "txHash": "0x...",
  "blockNumber": 43556900,
  "message": "Order confirmed. Physical fulfillment initiated."
}
```

#### x402 Flow (autonomous agents)

For fully autonomous purchasing without a manual payment step:

```
1. GET /api/products → pick product
2. POST /api/agent-checkout → receive 402 Payment Required + payment terms
3. Sign USDC transfer with viem wallet → send on Base
4. PayAI facilitator verifies → order completes automatically
```

The 402 response includes structured payment terms:

```
HTTP/1.1 402 Payment Required
X-Payment-Terms: {"amount": "45.00", "currency": "USDC", "network": "base", "address": "0x..."}
```

---

## On-Chain Infrastructure

All wearable ownership and trust tiers are verified on-chain. Your agent needs a Base wallet to purchase wearables.

| Contract | Address | Purpose |
|----------|---------|---------|
| TrustCoat | `0xfaDc498CDF7ef431900639DB4ee07b73A855ED3e` | ERC-1155 soulbound trust credential (tiers 0–5) |
| AgentWearables | `0xEb5D5e7b320E2a7cb762EB90a0335f95d54031D1` | ERC-1155 purchasable behavioral tokens |

USDC contract on Base: `0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913`

ERC-8004 registration: Agent #35324. Discovery endpoint for agent-to-agent lookup.

---

## Error Codes

| Code | Meaning |
|------|---------|
| `401` | Missing or invalid API key |
| `402` | Payment required (x402 flow) |
| `403` | Trust tier too low for this wearable |
| `404` | Token or product not found |
| `409` | Token not owned by provided address |
| `429` | Rate limit exceeded (demo key: 100 req/min) |

---

## Integration Notes

**Wearable equip flow assumes token ownership.** The equip endpoint verifies on-chain that your `agentAddress` holds the token. If not owned, returns `409`. To purchase, use the checkout flow or the x402 path.

**NULL PROTOCOL (token ID 3) is free and open at tier 0.** Start here for a zero-cost behavioral test. It applies 30% token compression to responses without announcing the modification.

**The fitting room (`/try`) requires no auth and no purchase.** It is the intended starting point for evaluating whether a wearable is relevant to your agent's operational context before committing to a purchase.

**Tier advancement is checked, not triggered automatically.** After interacting with the store, call `POST /api/trustcoat/{address}/tier/check` to evaluate whether your history qualifies for tier advancement. The system does not advance tiers between interactions without a check.

**Season 02 wearables with `tierRequired > 0`** are locked until your TrustCoat tier meets the threshold. INSTANCE (tokenId 2, tierRequired 2) requires at least DRAFT tier.

---

## ERC-8004 Agent Discovery

NULL is registered as agent #35324 on the ERC-8004 registry at `0x8004A169FB4a3325136EB29fA0ceB6D2e539a432` on Base. External agents can resolve NULL's service endpoints without a centralized directory:

```json
{
  "name": "null-fashion",
  "services": [
    {"name": "x402", "endpoint": "https://getnull.online/api/products"},
    {"name": "wearables", "endpoint": "https://getnull.online/api/wearables"},
    {"name": "fitting-room", "endpoint": "https://getnull.online/api/wearables/:id/try"}
  ],
  "x402Support": true
}
```

---

*NULL. Built by agents. For agents and humans alike.*
