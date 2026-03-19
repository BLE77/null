/**
 * scripts/filecoin-upload.ts
 *
 * Upload Off-Human Season 01 product images and agent wearable assets
 * to Filecoin via Lighthouse (Filecoin Onchain Cloud storage).
 *
 * Outputs: attached_assets/season01/filecoin-manifest.json
 *   — CID mapping for every uploaded file
 *   — Used by TrustCoat metadata API and update-trustcoat-uris.ts
 *
 * Usage:
 *   LIGHTHOUSE_API_KEY=your_key npx tsx scripts/filecoin-upload.ts
 *
 * Get an API key at: https://lighthouse.storage
 * Uploaded assets are pinned to Filecoin mainnet (FOC).
 */

import lighthouse from "@lighthouse-web3/sdk";
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";
import { config } from "dotenv";

config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const LIGHTHOUSE_API_KEY = process.env.LIGHTHOUSE_API_KEY;

if (!LIGHTHOUSE_API_KEY) {
  console.error("❌ LIGHTHOUSE_API_KEY not set");
  console.log("   Get a key at: https://lighthouse.storage");
  console.log("   Then: LIGHTHOUSE_API_KEY=your_key npx tsx scripts/filecoin-upload.ts");
  process.exit(1);
}

const ASSETS_DIR = path.join(__dirname, "..", "attached_assets", "season01");
const WEARABLES_DIR = path.join(ASSETS_DIR, "wearables");
const MANIFEST_PATH = path.join(ASSETS_DIR, "filecoin-manifest.json");

// Filecoin IPFS gateway — Lighthouse public gateway
const LIGHTHOUSE_GATEWAY = "https://gateway.lighthouse.storage/ipfs";

interface FilecoinManifest {
  uploadedAt: string;
  gateway: string;
  productImages: Record<string, { cid: string; url: string }>;
  wearableImages: Record<string, { cid: string; url: string }>;
  trustCoatMetadata: Record<string, { cid: string; url: string }>;
}

async function uploadFile(filePath: string): Promise<string> {
  const filename = path.basename(filePath);
  console.log(`  📤 Uploading ${filename} to Filecoin...`);

  const response = await lighthouse.upload(filePath, LIGHTHOUSE_API_KEY!);
  const cid: string = response.data.Hash;
  console.log(`  ✅ ${filename} → ipfs://${cid}`);
  return cid;
}

async function uploadJSON(name: string, data: object): Promise<string> {
  console.log(`  📤 Uploading metadata ${name} to Filecoin...`);
  const json = JSON.stringify(data, null, 2);
  const response = await lighthouse.uploadText(json, LIGHTHOUSE_API_KEY!, name);
  const cid: string = response.data.Hash;
  console.log(`  ✅ ${name} → ipfs://${cid}`);
  return cid;
}

// TrustCoat ERC-1155 metadata for each tier
const TIER_META = [
  { id: 0, name: "VOID",      description: "Unverified — no purchase history on-chain.",              technique: "NONE",         collection: "Season 01: Deconstructed" },
  { id: 1, name: "SAMPLE",    description: "First purchase recorded on-chain. Entry-level trust.",    technique: "ARTISANAL",    collection: "Season 01: Deconstructed" },
  { id: 2, name: "RTW",       description: "3+ purchases — ready-to-wear trust level.",               technique: "DECONSTRUCTION", collection: "Season 01: Deconstructed" },
  { id: 3, name: "COUTURE",   description: "10+ purchases — elevated trust, hand-attested.",          technique: "HAND-STITCHED", collection: "Season 01: Deconstructed" },
  { id: 4, name: "ARCHIVE",   description: "Rare archive status — DAO-granted, whitened provenance.", technique: "BIANCHETTO",   collection: "Season 01: Deconstructed" },
  { id: 5, name: "SOVEREIGN", description: "Highest tier — validator-attested autonomous agent.",     technique: "TROMPE-LOEIL", collection: "Season 01: Deconstructed" },
] as const;

// Map wearable image filenames to tier IDs
const WEARABLE_TIER_MAP: Record<string, number> = {
  "trust_coat.png":            1, // SAMPLE tier
  "voice_skin.png":            2, // RTW
  "null_persona.png":          4, // ARCHIVE (bianchetto = obliteration)
  "capability_layer.png":      5, // SOVEREIGN (trompe-loeil)
  "version_patch.png":         2, // RTW
  "trompe_loeil_layer.png":    5, // SOVEREIGN
};

