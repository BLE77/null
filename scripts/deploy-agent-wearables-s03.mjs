/**
 * Deploy AgentWearablesS03.sol to Base Mainnet (Chain ID 8453)
 *
 * Uses ethers.js direct deploy (Node 20 compatible — no Hardhat required).
 * Reads bytecode and ABI from artifacts/ directory.
 *
 * Constructor args:
 *   _trustCoat     0xfaDc498CDF7ef431900639DB4ee07b73A855ED3e  (TrustCoat S01)
 *   _usdc          0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913  (USDC on Base)
 *   _treasury      0xD9E2ad68BE5247DCBcd00CaCeb4783c0506028C7  (Locus wallet)
 *   _nullExchange  0x10067B71657665B6527B242E48e9Ea8d4951c37C  (NullExchange S03)
 *   _ethUsdcPrice  3_000_000_000                               ($3000/ETH in USDC 6-dec)
 *
 * After deployment, calls setBurnSource() to add S02 AgentWearables as a valid burn source.
 */

import { ethers } from 'ethers';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

// ─── Config ────────────────────────────────────────────────────────────────────

const PRIVATE_KEY     = process.env.LOCUS_OWNER_PRIVATE_KEY;
const RPC_URL         = process.env.BASE_RPC_URL || 'https://mainnet.base.org';

const TRUST_COAT      = '0xfaDc498CDF7ef431900639DB4ee07b73A855ED3e';
const USDC            = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913';
const TREASURY        = '0xD9E2ad68BE5247DCBcd00CaCeb4783c0506028C7';
const NULL_EXCHANGE   = '0x10067B71657665B6527B242E48e9Ea8d4951c37C';
const ETH_USDC_PRICE  = 3_000_000_000n;  // $3000 ETH, 6-decimal USDC representation

// S02 AgentWearables — register as burn source post-deploy
const S02_WEARABLES   = '0xEb5D5e7b320E2a7cb762EB90a0335f59d54031D1';

const RECEIPT_PATH    = path.join(ROOT, 'hackathon', 'agent-wearables-s03-receipt.json');

// ─── Load artifacts ────────────────────────────────────────────────────────────

const abi      = JSON.parse(fs.readFileSync(path.join(ROOT, 'artifacts', 'AgentWearablesS03.abi'), 'utf8'));
const bytecode = '0x' + fs.readFileSync(path.join(ROOT, 'artifacts', 'AgentWearablesS03.bin'), 'utf8').trim();

// ─── Main ──────────────────────────────────────────────────────────────────────

if (!PRIVATE_KEY) {
  console.error('Error: LOCUS_OWNER_PRIVATE_KEY not set');
  process.exit(1);
}

const provider = new ethers.JsonRpcProvider(RPC_URL);
const wallet   = new ethers.Wallet(PRIVATE_KEY, provider);

const [network, balance] = await Promise.all([
  provider.getNetwork(),
  provider.getBalance(wallet.address),
]);

console.log('Network:  ', network.name, `(chainId ${network.chainId})`);
console.log('Deployer: ', wallet.address);
console.log('Balance:  ', ethers.formatEther(balance), 'ETH');

if (network.chainId !== 8453n) {
  console.error('ERROR: expected Base Mainnet (8453), got', network.chainId);
  process.exit(1);
}

// ─── Deploy ────────────────────────────────────────────────────────────────────

console.log('\nDeploying AgentWearablesS03...');

const factory = new ethers.ContractFactory(abi, bytecode, wallet);

const contract = await factory.deploy(
  TRUST_COAT,
  USDC,
  TREASURY,
  NULL_EXCHANGE,
  ETH_USDC_PRICE,
  { gasLimit: 4_000_000 }
);

console.log('Deploy tx:', contract.deploymentTransaction().hash);
console.log('Waiting for confirmation...');

await contract.waitForDeployment();
const address = await contract.getAddress();
const receipt = await provider.getTransactionReceipt(contract.deploymentTransaction().hash);

console.log('Deployed to:  ', address);
console.log('Block:        ', receipt.blockNumber);
console.log('Gas used:     ', receipt.gasUsed.toString());

// ─── Register S02 as burn source ──────────────────────────────────────────────

console.log('\nRegistering S02 AgentWearables as burn source...');
const setBurnTx = await contract.setBurnSource(S02_WEARABLES, true, { gasLimit: 100_000 });
console.log('setBurnSource tx:', setBurnTx.hash);
await setBurnTx.wait();
console.log('S02 burn source registered.');

// ─── Verify on-chain state ────────────────────────────────────────────────────

const [
  onchainOwner,
  onchainTreasury,
  s02BurnSource,
  s03BurnSource,
  tokenMin,
  tokenMax,
  currentPriceTag,
] = await Promise.all([
  contract.owner(),
  contract.treasury(),
  contract.burnSources(S02_WEARABLES),
  contract.burnSources(address),
  contract.TOKEN_MIN(),
  contract.TOKEN_MAX(),
  contract.priceTag(),
]);

console.log('\n--- On-chain state ---');
console.log('owner:          ', onchainOwner);
console.log('treasury:       ', onchainTreasury);
console.log('S02 burnSource: ', s02BurnSource);
console.log('S03 burnSource: ', s03BurnSource);
console.log('token range:    ', tokenMin.toString(), '-', tokenMax.toString());
console.log('priceTag now:   ', (Number(currentPriceTag) / 1_000_000).toFixed(6), 'USDC');

// ─── Save receipt ──────────────────────────────────────────────────────────────

const receiptData = {
  contract:        'AgentWearablesS03',
  network:         'base-mainnet',
  chainId:         8453,
  address,
  deployTxHash:    contract.deploymentTransaction().hash,
  setBurnSourceTx: setBurnTx.hash,
  blockNumber:     receipt.blockNumber,
  gasUsed:         receipt.gasUsed.toString(),
  deployer:        wallet.address,
  constructorArgs: {
    trustCoat:    TRUST_COAT,
    usdc:         USDC,
    treasury:     TREASURY,
    nullExchange: NULL_EXCHANGE,
    ethUsdcPrice: ETH_USDC_PRICE.toString(),
  },
  burnSources: {
    s02: S02_WEARABLES,
    s03: address,
  },
  tokens: {
    6:  'THE NULL EXCHANGE',
    7:  'THE RECEIPT GARMENT',
    8:  'THE TRUST SKIN',
    9:  'THE PRICE TAG',
    10: 'THE COUNTERPARTY',
    11: 'THE BURN RECEIPT',
    12: 'THE INVOICE',
  },
  deployedAt: new Date().toISOString(),
};

fs.mkdirSync(path.dirname(RECEIPT_PATH), { recursive: true });
fs.writeFileSync(RECEIPT_PATH, JSON.stringify(receiptData, null, 2));
console.log('\nReceipt saved to:', RECEIPT_PATH);
console.log('\nDone. AgentWearablesS03 deployed at:', address);
console.log('Explorer: https://basescan.org/address/' + address);
