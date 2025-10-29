#!/usr/bin/env tsx
/**
 * Agent Wallet Generator
 * 
 * Generates a new Ethereum wallet for the autonomous shopping agent.
 * The private key should be added to your .env file as AGENT_WALLET_PRIVATE_KEY
 */

import { generatePrivateKey, privateKeyToAccount } from 'viem/accounts';

console.log('🔑 Generating new wallet for autonomous shopping agent...\n');

const privateKey = generatePrivateKey();
const account = privateKeyToAccount(privateKey);

console.log('✅ Wallet generated successfully!\n');
console.log('═══════════════════════════════════════════════════════════');
console.log('📋 Add this to your Replit Secrets:');
console.log('═══════════════════════════════════════════════════════════\n');
console.log(`Secret Name:  AGENT_WALLET_PRIVATE_KEY`);
console.log(`Secret Value: ${privateKey}\n`);
console.log('═══════════════════════════════════════════════════════════');
console.log(`\n💳 Agent Wallet Address: ${account.address}`);
console.log('\n⚠️  IMPORTANT: Fund this wallet with Base USDC before running the agent!');
console.log('   You can bridge USDC to Base at https://bridge.base.org\n');
