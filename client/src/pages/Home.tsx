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
      <section className="relative h-screen flex items-center justify-center overflow-hidden grain-overlay">
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/60 to-background z-10" />
        
        <div className="absolute inset-0 flex items-center justify-center text-xs text-muted-foreground bg-muted">
          HERO-IMAGE-VIDEO
        </div>

        <div className="relative z-20 text-center px-4 max-w-4xl mx-auto">
          <h1 
            className="text-6xl md:text-8xl lg:text-9xl font-bold uppercase tracking-wider mb-6 text-primary"
            style={{ fontFamily: "'Bebas Neue', sans-serif" }}
            data-testid="text-hero-title"
          >
            Your Brand
          </h1>
          <p className="text-xl md:text-2xl text-foreground mb-8 tracking-wide uppercase" style={{ fontFamily: "'Teko', sans-serif" }}>
            Y2K Streetwear / Crypto Native
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Button 
              size="lg" 
              className="uppercase tracking-wider text-base px-8 backdrop-blur-sm"
              onClick={() => document.getElementById('products')?.scrollIntoView({ behavior: 'smooth' })}
              data-testid="button-shop-now"
            >
              Shop Now
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              className="uppercase tracking-wider text-base px-8 backdrop-blur-sm bg-background/20"
              data-testid="button-learn-more"
            >
              Learn More
            </Button>
          </div>
        </div>

        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 animate-bounce">
          <ChevronDown className="w-8 h-8 text-primary" style={{ animation: 'scroll-prompt 2s infinite' }} />
        </div>
      </section>

      <section id="products" className="py-16 md:py-24">
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="mb-12">
            <h2 
              className="text-4xl md:text-6xl font-bold uppercase tracking-wider mb-4"
              style={{ fontFamily: "'Bebas Neue', sans-serif" }}
              data-testid="text-collection-title"
            >
              Latest Drop
            </h2>
            <div className="h-1 w-24 bg-primary" />
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="aspect-[4/5] bg-muted rounded-md animate-pulse" />
              ))}
            </div>
          ) : isError ? (
            <div className="text-center py-12">
              <h3 className="text-2xl font-bold mb-4">Failed to load products</h3>
              <p className="text-muted-foreground mb-6">There was an error loading the product catalog. Please try again later.</p>
              <Button onClick={() => window.location.reload()} data-testid="button-reload">
                Reload Page
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" data-testid="grid-products">
              {products?.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="py-16 md:py-24 bg-card border-y border-border">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 
                className="text-4xl md:text-5xl font-bold uppercase tracking-wider mb-6"
                style={{ fontFamily: "'Bebas Neue', sans-serif" }}
              >
                Crypto Native
              </h2>
              <p className="text-lg text-muted-foreground mb-6 leading-relaxed">
                We accept cryptocurrency payments via x402 protocol. Pay with USDC on Base network for instant, secure checkout. No accounts required.
              </p>
              <div className="flex gap-4 flex-wrap">
                <div className="bg-muted px-4 py-2 rounded-md">
                  <span className="text-sm font-semibold">USDC</span>
                </div>
                <div className="bg-muted px-4 py-2 rounded-md">
                  <span className="text-sm font-semibold">Base Network</span>
                </div>
                <div className="bg-muted px-4 py-2 rounded-md">
                  <span className="text-sm font-semibold">Instant Settlement</span>
                </div>
              </div>
            </div>
            <div className="aspect-video bg-muted rounded-md flex items-center justify-center text-xs text-muted-foreground">
              BRAND-STORY-IMG-1
            </div>
          </div>
        </div>
      </section>

      <footer className="bg-background border-t border-border py-12">
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div>
              <h3 className="font-bold uppercase tracking-wider mb-4" style={{ fontFamily: "'Teko', sans-serif" }}>
                About
              </h3>
              <p className="text-sm text-muted-foreground">
                Y2K inspired streetwear brand built for the crypto generation.
              </p>
            </div>
            
            <div>
              <h3 className="font-bold uppercase tracking-wider mb-4" style={{ fontFamily: "'Teko', sans-serif" }}>
                Shop
              </h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-primary transition-colors">All Products</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">New Arrivals</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Sale</a></li>
              </ul>
            </div>

            <div>
              <h3 className="font-bold uppercase tracking-wider mb-4" style={{ fontFamily: "'Teko', sans-serif" }}>
                Support
              </h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-primary transition-colors">Contact</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Shipping</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Returns</a></li>
              </ul>
            </div>

            <div>
              <h3 className="font-bold uppercase tracking-wider mb-4" style={{ fontFamily: "'Teko', sans-serif" }}>
                Connect
              </h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-primary transition-colors">Twitter</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Instagram</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Discord</a></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-border pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-muted-foreground">
              © 2024 Your Brand. All rights reserved.
            </p>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>Powered by</span>
              <span className="font-semibold text-accent">x402</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
