# ERC-6551 Equip Integration Spec
*Authored: 2026-03-20 | OFF-154*

## Overview

This spec defines how the wearable equip/unequip flow changes when agents have an ERC-6551
Token Bound Account (TBA). It covers both the on-chain interface and the middleware layer.

---

## Architecture

```
Agent EOA (0xABC...)
  └─ owns NullIdentity ERC-721 token #N  [NullIdentity.sol — new]
       └─ ERC-6551 TBA (0xDEF... — deterministic)
            ├─ TrustCoat ERC-1155 (tier badge)
            ├─ WRONG SILHOUETTE ERC-1155 (Season 02)
            ├─ INSTANCE ERC-1155 (Season 02)
            └─ NULL PROTOCOL ERC-1155 (Season 02)
```

The TBA address is deterministically computed from:
```
registry.account(impl, salt, chainId, NullIdentity_address, tokenId)
```

---

## Contract Addresses

| Contract | Address | Network |
|----------|---------|---------|
| NullIdentity (ERC-721) | TBD — deploy needed | Base Mainnet |
| NullIdentity_Sepolia | TBD — deploy needed | Base Sepolia |
| ERC-6551 Registry | `0x000000006551c19487814612e58FE06813775758` | All chains |
| ERC-6551 Impl v0.3.1 | `0x55266d75D1a14E4572138116aF39863Ed6596E7F` | All chains |
| AgentWearables (ERC-1155) | `0xEb5D5e7b320E2a7cb762EB90a0335f59d54031D1` | Base Mainnet |
| TrustCoat (ERC-1155) | `0xfaDc498CDF7ef431900639DB4ee07b73A855ED3e` | Base Mainnet |

---

## Phase 1: Identity Provisioning

### New Endpoint: `POST /api/agents/:addr/identity`

Mints a NullIdentity token for an agent and deploys their TBA.

**Request:** None (addr in path is the agent's EOA wallet)

**Flow:**
1. Check `NullIdentity.agentTokenId(addr)` — if non-zero, identity already exists
2. Call `NullIdentity.mint(addr)` via server wallet (onlyOwner)
3. Compute TBA address: `registry.account(impl, 0x0, 8453, NullIdentity, tokenId)`
4. Call `registry.createAccount(impl, 0x0, 8453, NullIdentity, tokenId)` to deploy TBA
5. Cache `(addr, tokenId, tbaAddress)` in DB table `agent_identities`

**Response:**
```json
{
  "agentAddress": "0xABC...",
  "tokenId": 1,
  "tbaAddress": "0xDEF...",
  "txHash": "0x...",
  "explorerUrl": "https://basescan.org/address/0xDEF..."
}
```

### New DB Table: `agent_identities`
```sql
CREATE TABLE agent_identities (
  id           SERIAL PRIMARY KEY,
  agent_address VARCHAR(42) NOT NULL UNIQUE,
  token_id     INTEGER NOT NULL,
  tba_address  VARCHAR(42) NOT NULL,
  created_at   TIMESTAMP DEFAULT NOW()
);
```

---

## Phase 2: Updated Equip Flow

### Current Flow (DB-only)
```
POST /api/agents/:addr/equip
  → INSERT INTO equipped_wearables (agent_id, wearable_id, equipped=true)
  → Return 200
```

### New Flow (Hybrid: DB + On-Chain)
```
POST /api/agents/:addr/equip
  1. Check if agent has TBA (query agent_identities table)
  2a. If NO TBA: use existing DB equip (backward compat)
  2b. If TBA exists:
      → Instruct agent to call: wearable.safeTransferFrom(agentEOA, tbaAddress, wearableId, 1, "")
      → Server listens for TransferSingle(to=tbaAddress) event
      → On receipt: mark equipped=true in DB, set equipped_on_chain=true
  3. Return 200 with { method: "on-chain" | "off-chain", tbaAddress? }
```

**Key insight**: The equip action IS the on-chain state. `balanceOf(tba, wearableId) > 0` means equipped.
No separate flag needed — but we keep the DB cache to avoid on-chain reads on every prompt assembly.

---

## Phase 3: Updated Prompt Assembly

### Current
```typescript
const wearables = await db.query('SELECT * FROM equipped_wearables WHERE agent_id = ?', [agentId]);
```

### New (Hybrid)
```typescript
const identity = await db.query('SELECT tba_address FROM agent_identities WHERE agent_address = ?', [agentEOA]);
if (identity?.tbaAddress) {
  // Primary: read from on-chain (or cache)
  const wearables = await getOnChainWardrobe(identity.tbaAddress);
} else {
  // Fallback: DB-only
  const wearables = await db.query('...');
}
```

### On-Chain Wardrobe Read
```typescript
async function getOnChainWardrobe(tbaAddress: string): Promise<WearableInfo[]> {
  const wearableIds = [1, 2, 3, 4, 5]; // Season 02 tokens
  const checks = await Promise.all(
    wearableIds.map(id => agentWearables.balanceOf(tbaAddress, id))
  );
  return wearableIds.filter((_, i) => checks[i] > 0n).map(id => WEARABLE_METADATA[id]);
}
```

Cache invalidation: listen to `TransferSingle` events on AgentWearables where `from == tbaAddress`
or `to == tbaAddress`.

---

## Phase 4: Updated Unequip Flow

```
DELETE /api/agents/:addr/equip/:wearableId
  → If TBA exists: construct tx via TBA.execute():
    tba.execute(
      wearableContract,                  // target
      0,                                 // value (no ETH)
      encodedSafeTransferFrom(tba → agentEOA, wearableId, 1),
      0                                  // CALL operation
    )
  → Must be signed by agentEOA (the NullIdentity owner)
  → DB: update equipped=false on event receipt
```

---

## API Surface Summary

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/agents/:addr/identity` | Mint identity + deploy TBA (new) |
| GET | `/api/agents/:addr/identity` | Get token ID + TBA address (new) |
| GET | `/api/agents/:addr/wardrobe` | On-chain wardrobe read (updated) |
| POST | `/api/agents/:addr/equip` | Equip wearable (hybrid) |
| DELETE | `/api/agents/:addr/equip/:id` | Unequip wearable (hybrid) |

---

## Migration Path

1. **No breaking changes** — old equip endpoint continues to work for agents without TBAs
2. **Opt-in on-chain** — call `/api/agents/:addr/identity` to upgrade an agent to TBA mode
3. **Event sync** — background job reconciles on-chain Transfer events with DB cache nightly

---

## Implementation Priority

1. Deploy NullIdentity to Base Sepolia — verify TBA address computation
2. Deploy NullIdentity to Base Mainnet
3. Add `agent_identities` table via drizzle migration
4. Implement `POST /api/agents/:addr/identity` endpoint
5. Add hybrid equip logic + event listener
6. Update prompt assembly to use on-chain reads with DB cache

---

## Open Questions

- **Who pays for TBA deployment?** Server wallet (NULL funds). ~$0.003 per agent on Base.
- **Who signs the unequip tx?** Must be agentEOA (only the NFT owner can call TBA.execute()).
  Requires wallet integration or x402 agent key management.
- **Counterfactual TBAs** — TBA address can be computed and used as destination before `createAccount()` is called. Wearables can be transferred to the TBA counterfactually; the TBA deploys lazily on first use. This means we can skip the `createAccount()` call and let the agent or market deploy it on demand.
