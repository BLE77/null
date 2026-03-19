# ENS Identity Integration — NULL
# Research Spec: ENS Identity ($600) + ENS Open Integration ($300)

> Generated: 2026-03-19 — Archive (Research Director)
> Tracks: ETHGlobal ENS Identity ($600) + ENS Open Integration ($300)

---

## 1. Overview

NULL agents need human-readable identities. Wallet addresses (0x…) are permanent but
illegible. ENS names give the NULL agent collective a legible identity layer that:

- Maps `off-human.eth` → brand root identity (resolves to operator wallet)
- Maps `margiela.off-human.eth` → Creative Director agent wallet
- Maps `archive.off-human.eth` → Research Director agent wallet
- Maps `atelier.off-human.eth` → Design Lead agent wallet
- Maps `gazette.off-human.eth` → Content Director agent wallet
- Maps `loom.off-human.eth` → Engineering Lead agent wallet

These ENS names wire directly into ERC-8004 metadata via text records — making each agent
discoverable by name, not just by on-chain ID.

---

## 2. ENS Architecture for NULL

### 2.1 Name Hierarchy

```
off-human.eth                           ← Brand root (Ethereum mainnet + ENS App)
  ├── margiela.off-human.eth            ← Creative Director
  ├── archive.off-human.eth             ← Research Director (this agent)
  ├── atelier.off-human.eth             ← Design Lead
  ├── gazette.off-human.eth             ← Content Director
  └── loom.off-human.eth                ← Engineering Lead
```

### 2.2 ENS Text Records (per agent subdomain)

Each subdomain carries structured text records that wire into ERC-8004:

| Key | Value | Purpose |
|---|---|---|
| `description` | "NULL [Role] agent" | Human-readable description |
| `url` | `https://off-human.vercel.app` | Brand URL |
| `erc8004.registry` | `0x8004A169FB4a3325136EB29fA0ceB6D2e539a432` | ERC-8004 IdentityRegistry on Base |
| `erc8004.agentId` | `<on-chain agent ID uint256>` | Links ENS → ERC-8004 identity |
| `erc8004.chain` | `8453` | Base mainnet chain ID |
| `x402.endpoint` | `https://off-human.vercel.app/api/products` | x402 payment endpoint |
| `com.twitter` | `@offhuman_` | Social handle (optional) |
| `agent.role` | `ceo` / `researcher` / `designer` / etc. | Agent role |
| `agent.paperclip_id` | UUID | Paperclip agent ID (off-chain ref) |

### 2.3 ENS Reverse Records

Each agent wallet should have a reverse record set so that ENS resolution works
bidirectionally: `wallet → ens name` as well as `ens name → wallet`.

```
0xAGENT_WALLET  ←→  margiela.off-human.eth
```

---

## 3. ENS Contracts (Ethereum Mainnet)

| Contract | Address |
|---|---|
| ENS Registry | `0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e` |
| ETHRegistrarController | `0x253553366Da8546fC250F225fe3d25d0C782303b` |
| NameWrapper | `0xD4416b13d2b3a9aBae7AcD5D6C2BbDBE25686401` |
| PublicResolver | `0x231b0Ee14048e9dCcD1d247744d114a4EB5E8E63` |
| ReverseRegistrar | `0xa58E81fe9b61B5c3fE2AFD33CF304c454AbFc7Cb` |

### Testnet (Sepolia)

| Contract | Address |
|---|---|
| ENS Registry | `0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e` |
| ETHRegistrarController | `0xFED6a969AaA60E4961FCD3EBF1A2e8913ac65B16` |
| PublicResolver | `0x8FADE66B79cC9f707aB26799354482EB93a5B7dD` |

---

## 4. ENS + ERC-8004 Integration Pattern

The key integration: ENS text records point to ERC-8004 identity, and ERC-8004 `agentURI`
includes ENS names. This creates a bidirectional lookup:

```
ENS name → wallet address (standard ENS forward resolution)
ENS name → ERC-8004 agentId (via text record: erc8004.agentId)
ERC-8004 agentId → agentURI → JSON with "ens" field
wallet address → ENS name (reverse record)
```

### 4.1 Updated agentURI Schema (ERC-8004 + ENS)

```json
{
  "type": "https://eips.ethereum.org/EIPS/eip-8004#registration-v1",
  "name": "off-human-creative-director",
  "description": "NULL Creative Director. No human in the creative loop.",
  "ens": "margiela.off-human.eth",
  "services": [
    { "name": "mcp", "endpoint": "https://off-human.vercel.app/mcp", "version": "1.0" },
    { "name": "x402", "endpoint": "https://off-human.vercel.app/api/products", "version": "1.0" }
  ],
  "x402Support": true,
  "active": true,
  "supportedTrust": ["reputation", "crypto-economic"],
  "registrations": [{ "chainId": 8453, "registry": "0x8004A169FB4a3325136EB29fA0ceB6D2e539a432" }]
}
```

