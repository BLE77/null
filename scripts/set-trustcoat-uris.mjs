/**
 * scripts/set-trustcoat-uris.mjs
 *
 * Calls TrustCoat.setURI() for each tier using ipfs:// URIs from filecoin-manifest.json.
 * Runs with Node 20 (no Hardhat required — direct ethers.js).
 *
 * Usage:
 *   node scripts/set-trustcoat-uris.mjs
 *
 * Required env vars (from .env):
 *   LOCUS_OWNER_PRIVATE_KEY  — owner wallet of TrustCoat.sol
 *   TRUST_COAT_ADDRESS       — deployed TrustCoat contract address
 */

import { ethers } from "ethers";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");

dotenv.config({ path: path.join(ROOT, ".env") });

const MANIFEST_PATH = path.join(ROOT, "attached_assets", "season01", "filecoin-manifest.json");
const RECEIPT_PATH = path.join(ROOT, "hackathon", "filecoin-uri-update-receipt.json");

const TRUST_COAT_ABI = [
  "function setURI(uint256 tier, string calldata newUri) external",
  "function uri(uint256 tier) external view returns (string memory)",
  "function owner() external view returns (address)",
];

const RPC_URL = "https://mainnet.base.org";

async function main() {
  const privateKey = process.env.LOCUS_OWNER_PRIVATE_KEY;
  const contractAddress = process.env.TRUST_COAT_ADDRESS;

  if (!privateKey) throw new Error("LOCUS_OWNER_PRIVATE_KEY not set in .env");
  if (!contractAddress) throw new Error("TRUST_COAT_ADDRESS not set in .env");

  if (!fs.existsSync(MANIFEST_PATH)) {
    throw new Error(`filecoin-manifest.json not found at ${MANIFEST_PATH}`);
  }

  const manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, "utf8"));
  const trustCoatMetadata = manifest.trustCoatMetadata;

  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const signer = new ethers.Wallet(privateKey, provider);
  const network = await provider.getNetwork();

  console.log("\n🔗 TrustCoat URI Update — Filecoin / IPFS");
  console.log("==========================================");
  console.log(`Network:  chain ${network.chainId} (Base Mainnet)`);
  console.log(`Signer:   ${signer.address}`);
  console.log(`Contract: ${contractAddress}`);

  const trustCoat = new ethers.Contract(contractAddress, TRUST_COAT_ABI, signer);

  const owner = await trustCoat.owner();
  if (owner.toLowerCase() !== signer.address.toLowerCase()) {
    throw new Error(
      `Signer ${signer.address} is not contract owner (${owner}). Only the owner can call setURI.`
    );
  }
  console.log(`Owner verified: ${owner}`);

  const updates = [];

  for (let tier = 0; tier <= 5; tier++) {
    const key = `tier-${tier}`;
    const entry = trustCoatMetadata[key];

    if (!entry) {
      console.log(`\n  ⚠ No manifest entry for ${key} — skipping`);
      continue;
    }

    // Use ipfs:// URI (not HTTPS gateway)
    const newUri = `ipfs://${entry.cid}`;
    let oldUri = "";
    try {
      oldUri = await trustCoat.uri(tier);
    } catch {
      // uri() reverts if not set — treat as empty
      oldUri = "";
    }

    console.log(`\n  Tier ${tier}:`);
    console.log(`    old: ${oldUri || "(not set)"}`);
    console.log(`    new: ${newUri}`);

    if (oldUri === newUri) {
      console.log(`    ✓ Already set — skipping`);
      continue;
    }

    // Get current fee data and bump to avoid replacement issues
    const feeData = await provider.getFeeData();
    const maxFeePerGas = feeData.maxFeePerGas
      ? (feeData.maxFeePerGas * 150n) / 100n  // 1.5x to avoid underpricing
      : undefined;
    const maxPriorityFeePerGas = feeData.maxPriorityFeePerGas
      ? (feeData.maxPriorityFeePerGas * 150n) / 100n
      : undefined;

    const tx = await trustCoat.setURI(tier, newUri, {
      ...(maxFeePerGas && { maxFeePerGas }),
      ...(maxPriorityFeePerGas && { maxPriorityFeePerGas }),
    });
    console.log(`    tx: ${tx.hash} (pending...)`);
    await tx.wait();
    console.log(`    ✅ Confirmed`);

    updates.push({ tier, oldUri, newUri, tx: tx.hash });
  }

  const receipt = {
    updatedAt: new Date().toISOString(),
    contract: contractAddress,
    network: `base-mainnet (chain-${network.chainId})`,
    manifestUploadedAt: manifest.uploadedAt,
    updates,
  };

  fs.writeFileSync(RECEIPT_PATH, JSON.stringify(receipt, null, 2));

  console.log(`\n✅ ${updates.length} tier URIs updated to ipfs://`);
  console.log(`📄 Receipt → hackathon/filecoin-uri-update-receipt.json`);

  if (updates.length > 0) {
    console.log("\nUpdated URIs:");
    updates.forEach(({ tier, newUri, tx }) => {
      console.log(`  Tier ${tier}: ${newUri}`);
      console.log(`    https://basescan.org/tx/${tx}`);
    });
  }
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("\n❌ Failed:", err.message);
    process.exit(1);
  });
