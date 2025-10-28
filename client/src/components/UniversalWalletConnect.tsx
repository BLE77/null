import { useState, useEffect } from 'react';
import { useAccount, useDisconnect } from 'wagmi';
import { useWeb3Modal } from '@web3modal/wagmi/react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Wallet, Power, ChevronDown } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";

export function UniversalWalletConnect() {
  const { open } = useWeb3Modal();
  const { address: evmAddress, isConnected: evmConnected } = useAccount();
  const { disconnect: disconnectEvm } = useDisconnect();
  const { toast } = useToast();
  
  const [solanaWallet, setSolanaWallet] = useState<any>(null);
  const [solanaConnected, setSolanaConnected] = useState(false);
  const [selectedNetwork, setSelectedNetwork] = useState<'base' | 'solana'>('base');

  // Detect Solana wallet
  useEffect(() => {
    if (typeof window !== 'undefined' && 'solana' in window) {
      const provider = (window as any).solana;
      if (provider?.isPhantom || provider?.isBackpack) {
        setSolanaWallet(provider);
      }
    }
  }, []);

  const connectSolana = async () => {
    try {
      if (!solanaWallet) {
        toast({
          title: "Solana wallet not found",
          description: "Please install Phantom or Backpack wallet",
          variant: "destructive",
        });
        return;
      }
      await solanaWallet.connect();
      setSolanaConnected(true);
      setSelectedNetwork('solana');
      toast({
        title: "Wallet connected",
        description: `Connected to Solana: ${solanaWallet.publicKey.toString().slice(0, 8)}...`,
      });
    } catch (error) {
      toast({
        title: "Connection failed",
        description: "Failed to connect Solana wallet",
        variant: "destructive",
      });
    }
  };

  const connectBase = () => {
    setSelectedNetwork('base');
    open();
  };

  const disconnectSolana = async () => {
    try {
      if (solanaWallet) {
        await solanaWallet.disconnect();
      }
      setSolanaConnected(false);
      toast({
        title: "Wallet disconnected",
        description: "Solana wallet disconnected",
      });
    } catch (error) {
      console.error('Failed to disconnect Solana wallet:', error);
    }
  };

  const handleDisconnect = () => {
    if (evmConnected) {
      disconnectEvm();
    }
    if (solanaConnected) {
      disconnectSolana();
    }
  };

  // If either wallet is connected
  const isConnected = evmConnected || solanaConnected;
  const displayAddress = evmConnected 
    ? evmAddress 
    : solanaConnected 
    ? solanaWallet?.publicKey?.toString() 
    : null;
  const networkBadge = evmConnected ? 'Base' : solanaConnected ? 'Solana' : null;

  if (isConnected && displayAddress) {
    return (
      <div className="flex items-center gap-2">
        <Badge 
          variant="outline" 
          className="bg-primary/10 border-primary text-primary text-xs"
          data-testid="badge-wallet-connected"
        >
          <Wallet className="w-3 h-3 mr-1" />
          {displayAddress.slice(0, 6)}...{displayAddress.slice(-4)}
        </Badge>
        {networkBadge && (
          <Badge variant="outline" className="text-xs" data-testid="badge-network">
            {networkBadge}
          </Badge>
        )}
        <Button
          size="sm"
          variant="ghost"
          onClick={handleDisconnect}
          className="text-white hover:bg-white/20"
          data-testid="button-disconnect-wallet"
        >
          <Power className="w-4 h-4" />
        </Button>
      </div>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="text-white hover:bg-white/20"
          data-testid="button-connect-wallet-menu"
        >
          <Wallet className="w-4 h-4 mr-2" />
          Connect
          <ChevronDown className="w-3 h-3 ml-1" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuItem onClick={connectBase} data-testid="menu-connect-base">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <span className="font-semibold">Base Network</span>
              <Badge variant="outline" className="text-xs">EVM</Badge>
            </div>
            <span className="text-xs text-muted-foreground">
              MetaMask, Coinbase, Phantom
            </span>
          </div>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem 
          onClick={connectSolana} 
          disabled={!solanaWallet}
          data-testid="menu-connect-solana"
        >
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <span className="font-semibold">Solana Network</span>
              <Badge variant="outline" className="text-xs">SOL</Badge>
            </div>
            <span className="text-xs text-muted-foreground">
              {solanaWallet ? 'Phantom, Backpack' : 'No Solana wallet detected'}
            </span>
          </div>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