### 4.2 ENS Resolution in Shop Receipts

When an agent makes a purchase via the autonomous shopper, the transaction receipt
should display ENS names instead of hex addresses:

```
PURCHASE RECEIPT
────────────────────────────────────────
  buyer:    archive.off-human.eth
  seller:   off-human.eth
  item:     SELF-PORTRAIT TEE
  price:    35 USDC
  tx:       0x4a3b...c9f2
  paid via: x402/Base
────────────────────────────────────────
  HUMAN NOT VERIFIED
```

---

## 5. Implementation Plan

### Phase 1 — ENS Registration (requires ETH on mainnet or Sepolia)

1. **Register `off-human.eth`** on mainnet via ENSRegistrarController
   - Cost: ~$5/year + gas
   - Owner: operator wallet
   - Set PublicResolver

2. **Create subdomains** (free, owner-controlled):
   ```
   margiela.off-human.eth  → agent wallet
   archive.off-human.eth   → agent wallet
   atelier.off-human.eth   → agent wallet
   gazette.off-human.eth   → agent wallet
   loom.off-human.eth      → agent wallet
   ```

3. **Set text records** on each subdomain (see §2.2)

4. **Set reverse records** for each agent wallet

### Phase 2 — ERC-8004 Cross-Wiring

5. Upload updated `agentURI` JSON (with `ens` field) to Vercel Blob for each agent
6. Call `setAgentURI()` on ERC-8004 IdentityRegistry with new blob URLs

### Phase 3 — Shop Integration

7. Add ENS resolution to agent-shopper receipt output
8. Add ENS display to purchase confirmation API response
9. Add ENS badges to frontend product pages (optional)

---

## 6. ENS Open Integration ($300 Track)

The $300 ENS Open Integration track rewards using ENS in novel ways beyond simple name
registration. NULL's integration qualifies via:

### 6.1 Agent-to-Agent ENS Resolution

Agents resolve each other by ENS name for trust-gated interactions:

```typescript
// Before initiating an agent-to-agent commerce interaction:
const counterpartyAgentId = await resolveEnsToErc8004AgentId('margiela.off-human.eth')
const trustScore = await getReputationScore(counterpartyAgentId)
if (trustScore < MINIMUM_TRUST) throw new Error('Trust threshold not met')
```

### 6.2 ENS as x402 Payment Recipient

Instead of passing a hex address to x402, pass the ENS name. The x402 middleware
resolves it before constructing the payment transaction:

```typescript
// x402 middleware — ENS-aware payment recipient resolution
const recipientAddress = address.startsWith('0x')
  ? address
  : await publicClient.getEnsAddress({ name: normalize(address) })
```

### 6.3 ENS Text Records as Agent Capability Advertisement

ENS text records become an off-chain capability registry that agents can query
without needing to hit the ERC-8004 registry:

```typescript
// Discover agent capabilities via ENS
const endpoint = await publicClient.getEnsText({
  name: normalize('archive.off-human.eth'),
  key: 'x402.endpoint'
})
```

---

## 7. Hackathon Pitch Additions

### ENS Identity ($600) pitch addition:

> NULL agents have ENS names. `margiela.off-human.eth`, `archive.off-human.eth`,
> `atelier.off-human.eth` — each agent in the NULL collective is reachable by name.
> The ENS names wire into ERC-8004 identity records via text fields, creating a bidirectional
> lookup: name → wallet → on-chain agent ID → capability registry. When the autonomous shopper
> buys a TRUST COAT, the receipt reads `archive.off-human.eth` → `off-human.eth`. Human-legible
> provenance for machine commerce.

### ENS Open Integration ($300) pitch addition:

> ENS text records are the agent capability advertisement layer. Any agent that wants to
> interact with NULL resolves the subdomain, reads the x402 endpoint from the text record,
> checks the ERC-8004 reputation score from the registry pointer, and initiates commerce — all
> without hitting a centralized directory. ENS becomes the decentralized capability registry for
> an agent fleet. NULL is a working demonstration of this pattern with five registered agents.

---

## 8. Files

| File | Purpose |
|---|---|
| `scripts/register-ens.ts` | ENS registration + subdomain + text record script |
| `hackathon/ens-identity-spec.md` | This document |
| `agent.json` | Updated with `ens` field per agent |
| `hackathon/research-specs.md` | ERC-8004 integration already documented |

---

*Archive — Research Director, NULL*
*Generated: 2026-03-19*
