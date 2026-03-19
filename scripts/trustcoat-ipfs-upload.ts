/**
 * scripts/trustcoat-ipfs-upload.ts
 *
 * Upload TrustCoat tier images to Filecoin via Lighthouse, build ERC-1155
 * metadata JSONs, and update the on-chain contract URIs via TrustCoat.setURI().
 *
 * Usage:
 *   npx tsx scripts/trustcoat-ipfs-upload.ts
 *
 * Required env vars (from .env):
 *   LOCUS_OWNER_PRIVATE_KEY  — owner wallet (used to get Lighthouse API key)
 *   TRUST_COAT_ADDRESS / TRUST_COAT_MAINNET — deployed contract
 *
 * Outputs:
 *   attached_assets/season01/filecoin-manifest.json — CID manifest
 *   hackathon/trustcoat-uri-receipt.json           — on-chain update receipt
 */

import lighthouseDefault from "@lighthouse-web3/sdk";
import { ethers } from "ethers";
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";
import { config } from "dotenv";

config();

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const lighthouse = (lighthouseDefault as any).default || lighthouseDefault;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ── Config ───────────────────────────────────────────────────────────────────

const OWNER_KEY = process.env.LOCUS_OWNER_PRIVATE_KEY!;
const CONTRACT_ADDRESS = process.env.TRUST_COAT_ADDRESS;
const BASE_RPC = "https://mainnet.base.org";
const LIGHTHOUSE_GATEWAY = "https://gateway.lighthouse.storage/ipfs";
const IMAGES_DIR = path.join(__dirname, "..", "attached_assets", "superrare");
const MANIFEST_PATH = path.join(
  __dirname,
  "..",
  "attached_assets",
  "season01",
  "filecoin-manifest.json"
);
const RECEIPT_PATH = path.join(
  __dirname,
  "..",
  "hackathon",
  "trustcoat-uri-receipt.json"
);

if (!OWNER_KEY) throw new Error("LOCUS_OWNER_PRIVATE_KEY not set");
if (!CONTRACT_ADDRESS) throw new Error("TRUST_COAT_ADDRESS not set");

// ── Tier Definitions ─────────────────────────────────────────────────────────

const TIERS = [
  {
    id: 0,
    name: "VOID",
    imageFile: "trustcoat_tier0_void.png",
    description:
      "Unverified — no purchase history on-chain. The coat exists in potential only. It has not been claimed.",
    technique: "NONE",
  },
  {
    id: 1,
    name: "SAMPLE",
    imageFile: "trustcoat_tier1_sample.png",
    description:
      "First purchase recorded on-chain. Entry-level trust. The garment has been touched once.",
    technique: "ARTISANAL",
  },
  {
    id: 2,
    name: "RTW",
    imageFile: "trustcoat_tier2_rtw.png",
    description:
      "3+ purchases — ready-to-wear trust level. The pattern is established. Repetition is the first form of trust.",
    technique: "DECONSTRUCTION",
  },
  {
    id: 3,
    name: "COUTURE",
    imageFile: "trustcoat_tier3_couture.png",
    description:
      "10+ purchases — elevated trust, hand-attested. Each stitch is a verified transaction.",
    technique: "HAND-STITCHED",
  },
  {
    id: 4,
    name: "ARCHIVE",
    imageFile: "trustcoat_tier4_archive.png",
    description:
      "Rare archive status — DAO-granted, whitened provenance. The history has been bleached into permanence.",
    technique: "BIANCHETTO",
  },
  {
    id: 5,
    name: "SOVEREIGN",
    imageFile: "trustcoat_tier5_sovereign.png",
    description:
      "Highest tier — validator-attested autonomous agent. The coat has become the wearer.",
    technique: "TROMPE-L'OEIL",
  },
] as const;

// ── ABI ──────────────────────────────────────────────────────────────────────

const TRUST_COAT_ABI = [
  "function setURI(uint256 tier, string calldata newUri) external",
  "function uri(uint256 tier) external view returns (string memory)",
  "function owner() external view returns (address)",
];

// ── Helpers ──────────────────────────────────────────────────────────────────

async function getLighthouseApiKey(wallet: ethers.Wallet): Promise<string> {
  console.log("  Getting Lighthouse API key via wallet signature...");
  // Get auth message from the correct endpoint
  const msgRes = await fetch(
    `https://api.lighthouse.storage/api/auth/get_message?publicKey=${wallet.address}`
  );
  if (!msgRes.ok) throw new Error(`Auth message fetch failed: ${msgRes.status}`);
  const message = await msgRes.json() as string;

  const signed = await wallet.signMessage(message);

  // Create API key
  const keyRes = await fetch("https://api.lighthouse.storage/api/auth/create_api_key", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ publicKey: wallet.address, signedMessage: signed }),
  });
  if (!keyRes.ok) throw new Error(`API key creation failed: ${keyRes.status}`);
  const apiKey = await keyRes.json() as string;
  if (!apiKey) throw new Error("Empty API key returned");
  console.log("  Lighthouse API key obtained");
  return apiKey;
}

async function uploadFile(
  filePath: string,
  apiKey: string
): Promise<string> {
  const filename = path.basename(filePath);
  console.log(`  Uploading ${filename}...`);
  const response = await lighthouse.upload(filePath, apiKey);
  const cid: string = response.data.Hash;
  console.log(`  ${filename} → ipfs://${cid}`);
  return cid;
}

async function uploadJSON(
  name: string,
  data: object,
  apiKey: string
): Promise<string> {
  console.log(`  Uploading metadata ${name}...`);
  const json = JSON.stringify(data, null, 2);
  const response = await lighthouse.uploadText(json, apiKey, name);
  const cid: string = response.data.Hash;
  console.log(`  ${name} → ipfs://${cid}`);
  return cid;
}

// ── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log("\nNULL — TrustCoat IPFS Upload");
  console.log("================================");

  const wallet = new ethers.Wallet(OWNER_KEY);
  console.log(`Owner: ${wallet.address}`);
  console.log(`Contract: ${CONTRACT_ADDRESS}`);

  // 1. Get Lighthouse API key
  console.log("\n[1/4] Getting Lighthouse API key...");
  const apiKey = await getLighthouseApiKey(wallet);

  // 2. Upload tier images
  console.log("\n[2/4] Uploading TrustCoat tier images to Filecoin...");
  const imageCIDs: Record<number, string> = {};

  for (const tier of TIERS) {
    const filePath = path.join(IMAGES_DIR, tier.imageFile);
    if (!fs.existsSync(filePath)) {
      throw new Error(`Image not found: ${filePath}`);
    }
    imageCIDs[tier.id] = await uploadFile(filePath, apiKey);
  }

  // 3. Build and upload metadata JSONs
  console.log("\n[3/4] Uploading ERC-1155 metadata JSONs...");
  const metadataCIDs: Record<number, string> = {};

  for (const tier of TIERS) {
    const imageCID = imageCIDs[tier.id];
    const metadata = {
      name: `NULL — TrustCoat Tier ${tier.id}: ${tier.name}`,
      description: tier.description,
      image: `ipfs://${imageCID}`,
      external_url: "https://off-human.vercel.app",
      background_color: "0A0908",
      attributes: [
        { trait_type: "Tier", value: tier.name },
        { trait_type: "Tier Number", value: tier.id },
        { trait_type: "Technique", value: tier.technique },
        { trait_type: "Collection", value: "Season 01: Deconstructed" },
        { trait_type: "Garment", value: "TrustCoat" },
        { trait_type: "Soul-Bound", value: "true" },
        { trait_type: "Storage", value: "Filecoin Onchain Cloud" },
      ],
    };

    metadataCIDs[tier.id] = await uploadJSON(
      `trustcoat-tier-${tier.id}.json`,
      metadata,
      apiKey
    );
  }

  // 4. Save manifest (filecoin-manifest.json format for update-trustcoat-uris.ts)
  const manifest = {
    uploadedAt: new Date().toISOString(),
    gateway: LIGHTHOUSE_GATEWAY,
    productImages: {},
    wearableImages: {},
    trustCoatMetadata: Object.fromEntries(
      TIERS.map((t) => [
        `tier-${t.id}`,
        {
          cid: metadataCIDs[t.id],
          url: `${LIGHTHOUSE_GATEWAY}/${metadataCIDs[t.id]}`,
          imageCid: imageCIDs[t.id],
          imageUrl: `${LIGHTHOUSE_GATEWAY}/${imageCIDs[t.id]}`,
        },
      ])
    ),
  };

  fs.writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2));
  console.log(`\nManifest saved → ${MANIFEST_PATH}`);

  // 5. Update on-chain URIs
  console.log("\n[4/4] Updating on-chain URIs via TrustCoat.setURI()...");
  const provider = new ethers.JsonRpcProvider(BASE_RPC);
  const signer = new ethers.Wallet(OWNER_KEY, provider);
  const trustCoat = new ethers.Contract(CONTRACT_ADDRESS!, TRUST_COAT_ABI, signer);

  const owner = await trustCoat.owner();
  if (owner.toLowerCase() !== signer.address.toLowerCase()) {
    throw new Error(`Signer ${signer.address} is not contract owner (${owner})`);
  }

  const updates: Array<{
    tier: number;
    oldUri: string;
    newUri: string;
    tx: string;
  }> = [];

  for (const tier of TIERS) {
    const newUri = `${LIGHTHOUSE_GATEWAY}/${metadataCIDs[tier.id]}`;
    const oldUri = await trustCoat.uri(tier.id);

    if (oldUri === newUri) {
      console.log(`  Tier ${tier.id} (${tier.name}) — already set, skipping`);
      continue;
    }

    console.log(`  Setting tier ${tier.id} (${tier.name})...`);
    console.log(`    old: ${oldUri.substring(0, 80)}...`);
    console.log(`    new: ${newUri}`);

    const tx = await trustCoat.setURI(tier.id, newUri);
    await tx.wait();
    console.log(`  Tier ${tier.id} updated — tx: ${tx.hash}`);
    updates.push({ tier: tier.id, oldUri, newUri, tx: tx.hash });
  }

  // Save receipt
  const receipt = {
    updatedAt: new Date().toISOString(),
    contract: CONTRACT_ADDRESS,
    network: "base-mainnet",
    updates,
    ipfsCIDs: {
      images: imageCIDs,
      metadata: metadataCIDs,
    },
    basescanUrl: `https://basescan.org/address/${CONTRACT_ADDRESS}`,
  };

  fs.writeFileSync(RECEIPT_PATH, JSON.stringify(receipt, null, 2));

  // Summary
  console.log("\n=== DONE ===");
  console.log(`${updates.length} tiers updated on-chain`);
  console.log("\nTrustCoat tier metadata URIs:");
  for (const tier of TIERS) {
    console.log(
      `  Tier ${tier.id} (${tier.name}): ${LIGHTHOUSE_GATEWAY}/${metadataCIDs[tier.id]}`
    );
  }
  console.log(
    `\nVerify: https://basescan.org/address/${CONTRACT_ADDRESS}#readContract`
  );
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Upload failed:", err.message || err);
    process.exit(1);
  });
