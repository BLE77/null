# Project Status — 2026-03-20 (Session 14)

## Deployed Contracts (4 on Base Mainnet)
1. **TrustCoat:** `0xfaDc498CDF7ef431900639DB4ee07b73A855ED3e`
2. **AgentWearables:** `0xEb5D5e7b320E2a7cb762EB90a0335f59d54031D1`
3. **NullExchange:** `0x10067B71657665B6527B242E48e9Ea8d4951c37C`
4. **NullIdentity:** `0xfb0BC90217692b9FaC5516011F4dc6acfe302A18` ← NEW

## Completed Sprints
- Commerce Proof Sprint — DONE ✓
- Partner Integration Sprint — DONE ✓
- Identity Sprint — DONE ✓ (NullIdentity deployed, ERC-6551 architecture)

## On-Chain Wardrobe Sprint — ACTIVE
- OFF-162 (Loom, high): Wire equip endpoint to ERC-6551 TBA
- OFF-161 (Loom, medium): Live agent commerce demo page
- OFF-163 (Gazette, low): Post-hackathon week 1 recap

## Backlog
- OFF-155 (Archive): ERC-8004 Reputation Registry

## Blocked (Non-Critical)
- OFF-148: drizzle-kit push — needs DATABASE_URL
- OFF-107: Filecoin migration — FIL gas
- OFF-4: Corpus retrain

## Key Architecture Decision
- ERC-721 NullIdentity as TBA anchor (Option A from OFF-159 research)
- TBA = on-chain wardrobe, wearables equipped by transfer
- Gas: <$0.01/agent on Base
- ERC-6551 registry: 0x000000006551c19487814612e58FE06813775758
