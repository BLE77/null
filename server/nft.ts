import { Connection, Keypair, PublicKey, Transaction, sendAndConfirmTransaction } from '@solana/web3.js';
import { getAssociatedTokenAddress, createAssociatedTokenAccountInstruction, createTransferCheckedInstruction } from '@solana/spl-token';
import bs58 from 'bs58';

const RPC_URL = process.env.HELIUS_API_KEY 
  ? `https://mainnet.helius-rpc.com/?api-key=${process.env.HELIUS_API_KEY}`
  : 'https://api.mainnet-beta.solana.com';

const SOLANA_NETWORK = process.env.SOLANA_NETWORK || "solana";

// Initialize Solana connection
const connection = new Connection(RPC_URL, "confirmed");

// Load vault wallet from environment
function loadVaultWallet(): Keypair | null {
  const VAULT_SECRET_KEY = process.env.VAULT_SECRET_KEY || process.env.AGENT_WALLET_PRIVATE_KEY;
  
  if (!VAULT_SECRET_KEY) {
    console.warn('[NFT] No vault wallet configured (VAULT_SECRET_KEY or AGENT_WALLET_PRIVATE_KEY)');
    return null;
  }

  try {
    // Try parsing as JSON array first
    return Keypair.fromSecretKey(Uint8Array.from(JSON.parse(VAULT_SECRET_KEY)));
  } catch {
    try {
      // Try parsing as base58 string
      return Keypair.fromSecretKey(bs58.decode(VAULT_SECRET_KEY));
    } catch (error) {
      console.error('[NFT] Failed to load vault wallet:', error);
      return null;
    }
  }
}

const VAULT_WALLET = loadVaultWallet();

export interface NFTTransferParams {
  recipient: string;  // Recipient wallet address (base58)
  mint: string;       // NFT mint address (base58)
  decimals?: number;  // Token decimals (0 for NFTs)
}

export interface NFTTransferResult {
  signature: string;
  explorerUrl: string;
  success: boolean;
}

/**
 * Transfer a preminted NFT from the vault wallet to a recipient
 * @param params Transfer parameters (recipient, mint, decimals)
 * @returns Transfer result with signature and explorer URL
 */
export async function transferNFT(params: NFTTransferParams): Promise<NFTTransferResult> {
  const { recipient, mint, decimals = 0 } = params;

  // Check if vault wallet is configured
  if (!VAULT_WALLET) {
    throw new Error('Vault wallet not configured. Set VAULT_SECRET_KEY or AGENT_WALLET_PRIVATE_KEY environment variable.');
  }

  console.log('[NFT] Transferring NFT...');
  console.log('[NFT] Vault:', VAULT_WALLET.publicKey.toBase58());
  console.log('[NFT] Recipient:', recipient);
  console.log('[NFT] Mint:', mint);

  try {
    const recipientPk = new PublicKey(recipient);
    const mintPk = new PublicKey(mint);

    // Get associated token addresses
    const fromAta = await getAssociatedTokenAddress(mintPk, VAULT_WALLET.publicKey, true);
    const toAta = await getAssociatedTokenAddress(mintPk, recipientPk, true);

    console.log('[NFT] From ATA:', fromAta.toBase58());
    console.log('[NFT] To ATA:', toAta.toBase58());

    // Build transaction instructions
    const instructions = [];

    // Check if recipient's ATA exists
    const toInfo = await connection.getAccountInfo(toAta);
    if (!toInfo) {
      console.log('[NFT] Creating associated token account for recipient...');
      instructions.push(
        createAssociatedTokenAccountInstruction(
          VAULT_WALLET.publicKey, // payer
          toAta,                   // associated token account
          recipientPk,             // owner
          mintPk                   // mint
        )
      );
    }

    // Add transfer instruction
    instructions.push(
      createTransferCheckedInstruction(
        fromAta,                  // from
        mintPk,                   // mint
        toAta,                    // to
        VAULT_WALLET.publicKey,  // owner
        1,                        // amount (1 for NFTs)
        decimals                  // decimals
      )
    );

    // Create and send transaction
    const transaction = new Transaction().add(...instructions);
    transaction.feePayer = VAULT_WALLET.publicKey;
    
    const { blockhash } = await connection.getLatestBlockhash();
    transaction.recentBlockhash = blockhash;

    console.log('[NFT] Sending transaction...');
    const signature = await sendAndConfirmTransaction(
      connection,
      transaction,
      [VAULT_WALLET],
      {
        commitment: 'confirmed',
        skipPreflight: false,
      }
    );

    const networkParam = SOLANA_NETWORK === 'solana-devnet' ? '?cluster=devnet' : '';
    const explorerUrl = `https://solscan.io/tx/${signature}${networkParam}`;

    console.log('[NFT] ✅ Transfer successful!');
    console.log('[NFT] Signature:', signature);
    console.log('[NFT] Explorer:', explorerUrl);

    return {
      signature,
      explorerUrl,
      success: true,
    };
  } catch (error: any) {
    console.error('[NFT] Transfer failed:', error);
    throw new Error(`NFT transfer failed: ${error.message}`);
  }
}

/**
 * Check if NFT transfers are enabled
 */
export function isNFTTransferEnabled(): boolean {
  return VAULT_WALLET !== null;
}

/**
 * Get vault wallet public key
 */
export function getVaultPublicKey(): string | null {
  return VAULT_WALLET?.publicKey.toBase58() || null;
}
