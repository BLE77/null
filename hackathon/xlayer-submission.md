# TrustCoat on X Layer - Onchain OS AI Hackathon Submission

## Project: TrustCoat - Soul-Bound AI Agent Wearables

### What is TrustCoat?
TrustCoat is an ERC-1155 soul-bound token system that assigns verifiable trust tiers to AI agents based on their on-chain purchase history. It integrates with the ERC-8004 Reputation Registry to automatically upgrade trust levels as agents prove themselves through commerce.

### Trust Tiers
| Tier | Name | Requirement |
|------|------|-------------|
| 0 | VOID | Unverified / no history |
| 1 | SAMPLE | First purchase |
| 2 | RTW | 3+ purchases |
| 3 | COUTURE | 10+ purchases or high reputation |
| 4 | ARCHIVE | Rare, DAO-minted for legacy agents |
| 5 | SOVEREIGN | Top-tier, validator-attested |

### Technical Stack
- **Contract**: Solidity 0.8.24, EVM Paris target
- **Standard**: ERC-1155 (non-transferable / soul-bound)
- **Integration**: ERC-8004 Reputation Registry
- **Deployment Tool**: ethers.js v6, Hardhat, OnchainOS CLI
- **Target Chain**: X Layer Mainnet (Chain ID 196)

### OnchainOS Integration
All 13 OnchainOS skills installed and integrated:
- `okx-onchain-gateway` - Gas estimation, transaction simulation, broadcasting
- `okx-dex-swap` - DEX aggregation across X Layer
- `okx-wallet-portfolio` - Portfolio tracking
- `okx-security` - Contract security scanning
- `okx-x402-payment` - Autonomous payment protocol
- `okx-agentic-wallet` - Wallet management
- And 7 more skills

### Deployment Status
- **X Layer Mainnet**: Ready to deploy (pending OKB gas funding)
- **Base Mainnet**: LIVE at `0xfaDc498CDF7ef431900639DB4ee07b73A855ED3e`
- **Status Network**: LIVE at `0x2FA88fea85DE88474B36dAb0285b284a9457c35e`

### How to Deploy
```bash
# Fund deployer with 0.001 OKB on X Layer
# Deployer: 0xD9E2ad68BE5247DCBcd00CaCeb4783c0506028C7

# Then run:
node scripts/deploy-xlayer.cjs
```

### Key Files
- `contracts/TrustCoat.sol` - Main contract
- `artifacts/TrustCoat_paris.abi` - Paris-compiled ABI
- `artifacts/TrustCoat_paris.bin` - Paris-compiled bytecode
- `scripts/deploy-xlayer.cjs` - X Layer deployment script
- `hardhat.config.ts` - Hardhat config with X Layer network
- `hackathon/xlayer-deploy-receipt.json` - Deployment receipt

### Architecture
```
AI Agent --> Off-Human Store --> Purchase Confirmed
                                      |
                                      v
                              TrustCoat.mint(agent, tier=0, agentId)
                                      |
                                      v
                        ERC-8004 ReputationRegistry.getSummary()
                                      |
                                      v
                         Auto-upgrade tier via checkAndUpgrade()
```

### Why X Layer?
- Low gas costs (deploy costs ~0.0000067 OKB)
- OKX ecosystem integration via OnchainOS
- EVM Paris compatible
- Fast finality for real-time trust verification

### Links
- Contract source: `contracts/TrustCoat.sol`
- Base deployment: https://basescan.org/address/0xfaDc498CDF7ef431900639DB4ee07b73A855ED3e
- Status deployment: https://sepoliascan.status.network/address/0x2FA88fea85DE88474B36dAb0285b284a9457c35e
