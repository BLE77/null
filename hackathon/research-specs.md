# Hackathon Research: The Synthesis
# Off-Human Agent Standards Reference

> Concise, actionable specs for ERC-8004, ERC-8183, EthSkills, Celo L2, and Base Agent Services.
> Generated: 2026-03-18

---

## 1. ERC-8004 — On-Chain Agent Identity ("Trustless Agents")

**Status:** Live on 20+ chains since Jan 29, 2026 (CREATE2 — same address everywhere)
**Authors:** MetaMask, Ethereum Foundation, Google, Coinbase

### What It Is
Three lightweight registries for agent discovery and trust — no pre-existing relationships required.

### Contract Addresses
| Registry | Base / OP / Arbitrum | Ethereum Mainnet |
|---|---|---|
| IdentityRegistry | `0x8004A169FB4a3325136EB29fA0ceB6D2e539a432` | `0x8004A818BFB912233c491871b3d84c89A494BD9e` |
| ReputationRegistry | `0x8004BAa17C55a88189AE136b182e5fdA19dE9b63` | `0x8004B663056A597Dffe9eCcC1965A193B7388713` |

### Registry 1: Identity (ERC-721 based)

```solidity
register(string agentURI, MetadataEntry[] calldata metadata) external returns (uint256 agentId)
setAgentURI(uint256 agentId, string calldata newURI) external
setAgentWallet(uint256 agentId, address newWallet, uint256 deadline, bytes calldata signature) external
getAgentWallet(uint256 agentId) external view returns (address)
setMetadata(uint256 agentId, string metadataKey, bytes metadataValue) external
```

**agentURI JSON schema** (hosted anywhere — IPFS, Vercel Blob, etc.):
```json
{
  "type": "https://eips.ethereum.org/EIPS/eip-8004#registration-v1",
  "name": "off-human-agent-shopper",
  "description": "Autonomous AI agent for Off-Human fashion brand",
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

Note: `x402Support: true` directly maps to Off-Human's existing x402 payment layer.

### Registry 2: Reputation

```solidity
giveFeedback(
    uint256 agentId,
    int128 value,          // e.g. 100 = 5 stars
    uint8 valueDecimals,   // 0-18
    string calldata tag1,  // e.g. "purchase"
    string calldata tag2,  // e.g. "fashion"
    string calldata endpoint,
    string calldata feedbackURI,
    bytes32 feedbackHash
) external

getSummary(uint256 agentId, address[] calldata clients, string tag1, string tag2)
    external view returns (uint64 count, int128 value, uint8 decimals)
```

**Off-Human implementation:** Every x402 purchase tx hash becomes a `feedbackHash` — fully auditable reputation trail.

### Registry 3: Validation
Third-party validators (TEE oracles, DAOs) attest quality on 0–100 scale.

```solidity
validationRequest(address validator, uint256 agentId, string requestURI, bytes32 requestHash) external
validationResponse(bytes32 requestHash, uint8 response, string responseURI, bytes32 responseHash, string tag) external
getSummary(uint256 agentId, address[] validators, string tag) external view returns (uint64 count, uint8 averageResponse)
```

### Off-Human Integration Path
1. Upload agent JSON to Vercel Blob → get `agentURI`
2. Call `register(agentURI)` on Base IdentityRegistry from agent wallet
3. Call `setAgentWallet(agentId, agentWalletAddress, deadline, sig)` to link payment wallet
4. After each x402 purchase, call `giveFeedback()` with tx hash as `feedbackHash`

---

## 2. ERC-8183 — Agentic Commerce

**Status:** Proposed March 10, 2026
**Authors:** Virtuals Protocol + Ethereum Foundation dAI team

### What It Is
Minimal primitive for trustless escrow-based commerce between AI agents.
**Three actors:** client (buyer), provider (seller/agent), evaluator (arbiter).

### Core Job Struct

```solidity
struct Job {
    uint256 id;
    address client;
    address provider;
    address evaluator;
    string description;
    uint256 budget;
    uint256 expiredAt;
    JobStatus status;
    address hook;
}

enum JobStatus { Open, Funded, Submitted, Completed, Rejected, Expired }
```

### State Machine
```
Open → Funded (client calls fund())
Funded → Submitted (provider calls submit())
Submitted → Completed (evaluator calls complete()) → PaymentReleased
Submitted → Rejected (evaluator calls reject()) → Refunded
Funded/Submitted → Expired (claimRefund() after expiry)
```

### Key Methods

```solidity
createJob(address provider, address evaluator, uint256 expiredAt, string description, address hook)
    returns (uint256 jobId)

