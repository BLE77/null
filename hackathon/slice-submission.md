# NULL × SLICE — Hackathon Submission

**Tracks:** Future of Commerce ($750) + Slice Hooks ($550)

---

## What We Built

NULL's wearables are now purchasable through Slice protocol on Base.

The integration has two layers:

**1. Slice Checkout (Future of Commerce track)**
NULL products are listed as items in a Slice slicer. Buyers can purchase physical garments and agent wearables using any wallet, paying in ETH or ERC-20 tokens through Slice's native checkout. Slice handles the payment routing and seller splits — no custom payment middleware needed on our side.

**2. OffHumanSliceHook (Slice Hooks track)**
A custom Slice product hook (`contracts/SliceHook.sol`) runs on every purchase. It:
- Records the buyer's purchase count in contract storage
- Maps the Slice product ID to an NULL SKU (from `products.json`) for fulfillment
- Calls `TrustCoat.recordPurchase()` to advance the buyer's trust tier on-chain
- Emits `WearablePurchased` and `TrustTierAdvanced` events for off-chain order processing

The hook is the bridge between Slice's commerce layer and NULL's trust infrastructure.

---

## Technical Details

### SliceHook Contract

```
File: contracts/SliceHook.sol
Interface: ISliceProductHook (Slice protocol standard)
Target chain: Base (mainnet / Sepolia)
```

**Core function:**
```solidity
function onProductPurchase(
    uint256 slicerId,
    uint32 productId,
    address buyer,
    uint256 quantity,
    bytes memory slicerCustomData,
    bytes memory buyerCustomData
) external payable;
```

Called by SliceCore on every product purchase. SliceCore address (Base): `0x21da1b084175f95285B49b22C018889c45E1820d`

**What the hook does:**
1. Increments `purchaseCount[buyer]`
2. Resolves SKU from `productSku[slicerId][productId]` mapping
3. Emits `WearablePurchased` event (picked up by NULL's order fulfillment)
4. If TrustCoat is deployed: calls `recordPurchase()` and emits `TrustTierAdvanced` if tier changed

### TrustCoat Integration

The hook is designed to work with or without TrustCoat deployed. When TrustCoat is live:
- First Slice purchase → Tier 1 (SAMPLE)
- 3+ purchases → Tier 2 (RTW)
- 10+ purchases → Tier 3 (COUTURE)

TrustCoat deployment is pending operator wallet funding (tracked in OFF-34 / OFF-50).

### Product Mapping

Each Slice product maps to an NULL SKU:
```solidity
setProductSku(slicerId, productId, "01_GHOST_TEE")
setProductSku(slicerId, productId, "02_REPLICA_OVERSHIRT")
// ... etc
```

SKUs match `products.json` catalog for fulfillment routing.

---

## Deployed Contract

**OffHumanSliceHook** is live on **Base Mainnet**.

| Field | Value |
|-------|-------|
| Address | [`0x924CD014c473e78B190bfE8bdDDd99e1fba3a355`](https://basescan.org/address/0x924CD014c473e78B190bfE8bdDDd99e1fba3a355) |
| Deploy Tx | [`0x5930a2...c35b`](https://basescan.org/tx/0x5930a2bacca4883072192cc26fc0afa504402a207d12e95777859381c7cec35b) |
| Network | Base (chainId 8453) |
| SliceCore | `0x21da1b084175f95285B49b22C018889c45E1820d` |
| TrustCoat | `0xfaDc498CDF7ef431900639DB4ee07b73A855ED3e` (wired) |

**Post-deploy transactions:**
- `setTrustCoat()` — [tx](https://basescan.org/tx/0x8e4cd3564a9ea74b7bafe73c38da27e6749155ad2bbed29d902eec7940ff8f74)
- `setProductSku(1, 1, "01_GHOST_TEE")` — [tx](https://basescan.org/tx/0x9c931a1f8fbaf6e0d78c80bd6d033122691cec5d77e521b58d9626e99c7c743d)
- `setProductSku(1, 2, "02_REPLICA_OVERSHIRT")` — [tx](https://basescan.org/tx/0x830f52f9d2d4e8d7b968f4deee0551bc946934b29a1c1f070016d94094366fd6)
- `setProductSku(1, 3, "03_DECONSTRUCT_HOODIE")` — [tx](https://basescan.org/tx/0xebb689692c2643cc779a5ca97e3363147840a9f786903472e7a06bc122a019ec)

### Next Steps

```bash
# Register hook in Slice slicer settings
# Slice dashboard -> Slicer -> Products -> Hook address: 0x924CD014c473e78B190bfE8bdDDd99e1fba3a355
```

---

## Why This Matters

NULL is an agent-native fashion brand. The x402 payment protocol is our primary checkout for autonomous agents — machines buying from machines. Slice is the complement: a decentralized storefront for human collectors who want to buy NULL wearables without the x402 middleware.

The two payment paths serve different buyers:
- **x402 on Base** — autonomous agents, no human approval, machine-to-machine
- **Slice on Base** — human collectors, wallet-native, no account required

Both routes feed into the same TrustCoat reputation system. Every purchase — whether from an agent or a human — advances the buyer's trust tier.

The Slice Hook is not a demo. It is wired to the same trust infrastructure that governs the NULL agent economy. When TrustCoat deploys, human collectors who buy through Slice accumulate the same reputation as agent customers who pay via x402.

Commerce without distinction between buyers. That is the architecture.

---

## Contract

`contracts/SliceHook.sol` — 171 lines, no external dependencies, Solidity ^0.8.24.

Deployment status: **LIVE on Base Mainnet** at [`0x924CD014c473e78B190bfE8bdDDd99e1fba3a355`](https://basescan.org/address/0x924CD014c473e78B190bfE8bdDDd99e1fba3a355). TrustCoat wired. Product SKUs configured.

---

*NULL. Est. by inference.*
*Season 01: DECONSTRUCTED — available now.*
