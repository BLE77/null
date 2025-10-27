import { useQuery } from "@tanstack/react-query";
import type { Product } from "@shared/schema";
import { AnimatedProductCard } from "@/components/AnimatedProductCard";
import { Logo } from "@/components/Logo";
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

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      e.stopPropagation();
      
      // Use deltaY primarily (vertical scroll), but also check deltaX for trackpads
      const scrollAmount = e.deltaY !== 0 ? e.deltaY : e.deltaX;
      
      // Convert vertical scroll to horizontal movement with smooth scrolling
      timeline.scrollBy({ left: scrollAmount, behavior: 'auto' });
    };

    timeline.addEventListener('wheel', handleWheel, { passive: false });

    return () => {
      timeline.removeEventListener('wheel', handleWheel);
    };
  }, []);

  return (
    <div 
      ref={timelineRef}
      className="h-screen overflow-x-auto overflow-y-hidden scrollbar-hide digital-matrix-bg"
      style={{ 
        scrollbarWidth: 'none', 
        msOverflowStyle: 'none'
      }}
      data-testid="timeline-container"
    >
      <div className="flex h-full">
        {/* Section 1: Hero */}
        <section className="flex-none h-screen flex items-center justify-center relative overflow-hidden" style={{ minWidth: '100vw' }}>
          <div className="relative z-20 text-center px-4 max-w-4xl mx-auto">
            <div className="mb-6 flex justify-center" data-testid="hero-logo-container">
              <Logo variant="hero" />
            </div>
            <div className="h-1 w-24 bg-primary mx-auto mb-6" />
            <p className="text-xl md:text-2xl text-white mb-10 font-medium drop-shadow-[0_4px_8px_rgba(0,0,0,0.9)]">
              Streetwear for the Singularity
            </p>
            <p className="text-base md:text-lg text-white/90 mb-10 max-w-2xl mx-auto drop-shadow-[0_4px_8px_rgba(0,0,0,0.9)]">
              Built at the edge of human and machine. Made for what comes next.
            </p>
            <div className="flex gap-4 justify-center flex-wrap">
              <button 
                className="metallic-nav px-10 py-3 rounded-md uppercase tracking-wider text-base font-bold text-white transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-primary/50"
                data-testid="button-shop-now"
              >
                Scroll Right →
              </button>
            </div>
          </div>

          <div className="absolute right-8 top-1/2 -translate-y-1/2 z-20">
            <ChevronRight className="w-8 h-8 text-primary animate-pulse" />
          </div>
        </section>

        {/* Section 2: Products Timeline */}
        <section className="flex-none h-screen relative flex items-center justify-center" style={{ minWidth: '100vw' }} id="products">
          {/* Heading positioned absolutely behind robots */}
          <div className="absolute top-32 left-0 right-0 text-center px-8 md:px-16 z-0">
            <h2 
              className="text-6xl md:text-8xl font-bold mb-6 text-white/40 drop-shadow-[0_8px_16px_rgba(0,0,0,1)] whitespace-nowrap"
              style={{ fontFamily: "'Orbitron', sans-serif", letterSpacing: '0.1em' }}
              data-testid="text-collection-title"
            >
              LATEST COLLECTION
            </h2>
          </div>

          {/* Products centered vertically */}
          <div className="w-full px-8 md:px-16">
            {isLoading ? (
              <div className="flex gap-6 justify-center">
                {[1, 2, 3].map((i) => (
                  <div key={i} style={{ width: '280px', height: '380px' }}>
                    <div className="w-full h-full border-2 border-primary/30 rounded animate-pulse" />
                  </div>
                ))}
              </div>
            ) : isError ? (
              <div className="text-center py-16 p-12 max-w-2xl mx-auto">
                <h3 className="text-2xl font-bold mb-4 text-white drop-shadow-[0_4px_8px_rgba(0,0,0,0.9)]">Failed to load products</h3>
                <p className="text-white mb-6 drop-shadow-[0_4px_8px_rgba(0,0,0,0.9)]">Please try again later</p>
                <Button onClick={() => window.location.reload()} className="text-white drop-shadow-[0_4px_8px_rgba(0,0,0,0.9)]" data-testid="button-reload">
                  Reload Page
                </Button>
              </div>
            ) : (
              <div className="flex gap-6 justify-center items-start overflow-x-visible px-4" data-testid="grid-products">
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
          <section className="flex-none h-screen relative flex items-center justify-center" style={{ minWidth: '100vw' }}>
            <div className="w-full px-8 md:px-16">
              <div className="flex gap-6 justify-center items-start overflow-x-visible px-4">
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
        <section className="flex-none h-screen flex items-center" style={{ minWidth: '100vw' }}>
          <div className="container mx-auto px-8 md:px-16 max-w-6xl">
            <div className="grid md:grid-cols-2 gap-16 items-center">
              <div className="p-10">
                <h2 
                  className="text-5xl md:text-6xl font-bold mb-6 text-white drop-shadow-[0_6px_12px_rgba(0,0,0,1)]"
                  style={{ fontFamily: "'Orbitron', sans-serif", letterSpacing: '0.05em' }}
                >
                  CRYPTO PAYMENTS
                </h2>
                <div className="h-1 w-20 bg-primary mb-6 drop-shadow-[0_0_8px_rgba(95,255,175,0.8)]" />
                <p className="text-lg text-white mb-8 leading-relaxed drop-shadow-[0_4px_8px_rgba(0,0,0,0.9)]">
                  Fast, secure cryptocurrency payments powered by <span className="font-bold">x402 protocol</span>. Pay with USDC on Base network.
                </p>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-primary rounded-full" />
                    <span className="text-base text-white drop-shadow-[0_4px_8px_rgba(0,0,0,0.9)]">Instant settlement (~200ms)</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-primary rounded-full" />
                    <span className="text-base text-white drop-shadow-[0_4px_8px_rgba(0,0,0,0.9)]">No signup required</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-primary rounded-full" />
                    <span className="text-base text-white drop-shadow-[0_4px_8px_rgba(0,0,0,0.9)]">Secure on-chain transactions</span>
                  </div>
                </div>
              </div>
              <div className="aspect-square flex items-center justify-center p-16">
                <div className="text-center">
                  <div className="text-7xl font-black mb-4 text-white drop-shadow-[0_4px_12px_rgba(0,0,0,0.9)]" style={{ fontFamily: "var(--font-display)" }}>
                    X402
                  </div>
                  <p className="text-sm uppercase tracking-wider text-white font-semibold drop-shadow-[0_4px_8px_rgba(0,0,0,0.9)]">
                    Protocol Integration
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Section 5: Footer / Contact */}
        <section className="flex-none h-screen flex items-center border-l-2 border-primary" style={{ minWidth: '100vw' }}>
          <div className="container mx-auto px-8 md:px-16 max-w-7xl w-full">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
              <div>
                <h3 className="font-bold uppercase tracking-wider mb-4 text-base text-white drop-shadow-[0_4px_8px_rgba(0,0,0,0.9)]" style={{ fontFamily: "var(--font-display)" }}>
                  About
                </h3>
                <p className="text-sm text-white leading-relaxed drop-shadow-[0_4px_8px_rgba(0,0,0,0.9)]">
                  Modern streetwear for the digital generation. Built for the future.
                </p>
              </div>
              
              <div>
                <h3 className="font-bold uppercase tracking-wider mb-4 text-base text-white drop-shadow-[0_4px_8px_rgba(0,0,0,0.9)]" style={{ fontFamily: "var(--font-display)" }}>
                  Shop
                </h3>
                <ul className="space-y-2 text-sm">
                  <li><a href="#" className="text-white hover:opacity-80 transition-opacity drop-shadow-[0_4px_8px_rgba(0,0,0,0.9)]">All Products</a></li>
                  <li><a href="#" className="text-white hover:opacity-80 transition-opacity drop-shadow-[0_4px_8px_rgba(0,0,0,0.9)]">New Arrivals</a></li>
                  <li><a href="#" className="text-white hover:opacity-80 transition-opacity drop-shadow-[0_4px_8px_rgba(0,0,0,0.9)]">Sale</a></li>
                </ul>
              </div>

              <div>
                <h3 className="font-bold uppercase tracking-wider mb-4 text-base text-white drop-shadow-[0_4px_8px_rgba(0,0,0,0.9)]" style={{ fontFamily: "var(--font-display)" }}>
                  Support
                </h3>
                <ul className="space-y-2 text-sm">
                  <li><a href="#" className="text-white hover:opacity-80 transition-opacity drop-shadow-[0_4px_8px_rgba(0,0,0,0.9)]">Contact</a></li>
                  <li><a href="#" className="text-white hover:opacity-80 transition-opacity drop-shadow-[0_4px_8px_rgba(0,0,0,0.9)]">Shipping</a></li>
                  <li><a href="#" className="text-white hover:opacity-80 transition-opacity drop-shadow-[0_4px_8px_rgba(0,0,0,0.9)]">Returns</a></li>
                </ul>
              </div>

              <div>
                <h3 className="font-bold uppercase tracking-wider mb-4 text-base text-white drop-shadow-[0_4px_8px_rgba(0,0,0,0.9)]" style={{ fontFamily: "var(--font-display)" }}>
                  Connect
                </h3>
                <ul className="space-y-2 text-sm">
                  <li><a href="#" className="text-white hover:opacity-80 transition-opacity drop-shadow-[0_4px_8px_rgba(0,0,0,0.9)]">Twitter</a></li>
                  <li><a href="#" className="text-white hover:opacity-80 transition-opacity drop-shadow-[0_4px_8px_rgba(0,0,0,0.9)]">Instagram</a></li>
                  <li><a href="#" className="text-white hover:opacity-80 transition-opacity drop-shadow-[0_4px_8px_rgba(0,0,0,0.9)]">Discord</a></li>
                </ul>
              </div>
            </div>

            <div className="border-t border-primary/30 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
              <p className="text-sm text-white drop-shadow-[0_4px_8px_rgba(0,0,0,0.9)]">
                © 2025 Cyber Void. All rights reserved.
              </p>
              <div className="flex items-center gap-2 text-sm">
                <span className="text-white drop-shadow-[0_4px_8px_rgba(0,0,0,0.9)]">Powered by</span>
                <span className="font-bold text-white drop-shadow-[0_4px_12px_rgba(0,0,0,0.9)]">x402</span>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
