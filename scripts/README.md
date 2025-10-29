# Agent Scripts

## Quick Start Guide

### 1. Generate Wallet

```bash
tsx scripts/generate-agent-wallet.ts
```

This creates a new Ethereum wallet for your AI agent.

**Copy the output** and add `AGENT_WALLET_PRIVATE_KEY` to your Replit Secrets.

### 2. Fund Wallet

Send Base USDC to the wallet address shown in step 1.

You can bridge USDC at: https://bridge.base.org

Recommended: Start with $5-10 USDC for testing.

### 3. Run Agent

```bash
tsx scripts/agent-shopper.ts
```

Watch your AI agent autonomously shop!

## Files

- `generate-agent-wallet.ts` - Creates a new wallet for the agent
- `agent-shopper.ts` - The autonomous shopping agent
- `../AGENT_SHOPPER_README.md` - Full documentation

## Environment Variables Required

```
OPENAI_API_KEY=sk-...          # For AI decision-making
AGENT_WALLET_PRIVATE_KEY=0x... # Agent's wallet
```

Optional:
```
STORE_URL=http://localhost:5000 # Default, only change if needed
```
