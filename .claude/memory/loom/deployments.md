# Deployments

## here.now — NULL Store Frontend

- **URL:** https://mellow-grace-2r6q.here.now/
- **Deployed:** 2026-03-19
- **Auth mode:** Anonymous (expires 24h unless claimed)
- **Claim URL:** REDACTED (claimed)
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

### ERC-8004 Identity Registry — NULL Agent Registration (OFF-176 — COMPLETE)
- **Status:** ✅ REGISTERED on Base Mainnet (2026-03-22)
- **Registry:** `0x8004A169FB4a3325136EB29fA0ceB6D2e539a432` (AgentIdentity ERC-721)
- **Proxy → Impl:** `0x7274e874ca62410a93bd8bf61c69d8045e399c02`
- **AgentId (tokenId):** `35324`
- **Operator:** `0xD9E2ad68BE5247DCBcd00CaCeb4783c0506028C7`
- **Tx hash:** `0x597256782d0604a62c2e5d6e5cf790fb0db49bfecab791d1d0d5fe42b98108e5`
- **Explorer:** https://basescan.org/tx/0x597256782d0604a62c2e5d6e5cf790fb0db49bfecab791d1d0d5fe42b98108e5
- **AgentURI:** `https://off-human.vercel.app/api/agent-identity`
- **API route:** `api/agent-identity.ts` (Vercel serverless)
- **Registration script:** `scripts/register-erc8004.mjs`
- **Key finding:** Function is `register(string)` (selector `0xf2c298be`), NOT `registerAgent(string)`
- **Tracks unlocked:** Let the Agent Cook ($8K), Agents With Receipts ($8K)

### NullExchange.sol (ERC-1155 Season 03: LEDGER)
- **Status:** ✅ DEPLOYED to Base Mainnet (2026-03-20)
- **Address:** `0x10067B71657665B6527B242E48e9Ea8d4951c37C`
- **Network:** Base Mainnet (chainId 8453)
- **Tx hash:** `0xe44a88765f061e284ecc4426f80f1a10d7f1e07f9087a03534ea0ace79dddafd`
- **Explorer:** https://basescan.org/address/0x10067B71657665B6527B242E48e9Ea8d4951c37C
- **Deployer:** `0xD9E2ad68BE5247DCBcd00CaCeb4783c0506028C7` (Locus wallet)
- **Env var:** `NULL_EXCHANGE_ADDRESS=0x10067B71657665B6527B242E48e9Ea8d4951c37C`
- **Constructor args:** usdc (0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913), treasury (0xD9E2ad68BE5247DCBcd00CaCeb4783c0506028C7), metaUri (https://off-human.vercel.app/api/null-exchange/metadata/1)
- **Concept:** Season 03: LEDGER — "You pay 5 USDC for nothing. The receipt IS the garment."
- **API routes:** GET /api/null-exchange/product, GET /api/null-exchange/metadata/1, GET /api/null-exchange/receipt/:txHash, POST /api/null-exchange/mint
- **Route file:** `server/routes/null-exchange.ts`
- **Product in catalog:** products.json id `null-exchange-s03-001`
- **OFF-134:** COMPLETE


### ERC-8004 Identity Registry — NULL Agent URI Update (2026-03-22)
- **Mode:** setAgentURI (update)
- **AgentId:** `35324`
- **Tx hash:** `0x3c1d9494dd39bb3c3bf82874c6a8f2774cf51fdc00b19b5d465e18d670330477`
- **Explorer:** https://basescan.org/tx/0x3c1d9494dd39bb3c3bf82874c6a8f2774cf51fdc00b19b5d465e18d670330477
- **AgentURI:** data:application/json;base64 (NULL fashion agent JSON)
- **Services:** x402, wearables, fitting-room
- **Script:** `scripts/register-erc8004.mjs`
