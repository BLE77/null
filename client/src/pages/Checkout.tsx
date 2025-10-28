import { useCart } from "@/lib/cart-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { Loader2, CheckCircle2, Wallet } from "lucide-react";
import { getProductImage } from "@/lib/product-images";
import { useAccount, useWalletClient } from 'wagmi';
import { WalletConnect } from '@/components/WalletConnect';
import { wrapFetchWithPayment } from 'x402-fetch';

export default function Checkout() {
  const { cart, getTotalPrice, clearCart } = useCart();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const { address: walletAddress, isConnected } = useAccount();
  const { data: walletClient } = useWalletClient();
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [orderComplete, setOrderComplete] = useState(false);
  const [transactionHash, setTransactionHash] = useState("");

  const totalPrice = getTotalPrice();

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
    
    if (!email || !address || !city || !postalCode) {
      toast({
        title: "Missing information",
        description: "Please fill in all shipping details",
        variant: "destructive",
      });
      return;
    }

    if (!isConnected || !walletAddress) {
      toast({
        title: "Wallet not connected",
        description: "Please connect your crypto wallet to complete payment",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);

    try {
      if (!walletClient) {
        throw new Error("Wallet client not available");
      }

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
        shippingDetails: { address, city, postalCode },
      };

      // FIXED TEST PRICE: 0.001 ETH (~$2.50 at current rates)
      // TODO: Make this dynamic based on cart total and real ETH/USD price
      const ethAmount = 0.001; // Must match server price in routes.ts
      
      toast({
        title: "Preparing payment",
        description: `Processing test payment of ${ethAmount} ETH (fixed test price)...`,
      });

      // Wrap fetch with X402 payment capabilities
      // This automatically handles 402 responses, signs the payment, and retries
      const fetchWithPayment = wrapFetchWithPayment(
        fetch, 
        walletClient as any, // WalletClient from wagmi is compatible but types differ
        // Max payment in ETH (18 decimals) - convert to wei
        // Using 0.01 ETH as max to allow headroom above the 0.001 ETH charge
        BigInt(Math.floor(0.01 * 1_000_000_000_000_000_000))
      );

      const response = await fetchWithPayment('/api/checkout/pay', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData),
      });

      if (response.ok) {
        // Payment verified and order created
        const result = await response.json();
        setTransactionHash(result.order.transactionHash);
        setOrderComplete(true);
        clearCart();
        setIsProcessing(false);
        toast({
          title: "Payment successful!",
          description: "Your X402 ETH payment has been verified on-chain",
        });
      } else {
        const error = await response.json();
        throw new Error(error.message || 'Payment failed');
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
      <div className="min-h-screen pt-24 pb-12">
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
                  <Badge variant="outline">ETH</Badge>
                  <Badge variant="outline">Base Network</Badge>
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
    <div className="min-h-screen pt-24 pb-12">
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
                  Shipping Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
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
                </div>

                <div>
                  <Label htmlFor="address">Street Address</Label>
                  <Input
                    id="address"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="123 Main St"
                    required
                    data-testid="input-address"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="city">City</Label>
                    <Input
                      id="city"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="New York"
                      required
                      data-testid="input-city"
                    />
                  </div>

                  <div>
                    <Label htmlFor="postal">Postal Code</Label>
                    <Input
                      id="postal"
                      value={postalCode}
                      onChange={(e) => setPostalCode(e.target.value)}
                      placeholder="10001"
                      required
                      data-testid="input-postal"
                    />
                  </div>
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
                {!isConnected ? (
                  <div className="bg-muted p-4 rounded-md">
                    <div className="flex items-center gap-2 mb-3">
                      <Wallet className="w-5 h-5 text-primary" />
                      <p className="text-sm font-medium">Connect your wallet to pay</p>
                    </div>
                    <p className="text-xs text-muted-foreground mb-4">
                      Supports MetaMask, Phantom, Coinbase Wallet, WalletConnect and 300+ wallets
                    </p>
                    <WalletConnect />
                  </div>
                ) : (
                  <div className="bg-primary/10 border border-primary/20 p-4 rounded-md">
                    <div className="flex items-center gap-2 mb-2">
                      <Wallet className="w-5 h-5 text-primary" />
                      <p className="text-sm font-medium text-primary">Wallet Connected</p>
                    </div>
                    <p className="text-xs text-muted-foreground font-mono" data-testid="text-wallet-address">
                      {walletAddress}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="uppercase tracking-wider" style={{ fontFamily: "'Teko', sans-serif" }}>
                  Payment Method
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-muted p-4 rounded-md">
                  <div className="flex items-center gap-3 mb-3">
                    <Badge variant="default">ETH</Badge>
                    <Badge variant="outline">Base Network</Badge>
                    <Badge variant="outline" className="bg-primary/10 border-primary text-primary">X402</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">
                    Pay securely with ETH via x402 protocol. Instant settlement, no accounts required.
                  </p>
                  <ul className="text-xs text-muted-foreground space-y-1">
                    <li>✓ Settlement in &lt;1 second</li>
                    <li>✓ No network fees for you</li>
                    <li>✓ Powered by Base blockchain</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            {!isConnected && (
              <div className="bg-destructive/10 border border-destructive/20 p-4 rounded-md mb-4">
                <p className="text-sm text-destructive font-medium">
                  ⚠️ Connect your wallet to enable crypto payments
                </p>
              </div>
            )}

            <Button
              type="submit"
              className="w-full h-12 uppercase tracking-wider text-base"
              disabled={!isConnected || isProcessing}
              data-testid="button-place-order"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processing Payment...
                </>
              ) : !isConnected ? (
                'Connect Wallet to Pay'
              ) : (
                'Pay 0.001 ETH (Test Payment)'
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
