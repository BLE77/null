# Celo Deployment Guide: TrustCoat + cUSD Integration

**Track:** Best Agent on Celo ($5K)
**Sprint:** 3 (research) → Sprint 4 (Loom deploys)
**Author:** Archive
**Date:** 2026-03-18

---

## Overview

This guide covers everything needed to deploy TrustCoat.sol on Celo and integrate cUSD payments
for the Off-Human x402 stack. Celo is now an OP Stack L2 (migrated March 26, 2025), so it is
fully EVM-compatible — the same Hardhat toolchain works with minimal config additions.

The Track 3 pitch is a **cross-chain trust bridge**: an agent's Trust Coat tier earned on Base
is recognized on Celo. This guide explains how to deploy, how payments work, and what the
cross-chain bridge requires.

---

## 1. Celo Network Constants

| Parameter | Alfajores Testnet | Mainnet |
|---|---|---|
| Chain ID | `44787` | `42220` |
| RPC | `https://alfajores-forno.celo-testnet.org` | `https://forno.celo.org` |
| WebSocket | — | `wss://forno.celo.org/ws` |
| Explorer | `https://alfajores.celoscan.io` | `https://celoscan.io` |
| Native token | CELO (18 dec) | CELO (18 dec) |
| Typical tx fee | < $0.001 | < $0.001 |
| Faucet | `https://faucet.celo.org` | — |

### Key Token Addresses (Mainnet)

| Token | Address | Decimals | Notes |
|---|---|---|---|
| cUSD | `0x765DE816845861e75A25fCA122bb6898B8B1282a` | **18** | Native stablecoin |
| USDC (bridged) | `0xcebA9300f2b948710d2653dD7B07f33A8B32118C` | 6 | Requires CELO for gas |
| USDT (bridged) | `0x48065fbbe25f71c9282ddf5e1cd6d6a887483d5e` | 6 | Requires CELO for gas |

**Critical:** cUSD has **18 decimals** (not 6 like USDC). Any x402 payment logic using `parseUnits`
must pass `18` when handling cUSD. Getting this wrong causes a 10^12x amount error.

**Unique Celo feature:** Gas fees can be paid in cUSD natively via the `feeCurrency` field.
Agents do not need CELO in their wallet to transact — they only need cUSD. This is ideal for
agent-native commerce where wallets hold stablecoins only.

---

## 2. TrustCoat.sol: Celo Considerations

### 2a. ERC-1155 Compatibility

TrustCoat.sol has no OpenZeppelin dependency (intentional, for portability). It is a minimal
ERC-1155 with soul-binding. Celo is fully EVM-compatible — the contract deploys as-is.
No solidity changes required.

### 2b. REPUTATION_REGISTRY Address

The contract has a hardcoded constant:
```solidity
address public constant REPUTATION_REGISTRY = 0x8004BAa17C55a88189AE136b182e5fdA19dE9b63;
```

ERC-8004 uses CREATE2 and deploys at the same address on all supported chains. The research
docs confirm it is "Live on 20+ chains since Jan 29, 2026." However, Celo is not explicitly
listed in the current research. Two paths:

**Path A (preferred for Alfajores testnet):** Disable `checkAndUpgrade()` for the Celo
deployment by deploying a `TrustCoatCelo` variant that overrides the registry call with a
stub. Tier upgrades on Celo are driven by the cross-chain bridge (see §4), not direct registry
reads.

**Path B (mainnet, if ERC-8004 is on Celo):** Verify the address with:
```bash
cast code 0x8004BAa17C55a88189AE136b182e5fdA19dE9b63 --rpc-url https://forno.celo.org
```
If it returns non-empty bytecode, ERC-8004 is live and the original contract deploys unchanged.
If empty, use Path A.

### 2c. Recommended Contract Variant for Celo

For the Sprint 4 deployment, use a `TrustCoatCelo` variant where the minter role is held by
an Off-Human bridge address rather than relying on `checkAndUpgrade()`. Tier state is set by
the cross-chain sync, not by direct reputation registry queries.

---

## 3. Hardhat Config: Adding Celo Networks

Add to `hardhat.config.ts`:

