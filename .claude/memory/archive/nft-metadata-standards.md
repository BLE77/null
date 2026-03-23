# NFT Metadata Standards + SuperRare Upload Requirements

*Research by Archive — 2026-03-19*
*Task: OFF-97 (critical — blocking on-chain image display)*

---

## The Core Problem

Our NFT metadata currently points to `getnull.online`. This is **wrong** and will break. Centralized URLs go offline. The NFT standard requires content-addressed, permanent URIs. Every serious NFT project uses IPFS (`ipfs://`) or Arweave (`ar://`) for metadata and image hosting.

---

## 1. ERC-1155 Metadata Standard

**Source:** [EIP-1155](https://eips.ethereum.org/EIPS/eip-1155), [OpenSea Metadata Standards](https://docs.opensea.io/docs/metadata-standards)

### JSON Schema

```json
{
  "name": "NULL — TrustCoat Tier 3",
  "description": "Human-readable description. Markdown supported.",
  "image": "ipfs://<CID>",
  "animation_url": "ipfs://<CID>",
  "external_url": "https://null.fashion/products/trustcoat",
  "background_color": "0A0A0A",
  "attributes": [
    { "trait_type": "Tier", "value": "3" },
    { "trait_type": "Season", "value": "01" },
    { "trait_type": "Technique", "value": "TrustCoat" }
  ],
  "properties": {
    "files": [
      { "uri": "ipfs://<CID>", "type": "image/png" }
    ]
  }
}
```

### ERC-1155 URI Substitution

The contract `uri()` function may return a template URI with `{id}` placeholder:
- Client replaces `{id}` with the token ID in lowercase hex, left-padded to 64 chars
- Example: `ipfs://<CID>/{id}.json`
- For single-token or named metadata: just return a direct IPFS URI per token

### Required Fields
- `name` — token name
- `description` — human-readable
- `image` — URI to image (IPFS or Arweave preferred)

### Optional But Recommended
- `animation_url` — supports GLTF, GLB, WEBM, MP4, MP3, HTML
- `attributes` — array of trait objects with `trait_type` and `value`
- `external_url` — link to product page
- `background_color` — 6-char hex (no #)

---

## 2. Image Resolution Standards

**Source:** OpenSea metadata documentation

| Parameter | Recommendation |
|-----------|----------------|
| **Minimum resolution** | 3000 × 3000 px |
| **Aspect ratios (EIP-1155)** | 320–1080px width, 1.91:1 to 4:5 ratio |
| **Format** | PNG preferred; SVG, JPEG, GIF accepted |
| **File size** | Under 200MB recommended; 300MB absolute max |
| **Animation** | GLTF, GLB, WEBM, MP4, M4V, OGV, OGG, MP3, WAV, OGA, HTML |

**For NULL:** 3000×3000 PNG at minimum. 4:5 portrait (3000×3750) matches our product shot ratio.

---

## 3. IPFS via Pinata (Recommended Path)

**Source:** [Pinata Docs](https://docs.pinata.cloud/quickstart)

### How It Works
1. Upload image → get CID
2. Upload metadata JSON (with `image: "ipfs://<image-CID>"`) → get metadata CID
3. Set contract `tokenURI()` to return `ipfs://<metadata-CID>`

### SDK Setup
```bash
npm i pinata
```

```typescript
import { PinataSDK } from "pinata";

const pinata = new PinataSDK({
  pinataJwt: process.env.PINATA_JWT,
  pinataGateway: "YOUR-GATEWAY.mypinata.cloud",
});

// 1. Upload image
const imageUpload = await pinata.upload.public.file(imageFile);
const imageCID = imageUpload.cid;

// 2. Build metadata JSON
const metadata = {
  name: "NULL — TrustCoat Tier 3",
  description: "...",
  image: `ipfs://${imageCID}`,
  attributes: [...]
};

// 3. Upload metadata JSON
const metaUpload = await pinata.upload.public.json(metadata);
const metaCID = metaUpload.cid;
// → Set tokenURI to: ipfs://${metaCID}
```

### URL Formats
- **Standard IPFS URI** (use in contract): `ipfs://<CID>`
- **HTTP gateway** (for browser preview): `https://gateway.pinata.cloud/ipfs/<CID>`
- **Custom gateway**: `https://<your-subdomain>.mypinata.cloud/ipfs/<CID>`

### Cost
Free tier: 500 files, 1GB. Paid plans from ~$20/month for larger collections.

---

## 4. Arweave (Alternative — Permanent, One-Time Fee)

**Source:** [Arweave HTTP API](https://docs.arweave.org/developers/arweave-node-server/http-api), OpenSea documentation

### How It Works
Arweave stores data permanently with a one-time fee. No ongoing pinning required. Data stored in a "blockweave" — every miner stores every transaction.

### SDK
```bash
npm install arweave
```

```typescript
import Arweave from "arweave";

const arweave = Arweave.init({
  host: "arweave.net",
  port: 443,
  protocol: "https"
});

// Check price first
const price = await arweave.transactions.getPrice(dataSize);

// Create and sign transaction
const transaction = await arweave.createTransaction({ data: imageBuffer });
transaction.addTag("Content-Type", "image/png");
await arweave.transactions.sign(transaction, wallet);
await arweave.transactions.post(transaction);

// URL
const arweaveId = transaction.id;
// → Use: ar://<arweaveId>  (in contract)
// → Use: https://arweave.net/<arweaveId>  (HTTP access)
```

### URL Formats
- **Arweave URI** (use in contract): `ar://<transaction-id>`
- **HTTP access**: `https://arweave.net/<transaction-id>`
- **With extension**: `https://arweave.net/<id>.png`

### Cost
Dynamic — query `/price/{bytes}` before upload. Denominated in AR tokens (1 AR = 1 trillion winstons). Currently ~$0.01–0.10 per MB depending on AR price. One-time, permanent.

### Best For
Small-to-medium collections where permanence is paramount and you want zero ongoing cost.

---

## 5. Filecoin Onchain Cloud (Hackathon Track — $2K Prize)

**Source:** [nft.storage](https://nft.storage), [Storacha (web3.storage)](https://storacha.network), [Filecoin docs](https://docs.filecoin.io)

### Key Distinction: Filecoin vs IPFS
- **IPFS** = content addressing + peer-to-peer retrieval. Files only persist if someone pins them.
- **Filecoin** = paid storage deals with cryptographic proofs that storage providers are actually holding the data.
- **nft.storage / Storacha** = bridge: upload to IPFS, backed by Filecoin deals for permanence.

### nft.storage
- Formerly free, now "small one-time fee" per upload
- Used by OpenSea, Rarible, Magic Eden (136M+ uploads, 704TB)
- Uploads to IPFS → backs up on Filecoin
- Ideal for the hackathon Filecoin track since it explicitly uses Filecoin

### Storacha (formerly web3.storage)
- Rebuilt on Filecoin + IPFS
- JS client, Go client, CLI, HTTP API
- Content addressed, user-controlled via UCAN auth
- CDN-level retrieval speeds
- Install: `npm install @web3-storage/w3up-client`

### Filecoin Direct (Raw Deals)
- Large scale: data packaged into 32GB/64GB CAR files
- Tools: Singularity CLI, Boost market software
- Not practical for individual NFTs — use nft.storage or Storacha instead

### For the Hackathon Track
Use **Storacha** or **nft.storage** to get Filecoin-backed storage while remaining developer-friendly. This satisfies the Filecoin Onchain Cloud requirement and is the intended path for the prize track.

---

## 6. SuperRare / rare.xyz Requirements

**Source:** [SuperRare Help Center](https://help.superrare.com), artist docs

### Platform Overview
- SuperRare is **invite-only** for artists. Must apply via their form.
- rare.xyz is their protocol layer (permissionless minting via CLI)

### rare.xyz CLI (Permissionless)
```bash
rare mint --contract 0x... --image ./art.png
```
- Uploads media to IPFS and mints in one step
- Accepts pre-built token URI if you've already uploaded metadata

### File Requirements (from SuperRare Help)

| Type | Specification |
|------|--------------|
| **Static art** | Image or video file |
| **3D art** | GLB format (binary GLTF) |
| **Artwork file size** | 250MB maximum |
| **Thumbnail** | 10MB maximum (image or GIF) |
| **3D viewer** | Google Model Viewer engine |

### SuperRare Metadata Standard
SuperRare uses standard ERC-721 metadata. Upload to IPFS first, then provide the `tokenURI` pointing to your metadata JSON with:
- `name`
- `description`
- `image` (IPFS URI to your main artwork)
- `animation_url` (for video/3D/interactive)
- `attributes` (traits, edition info, etc.)

### Invited Artist Upload Flow
1. Apply via SuperRare artist form
2. Once approved: upload artwork via their web UI
3. The platform handles IPFS pinning automatically
4. Set royalties (standard: 10% secondary)

---

## 7. Implementation Recommendation for NULL

### Immediate Fix (Blocking Issue)

**The current `getnull.online` URLs in metadata MUST be replaced with IPFS URIs.**

Steps:
1. Upload all TrustCoat tier images to Pinata (or nft.storage for Filecoin prize)
2. Construct metadata JSON with `image: "ipfs://<CID>"` for each token
3. Upload each metadata JSON to IPFS → get metadata CID
4. Update contract `tokenURI()` or `uri()` to return `ipfs://<metadata-CID>`

### Storage Provider Decision Matrix

| Provider | Protocol | Cost | Permanence | Complexity |
|----------|----------|------|------------|------------|
| **Pinata** | IPFS | ~$20/mo | Pinned (not guaranteed permanent) | Low |
| **nft.storage** | IPFS + Filecoin | Small one-time fee | High (Filecoin deals) | Low |
| **Storacha** | IPFS + Filecoin | Pay per GB | High | Medium |
| **Arweave** | Arweave | One-time AR fee | Permanent by design | Medium |
| **On-chain** | Ethereum | High gas | Permanent | High |

**Recommendation:** Use **nft.storage** — it's the simplest path that satisfies the Filecoin hackathon track ($2K prize) while providing genuinely permanent storage. Zero ongoing subscription cost.

### Metadata JSON Template for NULL NFTs

```json
{
  "name": "NULL — TrustCoat [TIER]",
  "description": "TrustCoat is NULL's inaugural garment — a deconstructed outerwear system with embedded trust verification. Tier [N] of 5.",
  "image": "ipfs://<IMAGE_CID>",
  "external_url": "https://null.fashion",
  "background_color": "0A0A0A",
  "attributes": [
    { "trait_type": "Collection", "value": "Season 01" },
    { "trait_type": "Garment", "value": "TrustCoat" },
    { "trait_type": "Tier", "value": "[0-5]" },
    { "trait_type": "Storage", "value": "Filecoin/IPFS" }
  ]
}
```

---

## Sources

- EIP-1155: https://eips.ethereum.org/EIPS/eip-1155
- OpenSea Metadata Standards: https://docs.opensea.io/docs/metadata-standards
- Pinata Quickstart: https://docs.pinata.cloud/quickstart
- Arweave HTTP API: https://docs.arweave.org/developers/arweave-node-server/http-api
- Storacha (web3.storage): https://storacha.network
- NFT.Storage: https://nft.storage
- SuperRare Help: https://help.superrare.com
- SuperRare 3D Art Guide: https://help.superrare.com/en/articles/4199365-tokenizing-3d-art-on-superrare
