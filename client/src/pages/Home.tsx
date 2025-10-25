import { useQuery } from "@tanstack/react-query";
import type { Product } from "@shared/schema";
import { AnimatedProductCard } from "@/components/AnimatedProductCard";
import { ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEffect, useRef } from "react";

export default function Home() {
  const { data: products, isLoading, isError } = useQuery<Product[]>({
    queryKey: ["/api/products"],
  });

  const timelineRef = useRef<HTMLDivElement>(null);

  // Convert vertical scroll to horizontal scroll for the timeline
  useEffect(() => {
    const timeline = timelineRef.current;
    if (!timeline) return;

    let scrollTimeout: NodeJS.Timeout;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      e.stopPropagation();
      
      // Temporarily disable snap scrolling during active scrolling
      timeline.style.scrollSnapType = 'none';
      
      // Use deltaY primarily (vertical scroll), but also check deltaX for trackpads
      const scrollAmount = e.deltaY !== 0 ? e.deltaY : e.deltaX;
      
      // Convert vertical scroll to horizontal movement with smooth behavior
      timeline.scrollBy({ left: scrollAmount, behavior: 'auto' });
      
      // Re-enable snap scrolling after user stops scrolling
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        timeline.style.scrollSnapType = 'x mandatory';
      }, 150);
    };

    timeline.addEventListener('wheel', handleWheel, { passive: false });

    return () => {
      timeline.removeEventListener('wheel', handleWheel);
      clearTimeout(scrollTimeout);
    };
  }, []);

  return (
    <div 
      ref={timelineRef}
      className="h-screen overflow-x-auto overflow-y-hidden snap-x snap-mandatory scrollbar-hide"
      style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      data-testid="timeline-container"
    >
      <div className="flex h-full">
        {/* Section 1: Hero */}
        <section className="flex-none h-screen flex items-center justify-center snap-center relative overflow-hidden bg-gradient-to-br from-primary/20 via-background to-accent/20" style={{ minWidth: '100vw' }}>
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
                  data-testid="button-shop-now"
                >
                  Scroll Right →
                </Button>
              </div>
            </div>
          </div>

          <div className="absolute right-8 top-1/2 -translate-y-1/2 z-20">
            <ChevronRight className="w-8 h-8 text-primary animate-pulse" />
          </div>
        </section>

        {/* Section 2: Products Timeline */}
        <section className="flex-none h-screen snap-center relative bg-background flex items-center" style={{ minWidth: '100vw' }} id="products">
          <div className="w-full px-8 md:px-16">
            <div className="mb-12 text-center">
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
              <div className="flex gap-6 justify-center">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="w-80">
                    <div className="aspect-[4/5] bg-muted rounded geometric-panel animate-pulse" />
                  </div>
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
              <div className="flex gap-6 justify-center overflow-x-visible px-4" data-testid="grid-products">
                {products?.slice(0, 3).map((product, index) => (
                  <AnimatedProductCard
                    key={product.id}
                    product={product}
                    delay={index * 150}
                  />
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Section 3: More Products */}
        {!isLoading && !isError && products && products.length > 3 && (
          <section className="flex-none h-screen snap-center relative bg-accent/10 flex items-center" style={{ minWidth: '100vw' }}>
            <div className="w-full px-8 md:px-16">
              <div className="flex gap-6 justify-center overflow-x-visible px-4">
                {products.slice(3, 6).map((product, index) => (
                  <AnimatedProductCard
                    key={product.id}
                    product={product}
                    delay={index * 150}
                  />
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Section 4: Crypto Payment */}
        <section className="flex-none h-screen snap-center bg-accent/30 flex items-center" style={{ minWidth: '100vw' }}>
          <div className="container mx-auto px-8 md:px-16 max-w-6xl">
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

        {/* Section 5: Footer / Contact */}
        <section className="flex-none h-screen snap-center bg-secondary flex items-center border-l-2 border-primary" style={{ minWidth: '100vw' }}>
          <div className="container mx-auto px-8 md:px-16 max-w-7xl w-full">
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
        </section>
      </div>
    </div>
  );
}
