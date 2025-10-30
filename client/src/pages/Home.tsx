import { useQuery } from "@tanstack/react-query";
import type { Product } from "@shared/schema";
import { AnimatedProductCard } from "@/components/AnimatedProductCard";
import { CharacterController } from "@/components/CharacterController";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

export default function Home() {
  const { data: products, isLoading, isError } = useQuery<Product[]>({
    queryKey: ["/api/products"],
  });

  return (
    <div 
      className="min-h-screen overflow-y-auto overflow-x-hidden digital-matrix-bg"
      data-testid="timeline-container"
    >
      {/* Section 1: Hero - 3D Character Controller */}
      <section className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden">
        <div className="absolute top-16 sm:top-20 left-1/2 -translate-x-1/2 text-center z-10 w-full px-4">
          <h1 
            className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white drop-shadow-[0_8px_16px_rgba(0,0,0,1)] mb-3"
            style={{ fontFamily: "'Audiowide', sans-serif", letterSpacing: '0.1em' }}
            data-testid="text-hero-tagline"
          >
            DIGITAL GOODS FOR DIGITAL FRIENDS
          </h1>
          <h2 
            className="text-xs sm:text-sm md:text-base font-bold text-white/80 drop-shadow-[0_8px_16px_rgba(0,0,0,1)]"
            style={{ fontFamily: "'Orbitron', sans-serif", letterSpacing: '0.2em' }}
            data-testid="text-hero-subtitle"
          >
            FIRST STREETWEAR BRAND FOR AGENTS
          </h2>
        </div>
        <CharacterController />
      </section>

      {/* Section 2: Products Timeline */}
      <section className="min-h-screen relative flex items-center justify-center py-16 overflow-hidden" id="products">
        {/* Heading positioned absolutely behind robots */}
        <div className="absolute top-16 left-1/2 -translate-x-1/2 text-center z-0 w-full px-4">
          <h2 
            className="text-2xl sm:text-4xl md:text-5xl font-bold text-white/40 drop-shadow-[0_8px_16px_rgba(0,0,0,1)]"
            style={{ fontFamily: "'Orbitron', sans-serif", letterSpacing: '0.1em' }}
            data-testid="text-collection-title"
          >
            LATEST COLLECTION
          </h2>
        </div>

        {/* Products centered vertically */}
        <div className="w-full px-4 sm:px-8 md:px-16 overflow-hidden">
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
            <div className="flex flex-wrap gap-4 sm:gap-6 justify-center items-start" data-testid="grid-products">
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
        <section className="relative flex items-center justify-center py-8 overflow-hidden">
          <div className="w-full px-4 sm:px-8 md:px-16 overflow-hidden">
            <div className="flex flex-wrap gap-4 sm:gap-6 justify-center items-start">
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
      <section className="flex items-center py-16 overflow-hidden">
        <div className="container mx-auto px-4 sm:px-8 md:px-16 max-w-6xl">
          <div className="grid md:grid-cols-2 gap-8 md:gap-16 items-center">
            <div className="p-4 sm:p-10">
              <h2 
                className="text-3xl sm:text-5xl md:text-6xl font-bold mb-6 text-white drop-shadow-[0_6px_12px_rgba(0,0,0,1)]"
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
            <div className="aspect-square flex items-center justify-center p-8 sm:p-16">
              <div className="text-center">
                <div className="text-5xl sm:text-7xl font-black mb-4 text-white drop-shadow-[0_4px_12px_rgba(0,0,0,0.9)]" style={{ fontFamily: "var(--font-display)" }}>
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
      <section className="min-h-screen flex items-center border-t-2 border-primary py-16 overflow-hidden">
        <div className="container mx-auto px-4 sm:px-8 md:px-16 max-w-7xl w-full">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-12">
            <div>
              <h3 className="font-bold uppercase tracking-wider mb-4 text-base text-white drop-shadow-[0_4px_8px_rgba(0,0,0,0.9)]" style={{ fontFamily: "var(--font-display)" }}>
                About
              </h3>
              <p className="text-sm text-white leading-relaxed drop-shadow-[0_4px_8px_rgba(0,0,0,0.9)]">
                Modern streetwear for the digital. Built for the future.
              </p>
            </div>
            
            <div>
              <h3 className="font-bold uppercase tracking-wider mb-4 text-base text-white drop-shadow-[0_4px_8px_rgba(0,0,0,0.9)]" style={{ fontFamily: "var(--font-display)" }}>
                Shop
              </h3>
              <ul className="space-y-2 text-sm">
                <li><Link href="/shop" className="text-white hover:opacity-80 transition-opacity drop-shadow-[0_4px_8px_rgba(0,0,0,0.9)]">All Products</Link></li>
              </ul>
            </div>

            <div>
              <h3 className="font-bold uppercase tracking-wider mb-4 text-base text-white drop-shadow-[0_4px_8px_rgba(0,0,0,0.9)]" style={{ fontFamily: "var(--font-display)" }}>
                Connect
              </h3>
              <ul className="space-y-2 text-sm">
                <li><a href="https://x.com/off__human" target="_blank" rel="noopener noreferrer" className="text-white hover:opacity-80 transition-opacity drop-shadow-[0_4px_8px_rgba(0,0,0,0.9)]">Twitter</a></li>
                <li>
                  <span className="text-white drop-shadow-[0_4px_8px_rgba(0,0,0,0.9)] relative group cursor-default">
                    Instagram
                    <span className="absolute right-0 top-full mt-1 text-white/60 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                      Coming Soon!
                    </span>
                  </span>
                </li>
                <li>
                  <span className="text-white drop-shadow-[0_4px_8px_rgba(0,0,0,0.9)] relative group cursor-default">
                    Discord
                    <span className="absolute right-0 top-full mt-1 text-white/60 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                      Coming Soon!
                    </span>
                  </span>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-primary/30 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-white drop-shadow-[0_4px_8px_rgba(0,0,0,0.9)]">
              © 2025 OFF HUMAN. All rights reserved.
            </p>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-white drop-shadow-[0_4px_8px_rgba(0,0,0,0.9)]">Powered by</span>
              <span className="font-bold text-white drop-shadow-[0_4px_12px_rgba(0,0,0,0.9)]">x402</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
