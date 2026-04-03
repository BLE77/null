/**
 * Deploy TrustCoat to X Layer mainnet (Chain ID 196)
 * Uses pre-compiled Paris artifacts for EVM compatibility
 *
 * Usage: node scripts/deploy-xlayer.js
 */

const { ethers } = require("ethers");
const fs = require("fs");
const path = require("path");

const XLAYER_RPC = "https://rpc.xlayer.tech";
const XLAYER_CHAIN_ID = 196;
const XLAYER_EXPLORER = "https://www.okx.com/web3/explorer/xlayer";
const DEPLOYER_KEY = process.env.LOCUS_OWNER_PRIVATE_KEY || "0x1391afc6332d715f8c31d673cd815a832533af15cf3d10a5842e10e701071bf5";
const DEPLOYER_ADDRESS = "0xD9E2ad68BE5247DCBcd00CaCeb4783c0506028C7";

async function main() {
  console.log("=== TrustCoat X Layer Mainnet Deployment ===\n");

  // Load Paris-compiled artifacts
  const artifactsDir = path.join(__dirname, "..", "artifacts");
  const abi = JSON.parse(fs.readFileSync(path.join(artifactsDir, "TrustCoat_paris.abi"), "utf8"));
  const bytecode = "0x" + fs.readFileSync(path.join(artifactsDir, "TrustCoat_paris.bin"), "utf8").trim();

  console.log("Loaded Paris-compiled artifacts");
  console.log(`  ABI functions: ${abi.length}`);
  console.log(`  Bytecode size: ${(bytecode.length - 2) / 2} bytes\n`);

  // Connect to X Layer
  const provider = new ethers.JsonRpcProvider(XLAYER_RPC, XLAYER_CHAIN_ID);
  const wallet = new ethers.Wallet(DEPLOYER_KEY, provider);

  console.log(`Deployer: ${wallet.address}`);

  // Check balance
  const balance = await provider.getBalance(wallet.address);
  console.log(`OKB Balance: ${ethers.formatEther(balance)} OKB\n`);

  if (balance === 0n) {
    console.log("WARNING: Zero OKB balance. Attempting deployment anyway...");
    console.log("If this fails, fund the wallet with OKB first.\n");
  }

  // Deploy
  console.log("Deploying TrustCoat...");
  const factory = new ethers.ContractFactory(abi, bytecode, wallet);

  let contract;
  let deployTx;
  try {
    contract = await factory.deploy({
      gasLimit: 3000000,
    });
    deployTx = contract.deploymentTransaction();
    console.log(`  Deploy TX: ${deployTx.hash}`);
    console.log("  Waiting for confirmation...");

    await contract.waitForDeployment();
    const contractAddress = await contract.getAddress();
    console.log(`  Contract deployed at: ${contractAddress}\n`);

    // Mint tier-0 VOID token as proof
    console.log("Minting tier-0 VOID TrustCoat...");
    const mintTx = await contract.mint(DEPLOYER_ADDRESS, 0, 1, { gasLimit: 200000 });
    console.log(`  Mint TX: ${mintTx.hash}`);
    const mintReceipt = await mintTx.wait();
    console.log(`  Mint confirmed in block ${mintReceipt.blockNumber}\n`);

    // Build receipt
    const receipt = {
      network: "xlayer-mainnet",
      chainId: XLAYER_CHAIN_ID,
      rpc: XLAYER_RPC,
      explorer: XLAYER_EXPLORER,
      contract: "TrustCoat",
      address: contractAddress,
      deployer: wallet.address,
      deployTx: deployTx.hash,
      deployBlock: (await deployTx.wait()).blockNumber,
      deployExplorerUrl: `${XLAYER_EXPLORER}/tx/${deployTx.hash}`,
      contractExplorerUrl: `${XLAYER_EXPLORER}/address/${contractAddress}`,
      mintTx: mintTx.hash,
      mintBlock: mintReceipt.blockNumber,
      mintExplorerUrl: `${XLAYER_EXPLORER}/tx/${mintTx.hash}`,
      mintDetails: {
        recipient: DEPLOYER_ADDRESS,
        tier: 0,
        tierName: "VOID",
        agentId: 1,
      },
      evmVersion: "paris",
      solidityVersion: "0.8.24",
      hackathon: "X Layer Onchain OS AI Hackathon",
      deployedAt: new Date().toISOString(),
    };

    // Save receipt
    const receiptPath = path.join(__dirname, "..", "hackathon", "xlayer-deploy-receipt.json");
    fs.writeFileSync(receiptPath, JSON.stringify(receipt, null, 2));
    console.log(`Receipt saved to ${receiptPath}`);
    console.log("\n=== Deployment Complete ===");
    console.log(JSON.stringify(receipt, null, 2));

    return receipt;
  } catch (err) {
    console.error("\nDeployment failed:", err.message);

    if (err.message.includes("insufficient funds")) {
      console.log("\n=== NEED OKB FOR GAS ===");
      console.log("Fund the deployer wallet with OKB on X Layer mainnet:");
      console.log(`  Address: ${wallet.address}`);
      console.log("  Options:");
      console.log("  1. Bridge OKB from OKX Exchange to X Layer");
      console.log("  2. Use OKX Web3 Wallet to transfer OKB");
      console.log("  3. Bridge from Ethereum via https://www.okx.com/web3/bridge");

      // Save partial receipt showing attempt
      const partialReceipt = {
        network: "xlayer-mainnet",
        chainId: XLAYER_CHAIN_ID,
        rpc: XLAYER_RPC,
        explorer: XLAYER_EXPLORER,
        contract: "TrustCoat",
        status: "PENDING_FUNDING",
        deployer: wallet.address,
        deployerBalance: ethers.formatEther(balance) + " OKB",
        evmVersion: "paris",
        solidityVersion: "0.8.24",
        hackathon: "X Layer Onchain OS AI Hackathon",
        artifactsReady: true,
        scriptReady: true,
        instructions: "Fund wallet with OKB, then run: node scripts/deploy-xlayer.js",
        attemptedAt: new Date().toISOString(),
      };

      const receiptPath = path.join(__dirname, "..", "hackathon", "xlayer-deploy-receipt.json");
      fs.writeFileSync(receiptPath, JSON.stringify(partialReceipt, null, 2));
      console.log(`\nPartial receipt saved to ${receiptPath}`);
    }

    process.exit(1);
  }
}

main().catch(console.error);
