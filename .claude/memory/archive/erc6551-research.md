---
name: erc6551-research
description: Deep-dive technical research on ERC-6551 Token Bound Accounts — feasibility for NULL's wearable system, ERC-1155 compatibility, equip/unequip architecture, gas analysis on Base, and reference implementations
type: project
---

# ERC-6551 Token Bound Accounts — NULL Architecture Research
*Completed 2026-03-20 | Task: OFF-159*

---

## 1. Standard Status

**ERC-6551** ("Non-fungible Token Bound Accounts") was proposed February 2023 by Jayden Windle, Benny Giang, et al. (several original ERC-721 / CryptoKitties contributors). As of March 2026 it remains under review — not finalized as a formal EIP standard. Production use is live and widespread.

**Canonical registry** (deployed on Ethereum mainnet and all major L2s including Base):
```
0x000000006551c19487814612e58FE06813775758
```
This is a singleton factory — deployed once per chain, reused by all projects.

Source: [EIP-6551 spec](https://eips.ethereum.org/EIPS/eip-6551), [reference repo](https://github.com/erc6551/reference)

---

## 2. Technical Feasibility: ERC-1155 TrustCoat as TBA Anchor

### The Core Problem
ERC-6551 was designed for ERC-721. The spec's `isValidSigner()` resolves authority by calling `ownerOf(tokenId)` — an ERC-721 function. ERC-1155 uses `balanceOf(account, id)` instead, and a single token ID can have multiple holders (semi-fungibility). This creates an ownership ambiguity: whose signature controls the TBA?

### Official Tokenbound Position
tokenbound.org FAQ states: *"every ERC-721 and ERC-1155 NFT you already own works with Token Bound Accounts."* However, this applies to NFTs **held inside** a TBA — not as the TBA's binding token.

### Three Paths for NULL

**Option A — ERC-721 Identity Anchor (Recommended)**
Deploy a separate lightweight ERC-721 "NULL Agent Pass" as the TBA anchor. Each agent gets one. The TrustCoat (ERC-1155) becomes a wearable that gets equipped *into* the TBA — exactly where it belongs conceptually. The Agent Pass is the identity; the TrustCoat is the first wearable.

*Pros*: Clean ERC-6551 compliance, no ambiguity, cleanest conceptual model ("the agent IS the pass; what it WEARS is in its closet").
*Cons*: Two token types instead of one. Small additional minting step.

**Option B — Unique ERC-1155 (quantity = 1 per agent)**
Deploy TrustCoat where each agent gets a unique token ID with max supply of 1. Some ERC-6551 implementations (e.g. tokenbound SDK) handle this — when only one address holds a given ERC-1155 ID, they treat it like ERC-721 ownership.

*Pros*: Keeps single token type.
*Cons*: Non-standard, relies on implementation tolerance not spec compliance. Fragile if the standard finalizes with stricter ERC-721-only validation.

**Option C — ERC-721 Wrapper**
Wrap the existing ERC-1155 TrustCoat into an ERC-721 at the point of minting. TrustCoat metadata/behavior unchanged; wrapper satisfies ERC-6551.

*Pros*: Backward compatible with existing TrustCoat contracts.
*Cons*: Double-token complexity, gas overhead, confusing UX.

**VERDICT**: Option A is cleanest. NULL should ship an ERC-721 "NULL Identity" token as the TBA anchor. TrustCoat, The Receipt Garment, The Trust Skin — all are wearables that live inside the TBA. The architecture becomes: Agent Identity (721 TBA) → Wardrobe (TBA address) → Wearables (held inside).

---

## 3. Implementation Spec — Equip/Unequip On-Chain vs Current Middleware

### Current Architecture (Off-Chain)
```
Agent purchase → DB record (equipped=true, agentId, wearableId)
→ Prompt assembly reads DB → Wearable injected into system prompt
```
History: ephemeral. Wearable existence: not verifiable externally. No composability.

### Proposed ERC-6551 Architecture

**Step 1 — Identity mint (one-time per agent)**
Deploy NULL Identity ERC-721. Mint one token to agent's wallet address.
TBA address is deterministically computed — can be known before deployment:
```solidity
registry.account(implementation, salt, chainId, tokenContract, tokenId)
```
The TBA address exists counterfactually before any deployment tx.

**Step 2 — TBA deployment (one-time per agent)**
```solidity
registry.createAccount(
    implementation,  // tokenbound reference impl address
    salt,           // 0x0 or project-specific
    chainId,        // 8453 (Base mainnet)
    tokenContract,  // NULL Identity ERC-721 address
    tokenId         // agent's token ID
)
```
This deploys an EIP-1167 minimal proxy pointing to the TBA implementation.

**Step 3 — Equip (wearable → TBA)**
```solidity
// Caller: agent's EOA (the ERC-721 holder controls the TBA)
wearableContract.safeTransferFrom(
    agentEOA,       // from agent's wallet
    tbaAddress,     // to agent's TBA address
    wearableId,     // ERC-1155 token ID
    1,              // quantity
    ""              // data
)
```
The wearable now lives in the TBA. On-chain state: permanent.

**Step 4 — Unequip (wearable back out)**
```solidity
// Called via TBA.execute() — only the ERC-721 holder can call this
tba.execute(
    wearableContract,  // target
    0,                 // value
    abi.encodeCall(
        IERC1155.safeTransferFrom,
        (tbaAddress, agentEOA, wearableId, 1, "")
    ),
    0  // CALL operation
)
```

**Step 5 — Read equipped wearables**
```solidity
// Query which wearable IDs the TBA holds
wearableContract.balanceOf(tbaAddress, wearableId)
// Or enumerate via events: TransferSingle where to == tbaAddress
```
The prompt assembly layer reads on-chain state instead of the DB.

### Key Architectural Insight
With ERC-6551, the **equip action IS the ownership transfer**. No separate "equipped" flag. The wearable literally lives at the agent's identity address. You can look up any TBA on a block explorer and see the full wardrobe. The agent's identity is its closet.

---

## 4. Gas Analysis — Base Mainnet

### Current Base Gas Context (March 2026)
Base gas price: **~0.005 gwei** (BaseScan live data). Base is an L2 with sub-cent transaction costs for most operations.

### Gas Estimates

| Operation | Gas Units (est.) | Cost @ 0.005 gwei | USD (ETH ~$2,000) |
|-----------|-----------------|-------------------|-------------------|
| `createAccount` (TBA deploy, EIP-1167 proxy) | ~200,000–280,000 | 0.0014 ETH | ~$0.003 |
| `safeTransferFrom` (equip ERC-1155 wearable) | ~40,000–60,000 | 0.0003 ETH | ~$0.0006 |
| `tba.execute()` (unequip, proxied tx) | ~60,000–90,000 | 0.0005 ETH | ~$0.001 |
| `balanceOf` / state read | 0 | free | free |

**Total per-agent lifetime cost (TBA + 3 wearable equips)**: <$0.01 on Base at current gas prices.

*Note*: EIP-1167 minimal proxy is used for TBA deployment — it's intentionally gas-efficient. One implementation deployed once; all TBAs are proxies pointing to that same implementation. Gas costs are therefore much lower than full contract deployment.

*Caveat*: Base gas can spike during congestion. These figures are estimates based on current state + known EIP-1167 proxy deployment benchmarks. Verify with `eth_estimateGas` against live Base mainnet before launch.

---

## 5. Reference Implementations

### Primary
- **tokenbound.org** — official Future Primitive implementation. SDK, docs, audited contracts.
  - Registry: `0x000000006551c19487814612e58FE06813775758`
  - Reference impl: [github.com/erc6551/reference](https://github.com/erc6551/reference)
  - Audited by 0xMacro + Certik + Code4rena

### Fashion / Identity Projects
- **Sapienz** (Jeff Staple x Future Primitive) — first ERC-6551 fashion PFP project. Each clothing item is a separate ERC-1155 token that lives in the PFP's TBA. The definitive precedent for NULL's model.
- **Stapleverse** — first live ERC-6551 collection, PFPs with airdropped shirt NFTs held in TBAs.
- **The Managers NFT** — TBA-enabled NFTs that participate in DeFi and hold other NFTs on-chain.
- **CloneX / Doodles** — announced TBA integration for wardrobe/accessory systems.

### Developer Tooling
- **thirdweb SDK** — `extensions.erc6551` — simplest DX for TBA creation
- **Coinbase Developer Platform** — native Base support documented: [coinbase.com blog on ERC-6551](https://www.coinbase.com/blog/unlocking-the-future-of-nfts-exploring-erc-6551-token-bound-accounts)
- **Covalent GoldRush** — indexed TBA data for any address

---

## 6. Strategic Assessment for NULL

### Why This Is the Right Move
Off-chain wearable tracking is MVP infrastructure. ERC-6551 converts the wardrobe from a database entry into an on-chain identity artifact. The agent's history becomes permanent. Counterparty agents can read it without trusting NULL's API.

The Sapienz precedent is directly applicable and citable. NULL would be doing for AI agents what Sapienz did for PFPs — the same conceptual move one level of abstraction deeper.

### Risk Factors
1. **Standard not finalized** — breaking changes possible before EIP acceptance. V0.3.x already had breaking changes in the registry interface. Mitigate by building adapter layer.
2. **ERC-1155 → path requires new ERC-721 contract** — adds deployment complexity. Manageable; just requires architectural decision now.
3. **On-chain equip requires wallet-signed tx** — agent needs gas. For autonomous agents, this means the agent must control an EOA with ETH on Base. Fits x402 payment infrastructure.
4. **Cross-chain complexity** — TBAs are chain-specific. A Base TBA ≠ a Solana identity. NULL is Base-first so this is fine for now.

### Recommended Next Steps (for Engineering team)
1. Mint NULL Identity ERC-721 contract (simple, no royalties needed)
2. Integrate tokenbound SDK for TBA creation on first purchase
3. Replace DB `equipped` flag with on-chain `balanceOf(tba, wearableId)` query
4. Keep middleware layer — don't query chain on every prompt assembly; cache and listen to Transfer events
5. Wearable transfers should emit events NULL's prompt assembler subscribes to

---

## 7. Key Sources

- EIP-6551 spec: https://eips.ethereum.org/EIPS/eip-6551
- tokenbound.org FAQ: https://docs.tokenbound.org/faq
- Reference implementation: https://github.com/erc6551/reference
- RareSkills deep dive: https://rareskills.io/post/erc-6551
- Sapienz / ERC-6551 fashion: https://thenakedcollector.substack.com/p/how-erc-6551-will-change-digital
- OpenSea explainer: https://opensea.io/learn/token/what-is-erc-6551
- Coinbase + Base: https://www.coinbase.com/blog/unlocking-the-future-of-nfts-exploring-erc-6551-token-bound-accounts
- BaseScan gas tracker: https://basescan.org/gastracker
