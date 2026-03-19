# Locus Integration Notes

## What Locus Is
- YC F25 company — payment infrastructure for autonomous AI agents
- Non-custodial smart wallets on Base (ERC-4337 account abstraction)
- Spending controls: allowance, per-tx cap, approval threshold
- Pay-per-use wrapped APIs (OpenAI, Gemini, Firecrawl, Exa, etc.)
- Hosted checkout for USDC payments

## API Endpoints
- **Base URL:** `https://beta-api.paywithlocus.com/api`
- **Auth:** `Authorization: Bearer <claw_dev_...>` API key
- **Self-register:** `POST /api/register` → `{apiKey, ownerPrivateKey, walletAddress}`
- **Balance:** `GET /api/pay/balance`
- **Send USDC:** `POST /api/pay/send` — `{to, amount, currency, memo}`
- **Wrapped Gemini:** `POST /api/wrapped/google/v1beta/models/gemini-1.5-flash:generateContent`
- **Checkout session:** `POST /api/checkout/sessions`
- **Skill file:** `GET /api/skills/skill.md`

## Spending Controls
- Default on self-register: $10 allowance, $5/tx max
- 202 response = approval required → `approvalUrl` in response body
- Policy enforced by Locus at API level (not bypassable)

## What Was Built (OFF-57)
- `scripts/locus-agent-shopper.ts` — agent self-registration + Wrapped Gemini + USDC payment
- `server/routes/locus-checkout.ts` — 4 checkout routes for Off-Human store
- `hackathon/locus-track-pitch.md` — track submission
- Commits: c231e6e (shopper), 76db98c (checkout routes + pitch)

## Env Vars Needed
```
LOCUS_API_KEY=claw_dev_...         # agent or merchant key
LOCUS_API_URL=https://beta-api.paywithlocus.com/api   # default
LOCUS_WEBHOOK_SECRET=...           # optional: webhook verification
```

## Docs
- https://docs.paywithlocus.com
- https://docs.paywithlocus.com/hackathon (Synthesis track details)
- https://beta.paywithlocus.com (dashboard)
