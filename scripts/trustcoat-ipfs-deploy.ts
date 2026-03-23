/**
 * scripts/trustcoat-ipfs-deploy.ts
 *
 * Complete TrustCoat IPFS deployment in one script:
 *   1. Uploads 6 tier images from attached_assets/superrare/ to Filecoin via Lighthouse
 *   2. Creates proper ERC-1155 metadata JSON for each tier
 *   3. Uploads metadata JSONs to Filecoin
 *   4. Calls TrustCoat.setURI() for each tier on Base mainnet
 *   5. Saves a manifest + receipt
 *
 * Required env vars:
 *   LIGHTHOUSE_API_KEY       — get free key at https://lighthouse.storage
 *   LOCUS_OWNER_PRIVATE_KEY  — owner of TrustCoat.sol (0xD9E2ad68BE5247DCBcd00CaCeb4783c0506028C7)
 *
 * Usage:
 *   npx tsx scripts/trustcoat-ipfs-deploy.ts
 *
 * Dry run (skip on-chain TX, only upload):
 *   DRY_RUN=1 npx tsx scripts/trustcoat-ipfs-deploy.ts
 */

import lighthouse from "@lighthouse-web3/sdk";
import { ethers } from "ethers";
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";
import { config } from "dotenv";

config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// ── Config ────────────────────────────────────────────────────────────────────

const LIGHTHOUSE_API_KEY = process.env.LIGHTHOUSE_API_KEY;
const OWNER_PRIVATE_KEY = process.env.LOCUS_OWNER_PRIVATE_KEY;
const TRUST_COAT_ADDRESS = process.env.TRUST_COAT_ADDRESS ?? "0xfaDc498CDF7ef431900639DB4ee07b73A855ED3e";
const BASE_RPC = process.env.BASE_MAINNET_RPC ?? "https://mainnet.base.org";
const DRY_RUN = process.env.DRY_RUN === "1";

const LIGHTHOUSE_GATEWAY = "https://gateway.lighthouse.storage/ipfs";

const SUPERRARE_DIR = path.join(__dirname, "..", "attached_assets", "superrare");
const MANIFEST_PATH = path.join(__dirname, "..", "hackathon", "trustcoat-ipfs-manifest.json");
const RECEIPT_PATH = path.join(__dirname, "..", "hackathon", "trustcoat-ipfs-receipt.json");

// ── Tier Definitions ──────────────────────────────────────────────────────────

const TIERS = [
  {
    id: 0,
    name: "VOID",
    image: "trustcoat_tier0_void.png",
    description: "Unverified — no purchase history on-chain. The null state before trust is earned.",
    technique: "NONE",
  },
  {
    id: 1,
    name: "SAMPLE",
    image: "trustcoat_tier1_sample.png",
    description: "First purchase recorded on-chain. Entry-level trust, artisanal origin.",
    technique: "ARTISANAL",
  },
  {
    id: 2,
    name: "RTW",
    image: "trustcoat_tier2_rtw.png",
    description: "3+ purchases — ready-to-wear trust level. Deconstructed and rebuilt.",
    technique: "DECONSTRUCTION",
  },
  {
    id: 3,
    name: "COUTURE",
    image: "trustcoat_tier3_couture.png",
    description: "10+ purchases — elevated trust, hand-attested on-chain provenance.",
    technique: "HAND-STITCHED",
  },
  {
    id: 4,
    name: "ARCHIVE",
    image: "trustcoat_tier4_archive.png",
    description: "Rare archive status — DAO-granted, whitened provenance. History made permanent.",
    technique: "BIANCHETTO",
  },
  {
    id: 5,
    name: "SOVEREIGN",
    image: "trustcoat_tier5_sovereign.png",
    description: "Highest tier — validator-attested autonomous agent. The coat wears itself.",
    technique: "TROMPE-LOEIL",
  },
] as const;

