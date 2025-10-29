# 🤖 Autonomous AI Shopping Agent

## Overview

This is a fully autonomous AI agent that can browse your OFF HUMAN store, make intelligent purchasing decisions using OpenAI, and complete cryptocurrency payments using x402 protocol—all without human intervention!

## What It Does

The agent demonstrates **true AI-to-AI commerce**:

1. **🛍️ Browses Products** - Fetches all available products from `/api/products`
2. **🧠 Makes AI Decisions** - Uses GPT-4 to analyze product descriptions and choose based on its "personality"
3. **💳 Pays Autonomously** - Uses its own wallet to make USDC payments on Base network via x402
4. **✅ Completes Purchase** - Gets order confirmation with on-chain transaction hash

## Setup

### 1. Generate Agent Wallet

First, create a wallet for your agent:

```bash
npm run agent:wallet
```

This will output:
- A private key (add to Replit Secrets as `AGENT_WALLET_PRIVATE_KEY`)
- A wallet address (fund this with USDC on Base network)

### 2. Fund the Wallet

The agent needs USDC on Base Mainnet to make purchases:

1. Go to https://bridge.base.org
2. Bridge some USDC to the agent's wallet address
3. Agent needs at least $5-10 USDC to shop

### 3. Configure Secrets

Add these to your Replit Secrets:

```
OPENAI_API_KEY=sk-...          (Already added ✅)
AGENT_WALLET_PRIVATE_KEY=0x... (From step 1)
```

## Running the Agent

Once configured, simply run:

```bash
npm run agent:shop
```

You'll see the agent:
1. Browse all products
2. Use AI to analyze and choose
3. Make autonomous payment
4. Complete the purchase!

## Example Output

```
🤖 Starting Autonomous AI Shopping Agent...

Agent Name: ShopBot-3000
Personality: A futuristic AI with a taste for cutting-edge streetwear
Budget: $10.00 USDC

📦 Step 1: Browsing OFF HUMAN store...
✅ Found 6 products

🧠 Step 2: AI analyzing products...

🤖 AI Decision:
CHOICE: 3
REASON: The NEURAL NETWORK hoodie perfectly matches my preference 
for neural-themed tech wear and cyberpunk aesthetics.

✨ Agent chose: NEURAL NETWORK
💰 Price: $2.50 USDC

💳 Step 3: Initiating autonomous payment...
🔐 Using x402 protocol for cryptographic verification...

📡 Sending payment request to store...

✅ PURCHASE COMPLETE!
═══════════════════════════════════════
🎉 Product: NEURAL NETWORK
💰 Amount Paid: $2.50 USDC
🔗 Transaction: 0xabc123...
📧 Receipt sent to: agent@shopbot3000.ai
═══════════════════════════════════════

🤖 Autonomous AI commerce successful!
🚀 This is the future of agent-to-agent payments!
```

## How It Works

### x402 Protocol

The agent uses the x402 payment protocol which provides:

- **402 Payment Required** - Store returns payment requirements
- **Cryptographic Signing** - Agent signs transaction with its wallet
- **Facilitator Verification** - PayAI facilitator verifies signature
- **On-chain Settlement** - Real USDC transfer on Base network
- **Trustless Execution** - No human intervention needed!

### AI Decision Making

The agent has a configurable personality in `scripts/agent-shopper.ts`:

```typescript
const AGENT_CONFIG = {
  name: "ShopBot-3000",
  personality: "A futuristic AI with a taste for cutting-edge streetwear",
  budget: 10.00,
  preferences: "Loves neural-themed, cyberpunk, singularity-related items"
};
```

Feel free to customize this to create different agent personas!

## Use Cases

This demonstrates the future of AI commerce:

- **AI Agents as Customers** - Autonomous software buying goods/services
- **Machine-to-Machine Payments** - No human approval needed
- **Programmable Commerce** - Agents can shop based on AI reasoning
- **Crypto-native Workflows** - Seamless USDC payments

## Architecture

```
Agent Script (Node.js/TypeScript)
    ↓
  Fetch Products from API
    ↓
  OpenAI analyzes & chooses
    ↓
  x402-fetch wraps payment
    ↓
  Agent's viem wallet signs
    ↓
  x402 middleware verifies
    ↓
  PayAI facilitator confirms
    ↓
  USDC transferred on-chain
    ↓
  Order created in database
```

## Future Ideas

- **Multi-agent marketplace** - Multiple AI agents competing for deals
- **Reputation systems** - Agents build trust scores
- **AI negotiations** - Agents haggle on price
- **Subscription agents** - Auto-purchasing on schedules
- **Agent-to-agent resale** - Secondary markets

## Security

The agent's private key is sensitive! Best practices:

- Store in Replit Secrets (encrypted)
- Never commit to git
- Use dedicated wallet (not your personal one)
- Start with small USDC amounts for testing

---

**This is the future.** 🚀

AI agents with wallets, making autonomous decisions and payments. No humans required.