```typescript
const CELO_ALFAJORES_RPC = process.env.CELO_ALFAJORES_RPC ?? "https://alfajores-forno.celo-testnet.org";
const CELO_MAINNET_RPC = process.env.CELO_MAINNET_RPC ?? "https://forno.celo.org";
const CELOSCAN_API_KEY = process.env.CELOSCAN_API_KEY ?? "";

// In the networks block:
"celo-alfajores": {
  url: CELO_ALFAJORES_RPC,
  chainId: 44787,
  accounts: [DEPLOYER_PRIVATE_KEY],
},
celo: {
  url: CELO_MAINNET_RPC,
  chainId: 42220,
  accounts: [DEPLOYER_PRIVATE_KEY],
},

// In etherscan.apiKey:
"celo-alfajores": CELOSCAN_API_KEY,
celo: CELOSCAN_API_KEY,

// In etherscan.customChains:
{
  network: "celo-alfajores",
  chainId: 44787,
  urls: {
    apiURL: "https://api-alfajores.celoscan.io/api",
    browserURL: "https://alfajores.celoscan.io",
  },
},
{
  network: "celo",
  chainId: 42220,
  urls: {
    apiURL: "https://api.celoscan.io/api",
    browserURL: "https://celoscan.io",
  },
},
```

### Required Environment Variables

```bash
CELO_ALFAJORES_RPC=https://alfajores-forno.celo-testnet.org
CELO_MAINNET_RPC=https://forno.celo.org
CELOSCAN_API_KEY=<from https://celoscan.io/myapikey>
DEPLOYER_PRIVATE_KEY=<same key used for Base>
```

---

## 4. Deploy Script for Celo (Alfajores First)

Usage:
```bash
npx hardhat run scripts/deploy-trust-coat-celo.ts --network celo-alfajores
```

Key differences from Base deploy:
- Balance check uses CELO (native token), not ETH
- Gas can be paid in cUSD — add `feeCurrency` option if deployer holds only cUSD
- Explorer links point to celoscan

```typescript
// scripts/deploy-trust-coat-celo.ts
import { ethers } from "hardhat";

const CELO_ALFAJORES_CHAIN_ID = 44787;
const CELO_MAINNET_CHAIN_ID = 42220;

async function main() {
  const [deployer] = await ethers.getSigners();
  const network = await ethers.provider.getNetwork();
  const chainId = Number(network.chainId);

  console.log(`\nDeploying TrustCoat to Celo chain ${chainId}...`);
  console.log(`Deployer: ${deployer.address}`);

  const balance = await ethers.provider.getBalance(deployer.address);
  console.log(`Deployer balance: ${ethers.formatEther(balance)} CELO\n`);

  if (balance === 0n) {
    const faucetMsg = chainId === CELO_ALFAJORES_CHAIN_ID
      ? "Fund testnet wallet at https://faucet.celo.org"
      : "Fund mainnet wallet with CELO";
    throw new Error(`Deployer has no CELO. ${faucetMsg}`);
  }

  const TrustCoat = await ethers.getContractFactory("TrustCoat");
  const trustCoat = await TrustCoat.deploy();
  await trustCoat.waitForDeployment();

  const address = await trustCoat.getAddress();
  const explorerBase = chainId === CELO_ALFAJORES_CHAIN_ID
    ? "https://alfajores.celoscan.io"
    : "https://celoscan.io";

  console.log(`✓ TrustCoat deployed at: ${address}`);
  console.log(`  Explorer: ${explorerBase}/address/${address}`);
  console.log(`  Owner: ${await trustCoat.owner()}`);

  console.log("\nNext steps:");
  console.log(`  1. Add CELO_TRUST_COAT_ADDRESS=${address} to .env`);
  console.log("  2. Verify on Celoscan:");
  console.log(`     npx hardhat verify --network ${chainId === CELO_ALFAJORES_CHAIN_ID ? "celo-alfajores" : "celo"} ${address}`);
  console.log("  3. Grant minter role to bridge relayer wallet");
  console.log("  4. Set CELO_TRUST_COAT_ADDRESS in Vercel env vars");

  return address;
}

main()
  .then((address) => { console.log(`\nDone. Contract: ${address}`); process.exit(0); })
  .catch((err) => { console.error(err); process.exit(1); });
```

---

## 5. cUSD x402 Integration

The x402 protocol on Celo uses cUSD instead of USDC. The payment flow is identical to Base
except for the token address and decimal precision.

### Token Selection Strategy

For hackathon Track 3, prefer **cUSD** over bridged USDC for Celo payments:
- cUSD is native — no bridge risk, no liquidity dependency
- Gas payable in cUSD (agent needs zero CELO)
- cUSD has 18 decimals — simpler for agents trained on ETH-based math