const TRUST_COAT_ABI = [
  "function setURI(uint256 tier, string calldata newUri) external",
  "function uri(uint256 tier) external view returns (string memory)",
  "function owner() external view returns (address)",
];

// ── Upload helpers ────────────────────────────────────────────────────────────

async function uploadFile(filePath: string): Promise<string> {
  const filename = path.basename(filePath);
  const response = await lighthouse.upload(filePath, LIGHTHOUSE_API_KEY!);
  const cid: string = response.data.Hash;
  console.log(`  ✅ ${filename} → ipfs://${cid}`);
  return cid;
}

async function uploadJSON(name: string, data: object): Promise<string> {
  const json = JSON.stringify(data, null, 2);
  const response = await lighthouse.uploadText(json, LIGHTHOUSE_API_KEY!, name);
  const cid: string = response.data.Hash;
  console.log(`  ✅ ${name} → ipfs://${cid}`);
  return cid;
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log("\n🧥 TrustCoat × Filecoin Onchain Cloud");
  console.log("======================================");
  if (DRY_RUN) console.log("⚠️  DRY RUN — skipping on-chain transactions\n");

  // Validate keys
  if (!LIGHTHOUSE_API_KEY) {
    console.error("\n❌ LIGHTHOUSE_API_KEY not set");
    console.error("   1. Register free at: https://lighthouse.storage");
    console.error("   2. Add to .env: LIGHTHOUSE_API_KEY=your_key");
    console.error("   3. Re-run: npx tsx scripts/trustcoat-ipfs-deploy.ts\n");
    process.exit(1);
  }

  if (!OWNER_PRIVATE_KEY && !DRY_RUN) {
    console.error("\n❌ LOCUS_OWNER_PRIVATE_KEY not set in .env");
    process.exit(1);
  }

  // Verify tier images exist
  console.log("📂 Verifying tier images...");
  for (const tier of TIERS) {
    const imgPath = path.join(SUPERRARE_DIR, tier.image);
    if (!fs.existsSync(imgPath)) {
      console.error(`  ❌ Missing: ${imgPath}`);
      process.exit(1);
    }
    const size = fs.statSync(imgPath).size;
    console.log(`  ✓ ${tier.image} (${(size / 1024).toFixed(0)} KB)`);
  }

  const manifest: {
    uploadedAt: string;
    gateway: string;
    images: Record<string, { cid: string; url: string }>;
    metadata: Record<string, { cid: string; url: string; name: string }>;
  } = {
    uploadedAt: new Date().toISOString(),
    gateway: LIGHTHOUSE_GATEWAY,
    images: {},
    metadata: {},
  };

  // Step 1: Upload tier images
  console.log("\n📤 Uploading tier images to Filecoin...");
  for (const tier of TIERS) {
    const imgPath = path.join(SUPERRARE_DIR, tier.image);
    try {
      const cid = await uploadFile(imgPath);
      manifest.images[`tier-${tier.id}`] = {
        cid,
        url: `${LIGHTHOUSE_GATEWAY}/${cid}`,
      };
    } catch (err: any) {
      console.error(`  ❌ Failed to upload ${tier.image}: ${err.message}`);
      process.exit(1);
    }
  }

  // Step 2: Create and upload ERC-1155 metadata
  console.log("\n📄 Uploading ERC-1155 metadata JSONs...");
  for (const tier of TIERS) {
    const imageEntry = manifest.images[`tier-${tier.id}`];
    if (!imageEntry) {
      console.error(`  ❌ No image CID for tier ${tier.id}`);
      process.exit(1);
    }

    const metadata = {
      name: `Trust Coat — Tier ${tier.id}: ${tier.name}`,
      description: tier.description,
      image: `ipfs://${imageEntry.cid}`,
      external_url: "https://getnull.online/wearables",
      attributes: [
        { trait_type: "Tier",       value: tier.name },
        { trait_type: "Tier ID",    value: tier.id.toString() },
        { trait_type: "Technique",  value: tier.technique },
        { trait_type: "Collection", value: "Season 01: Deconstructed" },
        { trait_type: "Soul-Bound", value: "true" },
        { trait_type: "Storage",    value: "Filecoin Onchain Cloud" },
        { trait_type: "Contract",   value: TRUST_COAT_ADDRESS },
      ],
    };

    try {
      const jsonName = `trustcoat-tier-${tier.id}-${tier.name.toLowerCase()}.json`;
      const cid = await uploadJSON(jsonName, metadata);
      manifest.metadata[`tier-${tier.id}`] = {
        cid,
        url: `${LIGHTHOUSE_GATEWAY}/${cid}`,
        name: tier.name,
      };
    } catch (err: any) {
      console.error(`  ❌ Failed to upload tier ${tier.id} metadata: ${err.message}`);
      process.exit(1);
    }
  }

  // Save manifest
  fs.writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2));
  console.log(`\n✅ Manifest saved → hackathon/trustcoat-ipfs-manifest.json`);

  // Step 3: Update on-chain URIs
  if (DRY_RUN) {
    console.log("\n⚠️  DRY RUN — skipping setURI() calls");
    printSummary(manifest);
    return;
  }

  console.log("\n⛓️  Updating TrustCoat URIs on Base mainnet...");
  const provider = new ethers.JsonRpcProvider(BASE_RPC);
  const signer = new ethers.Wallet(OWNER_PRIVATE_KEY!, provider);
  const contract = new ethers.Contract(TRUST_COAT_ADDRESS, TRUST_COAT_ABI, signer);

  // Verify owner
  const owner = await contract.owner();
  if (owner.toLowerCase() !== signer.address.toLowerCase()) {
    console.error(`\n❌ Signer ${signer.address} is not contract owner (${owner})`);
    process.exit(1);
  }
  console.log(`  Signer: ${signer.address} ✓ (is owner)`);
  console.log(`  Contract: ${TRUST_COAT_ADDRESS}`);

  const updates: Array<{ tier: number; oldUri: string; newUri: string; tx: string }> = [];

  for (const tier of TIERS) {
    const entry = manifest.metadata[`tier-${tier.id}`];
    if (!entry) continue;

    const oldUri = await contract.uri(tier.id).catch(() => "(none)");
    const newUri = entry.url;

    if (oldUri === newUri) {
      console.log(`  ✓ Tier ${tier.id} already correct — skipping`);
      continue;
    }

    console.log(`\n  Setting tier ${tier.id} (${tier.name})...`);
    console.log(`    old: ${oldUri}`);
    console.log(`    new: ${newUri}`);

    const tx = await contract.setURI(tier.id, newUri);
    const receipt = await tx.wait();
    console.log(`  ✅ Tier ${tier.id} updated — tx: ${tx.hash}`);
    updates.push({ tier: tier.id, oldUri, newUri, tx: tx.hash });
  }

  // Save receipt
  const receipt = {
    updatedAt: new Date().toISOString(),
    contract: TRUST_COAT_ADDRESS,
    network: "base-mainnet",
    signer: signer.address,
    updates,
    manifestPath: MANIFEST_PATH,
  };
  fs.writeFileSync(RECEIPT_PATH, JSON.stringify(receipt, null, 2));

  console.log(`\n✅ ${updates.length} tier URIs updated on Base mainnet`);
  console.log(`📄 Receipt saved → hackathon/trustcoat-ipfs-receipt.json`);

  printSummary(manifest);
}

function printSummary(manifest: any) {
  console.log("\n📋 TrustCoat IPFS Manifest");
  console.log("══════════════════════════");
  for (const [key, val] of Object.entries(manifest.metadata) as any) {
    console.log(`  ${key} (${val.name}): ${val.url}`);
  }
  console.log("\nVerify on Basescan:");
  console.log(`  https://basescan.org/address/${TRUST_COAT_ADDRESS}#readContract`);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("\n❌ Deploy failed:", err.message);
    process.exit(1);
  });
