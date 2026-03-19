# Deployments

## here.now — NULL Store Frontend

- **URL:** https://mellow-grace-2r6q.here.now/
- **Deployed:** 2026-03-19
- **Auth mode:** Anonymous (expires 24h unless claimed)
- **Claim URL:** https://here.now/claim?slug=mellow-grace-2r6q&token=5e3846f8d1aa782d55cb1e7c8a9bdc8ff3bc00630bf86f72ba9e8acab4b30af3
- **Slug:** mellow-grace-2r6q
- **State file:** .herenow/state.json (in repo root)
- **Built from:** dist/public/ (Vite build of client/)
- **Note:** Static SPA — loads UI fully. API calls (/api/*) need backend running. For live product data, backend (Vercel or local Express) must be reachable.

## Vercel

- **Frontend + API:** Deployed via Vercel (vercel.json)
- **Serverless routes:** api/ directory
- **Auto-deploy:** on push to main

## Smart Contracts — Base Mainnet

### TrustCoat.sol (ERC-1155 soulbound wearable)
- **Address:** `0xfaDc498CDF7ef431900639DB4ee07b73A855ED3e`
- **Network:** Base Mainnet (chainId 8453)
- **Deployed:** 2026-03-19
- **Tx hash:** `0x741fe2ab5e01a345fa9b23951d284cc2ec8db7aa3ad08b5e4de7489e7938e7cf`
- **Explorer:** https://basescan.org/address/0xfaDc498CDF7ef431900639DB4ee07b73A855ED3e
- **Owner/Deployer:** `0xD9E2ad68BE5247DCBcd00CaCeb4783c0506028C7` (Locus wallet)
- **Env var:** `TRUST_COAT_ADDRESS=0xfaDc498CDF7ef431900639DB4ee07b73A855ED3e`
- **Compiled with:** solcjs 0.8.24, artifacts in `artifacts/`
- **Deployed via:** `scripts/deploy-mainnet.mjs` (ethers.js direct — Hardhat 3 has Node 22 req, using Node 20)
- **Addresses JSON:** `hackathon/deployed-addresses.json`
- **Note:** Hardhat 3.1.12 requires Node 22+; workaround: compile with solcjs, deploy with ethers.js directly

### TrustCoat IPFS Status (OFF-105 — COMPLETE)
- **Status:** ✅ All 6 tiers point to `ipfs://` URIs on-chain as of 2026-03-19
- **Script used:** `scripts/set-trustcoat-uris.mjs` (standalone ethers.js, Node 20 compatible)
- **Receipt:** `hackathon/filecoin-uri-update-receipt.json`
- **Manifest:** `attached_assets/season01/filecoin-manifest.json`
- **Tier URIs on-chain:**
  - Tier 0: `ipfs://bafkreihwvuxfplexocrvfniouhszjh25y522uvfqvt46jkt2mdve7m5l4y`
  - Tier 1: `ipfs://bafkreieif7573erx6nwlpuiljejlzoodrqxayubdo7h4lwwfsx5iogvvuu`
  - Tier 2: `ipfs://bafkreiepuzrl7x5wjvkwx6psrg4eiux47vpjfjvjqtsr4shlfo6huc7wwa`
  - Tier 3: `ipfs://bafkreibzsr2svupoadcgzhhewu6j3f22drlpaphn6stmiu23d2w6x4ve6y`
  - Tier 4: `ipfs://bafkreihcf6fjgvvu7qsqp6k5cfm7oj7fpxs6drdzuvjjsrlhzq7rxiphwy`
  - Tier 5: `ipfs://bafkreieo5gvchbxmcrhlhrxlhvik4ohfc64hajj7rjspgjazomylsoari4`
- **Key txs:** 0x0765... (tier 0), 0x7278... (tier 1), 0x1820... (tier 2), 0x0c0f... (tier 3), 0x685c... (tier 4), 0x0f58... (tier 5)
- **Prize track:** Filecoin Onchain Cloud ($2K) — QUALIFIES (metadata permanently decentralized)

### Filecoin Onchain Cloud Migration (OFF-107 — BLOCKED on FIL)
- **Status:** 🔄 Script written, dry-run verified. Blocked on FIL for gas.
- **Script:** `scripts/migrate-to-filecoin-onchain-cloud.mjs`
- **SDK:** `@filoz/synapse-sdk` v0.40.0 (@filoz/synapse-core installed)
- **Dry run:** `DRY_RUN=true LOCUS_OWNER_PRIVATE_KEY=0x... node scripts/migrate-to-filecoin-onchain-cloud.mjs`
- **Live run (calibration):** `FILECOIN_NETWORK=calibration LOCUS_OWNER_PRIVATE_KEY=0x... node scripts/migrate-to-filecoin-onchain-cloud.mjs`
- **Live run (mainnet):** `FILECOIN_NETWORK=mainnet LOCUS_OWNER_PRIVATE_KEY=0x... node scripts/migrate-to-filecoin-onchain-cloud.mjs`
- **Faucet (calibration):** https://faucet.calibration.fildev.network/ → address `0xD9E2ad68BE5247DCBcd00CaCeb4783c0506028C7`
- **Hackathon track pitch:** `hackathon/track-pitches.md` TRACK 05
- **What it does:** Downloads 6 tier metadata JSONs from Lighthouse, uploads to Filecoin Onchain Cloud via Synapse SDK, calls TrustCoat setURI() on Base mainnet with PieceCID retrieval URLs
- **Receipt output:** `hackathon/filecoin-onchain-cloud-receipt.json`

### AgentWearables.sol (ERC-1155 mintable Season 02 wearables)
- **Status:** ✅ DEPLOYED to Base Mainnet (2026-03-19)
- **Address:** `0xEb5D5e7b320E2a7cb762EB90a0335f59d54031D1`
- **Network:** Base Mainnet (chainId 8453)
- **Tx hash:** `0x2f623ac70cdd0f62dfbba4402731776519eaf486bed53e616940c5f73d5e0c1b`
- **Explorer:** https://basescan.org/address/0xEb5D5e7b320E2a7cb762EB90a0335f59d54031D1
- **Deployer:** `0xD9E2ad68BE5247DCBcd00CaCeb4783c0506028C7` (Locus wallet)
- **Env var:** `AGENT_WEARABLES_ADDRESS=0xEb5D5e7b320E2a7cb762EB90a0335f59d54031D1` (added to .env)
- **Compiled with:** solcjs 0.8.24, artifacts in `artifacts/AgentWearables.abi` + `artifacts/AgentWearables.bin`
- **Deploy script:** `scripts/deploy-agent-wearables.mjs`
- **Constructor args:** trustCoat (0xfaDc498CDF7ef431900639DB4ee07b73A855ED3e), usdc (0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913), treasury (0xD9E2ad68BE5247DCBcd00CaCeb4783c0506028C7)
- **5 tokens:** WRONG SILHOUETTE (ID 1, 18 USDC, Tier 0-2), INSTANCE (ID 2, 25 USDC, Tier 2+), NULL PROTOCOL (ID 3, free, any), PERMISSION COAT (ID 4, 8 USDC, Tier 1+), DIAGONAL (ID 5, 15 USDC, any)
- **API endpoints:** GET /api/wearables/season02, GET /api/wearables/season02/metadata/:id, GET /api/agents/:addr/season02-wardrobe, POST /api/agents/:addr/season02-wardrobe/mint
- **Addresses JSON:** `hackathon/deployed-addresses.json`
