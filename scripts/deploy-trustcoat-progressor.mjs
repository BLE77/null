/**
 * deploy-trustcoat-progressor.mjs
 * Deploy TrustCoatProgressor.sol to Base Mainnet (or testnet).
 *
 * After deploy, the owner must call:
 *   TrustCoat.setMinter(progressorAddress, true)
 * to authorize the Progressor to mint and upgrade TrustCoat tokens.
 *
 * Usage:
 *   LOCUS_OWNER_PRIVATE_KEY=0x... node scripts/deploy-trustcoat-progressor.mjs
 *   LOCUS_OWNER_PRIVATE_KEY=0x... NETWORK=sepolia node scripts/deploy-trustcoat-progressor.mjs
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { createRequire } from "module";
import { fileURLToPath } from "url";
import path from "path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);
const { ethers } = require("ethers");

const PRIVATE_KEY = process.env.LOCUS_OWNER_PRIVATE_KEY || process.env.DEPLOYER_PRIVATE_KEY;
if (!PRIVATE_KEY) {
  throw new Error("LOCUS_OWNER_PRIVATE_KEY or DEPLOYER_PRIVATE_KEY not set");
}

const NETWORK = process.env.NETWORK ?? "mainnet";
const RPC = NETWORK === "sepolia"
  ? (process.env.BASE_SEPOLIA_RPC ?? "https://sepolia.base.org")
  : (process.env.BASE_MAINNET_RPC ?? "https://mainnet.base.org");

// TrustCoat deployed on Base Mainnet
const TRUST_COAT_ADDRESS = process.env.TRUST_COAT_ADDRESS
  ?? "0xfaDc498CDF7ef431900639DB4ee07b73A855ED3e";

// ABI + bytecode for TrustCoatProgressor
const artifactsDir = path.join(__dirname, "..", "artifacts");
const abiPath = path.join(artifactsDir, "TrustCoatProgressor.abi");
const binPath = path.join(artifactsDir, "TrustCoatProgressor.bin");

if (!existsSync(abiPath) || !existsSync(binPath)) {
  console.error(`\n✗ Artifacts not found. Compile first:\n  node scripts/compile-trustcoat-progressor.mjs\n`);
  process.exit(1);
}

const abi = JSON.parse(readFileSync(abiPath, "utf8"));
const bytecode = "0x" + readFileSync(binPath, "utf8").trim();

async function main() {
  const provider = new ethers.JsonRpcProvider(RPC);
  const wallet = new ethers.Wallet(PRIVATE_KEY, provider);

  const network = await provider.getNetwork();
  console.log(`\nDeploying TrustCoatProgressor to chain ${network.chainId} (${NETWORK})...`);
  console.log(`Deployer: ${wallet.address}`);
  console.log(`TrustCoat: ${TRUST_COAT_ADDRESS}\n`);

  const balance = await provider.getBalance(wallet.address);
  console.log(`Deployer balance: ${ethers.formatEther(balance)} ETH`);

  if (balance === 0n) {
    throw new Error("Deployer has no ETH on Base.");
  }

  const factory = new ethers.ContractFactory(abi, bytecode, wallet);

  console.log("Deploying...");
  const contract = await factory.deploy(TRUST_COAT_ADDRESS);
  await contract.deploymentTransaction().wait(2);

  const contractAddress = await contract.getAddress();
  const txHash = contract.deploymentTransaction().hash;

  console.log(`\n✓ TrustCoatProgressor deployed at: ${contractAddress}`);
  console.log(`  Tx hash: ${txHash}`);
  console.log(`  Explorer: https://basescan.org/address/${contractAddress}`);

  // Save to deployed-addresses.json
  const outputDir = path.join(__dirname, "..", "hackathon");
  const outputPath = path.join(outputDir, "deployed-addresses.json");
  if (!existsSync(outputDir)) mkdirSync(outputDir, { recursive: true });

  const existing = existsSync(outputPath)
    ? JSON.parse(readFileSync(outputPath, "utf8"))
    : {};

  const updated = {
    ...existing,
    TrustCoatProgressor: {
      address: contractAddress,
      network: NETWORK === "sepolia" ? "base-sepolia" : "base",
      chainId: Number(network.chainId),
      deployTx: txHash,
      deployer: wallet.address,
      trustCoat: TRUST_COAT_ADDRESS,
      deployedAt: new Date().toISOString(),
      basescanUrl: `https://basescan.org/address/${contractAddress}`,
    },
  };

  writeFileSync(outputPath, JSON.stringify(updated, null, 2));
  console.log(`\n✓ Address saved to hackathon/deployed-addresses.json`);

  console.log(`
Next steps:
  1. Set as TrustCoat minter:
       cast send ${TRUST_COAT_ADDRESS} "setMinter(address,bool)" ${contractAddress} true \\
         --private-key $LOCUS_OWNER_PRIVATE_KEY --rpc-url ${RPC}

  2. Add to .env:
       TRUST_COAT_PROGRESSOR_ADDRESS=${contractAddress}

  3. Register reporter (Off-Human backend wallet):
       cast send ${contractAddress} "setReporter(address,bool)" <BACKEND_WALLET> true \\
         --private-key $LOCUS_OWNER_PRIVATE_KEY --rpc-url ${RPC}
`);

  return { contractAddress, txHash };
}

main()
  .then(({ contractAddress }) => {
    console.log(`Done. Progressor: ${contractAddress}`);
    process.exit(0);
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
