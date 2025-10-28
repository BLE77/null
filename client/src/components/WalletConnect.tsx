import { useAccount, useDisconnect } from 'wagmi';
import { useWeb3Modal } from '@web3modal/wagmi/react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Wallet, Power } from 'lucide-react';

export function WalletConnect() {
  const { open } = useWeb3Modal();
  const { address, isConnected, chain } = useAccount();
  const { disconnect } = useDisconnect();

  if (isConnected && address) {
    return (
      <div className="flex items-center gap-2">
        <Badge 
          variant="outline" 
          className="bg-primary/10 border-primary text-primary"
          data-testid="badge-wallet-connected"
        >
          <Wallet className="w-3 h-3 mr-1" />
          {address.slice(0, 6)}...{address.slice(-4)}
        </Badge>
        {chain && (
          <Badge variant="outline" data-testid="badge-network">
            {chain.name}
          </Badge>
        )}
        <Button
          size="sm"
          variant="ghost"
          onClick={() => disconnect()}
          data-testid="button-disconnect-wallet"
        >
          <Power className="w-4 h-4" />
        </Button>
      </div>
    );
  }

  return (
    <Button
      onClick={() => open()}
      variant="default"
      size="sm"
      data-testid="button-connect-wallet"
    >
      <Wallet className="w-4 h-4 mr-2" />
      Connect Wallet
    </Button>
  );
}
