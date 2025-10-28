import { createWeb3Modal } from '@web3modal/wagmi';
import { http, createConfig } from 'wagmi';
import { base, baseSepolia } from 'wagmi/chains';
import { walletConnect, injected, coinbaseWallet } from 'wagmi/connectors';

// WalletConnect Project ID - get from https://cloud.walletconnect.com
export const projectId = 'a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6';

const metadata = {
  name: 'OFF HUMAN',
  description: 'X402-themed streetwear for the singularity',
  url: typeof window !== 'undefined' ? window.location.origin : 'https://offhuman.com',
  icons: ['https://offhuman.com/icon.png']
};

// Configure supported chains
export const chains = [baseSepolia, base] as const;

// Configure wagmi
export const config = createConfig({
  chains,
  transports: {
    [baseSepolia.id]: http(),
    [base.id]: http(),
  },
  // Disable auto-reconnect completely
  ssr: false,
  multiInjectedProviderDiscovery: false, // Don't auto-discover wallets
  connectors: [
    // WalletConnect - supports 300+ wallets including Phantom (EVM mode)
    walletConnect({ 
      projectId, 
      metadata,
      showQrModal: false, // Web3Modal handles the QR modal
    }),
    // Injected wallets (MetaMask, Phantom browser extension, etc.)
    injected({ 
      target: 'metaMask',
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
    }),
    // Coinbase Wallet
    coinbaseWallet({
      appName: metadata.name,
      appLogoUrl: metadata.icons[0],
    }),
  ],
});