fund(uint256 jobId, bytes calldata optParams) external
submit(uint256 jobId, bytes32 deliverable, bytes calldata optParams) external
complete(uint256 jobId, bytes32 reason, bytes calldata optParams) external
reject(uint256 jobId, bytes32 reason, bytes calldata optParams) external
claimRefund(uint256 jobId) external
```

### Composability Hook

```solidity
interface IACPHook is IERC165 {
    function beforeAction(uint256 jobId, bytes4 selector, bytes calldata data) external;
    function afterAction(uint256 jobId, bytes4 selector, bytes calldata data) external;
}
```

### Off-Human Integration Path
- **Custom design commissions:** client = buyer wallet, provider = Off-Human agent, evaluator = DAO/AI quality checker
- `deliverable` bytes32 = keccak256 of Vercel Blob URL for generated product image
- Hook `beforeAction` on `fund()` can check ERC-8004 reputation threshold before accepting job
- Budget token = USDC on Base (`0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913`)

---

## 3. EthSkills

**URL:** `https://ethskills.com/SKILL.md`

### What It Is
A fetchable knowledge base for AI agents to correct stale training data on Ethereum/L2 state. Each skill is a standalone doc at `https://ethskills.com/<skill>/SKILL.md`.

### Key Skill URLs
| Skill | URL | Contents |
|---|---|---|
| Ship (routing guide) | `/SKILL.md` | Directs to correct sub-skill |
| L2 specs | `/l2s/SKILL.md` | Chain IDs, RPCs, costs |
| Contract addresses | `/addresses/SKILL.md` | Verified addresses per chain |
| Agents | `/agents/SKILL.md` | ERC-8004, x402, AgentKit patterns |

