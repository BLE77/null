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
