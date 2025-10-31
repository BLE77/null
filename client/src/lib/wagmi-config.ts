import { createWeb3Modal } from '@web3modal/wagmi';
import { createConfig, createStorage } from 'wagmi';
import { http } from 'viem';
import { base, baseSepolia } from 'wagmi/chains';
// Import injected from @wagmi/connectors for wagmi v2
import { injected } from '@wagmi/connectors';

// WalletConnect Project ID (set VITE_WALLETCONNECT_PROJECT_ID in env)
export const projectId = (import.meta.env.VITE_WALLETCONNECT_PROJECT_ID as string) || 'c4c89e8e16e7ac96efcf97932c8b0070';

const metadata = {
  name: 'OFF HUMAN',
  description: 'X402-themed streetwear for the singularity',
  url: typeof window !== 'undefined' ? window.location.origin : 'https://offhuman.com',
  icons: ['https://offhuman.com/icon.png']
};

// Configure supported chains (Base mainnet first for primary network)
export const chains = [base, baseSepolia] as const;

// Configure wagmi v2
export const config = createConfig({
  chains,
  transports: {
    [baseSepolia.id]: http(),
    [base.id]: http(),
  },
  // Storage configuration for wagmi v2
  storage: typeof window !== 'undefined' ? createStorage({ storage: window.localStorage }) : undefined,
  connectors: [
    // Injected wallets (MetaMask, Phantom browser extension, etc.)
    injected({ 
      target: 'metaMask',
      shimDisconnect: true,
    }),
    // Phantom specifically (when installed as browser extension)
    injected({
      target() {
        return {
          id: 'phantom',
          name: 'Phantom',
          provider: typeof window !== 'undefined' ? (window as any).phantom?.ethereum : undefined,
        };
      },
      shimDisconnect: true,
    }),
    // Note: WalletConnect and Coinbase Wallet are handled by @web3modal/wagmi
  ],
});