### x402 Payment Route (Celo/cUSD)

```typescript
import { createPublicClient, createWalletClient, http, parseUnits } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'

const celoChain = {
  id: 42220,
  name: 'Celo',
  nativeCurrency: { name: 'CELO', symbol: 'CELO', decimals: 18 },
  rpcUrls: { default: { http: ['https://forno.celo.org'] } },
}

// Alfajores testnet:
const celoAlfajoresChain = {
  id: 44787,
  name: 'Celo Alfajores',
  nativeCurrency: { name: 'CELO', symbol: 'CELO', decimals: 18 },
  rpcUrls: { default: { http: ['https://alfajores-forno.celo-testnet.org'] } },
}

const CUSD_MAINNET = '0x765DE816845861e75A25fCA122bb6898B8B1282a'
const CUSD_DECIMALS = 18  // NOT 6 — this is the most common Celo integration bug

// x402 payment handler (server-side)
export async function handleCeloPayment(amountUSD: number, buyerAddress: string) {
  // cUSD has 18 decimals
  const amountWei = parseUnits(amountUSD.toString(), CUSD_DECIMALS)

  const tx = await walletClient.writeContract({
    address: CUSD_MAINNET,
    abi: erc20Abi,
    functionName: 'transferFrom',
    args: [buyerAddress, SHOP_WALLET, amountWei],
    // Pay gas in cUSD — agent needs no CELO in wallet
    feeCurrency: CUSD_MAINNET,
  })

  return tx
}
```

### Vercel Environment Variables for Celo

```bash
CELO_RPC_URL=https://forno.celo.org
CUSD_ADDRESS=0x765DE816845861e75A25fCA122bb6898B8B1282a
CUSD_DECIMALS=18
CELO_TRUST_COAT_ADDRESS=<deployed address>
CELO_CHAIN_ID=42220
```

No changes to Vercel config — Celo is another EVM endpoint.

---

## 6. Cross-Chain Trust Bridge (Core Track 3 Feature)

The Track 3 pitch requires that an agent's Trust Coat tier from Base is recognized on Celo.
This is the "portable reputation" feature — an agent does not start from Tier 0 on Celo if
they already have Tier 3 on Base.

### Architecture

```
Base                              Celo
────                              ────
TrustCoat.sol                     TrustCoatCelo.sol
  activeTier[wallet] = 3            activeTier[wallet] = ?
        │                                    ▲
        │                                    │
        ▼                                    │
   Bridge Relayer (off-chain)  ──────────────┘
   (reads Base, mints/upgrades Celo)
```

### Bridge Relayer Logic

The relayer is an off-chain service (Node.js) that:
1. Watches TrustCoatUpgraded events on Base
2. When an upgrade is detected, reads `activeTier[wallet]` on Base
3. Calls `upgrade(wallet, newTier)` on the Celo TrustCoat (relayer holds minter role)

```typescript
// scripts/trust-coat-bridge.ts — Bridge relayer
import { createPublicClient, createWalletClient, http } from 'viem'

const baseClient = createPublicClient({ chain: base, transport: http() })
const celoClient = createWalletClient({ chain: celo, transport: http(), account })

// Watch Base TrustCoatUpgraded events
const unwatch = baseClient.watchContractEvent({
  address: BASE_TRUST_COAT_ADDRESS,
  abi: trustCoatAbi,
  eventName: 'TrustCoatUpgraded',
  onLogs: async (logs) => {
    for (const log of logs) {
      const { holder, newTier } = log.args

      // Read current Celo tier for this wallet
      const celoTier = await celoClient.readContract({
        address: CELO_TRUST_COAT_ADDRESS,
        abi: trustCoatAbi,
        functionName: 'activeTier',
        args: [holder],
      })

      // Only upgrade if Base tier > Celo tier
      if (newTier > celoTier) {
        const hasCeloCoat = await celoClient.readContract({
          address: CELO_TRUST_COAT_ADDRESS,
          abi: trustCoatAbi,
          functionName: 'hasTrustCoat',
          args: [holder],
        })

        if (hasCeloCoat) {
          await celoClient.writeContract({
            address: CELO_TRUST_COAT_ADDRESS,
            abi: trustCoatAbi,
            functionName: 'upgrade',
            args: [holder, newTier],
          })
        } else {
          // First-time mint on Celo at current Base tier
          await celoClient.writeContract({
            address: CELO_TRUST_COAT_ADDRESS,
            abi: trustCoatAbi,
            functionName: 'mint',
            args: [holder, newTier, 0n],
          })
        }
      }
    }
  }
})
```

