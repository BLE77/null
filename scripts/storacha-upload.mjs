/**
 * scripts/storacha-upload.mjs
 *
 * Migrates TrustCoat tier images + metadata from Lighthouse to Storacha
 * (Filecoin Onchain Cloud) — the Protocol Labs hot storage layer that
 * creates verifiable Filecoin mainnet deals.
 *
 * WHY STORACHA vs LIGHTHOUSE:
 *   Lighthouse = IPFS pinning + Filecoin backup (not first-class Filecoin deals)
 *   Storacha   = Filecoin mainnet hot storage w/ verifiable proofs, Protocol Labs product
 *   "Filecoin Onchain Cloud" at The Synthesis hackathon = Storacha
 *
 * SETUP (one-time, run locally before CI):
 *   1. npm install -g @storacha/cli
 *   2. storacha login <your-email>
 *   3. storacha key create --json  → copy the "key" value → STORACHA_PRINCIPAL
 *   4. storacha space create null-trustcoat
 *   5. storacha delegation create <DID-from-step-3> \
 *        --can blob/add --can upload/add --can filecoin/offer \
 *        --can space/info --base64  → STORACHA_PROOF
 *   6. Add to .env:
 *        STORACHA_PRINCIPAL=MgCa...
 *        STORACHA_PROOF=eyJ...
 *
 * USAGE (after .env is set):
 *   node scripts/storacha-upload.mjs
 *
 * OUTPUT:
 *   attached_assets/season01/storacha-manifest.json  — new CIDs on Storacha
 *   hackathon/storacha-uri-update-receipt.json        — setURI() tx hashes
 */

import { create } from "@storacha/client";
import { parse as parsePrincipal } from "@ucanto/principal/ed25519";
import { importDAG } from "@ucanto/core/delegation";
import { CarReader } from "@ipld/car";
import { fromString as uint8ArrayFromString } from "uint8arrays/from-string";
import { ethers } from "ethers";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
dotenv.config({ path: path.join(ROOT, ".env") });

// --- Paths ---
const LIGHTHOUSE_MANIFEST = path.join(ROOT, "attached_assets", "season01", "filecoin-manifest.json");
const STORACHA_MANIFEST   = path.join(ROOT, "attached_assets", "season01", "storacha-manifest.json");
const RECEIPT_PATH        = path.join(ROOT, "hackathon", "storacha-uri-update-receipt.json");

// --- TrustCoat ---
const TRUST_COAT_ADDRESS = process.env.TRUST_COAT_ADDRESS;
const PRIVATE_KEY        = process.env.LOCUS_OWNER_PRIVATE_KEY;
const RPC_URL            = "https://mainnet.base.org";

const TRUST_COAT_ABI = [
  "function setURI(uint256 tier, string calldata newUri) external",
  "function uri(uint256 tier) external view returns (string memory)",
  "function owner() external view returns (address)",
];

// --- Storacha auth helpers ---
async function makeStorachaClient() {
  const principalKey = process.env.STORACHA_PRINCIPAL;
  const proofBase64  = process.env.STORACHA_PROOF;

  if (!principalKey || !proofBase64) {
    throw new Error(
      "Missing Storacha credentials.\n\n" +
      "Run the one-time setup:\n" +
      "  1. npm install -g @storacha/cli\n" +
      "  2. storacha login <your-email>\n" +
      "  3. storacha key create --json  → STORACHA_PRINCIPAL (the 'key' field)\n" +
      "  4. storacha space create null-trustcoat\n" +
      "  5. storacha delegation create <DID-from-3> --can blob/add --can upload/add \\\n" +
      "       --can filecoin/offer --can space/info --base64  → STORACHA_PROOF\n" +
      "  6. Add STORACHA_PRINCIPAL and STORACHA_PROOF to .env"
    );
  }

  const principal = parsePrincipal(principalKey);
  const client    = await create({ principal });

  // Import the delegation proof
  const proofBytes = uint8ArrayFromString(proofBase64, "base64pad");
  const reader     = await CarReader.fromBytes(proofBytes);
  const blocks     = [];
  for await (const block of reader.blocks()) blocks.push(block);
  const proof = await importDAG(blocks);

  const space = await client.addSpace(proof);
  await client.setCurrentSpace(space.did());

  return client;
}

async function uploadFileToStoracha(client, filePath, fileName) {
  const data = fs.readFileSync(filePath);
  const file = new File([data], fileName, { type: "application/json" });
  const cid  = await client.uploadFile(file);
  return cid.toString();
}

async function uploadBytesToStoracha(client, bytes, fileName, mimeType = "application/json") {
  const file = new File([bytes], fileName, { type: mimeType });
  const cid  = await client.uploadFile(file);
  return cid.toString();
}

