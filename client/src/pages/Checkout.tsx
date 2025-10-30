import { useCart } from "@/lib/cart-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { Loader2, CheckCircle2, Wallet } from "lucide-react";
import { getProductImage } from "@/lib/product-images";
import { useAccount, useWalletClient, useDisconnect, useSwitchChain } from 'wagmi';
import { useWeb3Modal } from '@web3modal/wagmi/react';
import { WalletConnect } from '@/components/WalletConnect';
import { wrapFetchWithPayment } from 'x402-fetch';
import { createX402Client } from 'x402-solana/client';
import type { VersionedTransaction } from '@solana/web3.js';
import { base } from 'wagmi/chains';

type PaymentNetwork = 'base' | 'solana';

export default function Checkout() {
  const { cart, getTotalPrice, clearCart } = useCart();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const { address: walletAddress, isConnected, chain } = useAccount();
  const { data: walletClient } = useWalletClient();
  const { disconnect } = useDisconnect();
  const { close } = useWeb3Modal();
  const { switchChain } = useSwitchChain();
  const [email, setEmail] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [orderComplete, setOrderComplete] = useState(false);
  const [transactionHash, setTransactionHash] = useState("");
  const [selectedNetwork, setSelectedNetwork] = useState<PaymentNetwork>('base');
  const [paymentNetwork, setPaymentNetwork] = useState<PaymentNetwork>('base');
  const [solanaWallet, setSolanaWallet] = useState<any>(null);
  const [solanaConnected, setSolanaConnected] = useState(false);

  const totalPrice = getTotalPrice();

  // Auto-disconnect EVM wallet and close Web3Modal when switching to Solana
  useEffect(() => {
    if (selectedNetwork === 'solana') {
      console.log('[Network Switch] Switching to Solana mode');
      if (isConnected) {
        console.log('[Network Switch] Disconnecting EVM wallet');
        disconnect();
      }
      // Force close Web3Modal if it's open
      close();
    }
  }, [selectedNetwork, isConnected, disconnect, close]);

  // Detect and connect Solana wallet (Phantom/Backpack)
  useEffect(() => {
    const checkSolanaWallet = async () => {
      console.log('[Solana Wallet Detection] Checking for Solana wallet...');
      console.log('[Solana Wallet Detection] window.solana exists:', 'solana' in window);
      
      if (typeof window !== 'undefined' && 'solana' in window) {
        const provider = (window as any).solana;
        console.log('[Solana Wallet Detection] Provider found:', {
          isPhantom: provider?.isPhantom,
          isBackpack: provider?.isBackpack,
          publicKey: provider?.publicKey?.toString(),
        });
        
        if (provider?.isPhantom || provider?.isBackpack) {
          setSolanaWallet(provider);
          console.log('[Solana Wallet Detection] Wallet set successfully');
        }
      } else {
        console.log('[Solana Wallet Detection] No Solana wallet detected. Please ensure Phantom or Backpack is installed.');
      }
    };
    checkSolanaWallet();
  }, []);

  const connectSolanaWallet = async () => {
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
      setSolanaConnected(true); // Force React re-render
      toast({
        title: "Solana wallet connected",
        description: `Connected: ${solanaWallet.publicKey.toString().slice(0, 8)}...`,
      });
    } catch (error) {
      toast({
        title: "Connection failed",
        description: "Failed to connect Solana wallet",
        variant: "destructive",
      });
    }
  };

  const isWalletConnected = selectedNetwork === 'base' ? isConnected : solanaConnected;

  if (cart.length === 0 && !orderComplete) {
    return (
      <div className="min-h-screen pt-24 pb-12 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4" data-testid="text-empty-cart">Your cart is empty</h2>
          <Button onClick={() => setLocation("/")} data-testid="button-continue-shopping">
            Continue Shopping
          </Button>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      toast({
        title: "Missing information",
        description: "Please enter your email address",
        variant: "destructive",
      });
      return;
    }

    if (!isWalletConnected) {
      toast({
        title: "Wallet not connected",
        description: `Please connect your ${selectedNetwork === 'base' ? 'EVM' : 'Solana'} wallet to complete payment`,
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);

    try {
      const orderData = {
        customerEmail: email,
        items: cart.map(item => ({
          productId: item.product.id,
          name: item.product.name,
          size: item.size,
          quantity: item.quantity,
          price: item.product.price,
        })),
        totalAmount: totalPrice.toFixed(2),
      };

      // Use actual cart total (not hardcoded)
      const usdcAmount = totalPrice;
      
      toast({
        title: "Preparing payment",
        description: `Processing payment of $${usdcAmount.toFixed(2)} USDC on ${selectedNetwork === 'base' ? 'Base' : 'Solana'}...`,
      });

      if (selectedNetwork === 'base') {
        // Base Network Payment (EVM)
        if (!walletClient) {
          throw new Error("EVM wallet client not available");
        }

        // Check if wallet is on Base Mainnet (chain ID 8453)
        if (chain?.id !== base.id) {
          console.log('[Network Switch] Wrong network detected. Current:', chain?.id, 'Required:', base.id);
          toast({
            title: "Switching network",
            description: "Switching to Base Mainnet...",
          });
          
          try {
            await switchChain({ chainId: base.id });
            toast({
              title: "Network switched",
              description: "Successfully switched to Base Mainnet",
            });
            // Wait a moment for the wallet to update
            await new Promise(resolve => setTimeout(resolve, 1000));
          } catch (error) {
            throw new Error("Please switch to Base Mainnet in your wallet to continue");
          }
        }

        // Set max amount to cart total + 10% buffer for gas/fees
        const maxAmount = Math.ceil(totalPrice * 1.1 * 1_000_000);
        
        const fetchWithPayment = wrapFetchWithPayment(
          fetch, 
          walletClient as any,
          BigInt(maxAmount) // Dynamic max based on cart total
        );

        const response = await fetchWithPayment('/api/checkout/pay', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(orderData),
        });

        if (response.ok) {
          const result = await response.json();
          setTransactionHash(result.order.transactionHash);
          setPaymentNetwork('base');
          setOrderComplete(true);
          clearCart();
          setIsProcessing(false);
          toast({
            title: "Payment successful!",
            description: "Your USDC payment on Base has been verified",
          });
        } else {
          const error = await response.json();
          throw new Error(error.message || 'Payment failed');
        }
      } else {
        // Solana Network Payment
        if (!solanaWallet?.publicKey) {
          throw new Error("Solana wallet not connected");
        }

        console.log('[Solana Payment] Starting payment with wallet:', solanaWallet.publicKey.toString());

        // Create wallet adapter for x402-solana
        const walletAdapter = {
          address: solanaWallet.publicKey.toString(),
          signTransaction: async (tx: VersionedTransaction): Promise<VersionedTransaction> => {
            console.log('[Solana Payment] Signing transaction...');
            const signedTx = await solanaWallet.signTransaction(tx);
            console.log('[Solana Payment] Transaction signed successfully');
            return signedTx;
          }
        };

        // Set max amount to cart total + 10% buffer for gas/fees
        const maxAmountSolana = Math.ceil(totalPrice * 1.1 * 1_000_000);
        
        // Create x402 client for automatic payment handling  
        // DEVNET - Mainnet doesn't work despite docs claiming "drop-in setup"
        const x402Client = createX402Client({
          wallet: walletAdapter,
          network: 'solana-devnet',
          rpcUrl: 'https://api.devnet.solana.com',
          maxPaymentAmount: BigInt(maxAmountSolana), // Dynamic max based on cart total
        });
        
        console.log('[Solana Payment] x402 client created, making payment request...');

        console.log('[Solana Payment] Making payment request...');
        const response = await x402Client.fetch('/api/checkout/pay/solana', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(orderData),
        });
        console.log('[Solana Payment] Payment response received:', response.status);

        if (response.ok) {
          const result = await response.json();
          setTransactionHash(result.order.transactionHash);
          setPaymentNetwork('solana');
          setOrderComplete(true);
          clearCart();
          setIsProcessing(false);
          toast({
            title: "Payment successful!",
            description: "Your USDC payment on Solana has been verified",
          });
        } else {
          const error = await response.json();
          throw new Error(error.message || 'Payment failed');
        }
      }
    } catch (error) {
      console.error('Payment error (full details):', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        error: error,
      });
      setIsProcessing(false);
      toast({
        title: "Payment failed",
        description: error instanceof Error ? error.message : "Unable to process payment. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (orderComplete) {
    return (
      <div className="min-h-screen pt-24 pb-12 digital-matrix-bg">
        <div className="container mx-auto px-4 max-w-2xl">
          <Card className="border-primary/50">
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <CheckCircle2 className="w-16 h-16 text-primary" />
              </div>
              <CardTitle 
                className="text-3xl uppercase tracking-wider"
                style={{ fontFamily: "'Bebas Neue', sans-serif" }}
                data-testid="text-order-success"
              >
                Order Confirmed!
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-center">
                <p className="text-muted-foreground mb-2">
                  Thank you for your order. A confirmation email has been sent to:
                </p>
                <p className="font-semibold" data-testid="text-order-email">{email}</p>
              </div>

              <div className="bg-muted p-4 rounded-md">
                <p className="text-xs text-muted-foreground mb-1 uppercase tracking-wider">
                  Transaction Hash
                </p>
                <p className="font-mono text-xs break-all" data-testid="text-transaction-hash">
                  {transactionHash}
                </p>
              </div>

              <div className="bg-card border border-border rounded-md p-4">
                <p className="text-xs text-muted-foreground mb-1 uppercase tracking-wider">
                  Payment Method
                </p>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">USDC</Badge>
                  <Badge variant="outline">{paymentNetwork === 'base' ? 'Base Network' : 'Solana Network'}</Badge>
                </div>
              </div>

              <div className="pt-4">
                <Button 
                  className="w-full uppercase tracking-wider"
                  onClick={() => setLocation("/")}
                  data-testid="button-continue-shopping-success"
                >
                  Continue Shopping
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 pb-12 digital-matrix-bg">
      <div className="container mx-auto px-4 max-w-6xl">
        <h1 
          className="text-4xl md:text-5xl font-bold uppercase tracking-wider mb-8"
          style={{ fontFamily: "'Bebas Neue', sans-serif" }}
          data-testid="text-checkout-title"
        >
          Checkout
        </h1>

        <div className="grid lg:grid-cols-[1fr_400px] gap-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="uppercase tracking-wider" style={{ fontFamily: "'Teko', sans-serif" }}>
                  Contact Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    required
                    data-testid="input-email"
                  />
                  <p className="text-xs text-muted-foreground mt-2">
                    Order confirmation will be sent to this email
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="uppercase tracking-wider" style={{ fontFamily: "'Teko', sans-serif" }}>
                  Select Network
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => setSelectedNetwork('base')}
                    className={`p-4 rounded-md border-2 transition-all ${
                      selectedNetwork === 'base'
                        ? 'border-primary bg-primary/10'
                        : 'border-border hover:border-primary/50'
                    }`}
                    data-testid="button-select-base"
                  >
                    <div className="text-center">
                      <p className="font-semibold mb-1">Base Network</p>
                      <Badge variant="outline" className="text-xs">EVM</Badge>
                      <p className="text-xs text-muted-foreground mt-2">
                        MetaMask, Coinbase Wallet
                      </p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedNetwork('solana')}
                    className={`p-4 rounded-md border-2 transition-all ${
                      selectedNetwork === 'solana'
                        ? 'border-primary bg-primary/10'
                        : 'border-border hover:border-primary/50'
                    }`}
                    data-testid="button-select-solana"
                  >
                    <div className="text-center">
                      <p className="font-semibold mb-1">Solana Network</p>
                      <Badge variant="outline" className="text-xs">SOL</Badge>
                      <p className="text-xs text-muted-foreground mt-2">
                        Phantom, Backpack
                      </p>
                    </div>
                  </button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="uppercase tracking-wider" style={{ fontFamily: "'Teko', sans-serif" }}>
                  Crypto Wallet
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {selectedNetwork === 'base' ? (
                  !isConnected ? (
                    <div className="bg-muted p-4 rounded-md">
                      <div className="flex items-center gap-2 mb-3">
                        <Wallet className="w-5 h-5 text-primary" />
                        <p className="text-sm font-medium">Connect EVM Wallet</p>
                      </div>
                      <p className="text-xs text-muted-foreground mb-4">
                        MetaMask, Coinbase Wallet, WalletConnect, Phantom (EVM mode)
                      </p>
                      <WalletConnect />
                    </div>
                  ) : (
                    <div className="bg-primary/10 border border-primary/20 p-4 rounded-md">
                      <div className="flex items-center gap-2 mb-2">
                        <Wallet className="w-5 h-5 text-primary" />
                        <p className="text-sm font-medium text-primary">EVM Wallet Connected</p>
                      </div>
                      <p className="text-xs text-muted-foreground font-mono" data-testid="text-wallet-address">
                        {walletAddress}
                      </p>
                    </div>
                  )
                ) : (
                  !solanaConnected ? (
                    <div className="bg-muted p-4 rounded-md">
                      <div className="flex items-center gap-2 mb-3">
                        <Wallet className="w-5 h-5 text-primary" />
                        <p className="text-sm font-medium">Connect Solana Wallet</p>
                      </div>
                      <p className="text-xs text-muted-foreground mb-4">
                        Phantom or Backpack wallet required
                      </p>
                      {solanaWallet ? (
                        <Button onClick={connectSolanaWallet} className="w-full" data-testid="button-connect-solana">
                          Connect Phantom/Backpack
                        </Button>
                      ) : (
                        <div className="space-y-2">
                          <div className="text-sm text-destructive font-medium">
                            ⚠️ No Solana wallet detected
                          </div>
                          <div className="text-xs text-muted-foreground space-y-1">
                            <p>• Install Phantom wallet from phantom.app</p>
                            <p>• If Phantom is installed, make sure it's in Solana mode (not EVM mode)</p>
                            <p>• Refresh the page after installation</p>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="bg-primary/10 border border-primary/20 p-4 rounded-md">
                      <div className="flex items-center gap-2 mb-2">
                        <Wallet className="w-5 h-5 text-primary" />
                        <p className="text-sm font-medium text-primary">Solana Wallet Connected</p>
                      </div>
                      <p className="text-xs text-muted-foreground font-mono" data-testid="text-solana-wallet-address">
                        {solanaWallet?.publicKey?.toString().slice(0, 20)}...
                      </p>
                    </div>
                  )
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="uppercase tracking-wider" style={{ fontFamily: "'Teko', sans-serif" }}>
                  Payment Details
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-muted p-4 rounded-md">
                  <div className="flex items-center gap-3 mb-3">
                    <Badge variant="default">USDC</Badge>
                    <Badge variant="outline">{selectedNetwork === 'base' ? 'Base' : 'Solana'}</Badge>
                    <Badge variant="outline" className="bg-primary/10 border-primary text-primary">X402</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">
                    Pay securely with USDC via x402 protocol on {selectedNetwork === 'base' ? 'Base' : 'Solana'}. Instant settlement, no accounts required.
                  </p>
                  <ul className="text-xs text-muted-foreground space-y-1">
                    <li>✓ Settlement in &lt;1 second</li>
                    <li>✓ No network fees for you</li>
                    <li>✓ Powered by {selectedNetwork === 'base' ? 'Base blockchain' : 'Solana blockchain'}</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            {!isWalletConnected && (
              <div className="bg-destructive/10 border border-destructive/20 p-4 rounded-md mb-4">
                <p className="text-sm text-destructive font-medium">
                  ⚠️ Connect your {selectedNetwork === 'base' ? 'EVM' : 'Solana'} wallet to enable crypto payments
                </p>
              </div>
            )}

            <Button
              type="submit"
              className="w-full h-12 uppercase tracking-wider text-base"
              disabled={!isWalletConnected || isProcessing || !email}
              data-testid="button-place-order"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processing Payment...
                </>
              ) : !isWalletConnected ? (
                'Connect Wallet to Pay'
              ) : (
                `Pay $2.50 USDC on ${selectedNetwork === 'base' ? 'Base' : 'Solana'}`
              )}
            </Button>
          </form>

          <div className="lg:sticky lg:top-24 h-fit">
            <Card>
              <CardHeader>
                <CardTitle className="uppercase tracking-wider" style={{ fontFamily: "'Teko', sans-serif" }}>
                  Order Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  {cart.map((item) => (
                    <div 
                      key={`${item.product.id}-${item.size}`}
                      className="flex gap-3 pb-3 border-b border-border last:border-0"
                      data-testid={`order-item-${item.product.id}`}
                    >
                      <div className="w-16 h-16 bg-muted rounded-md overflow-hidden">
                        <img 
                          src={getProductImage(item.product.imageUrl) || item.product.imageUrl} 
                          alt={item.product.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm uppercase truncate">
                          {item.product.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Size: {item.size} • Qty: {item.quantity}
                        </p>
                        <p className="text-sm font-semibold text-primary mt-1">
                          ${(parseFloat(item.product.price) * item.quantity).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="pt-4 space-y-2 border-t border-border">
                  <div className="flex justify-between text-sm">
                    <span>Subtotal</span>
                    <span>${totalPrice.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Shipping</span>
                    <span className="text-accent">Free</span>
                  </div>
                  <div className="flex justify-between text-lg font-bold pt-2 border-t border-border">
                    <span className="uppercase tracking-wider">Total</span>
                    <span className="text-primary text-2xl" data-testid="text-order-total">
                      ${totalPrice.toFixed(2)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
