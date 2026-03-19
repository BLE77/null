/**
 * scripts/update-trustcoat-uris.ts
 *
 * Reads the Filecoin CID manifest produced by filecoin-upload.ts and calls
 * TrustCoat.setURI() for each tier so the on-chain tokenURIs point to
 * Filecoin Onchain Cloud instead of the Vercel fallback.
 *
 * Run AFTER filecoin-upload.ts has produced filecoin-manifest.json.
 *
 * Usage:
 *   npx hardhat run scripts/update-trustcoat-uris.ts --network base-sepolia
 *
 * Required env vars:
 *   DEPLOYER_PRIVATE_KEY  — owner wallet of TrustCoat.sol
 *   TRUST_COAT_ADDRESS    — deployed TrustCoat contract address
 */

import { ethers } from "hardhat";
import fs from "fs";
import path from "path";

const MANIFEST_PATH = path.join(
  __dirname,
  "..",
  "attached_assets",
  "season01",
  "filecoin-manifest.json"
);

const TRUST_COAT_ABI = [
  "function setURI(uint256 tier, string calldata newUri) external",
  "function uri(uint256 tier) external view returns (string memory)",
  "function owner() external view returns (address)",
];

async function main() {
  // Load manifest
  if (!fs.existsSync(MANIFEST_PATH)) {
    throw new Error(
      `filecoin-manifest.json not found at ${MANIFEST_PATH}\n` +
        "Run: LIGHTHOUSE_API_KEY=your_key npx tsx scripts/filecoin-upload.ts"
    );
  }

  const manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, "utf8"));
  const trustCoatMetadata = manifest.trustCoatMetadata as Record<
    string,
    { cid: string; url: string }
  >;

  // Contract address
  const contractAddress = process.env.TRUST_COAT_ADDRESS;
  if (!contractAddress) {
    // Try deployed-addresses.json
    const addressesPath = path.join(__dirname, "..", "hackathon", "deployed-addresses.json");
    if (!fs.existsSync(addressesPath)) {
      throw new Error(
        "TRUST_COAT_ADDRESS env var not set and hackathon/deployed-addresses.json not found"
      );
    }
    const addresses = JSON.parse(fs.readFileSync(addressesPath, "utf8"));
    if (!addresses.TrustCoat?.address) {
      throw new Error("TrustCoat address not found in deployed-addresses.json");
    }
    process.env.TRUST_COAT_ADDRESS = addresses.TrustCoat.address;
  }

  const [signer] = await ethers.getSigners();
  const network = await ethers.provider.getNetwork();

  console.log("\n🔗 TrustCoat URI Update — Filecoin Onchain Cloud");
  console.log("=================================================");
  console.log(`Network:  chain ${network.chainId}`);
  console.log(`Signer:   ${signer.address}`);
  console.log(`Contract: ${process.env.TRUST_COAT_ADDRESS}`);

  const trustCoat = new ethers.Contract(
    process.env.TRUST_COAT_ADDRESS!,
    TRUST_COAT_ABI,
    signer
  );

  // Verify signer is owner
  const owner = await trustCoat.owner();
  if (owner.toLowerCase() !== signer.address.toLowerCase()) {
    throw new Error(
      `Signer ${signer.address} is not contract owner (${owner}). ` +
        "Only the owner can call setURI."
    );
  }

  // Update each tier
  const updates: Array<{ tier: number; oldUri: string; newUri: string; tx: string }> = [];

  for (let tier = 0; tier <= 5; tier++) {
    const key = `tier-${tier}`;
    const entry = trustCoatMetadata[key];

    if (!entry) {
      console.log(`  ⚠ No Filecoin entry for ${key} — skipping`);
      continue;
    }

    const oldUri = await trustCoat.uri(tier);
    const newUri = entry.url;

    if (oldUri === newUri) {
      console.log(`  ✓ Tier ${tier} already set to Filecoin URI — skipping`);
      continue;
    }

    console.log(`\n  Setting tier ${tier} URI...`);
    console.log(`    old: ${oldUri}`);
    console.log(`    new: ${newUri}`);

    const tx = await trustCoat.setURI(tier, newUri);
    await tx.wait();

    console.log(`  ✅ Tier ${tier} updated — tx: ${tx.hash}`);
    updates.push({ tier, oldUri, newUri, tx: tx.hash });
  }

  // Save update receipt
  const receiptPath = path.join(
    __dirname,
    "..",
    "hackathon",
    "filecoin-uri-update-receipt.json"
  );

  const receipt = {
    updatedAt: new Date().toISOString(),
    contract: process.env.TRUST_COAT_ADDRESS,
    network: `chain-${network.chainId}`,
    manifestUploadedAt: manifest.uploadedAt,
    updates,
  };

  fs.writeFileSync(receiptPath, JSON.stringify(receipt, null, 2));

  console.log(`\n✅ ${updates.length} tier URIs updated to Filecoin Onchain Cloud`);
  console.log(`📄 Receipt saved → hackathon/filecoin-uri-update-receipt.json`);
  console.log(
    "\nTrustCoat tokenURIs now point to permanent Filecoin storage.\n" +
      "Metadata is decentralized, censorship-resistant, and agent-addressable."
  );
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("❌ Update failed:", err.message);
    process.exit(1);
  });
