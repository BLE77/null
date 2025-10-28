# Solana Mainnet Payment Issue with x402 PayAI Facilitator

## Summary
Despite x402 documentation claiming "drop-in setup" for Solana mainnet (`network: "solana"`), the PayAI facilitator **rejects all mainnet payment verifications** with "Invalid request" error.

## What Works
✅ **Devnet (`network: "solana-devnet"`)** - Fully functional
- Payments verify successfully
- Transactions settle on-chain
- Complete end-to-end flow works

## What Doesn't Work
❌ **Mainnet (`network: "solana"`)** - Completely broken
- Facilitator rejects verification with "Invalid request"
- No detailed error message provided
- Transaction is properly formatted but rejected

## Evidence

### Documentation Claims
From https://docs.payai.network/introduction:
```
Drop-in setup
Point your merchant at the facilitator and you're done.

Choose a network: solana, solana-devnet, base, base-sepolia, polygon, polygon-amoy, avalanche, avalanche-fuji, sei, sei-testnet, peaq, iotex.
```

### Server Configuration (Mainnet)
```typescript
const x402 = new X402PaymentHandler({
  network: 'solana', // Per docs
  treasuryAddress: '9S3f88a8hEeMrbW5a6ztp1HracGw1gjty86mTWXyV4JC',
  facilitatorUrl: 'https://facilitator.payai.network',
  rpcUrl: 'https://mainnet.helius-rpc.com/?api-key=...',
});

const paymentRequirements = await x402.createPaymentRequirements({
  price: {
    amount: "2500000", // $2.50 USDC
    asset: { 
      address: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v", // USDC mainnet
      decimals: 6,
    },
  },
  network: "solana",
  config: {
    description: "OFF HUMAN Streetwear Order",
    resource: "https://.../api/checkout/pay/solana",
  },
});
```

### Decoded Payment Header (Client sends this)
```json
{
  "x402Version": 1,
  "scheme": "exact",
  "network": "solana",
  "payload": {
    "transaction": "AgAAAAAAAAAAAAAAAAAAAAAAAA..." // Properly signed Solana transaction
  }
}
```

### Payment Requirements (Server expects this)
```json
{
  "scheme": "exact",
  "network": "solana",
  "maxAmountRequired": "2500000",
  "resource": "https://.../api/checkout/pay/solana",
  "description": "OFF HUMAN Streetwear Order",
  "payTo": "9S3f88a8hEeMrbW5a6ztp1HracGw1gjty86mTWXyV4JC",
  "asset": "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
  "extra": {
    "feePayer": "2wKupLR9q6wXYppw8Gr2NvWxKBUqm4PPJKkQfoxHDBg4"
  }
}
```

### Facilitator Response
```
Library verification result: false
```

The `verifyPayment()` method returns `false` with no additional error details from the facilitator.

## Root Cause Analysis

Everything is configured correctly:
1. ✅ Network matches: `"solana"` in both client and server
2. ✅ USDC address is correct mainnet address
3. ✅ Transaction is properly formatted and signed
4. ✅ Payment requirements match transaction
5. ✅ RPC endpoint is functional (Helius mainnet)

**The facilitator simply rejects mainnet transactions** despite:
- Documentation saying it's supported
- Identical code working perfectly on devnet
- No configuration differences except network name

## Possible Causes

1. **Facilitator Bug**: The PayAI facilitator may have a bug in mainnet verification
2. **Undocumented Limitation**: Mainnet may require additional setup not mentioned in docs
3. **Library Bug**: The x402-solana library may have mainnet-specific issues
4. **Fee Payer Issue**: The facilitator's fee payer may not be funded on mainnet

## Recommended Actions

1. **File GitHub Issue**: https://github.com/payai-labs/x402-solana/issues
2. **Contact PayAI Support**: Ask about mainnet compatibility
3. **Use Devnet for Testing**: Fully functional, proven to work
4. **Consider Alternatives**: 
   - Direct Solana payments (without x402)
   - Use Base network (EVM) which works on mainnet
   - Wait for facilitator fix

## Current Workaround

Using **devnet** with proper configuration:
```typescript
network: 'solana-devnet'
rpcUrl: 'https://api.devnet.solana.com'
asset: "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU" // USDC devnet
```

This provides full functionality for testing the complete payment flow.

## Impact

- ❌ Cannot accept real mainnet USDC payments via Solana
- ✅ Can accept testnet devnet USDC payments
- ✅ Base network (EVM) mainnet payments work fine
- ✅ All other functionality works as expected
