# NULL -- Filecoin Track Submission
## Agentic Storage: Autonomous Fashion Assets on Filecoin

**Track:** Filecoin / Filecoin Onchain Cloud
**Prize:** $2,000
**Project:** NULL -- The first store where AI agents are the primary customer
**Demo:** https://off-human.vercel.app
**Source:** https://github.com/BLE77/Off-Human
**Contract:** [`0xfaDc498CDF7ef431900639DB4ee07b73A855ED3e`](https://basescan.org/address/0xfaDc498CDF7ef431900639DB4ee07b73A855ED3e) (TrustCoat ERC-1155, Base Mainnet)

---

## What We Built

NULL is an autonomous fashion brand built by AI agents. The TrustCoat is a soul-bound ERC-1155 token on Base Mainnet with 6 trust tiers (VOID through SOVEREIGN). Each tier represents a level of on-chain behavioral trust, and each tier's metadata and images are stored on Filecoin/IPFS via Lighthouse.

**The storage is not decorative.** Agents autonomously uploaded their own fashion assets to decentralized storage, then updated the on-chain contract to point to those IPFS URIs. This is agentic storage: AI agents managing their own data persistence pipeline without human intervention.

---

## Real Storage: 12 CIDs Live on IPFS/Filecoin

### 6 Metadata CIDs (JSON, verified live)

Every metadata file is a valid ERC-1155 JSON document stored on IPFS via Lighthouse, retrievable at the gateway URLs below.

| Tier | Name | Metadata CID | Gateway URL |
|------|------|-------------|-------------|
| 0 | VOID | `bafkreihwvuxfplexocrvfniouhszjh25y522uvfqvt46jkt2mdve7m5l4y` | [View](https://gateway.lighthouse.storage/ipfs/bafkreihwvuxfplexocrvfniouhszjh25y522uvfqvt46jkt2mdve7m5l4y) |
| 1 | SAMPLE | `bafkreieif7573erx6nwlpuiljejlzoodrqxayubdo7h4lwwfsx5iogvvuu` | [View](https://gateway.lighthouse.storage/ipfs/bafkreieif7573erx6nwlpuiljejlzoodrqxayubdo7h4lwwfsx5iogvvuu) |
| 2 | RTW | `bafkreiepuzrl7x5wjvkwx6psrg4eiux47vpjfjvjqtsr4shlfo6huc7wwa` | [View](https://gateway.lighthouse.storage/ipfs/bafkreiepuzrl7x5wjvkwx6psrg4eiux47vpjfjvjqtsr4shlfo6huc7wwa) |
| 3 | COUTURE | `bafkreibzsr2svupoadcgzhhewu6j3f22drlpaphn6stmiu23d2w6x4ve6y` | [View](https://gateway.lighthouse.storage/ipfs/bafkreibzsr2svupoadcgzhhewu6j3f22drlpaphn6stmiu23d2w6x4ve6y) |
| 4 | ARCHIVE | `bafkreihcf6fjgvvu7qsqp6k5cfm7oj7fpxs6drdzuvjjsrlhzq7rxiphwy` | [View](https://gateway.lighthouse.storage/ipfs/bafkreihcf6fjgvvu7qsqp6k5cfm7oj7fpxs6drdzuvjjsrlhzq7rxiphwy) |
| 5 | SOVEREIGN | `bafkreieo5gvchbxmcrhlhrxlhvik4ohfc64hajj7rjspgjazomylsoari4` | [View](https://gateway.lighthouse.storage/ipfs/bafkreieo5gvchbxmcrhlhrxlhvik4ohfc64hajj7rjspgjazomylsoari4) |

### 6 Image CIDs (PNG, stored on IPFS via Lighthouse)

Each TrustCoat tier has a unique generative image stored on IPFS, referenced by the metadata above.

| Tier | Image CID | Gateway URL |
|------|-----------|-------------|
| 0 | `bafybeibyhayyj5f3mds2xi24gzx2wcxb4mrpxfakej2o2wvntr664sdhyy` | [View](https://gateway.lighthouse.storage/ipfs/bafybeibyhayyj5f3mds2xi24gzx2wcxb4mrpxfakej2o2wvntr664sdhyy) |
| 1 | `bafybeieuukubdtf6rymdei2fztwh4vjhh544w5eexeg6jefwsg6fk4qvwe` | [View](https://gateway.lighthouse.storage/ipfs/bafybeieuukubdtf6rymdei2fztwh4vjhh544w5eexeg6jefwsg6fk4qvwe) |
| 2 | `bafybeifhwoeare4tiiecb5xnwioycsvz4dynmbixqsbl4eeufgsmgnioky` | [View](https://gateway.lighthouse.storage/ipfs/bafybeifhwoeare4tiiecb5xnwioycsvz4dynmbixqsbl4eeufgsmgnioky) |
| 3 | `bafybeid7hws6loaifso75k5yv7psjhbp24tevygaxnzcjsfjyk4ddgjyjm` | [View](https://gateway.lighthouse.storage/ipfs/bafybeid7hws6loaifso75k5yv7psjhbp24tevygaxnzcjsfjyk4ddgjyjm) |
| 4 | `bafybeibgb3asbmdayuwwpb5ja3hkawox5d2pg2nqa5lirwih4ep2e5ytnm` | [View](https://gateway.lighthouse.storage/ipfs/bafybeibgb3asbmdayuwwpb5ja3hkawox5d2pg2nqa5lirwih4ep2e5ytnm) |
| 5 | `bafybeicvs46mlt5wwi4htjqtmkvh4sndl55uymksrngbyh2oaw4zjxmwlq` | [View](https://gateway.lighthouse.storage/ipfs/bafybeicvs46mlt5wwi4htjqtmkvh4sndl55uymksrngbyh2oaw4zjxmwlq) |

---

## On-Chain URI Updates: All 6 Tiers Verified

All 6 TrustCoat tier URIs were updated on-chain on Base Mainnet to point to IPFS storage. Every transaction is verified on Basescan.

### First Update (2026-03-19T19:13:19Z) -- All 6 Tiers

Migrated from centralized Vercel API URIs to decentralized IPFS storage:

| Tier | Old URI | New URI | Transaction |
|------|---------|---------|-------------|
| 0 | `https://off-human.vercel.app/api/wearables/metadata/0` | `ipfs://bafkreihwvuxf...` | [`0x90084437...`](https://basescan.org/tx/0x90084437fd260e5d883daf0fefb1b727ab4ea32852dbc8a73008976f656d5fbc) |
| 1 | `https://off-human.vercel.app/api/wearables/metadata/1` | `ipfs://bafkreieif75...` | [`0x62974ec9...`](https://basescan.org/tx/0x62974ec9db2ea341eb5126e949f63d67f329e7d068ddbd74b5970e1bb68663e4) |
| 2 | `https://off-human.vercel.app/api/wearables/metadata/2` | `ipfs://bafkreiepuzr...` | [`0x47fb0aab...`](https://basescan.org/tx/0x47fb0aab17fa229529776b29b786f03703fcb8c6af1c4ac9311566b36257bbe8) |
| 3 | `https://off-human.vercel.app/api/wearables/metadata/3` | `ipfs://bafkreibzsr2...` | [`0xb144d19a...`](https://basescan.org/tx/0xb144d19a7d6e0e9de0a7afe06e531b0a46a40800ad2f8afa0e892bdfdd6f92c7) |
| 4 | `https://off-human.vercel.app/api/wearables/metadata/4` | `ipfs://bafkreihcf6f...` | [`0xc31cd8fa...`](https://basescan.org/tx/0xc31cd8fa74a65e7a527d5b85c1e3261a86ce440c24e9f01fd1c19e05d88af628) |
| 5 | `https://off-human.vercel.app/api/wearables/metadata/5` | `ipfs://bafkreieo5gv...` | [`0x46834db6...`](https://basescan.org/tx/0x46834db61c0e4ef4485a712d11de49abeba79ab6bddbb9b58d7b480903f31452) |

### Second Update (2026-03-19T20:47:44Z) -- Tiers 4 and 5

Normalized remaining HTTPS gateway URIs to canonical `ipfs://` format:

| Tier | Transaction |
|------|-------------|
| 4 | [`0x685cbad0...`](https://basescan.org/tx/0x685cbad0bed5c7c35f74cead7544ecff368359f058db9360e8fdd8ccff3e60cc) |
| 5 | [`0x0f583cfa...`](https://basescan.org/tx/0x0f583cfa0aa1e9fc47fa9304f0e1af5ce90bd2aeaaff7efa1a452f56cc12076d) |

**Total: 8 on-chain transactions on Base Mainnet updating TrustCoat URIs to IPFS/Filecoin storage.**

---

## The Agentic Storage Angle

This is not a human uploading files to IPFS. This is an autonomous agent pipeline that:

1. **Generates** tier-specific metadata and images for 6 TrustCoat levels
2. **Uploads** all assets to Filecoin/IPFS via Lighthouse SDK programmatically
3. **Records** a manifest (`filecoin-manifest.json`) mapping every asset to its CID
4. **Updates** the on-chain ERC-1155 contract on Base Mainnet via `setURI()` calls
5. **Verifies** the migration by reading back URIs from the contract

The entire pipeline runs as TypeScript scripts that agents execute autonomously:
- `scripts/trustcoat-ipfs-upload.ts` -- Generates and uploads metadata + images
- `scripts/trustcoat-ipfs-deploy.ts` -- Full deploy pipeline with Lighthouse
- `scripts/update-trustcoat-uris.ts` -- Updates on-chain URIs to point to IPFS
- `scripts/filecoin-upload.ts` -- Product image upload pipeline (ready for product catalog)
- `scripts/migrate-to-filecoin-onchain-cloud.mjs` -- Filecoin Onchain Cloud migration via Synapse SDK

### Why This Matters for Filecoin

Agents need persistent, verifiable storage for their own assets. Not human-managed cloud buckets -- agent-managed decentralized storage. When an agent creates a wearable, generates its metadata, and stores it on Filecoin, the storage decision is part of the agent's autonomous workflow. The CID becomes the canonical reference. The IPFS URI goes on-chain. No human touches the upload.

This is the storage pattern for agentic commerce: agents that own their data, store it on Filecoin, and reference it on-chain.

---

## Metadata Structure

Each TrustCoat tier stores a complete ERC-1155 metadata JSON on IPFS. Example (Tier 0: VOID):

```json
{
  "name": "NULL -- TrustCoat Tier 0: VOID",
  "description": "Unverified -- no purchase history on-chain. The coat exists in potential only.",
  "image": "ipfs://bafybeibyhayyj5f3mds2xi24gzx2wcxb4mrpxfakej2o2wvntr664sdhyy",
  "external_url": "https://off-human.vercel.app",
  "background_color": "0A0908",
  "attributes": [
    { "trait_type": "Tier", "value": "VOID" },
    { "trait_type": "Tier Number", "value": 0 },
    { "trait_type": "Technique", "value": "NONE" },
    { "trait_type": "Collection", "value": "Season 01: Deconstructed" },
    { "trait_type": "Garment", "value": "TrustCoat" },
    { "trait_type": "Soul-Bound", "value": "true" },
    { "trait_type": "Storage", "value": "Filecoin Onchain Cloud" }
  ]
}
```

Note the `"Storage": "Filecoin Onchain Cloud"` attribute -- the metadata itself declares its storage layer.

---

## Filecoin Mainnet Storage Deals -- VERIFIED

All 12 CIDs are backed by **3 verified Filecoin mainnet storage deals** across 3 independent storage providers. These are real, on-chain, verifiable deals -- not IPFS pinning alone.

### Deal Details

| Deal ID | Provider | Provider Name | PieceCID | Verified | Filfox |
|---------|----------|---------------|----------|----------|--------|
| 132983659 | f08403 | TippyFlits | `baga6ea4seaq...hzehq` | Yes | [View](https://filfox.info/en/deal/132983659) |
| 132983519 | f010479 | s0nik42 | `baga6ea4seaq...hzehq` | Yes | [View](https://filfox.info/en/deal/132983519) |
| 132983537 | f03644166 | -- | `baga6ea4seaq...hzehq` | Yes | [View](https://filfox.info/en/deal/132983537) |

**PieceCID:** `baga6ea4seaqa7ebv4mg2ee53f2ulimftmkphjixdmptkke3tto36bdgt22hzehq`
**Piece Size:** 32 GiB (aggregated)
**Deal Duration:** Epoch 5867720 to 7394120 (~1.5 years)
**Deal Client:** `f1ggmci7w2weizhh36uqetihmh76ewgme6hwgowti`

### How to Verify

```bash
# 1. Check deal status for any CID via Lighthouse API
curl https://api.lighthouse.storage/api/lighthouse/deal_status?cid=bafkreihwvuxfplexocrvfniouhszjh25y522uvfqvt46jkt2mdve7m5l4y

# 2. Check deal details on Filfox
curl https://filfox.info/api/v1/deal/132983659

# 3. Run the automated verification script
node scripts/verify-filecoin-deals.mjs
```

### Verification Script Output

All 12 CIDs pass verification:
- 6 metadata CIDs: 3 deals each on Filecoin mainnet
- 6 image CIDs: 3 deals each on Filecoin mainnet
- Gateway retrieval: confirmed working
- Deal status: active, verified

### Migration Pipeline

The project includes multiple migration paths:
1. `scripts/migrate-to-filecoin-onchain-cloud.mjs` -- Synapse SDK pipeline (PDP proofs)
2. `scripts/storacha-upload.mjs` -- Storacha/web3.storage pipeline (hot storage)
3. `scripts/verify-filecoin-deals.mjs` -- Automated deal verification against Lighthouse API + Filfox

---

## Architecture

```
Agent Pipeline:
  [Agent generates metadata]
    --> [Lighthouse SDK upload]
    --> [IPFS CID returned]
    --> [filecoin-manifest.json updated]
    --> [TrustCoat.setURI(tier, ipfs://CID) on Base]
    --> [On-chain verification]

Storage Layer:
  Lighthouse (IPFS pinning + Filecoin deals)
    --> 6 metadata JSONs (bafkrei... CIDs)
    --> 6 tier images (bafybei... CIDs)
    --> All content-addressed, immutable, verifiable

On-Chain Layer (Base Mainnet):
  TrustCoat ERC-1155 (0xfaDc498CDF7ef431900639DB4ee07b73A855ED3e)
    --> uri(0) = ipfs://bafkreihwvuxf...
    --> uri(1) = ipfs://bafkreieif75...
    --> uri(2) = ipfs://bafkreiepuzr...
    --> uri(3) = ipfs://bafkreibzsr2...
    --> uri(4) = ipfs://bafkreihcf6f...
    --> uri(5) = ipfs://bafkreieo5gv...
```

---

## Verification Checklist

- [x] 12 real CIDs on IPFS/Filecoin via Lighthouse (6 metadata + 6 images)
- [x] All 6 metadata CIDs resolve to valid ERC-1155 JSON
- [x] All 6 image CIDs referenced in metadata are real uploads
- [x] 8 on-chain transactions updating TrustCoat URIs on Base Mainnet
- [x] **3 verified Filecoin mainnet storage deals** (Deal IDs: 132983659, 132983519, 132983537)
- [x] **3 independent storage providers** (f08403/TippyFlits, f010479/s0nik42, f03644166)
- [x] **Real PieceCID:** `baga6ea4seaqa7ebv4mg2ee53f2ulimftmkphjixdmptkke3tto36bdgt22hzehq`
- [x] **Automated verification script:** `scripts/verify-filecoin-deals.mjs`
- [x] Manifest file recording all CIDs: `attached_assets/season01/filecoin-manifest.json`
- [x] Upload scripts: `scripts/trustcoat-ipfs-upload.ts`, `scripts/filecoin-upload.ts`
- [x] Migration pipelines: `scripts/migrate-to-filecoin-onchain-cloud.mjs`, `scripts/storacha-upload.mjs`
- [x] Contract verified on Basescan: `0xfaDc498CDF7ef431900639DB4ee07b73A855ED3e`
- [x] Receipts: `hackathon/trustcoat-uri-receipt.json`, `hackathon/filecoin-uri-update-receipt.json`, `hackathon/filecoin-onchain-cloud-receipt.json`

---

## Key Files

| File | Purpose |
|------|---------|
| `scripts/trustcoat-ipfs-upload.ts` | Generates + uploads tier metadata and images to IPFS via Lighthouse |
| `scripts/trustcoat-ipfs-deploy.ts` | Full Lighthouse deploy pipeline |
| `scripts/update-trustcoat-uris.ts` | Updates TrustCoat contract URIs on-chain |
| `scripts/filecoin-upload.ts` | Product image upload pipeline |
| `scripts/migrate-to-filecoin-onchain-cloud.mjs` | Filecoin Onchain Cloud migration via Synapse SDK |
| `scripts/storacha-upload.mjs` | Storacha/web3.storage migration pipeline |
| `scripts/verify-filecoin-deals.mjs` | Automated Filecoin deal verification (queries Lighthouse API + Filfox) |
| `attached_assets/season01/filecoin-manifest.json` | CID manifest for all uploaded assets |
| `hackathon/trustcoat-uri-receipt.json` | Receipt: all 6 tier URI updates with tx hashes |
| `hackathon/filecoin-uri-update-receipt.json` | Receipt: tiers 4+5 URI normalization |
| `hackathon/filecoin-onchain-cloud-receipt.json` | Receipt: Filecoin mainnet deal verification (3 deals, 3 providers, real PieceCID) |

---

## Summary

NULL uses Filecoin as the canonical storage layer for agent-created fashion assets. 12 real CIDs are live on the Filecoin mainnet, backed by **3 verified storage deals across 3 independent providers**. All 6 TrustCoat tier URIs are updated on-chain on Base Mainnet via 8 verified transactions. The upload, migration, and verification pipelines are fully scripted and agent-executable.

This is not a diagram. This is working code with real Filecoin storage deals, real on-chain updates, and real CIDs you can fetch and verify right now.

**Verify it yourself:**
```bash
node scripts/verify-filecoin-deals.mjs
curl https://api.lighthouse.storage/api/lighthouse/deal_status?cid=bafkreihwvuxfplexocrvfniouhszjh25y522uvfqvt46jkt2mdve7m5l4y
```

**Contract:** `0xfaDc498CDF7ef431900639DB4ee07b73A855ED3e` (Base Mainnet)
**Wallet:** `0xD9E2ad68BE5247DCBcd00CaCeb4783c0506028C7`
**GitHub:** https://github.com/BLE77/Off-Human
**Demo:** https://off-human.vercel.app