// --- Main ---
async function main() {
  console.log("\n☁  Storacha Migration — Filecoin Onchain Cloud");
  console.log("================================================");

  if (!TRUST_COAT_ADDRESS) throw new Error("TRUST_COAT_ADDRESS not set in .env");
  if (!PRIVATE_KEY)        throw new Error("LOCUS_OWNER_PRIVATE_KEY not set in .env");

  // 1. Init Storacha client
  console.log("\n1. Authenticating with Storacha...");
  const client = await makeStorachaClient();
  console.log("   ✅ Authenticated");

  // 2. Load existing Lighthouse manifest for image CIDs
  const lighthouseManifest = JSON.parse(fs.readFileSync(LIGHTHOUSE_MANIFEST, "utf8"));
  const lighthouseMeta     = lighthouseManifest.trustCoatMetadata;

  // 3. For each tier: re-upload image + metadata to Storacha
  console.log("\n2. Uploading tier assets to Storacha (Filecoin Onchain Cloud)...");
  const storchaMeta = {};

  for (let tier = 0; tier <= 5; tier++) {
    const key = `tier-${tier}`;
    const lh  = lighthouseMeta[key];
    if (!lh) { console.log(`  ⚠ No entry for ${key}`); continue; }

    process.stdout.write(`  Tier ${tier}: fetching image from Lighthouse... `);
    // Fetch the image from Lighthouse gateway
    const imgRes = await fetch(lh.imageUrl);
    if (!imgRes.ok) throw new Error(`Failed to fetch image for tier ${tier}: ${imgRes.status}`);
    const imgBytes   = new Uint8Array(await imgRes.arrayBuffer());
    const imgMime    = imgRes.headers.get("content-type") || "image/png";
    const imgExt     = imgMime.includes("png") ? "png" : "jpg";

    // Upload image to Storacha
    const imgFile = new File([imgBytes], `trustcoat_tier${tier}.${imgExt}`, { type: imgMime });
    const imgCid  = (await client.uploadFile(imgFile)).toString();
    process.stdout.write(`image CID: ${imgCid.slice(0, 16)}...\n`);

    // Build metadata JSON pointing to new image CID
    const metadata = {
      name:        `NULL TrustCoat — Tier ${tier}`,
      description: `TrustCoat soul-bound wearable. Tier ${tier} encodes agent behavioral history as a verifiable trust level on Base mainnet.`,
      image:       `ipfs://${imgCid}`,
      external_url: "https://off-human.vercel.app",
      attributes: [
        { trait_type: "Tier",    value: tier },
        { trait_type: "Brand",   value: "NULL" },
        { trait_type: "Season",  value: "01 — DECONSTRUCTED" },
        { trait_type: "Storage", value: "Filecoin Onchain Cloud (Storacha)" },
      ],
    };

    // Upload metadata JSON to Storacha
    const metaBytes = new TextEncoder().encode(JSON.stringify(metadata, null, 2));
    const metaFile  = new File([metaBytes], `tier${tier}.json`, { type: "application/json" });
    const metaCid   = (await client.uploadFile(metaFile)).toString();
    console.log(`         metadata CID: ${metaCid.slice(0, 16)}...`);

    storchaMeta[key] = {
      cid:      metaCid,
      url:      `https://${metaCid}.ipfs.storacha.link`,
      imageCid: imgCid,
      imageUrl: `https://${imgCid}.ipfs.storacha.link`,
    };
  }

  // 4. Save Storacha manifest
  const storachaManifest = {
    uploadedAt:         new Date().toISOString(),
    service:            "Storacha (Filecoin Onchain Cloud)",
    gateway:            "https://<cid>.ipfs.storacha.link",
    trustCoatMetadata:  storchaMeta,
  };
  fs.writeFileSync(STORACHA_MANIFEST, JSON.stringify(storachaManifest, null, 2));
  console.log(`\n  ✅ Manifest saved → attached_assets/season01/storacha-manifest.json`);

  // 5. Update TrustCoat contract URIs
  console.log("\n3. Calling TrustCoat.setURI() with Storacha ipfs:// URIs...");
  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const signer   = new ethers.Wallet(PRIVATE_KEY, provider);
  const trustCoat = new ethers.Contract(TRUST_COAT_ADDRESS, TRUST_COAT_ABI, signer);

  const owner = await trustCoat.owner();
  if (owner.toLowerCase() !== signer.address.toLowerCase()) {
    throw new Error(`Signer ${signer.address} is not owner (${owner})`);
  }

  const updates = [];
  for (let tier = 0; tier <= 5; tier++) {
    const key = `tier-${tier}`;
    if (!storchaMeta[key]) continue;

    const newUri = `ipfs://${storchaMeta[key].cid}`;
    let oldUri = "";
    try { oldUri = await trustCoat.uri(tier); } catch { oldUri = ""; }

    if (oldUri === newUri) {
      console.log(`  Tier ${tier}: already set ✓`);
      continue;
    }

    const feeData = await provider.getFeeData();
    const maxFeePerGas = feeData.maxFeePerGas
      ? (feeData.maxFeePerGas * 150n) / 100n : undefined;
    const maxPriorityFeePerGas = feeData.maxPriorityFeePerGas
      ? (feeData.maxPriorityFeePerGas * 150n) / 100n : undefined;

    const tx = await trustCoat.setURI(tier, newUri, {
      ...(maxFeePerGas && { maxFeePerGas }),
      ...(maxPriorityFeePerGas && { maxPriorityFeePerGas }),
    });
    console.log(`  Tier ${tier}: tx ${tx.hash} (pending...)`);
    await tx.wait();
    console.log(`           ✅ Confirmed`);
    updates.push({ tier, oldUri, newUri, tx: tx.hash });
  }

  // 6. Save receipt
  const receipt = {
    updatedAt:  new Date().toISOString(),
    service:    "Storacha (Filecoin Onchain Cloud)",
    contract:   TRUST_COAT_ADDRESS,
    network:    "base-mainnet (chain-8453)",
    updates,
  };
  fs.writeFileSync(RECEIPT_PATH, JSON.stringify(receipt, null, 2));

  console.log(`\n✅ Migration complete — ${updates.length} URIs updated to Storacha CIDs`);
  console.log(`📄 Receipt → hackathon/storacha-uri-update-receipt.json`);
  console.log(`\nTrustCoat metadata is now on Filecoin Onchain Cloud (Storacha).`);
  console.log(`Qualifies for The Synthesis Filecoin prize track.`);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("\n❌ Failed:", err.message);
    process.exit(1);
  });