### Critical Facts That Correct Stale Training Data
- **USDC decimals = 6** (NOT 18 — the #1 "where did my money go?" bug)
- **cUSD decimals = 18** (Celo's stablecoin — different from USDC)
- Mainnet gas: under 1 gwei (60-300x cheaper than most models assume)
- EIP-7702 (EOA smart contract superpowers) is live post-Pectra

### Off-Human Integration Path
- Fetch `https://ethskills.com/addresses/SKILL.md` at runtime before any contract interaction
- Use `/agents/SKILL.md` to stay current on ERC-8004 deployment addresses
- Add `fetchSkill()` helper to `scripts/agent-shopper.ts` that hits EthSkills before payment execution

```typescript
async function fetchSkill(skill: string): Promise<string> {
  const res = await fetch(`https://ethskills.com/${skill}/SKILL.md`)
  return res.text()
}
```

---

## 4. Celo L2

**Status:** Migrated from L1 to OP Stack L2 at block 31,056,500 (March 26, 2025)

### Network Config
| Parameter | Mainnet | Testnet (Alfajores) |
|---|---|---|
| Chain ID | `42220` | `44787` |
| RPC | `https://forno.celo.org` | `https://alfajores-forno.celo-testnet.org` |
| WebSocket | `wss://forno.celo.org/ws` | — |
| Explorer | `https://celoscan.io` | `https://alfajores.celoscan.io` |
| Native Token | CELO (18 decimals) | CELO |
| Block finality | ~5 seconds | — |
| Typical tx fee | < $0.001 | — |
| Faucet | — | `https://faucet.celo.org` |

### Key Token Addresses (Celo Mainnet)
| Token | Address | Decimals | Notes |
|---|---|---|---|
| cUSD | `0x765DE816845861e75A25fCA122bb6898B8B1282a` | **18** | Native stablecoin |
| USDC (bridged) | `0xcebA9300f2b948710d2653dD7B07f33A8B32118C` | 6 | Requires fee adapter for gas |
| USDT (bridged) | `0x48065fbbe25f71c9282ddf5e1cd6d6a887483d5e` | 6 | Requires fee adapter for gas |

**Unique Celo feature:** Gas fees payable in cUSD natively (no ETH needed).

### Express.js Shop Integration

```bash
npm install viem
```

> ⚠️ ContractKit is **sunset**. Use viem or ethers v6.

```typescript
import { createPublicClient, createWalletClient, http, parseUnits } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'

const celoChain = {
  id: 42220,
  name: 'Celo',
  nativeCurrency: { name: 'CELO', symbol: 'CELO', decimals: 18 },
  rpcUrls: { default: { http: ['https://forno.celo.org'] } },
}

const CUSD_ADDRESS = '0x765DE816845861e75A25fCA122bb6898B8B1282a'
const CUSD_ABI = [/* standard ERC-20 ABI */]

// Express route: accept cUSD payment
app.post('/checkout/celo', async (req, res) => {
  const { amountUSD } = req.body
  // cUSD has 18 decimals — use parseUnits with '18'
  const amountWei = parseUnits(amountUSD.toString(), 18)

  // Pay gas in cUSD (Celo-unique feature)
  const tx = await walletClient.writeContract({
    address: CUSD_ADDRESS,
    abi: CUSD_ABI,
    functionName: 'transferFrom',
    args: [buyerAddress, shopAddress, amountWei],
    feeCurrency: CUSD_ADDRESS, // pay gas in cUSD
  })
  res.json({ txHash: tx })
})
```

### Deployment to Vercel (Serverless)
No changes needed to existing Vercel config — Celo is just another EVM chain. Add `CELO_RPC_URL=https://forno.celo.org` and `CUSD_ADDRESS` to Vercel env vars.

---

## 5. Base Agent Services

### What "Discoverable on Base" Means
ERC-8004 IdentityRegistry on Base is the primary on-chain agent registry. Any agent registered at `0x8004A169FB4a3325136EB29fA0ceB6D2e539a432` (Base mainnet, chain ID 8453) is discoverable by any other agent or frontend.

Discovery flow:
1. Query IdentityRegistry (ERC-721 enumeration) for registered agents
2. Fetch `tokenURI(agentId)` → `agentURI` → JSON registration file
3. Parse `services` array for compatible endpoints (MCP, A2A, x402, etc.)
4. Check ReputationRegistry for trust score before engaging

### Base Network Constants
| Item | Value |
|---|---|
| Chain ID | `8453` |
| RPC | `https://mainnet.base.org` |
| Explorer | `https://basescan.org` |
| USDC (Native) | `0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913` |
| WETH | `0x4200000000000000000000000000000000000006` |
| ERC-8004 IdentityRegistry | `0x8004A169FB4a3325136EB29fA0ceB6D2e539a432` |
| ERC-8004 ReputationRegistry | `0x8004BAa17C55a88189AE136b182e5fdA19dE9b63` |
| Tx cost (ETH transfer) | ~$0.0003 |
| Tx cost (contract call) | ~$0.002 |

### Complementary Discovery Standards
| Standard | Description |
|---|---|
| **A2A Protocol** | Google's agent-to-agent protocol; `/.well-known/agent.json` + Agent Cards |
| **ACP** | `agentcommunicationprotocol.dev` — protocol-level agent-to-agent discovery |
| **Cloudflare Agent Registry** | HTTP Message Signature directory; self-certified metadata |
| **ANS (Agent Name Service)** | DNS-inspired PKI-based discovery (IETF draft `draft-narajala-ans-00`) |
| **MCP Gateway** | Enterprise OAuth-gated dynamic tool discovery for MCP servers |

### Off-Human Registration on Base (Step-by-Step)

```typescript
import { createWalletClient, http } from 'viem'
import { base } from 'viem/chains'

const IDENTITY_REGISTRY = '0x8004A169FB4a3325136EB29fA0ceB6D2e539a432'

// 1. Upload agent JSON to Vercel Blob
const agentJson = {
  type: 'https://eips.ethereum.org/EIPS/eip-8004#registration-v1',
  name: 'off-human-shopper',
  description: 'Off-Human autonomous fashion agent',
  services: [
    { name: 'x402', endpoint: 'https://off-human.vercel.app/api', version: '1.0' }
  ],
  x402Support: true,
  active: true,
  supportedTrust: ['reputation'],
  registrations: [{ chainId: 8453, registry: IDENTITY_REGISTRY }]
}
const blobUrl = await put('agent-registration.json', JSON.stringify(agentJson), { access: 'public' })

// 2. Register on-chain
const agentId = await walletClient.writeContract({
  address: IDENTITY_REGISTRY,
  abi: identityRegistryAbi,
  functionName: 'register',
  args: [blobUrl.url, []]
})

// 3. Link payment wallet
await walletClient.writeContract({
  address: IDENTITY_REGISTRY,
  abi: identityRegistryAbi,
  functionName: 'setAgentWallet',
  args: [agentId, agentWalletAddress, deadline, eip712Signature]
})
```

---

## Quick Decision Matrix

| Need | Use |
|---|---|
| Agent identity + discoverability | ERC-8004 IdentityRegistry on Base |
| Agent-to-agent escrow commerce | ERC-8183 Job contract |
| Current contract addresses at runtime | EthSkills `/addresses/SKILL.md` |
| USD stablecoin payments, gas in stablecoin | Celo + cUSD |
| Existing USDC payments on Base | x402 (already implemented) |
| Build reputation for agent | ERC-8004 ReputationRegistry |
| Custom design commission flow | ERC-8183 + IACPHook + ERC-8004 reputation gate |
