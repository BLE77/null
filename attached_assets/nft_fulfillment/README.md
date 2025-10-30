# Clanker NFT Fulfillment (Preminted → Transfer)
This service listens for x402 payment confirmations and sends a preminted Solana NFT from a vault wallet to the buyer.

## Setup
1. Add Replit secrets for RPC_URL, VAULT_SECRET_KEY, PORT (optional), X402_WEBHOOK_SECRET (optional).
2. Click Run.
3. Test endpoint:
```
curl -X POST http://localhost:3000/fulfill -H "Content-Type: application/json" -d '{"recipient":"WALLET","mint":"NFT_MINT"}'
```

View on https://solscan.io/tx/<signature> after success.