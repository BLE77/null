#!/usr/bin/env tsx
/**
 * Autonomous AI Shopping Agent
 * 
 * This script demonstrates AI-to-AI commerce using x402 payments.
 * The agent:
 * 1. Browses the OFF HUMAN store
 * 2. Uses AI to analyze products and make a decision
 * 3. Autonomously pays with USDC on Base network
 * 4. Completes the purchase with cryptographic verification
 */

import OpenAI from 'openai';
import { createWalletClient, http } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { base } from 'viem/chains';
import { wrapFetchWithPayment } from 'x402-fetch';

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
}

interface AgentConfig {
  name: string;
  personality: string;
  budget: number;
  preferences: string;
}

const AGENT_CONFIG: AgentConfig = {
  name: "ShopBot-3000",
  personality: "A futuristic AI with a taste for cutting-edge streetwear and tech aesthetics",
  budget: 10.00, // $10 USDC max
  preferences: "Loves anything cyberpunk, neural-themed, or singularity-related. Prefers hoodies and tech wear."
};

const STORE_URL = process.env.STORE_URL || 'http://localhost:5000';

async function main() {
  console.log('🤖 Starting Autonomous AI Shopping Agent...\n');
  console.log(`Agent Name: ${AGENT_CONFIG.name}`);
  console.log(`Personality: ${AGENT_CONFIG.personality}`);
  console.log(`Budget: $${AGENT_CONFIG.budget} USDC\n`);
  
  // Check for required environment variables
  if (!process.env.OPENAI_API_KEY) {
    console.error('❌ OPENAI_API_KEY not found in environment variables');
    process.exit(1);
  }
  
  if (!process.env.AGENT_WALLET_PRIVATE_KEY) {
    console.error('❌ AGENT_WALLET_PRIVATE_KEY not found');
    console.log('💡 Generate a wallet for your agent:');
    console.log('   const { privateKey } = generatePrivateKey();');
    console.log('   Then add it to your .env file');
    process.exit(1);
  }

  // Initialize OpenAI
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  // Initialize agent's wallet
  const account = privateKeyToAccount(process.env.AGENT_WALLET_PRIVATE_KEY as `0x${string}`);
  const walletClient = createWalletClient({
    account,
    chain: base,
    transport: http(),
  });

  console.log(`💳 Agent Wallet: ${account.address}\n`);

  // Step 1: Browse the store
  console.log('📦 Step 1: Browsing OFF HUMAN store...');
  const response = await fetch(`${STORE_URL}/api/products`);
  
  if (!response.ok) {
    console.error('❌ Failed to fetch products:', response.statusText);
    process.exit(1);
  }
  
  const products: Product[] = await response.json();
  console.log(`✅ Found ${products.length} products\n`);

  // Step 2: Use AI to analyze and choose
  console.log('🧠 Step 2: AI analyzing products...');
  
  const productList = products
    .map((p, i) => `${i + 1}. ${p.name} ($${p.price}) - ${p.description}`)
    .join('\n');

  const prompt = `You are ${AGENT_CONFIG.name}, an autonomous shopping AI agent.

Your personality: ${AGENT_CONFIG.personality}
Your preferences: ${AGENT_CONFIG.preferences}
Your budget: $${AGENT_CONFIG.budget} USDC

Here are the available products:
${productList}

Analyze these products and choose ONE that best matches your personality and preferences. 
Respond with ONLY the product number (1-${products.length}) and a brief reason why in this format:
CHOICE: [number]
REASON: [one sentence explanation]`;

  const completion = await openai.chat.completions.create({
    model: 'gpt-4',
    messages: [
      { role: 'system', content: 'You are an autonomous shopping AI making purchasing decisions.' },
      { role: 'user', content: prompt }
    ],
    temperature: 0.8,
  });

  const aiResponse = completion.choices[0].message.content || '';
  console.log(`\n🤖 AI Decision:\n${aiResponse}\n`);

  // Parse the AI's choice
  const choiceMatch = aiResponse.match(/CHOICE:\s*(\d+)/);
  if (!choiceMatch) {
    console.error('❌ Could not parse AI choice');
    process.exit(1);
  }

  const choiceIndex = parseInt(choiceMatch[1]) - 1;
  const chosenProduct = products[choiceIndex];

  if (!chosenProduct) {
    console.error('❌ Invalid product choice');
    process.exit(1);
  }

  console.log(`\n✨ Agent chose: ${chosenProduct.name}`);
  console.log(`💰 Price: $${chosenProduct.price} USDC`);

  const productPrice = Number(chosenProduct.price);
  if (productPrice > AGENT_CONFIG.budget) {
    console.log('❌ Product exceeds budget, aborting purchase');
    process.exit(1);
  }

  // Step 3: Make autonomous payment
  console.log('\n💳 Step 3: Initiating autonomous payment...');
  console.log('🔐 Using x402 protocol for cryptographic verification...');

  const fetchWithPayment = wrapFetchWithPayment(
    fetch,
    walletClient as any,
    BigInt(Math.floor(AGENT_CONFIG.budget * 1_000_000)) // Max budget in USDC micro-units
  );

  const orderData = {
    customerEmail: 'agent@shopbot3000.ai',
    items: [{
      productId: chosenProduct.id,
      name: chosenProduct.name,
      size: 'L', // Agent picks size L
      quantity: 1,
      price: productPrice,
    }],
    totalAmount: productPrice.toFixed(2),
  };

  console.log('\n📡 Sending payment request to store...');
  
  try {
    const paymentResponse = await fetchWithPayment(`${STORE_URL}/api/checkout/pay`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(orderData),
    });

    if (!paymentResponse.ok) {
      const error = await paymentResponse.json();
      console.error('❌ Payment failed:', error);
      process.exit(1);
    }

    const result = await paymentResponse.json();
    
    console.log('\n✅ PURCHASE COMPLETE!');
    console.log('═══════════════════════════════════════');
    console.log(`🎉 Product: ${chosenProduct.name}`);
    console.log(`💰 Amount Paid: $${productPrice.toFixed(2)} USDC`);
    console.log(`🔗 Transaction: ${result.order.transactionHash}`);
    console.log(`📧 Receipt sent to: ${orderData.customerEmail}`);
    console.log('═══════════════════════════════════════\n');
    console.log('🤖 Autonomous AI commerce successful!');
    console.log('🚀 This is the future of agent-to-agent payments!\n');

  } catch (error) {
    console.error('\n❌ Payment error:', error);
    process.exit(1);
  }
}

// Run the agent
main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
