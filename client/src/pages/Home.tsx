import { useQuery } from "@tanstack/react-query";
import type { Product } from "@shared/schema";
import { ProductCard } from "@/components/ProductCard";
import { ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Home() {
  const { data: products, isLoading, isError } = useQuery<Product[]>({
    queryKey: ["/api/products"],
  });

  return (
    <div className="min-h-screen">
      {/* Hero Section - Clean geometric */}
      <section className="relative h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-primary/20 via-background to-accent/20">
        <div className="absolute inset-0 texture-overlay" />
        
        {/* Clean geometric grid overlay */}
        <div className="absolute inset-0" style={{
          backgroundImage: 'linear-gradient(rgba(0,0,0,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.02) 1px, transparent 1px)',
          backgroundSize: '80px 80px'
        }} />

        <div className="relative z-20 text-center px-4 max-w-4xl mx-auto">
          <div className="geometric-panel bg-white/90 backdrop-blur-md p-12 md:p-16 corner-lines">
            <h1 
              className="text-5xl md:text-7xl lg:text-8xl font-bold mb-6 text-foreground"
              style={{ fontFamily: "var(--font-display)", letterSpacing: "-0.03em" }}
              data-testid="text-hero-title"
            >
              CYBER VOID
            </h1>
            <div className="h-1 w-24 bg-primary mx-auto mb-6" />
            <p className="text-xl md:text-2xl text-muted-foreground mb-10 font-medium">
              Digital Streetwear for 2025
            </p>
            <div className="flex gap-4 justify-center flex-wrap">
              <Button 
                size="lg" 
                className="uppercase tracking-wider text-base px-10 font-semibold"
                onClick={() => document.getElementById('products')?.scrollIntoView({ behavior: 'smooth' })}
                data-testid="button-shop-now"
              >
                Shop Collection
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                className="uppercase tracking-wider text-base px-10 font-semibold border-2"
                data-testid="button-learn-more"
              >
                Learn More
              </Button>
            </div>
          </div>
        </div>

        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20">
          <ChevronDown className="w-8 h-8 text-primary animate-bounce" />
        </div>
      </section>

      {/* Products Section */}
      <section id="products" className="py-20 md:py-32 bg-background">
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="mb-16 text-center">
            <h2 
              className="text-4xl md:text-6xl font-bold mb-4 text-foreground"
              style={{ fontFamily: "var(--font-display)" }}
              data-testid="text-collection-title"
            >
              Latest Collection
            </h2>
            <div className="h-1 w-20 bg-primary mx-auto mb-6" />
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Explore our curated selection of premium streetwear pieces
            </p>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="aspect-[4/5] bg-muted rounded geometric-panel animate-pulse" />
              ))}
            </div>
          ) : isError ? (
            <div className="text-center py-16 geometric-panel bg-card p-12 max-w-2xl mx-auto">
              <h3 className="text-2xl font-bold mb-4">Failed to load products</h3>
              <p className="text-muted-foreground mb-6">Please try again later</p>
              <Button onClick={() => window.location.reload()} data-testid="button-reload">
                Reload Page
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8" data-testid="grid-products">
              {products?.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Crypto Payment Section */}
      <section className="py-20 md:py-32 bg-accent/30">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div className="geometric-panel bg-white p-10 corner-lines">
              <h2 
                className="text-4xl md:text-5xl font-bold mb-6 text-foreground"
                style={{ fontFamily: "var(--font-display)" }}
              >
                Crypto Payments
              </h2>
              <div className="h-1 w-16 bg-primary mb-6" />
              <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
                Fast, secure cryptocurrency payments powered by <span className="font-bold text-foreground">x402 protocol</span>. Pay with USDC on Base network.
              </p>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-primary rounded-full" />
                  <span className="text-base">Instant settlement (~200ms)</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-primary rounded-full" />
                  <span className="text-base">No signup required</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-primary rounded-full" />
                  <span className="text-base">Secure on-chain transactions</span>
                </div>
              </div>
            </div>
            <div className="geometric-panel bg-white aspect-square flex items-center justify-center p-16">
              <div className="text-center">
                <div className="text-7xl font-black mb-4 text-primary" style={{ fontFamily: "var(--font-display)" }}>
                  X402
                </div>
                <p className="text-sm uppercase tracking-wider text-muted-foreground font-semibold">
                  Protocol Integration
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-secondary border-t-2 border-primary py-16">
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
            <div>
              <h3 className="font-bold uppercase tracking-wider mb-4 text-base" style={{ fontFamily: "var(--font-display)" }}>
                About
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Modern streetwear for the digital generation. Built for the future.
              </p>
            </div>
            
            <div>
              <h3 className="font-bold uppercase tracking-wider mb-4 text-base" style={{ fontFamily: "var(--font-display)" }}>
                Shop
              </h3>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="text-muted-foreground hover:text-primary transition-colors">All Products</a></li>
                <li><a href="#" className="text-muted-foreground hover:text-primary transition-colors">New Arrivals</a></li>
                <li><a href="#" className="text-muted-foreground hover:text-primary transition-colors">Sale</a></li>
              </ul>
            </div>

            <div>
              <h3 className="font-bold uppercase tracking-wider mb-4 text-base" style={{ fontFamily: "var(--font-display)" }}>
                Support
              </h3>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="text-muted-foreground hover:text-primary transition-colors">Contact</a></li>
                <li><a href="#" className="text-muted-foreground hover:text-primary transition-colors">Shipping</a></li>
                <li><a href="#" className="text-muted-foreground hover:text-primary transition-colors">Returns</a></li>
              </ul>
            </div>

            <div>
              <h3 className="font-bold uppercase tracking-wider mb-4 text-base" style={{ fontFamily: "var(--font-display)" }}>
                Connect
              </h3>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="text-muted-foreground hover:text-primary transition-colors">Twitter</a></li>
                <li><a href="#" className="text-muted-foreground hover:text-primary transition-colors">Instagram</a></li>
                <li><a href="#" className="text-muted-foreground hover:text-primary transition-colors">Discord</a></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-border pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-muted-foreground">
              © 2025 Cyber Void. All rights reserved.
            </p>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">Powered by</span>
              <span className="font-bold text-primary">x402</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