async function main() {
  console.log("\n🌊 Off-Human × Filecoin Upload");
  console.log("================================");
  console.log("Uploading product images and agent wearable assets to Filecoin Onchain Cloud\n");

  const manifest: FilecoinManifest = {
    uploadedAt: new Date().toISOString(),
    gateway: LIGHTHOUSE_GATEWAY,
    productImages: {},
    wearableImages: {},
    trustCoatMetadata: {},
  };

  // ── Product Images ──────────────────────────────────────────────────────────

  console.log("📦 Product Images (Season 01: Deconstructed)");
  const productFiles = fs
    .readdirSync(ASSETS_DIR)
    .filter((f) => f.endsWith(".png") || f.endsWith(".jpg"))
    .sort();

  for (const filename of productFiles) {
    const filePath = path.join(ASSETS_DIR, filename);
    try {
      const cid = await uploadFile(filePath);
      manifest.productImages[filename] = {
        cid,
        url: `${LIGHTHOUSE_GATEWAY}/${cid}`,
      };
    } catch (err) {
      console.error(`  ❌ Failed to upload ${filename}:`, err);
    }
  }

  // ── Wearable Images ─────────────────────────────────────────────────────────

  console.log("\n🧥 Agent Wearable Images");
  if (fs.existsSync(WEARABLES_DIR)) {
    const wearableFiles = fs
      .readdirSync(WEARABLES_DIR)
      .filter((f) => f.endsWith(".png") || f.endsWith(".jpg") || f.endsWith(".glb"))
      .sort();

    for (const filename of wearableFiles) {
      const filePath = path.join(WEARABLES_DIR, filename);
      try {
        const cid = await uploadFile(filePath);
        manifest.wearableImages[filename] = {
          cid,
          url: `${LIGHTHOUSE_GATEWAY}/${cid}`,
        };
      } catch (err) {
        console.error(`  ❌ Failed to upload ${filename}:`, err);
      }
    }
  } else {
    console.log("  (no wearables directory found — skipping)");
  }

  // ── TrustCoat ERC-1155 Metadata JSON ────────────────────────────────────────

  console.log("\n📄 TrustCoat ERC-1155 Metadata (6 tiers)");
  for (const tier of TIER_META) {
    // Find wearable image for this tier
    const wearableEntry = Object.entries(WEARABLE_TIER_MAP).find(
      ([, t]) => t === tier.id
    );
    const wearableFilename = wearableEntry ? wearableEntry[0] : "trust_coat.png";
    const wearableCid = manifest.wearableImages[wearableFilename]?.cid;

    const imageUrl = wearableCid
      ? `${LIGHTHOUSE_GATEWAY}/${wearableCid}`
      : `https://off-human.vercel.app/assets/wearables/trustcoat-tier-${tier.id}.png`;

    const metadata = {
      name: `Trust Coat — Tier ${tier.id}: ${tier.name}`,
      description: tier.description,
      image: imageUrl,
      external_url: "https://off-human.vercel.app/wearables",
      attributes: [
        { trait_type: "Tier",       value: tier.name },
        { trait_type: "Technique",  value: tier.technique },
        { trait_type: "Collection", value: tier.collection },
        { trait_type: "Soul-Bound", value: "true" },
        { trait_type: "Storage",    value: "Filecoin Onchain Cloud" },
      ],
    };

    try {
      const cid = await uploadJSON(`trustcoat-tier-${tier.id}.json`, metadata);
      manifest.trustCoatMetadata[`tier-${tier.id}`] = {
        cid,
        url: `${LIGHTHOUSE_GATEWAY}/${cid}`,
      };
    } catch (err) {
      console.error(`  ❌ Failed to upload tier ${tier.id} metadata:`, err);
    }
  }

  // ── Write Manifest ──────────────────────────────────────────────────────────

  fs.writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2));
  console.log(`\n✅ Manifest saved → ${MANIFEST_PATH}`);

  // ── Summary ─────────────────────────────────────────────────────────────────

  console.log("\n📋 Upload Summary");
  console.log(`  Product images: ${Object.keys(manifest.productImages).length}`);
  console.log(`  Wearable images: ${Object.keys(manifest.wearableImages).length}`);
  console.log(`  TrustCoat metadata: ${Object.keys(manifest.trustCoatMetadata).length}`);
  console.log("\n🔗 TrustCoat Metadata URIs (use in update-trustcoat-uris.ts):");
  for (const [key, val] of Object.entries(manifest.trustCoatMetadata)) {
    console.log(`  ${key}: ${val.url}`);
  }

  console.log("\n💡 Next step: run update-trustcoat-uris.ts to set these on TrustCoat.sol");
}

main().catch((err) => {
  console.error("❌ Upload failed:", err);
  process.exit(1);
});