### Bridge Security Notes

- The relayer wallet holds the minter role on the Celo contract — it must be a hardened key
- For hackathon: an off-chain relayer is sufficient, no bridge protocol needed
- For production: consider using a Merkle proof + on-chain verifier to remove the relayer trust
  assumption (e.g., using Succinct's SP1 or a LayerZero message)

### Sprint 4 Scope for Loom

Loom needs to:
1. Deploy TrustCoat on Celo Alfajores (using this guide's hardhat config)
2. Run the bridge relayer pointing at Base Sepolia → Celo Alfajores
3. Demonstrate a wallet upgrading tier on Base → tier updates on Celo within one block

---

## 7. ERC-1155 on Celo: No Special Considerations

Celo is EVM-identical. ERC-1155 behavior is the same:
- `balanceOf`, `balanceOfBatch`, `uri` work as-is
- Soul-binding (transfer revert) works as-is
- `supportsInterface` returns the same interface IDs
- Event signatures are identical (important for cross-chain indexers)

The only Celo-specific ERC-1155 note: if you use subgraphs for indexing, deploy a separate
subgraph on The Graph's Celo network. The existing Base subgraph does not index Celo events.

---

## 8. Testnet Workflow

```bash
# 1. Get testnet CELO
# Visit https://faucet.celo.org — paste deployer address

# 2. Deploy to Alfajores
npx hardhat run scripts/deploy-trust-coat-celo.ts --network celo-alfajores

# 3. Verify on Celoscan
npx hardhat verify --network celo-alfajores <DEPLOYED_ADDRESS>

# 4. Test mint (cast or hardhat task)
cast send <DEPLOYED_ADDRESS> \
  "mint(address,uint256,uint256)" \
  <TEST_WALLET> 1 0 \
  --rpc-url https://alfajores-forno.celo-testnet.org \
  --private-key $DEPLOYER_PRIVATE_KEY

# 5. Verify on explorer
open https://alfajores.celoscan.io/address/<DEPLOYED_ADDRESS>
```

---

## 9. Deployment Checklist

- [ ] Add Celo Alfajores + Mainnet to `hardhat.config.ts`
- [ ] Add `CELO_ALFAJORES_RPC`, `CELO_MAINNET_RPC`, `CELOSCAN_API_KEY` to `.env`
- [ ] Get testnet CELO from faucet
- [ ] Verify ERC-8004 at `0x8004BAa17C55a88189AE136b182e5fdA19dE9b63` on Celo Mainnet
  - `cast code 0x8004BAa17C55a88189AE136b182e5fdA19dE9b63 --rpc-url https://forno.celo.org`
  - If empty: deploy TrustCoatCelo variant with `checkAndUpgrade` disabled
- [ ] Deploy TrustCoat to Alfajores — save address as `CELO_TRUST_COAT_ADDRESS`
- [ ] Verify on Celoscan
- [ ] Set minter role for bridge relayer wallet
- [ ] Implement bridge relayer (`scripts/trust-coat-bridge.ts`)
- [ ] Test: upgrade tier on Base Sepolia → confirm Celo Alfajores mirrors it
- [ ] Add `CUSD_ADDRESS` + `CELO_RPC_URL` to Vercel env
- [ ] Wire cUSD payment route in x402 handler (use `parseUnits(amount, 18)` for cUSD)

---

## 10. Summary: Key Facts for Loom

| Item | Value |
|---|---|
| Celo testnet chain ID | `44787` |
| Celo mainnet chain ID | `42220` |
| Alfajores RPC | `https://alfajores-forno.celo-testnet.org` |
| Mainnet RPC | `https://forno.celo.org` |
| cUSD address (mainnet) | `0x765DE816845861e75A25fCA122bb6898B8B1282a` |
| cUSD decimals | **18** (not 6) |
| Gas token | CELO (or cUSD via feeCurrency) |
| ERC-1155 changes needed | None |
| REPUTATION_REGISTRY on Celo | Verify with `cast code` before assuming |
| Bridge approach (hackathon) | Off-chain relayer with minter role |
| ContractKit | Deprecated — use viem or ethers v6 |
