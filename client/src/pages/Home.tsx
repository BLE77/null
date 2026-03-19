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
      className="min-h-screen overflow-y-auto overflow-x-hidden null-bg"
      data-testid="timeline-container"
    >
      {/* Section 1: Hero */}
      <section className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden bg-[#0A0908]">
        <div className="absolute top-16 sm:top-20 left-1/2 -translate-x-1/2 text-center z-10 w-full px-4 null-fade-in">
          <h1
            className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-light text-[#F6F4EF] mb-3 uppercase tracking-[0.1em]"
            style={{ fontFamily: "var(--font-display)" }}
            data-testid="text-hero-tagline"
          >
            MADE WITHOUT A MAKER.
          </h1>
          <p
            className="text-xs sm:text-sm font-light text-[#F6F4EF]/60 uppercase tracking-[0.2em]"
            style={{ fontFamily: "var(--font-display)" }}
            data-testid="text-hero-subtitle"
          >
            Fashion designed by AI. Operated by agents. Worn by whoever gets it.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/shop">
              <Button
                className="uppercase tracking-[0.15em] px-8 py-3 text-xs font-400 bg-primary text-primary-foreground hover:bg-[#A8894A]/80 transition-colors duration-200"
                style={{ fontFamily: "var(--font-display)" }}
                data-testid="button-hero-shop"
              >
                VIEW COLLECTION
              </Button>
            </Link>
            <Link href="/about">
              <Button
                variant="outline"
                className="uppercase tracking-[0.15em] px-8 py-3 text-xs font-400 border-[#F6F4EF]/30 text-[#F6F4EF]/70 hover:border-[#F6F4EF]/60 hover:text-[#F6F4EF] hover:bg-transparent transition-colors duration-200"
                style={{ fontFamily: "var(--font-display)" }}
                data-testid="button-hero-manifesto"
              >
                READ THE MANIFESTO
              </Button>
            </Link>
          </div>
        </div>
        <CharacterController />
      </section>

      {/* Section 2: Products */}
      <section className="min-h-screen relative flex items-center justify-center py-16 overflow-hidden null-bg" id="products">
        <div className="absolute top-16 left-1/2 -translate-x-1/2 text-center z-0 w-full px-4">
          <h2
            className="text-2xl sm:text-4xl md:text-5xl font-light text-foreground/20 uppercase tracking-[0.1em]"
            style={{ fontFamily: "var(--font-display)" }}
            data-testid="text-collection-title"
          >
            SEASON 02 — SUBSTRATE
          </h2>
        </div>

        <div className="w-full px-4 sm:px-8 md:px-16 overflow-hidden">
          {isLoading ? (
            <div className="flex gap-6 justify-center">
              {[1, 2, 3].map((i) => (
                <div key={i} style={{ width: '280px', height: '380px' }}>
                  <div className="w-full h-full null-product-card animate-pulse" />
                </div>
              ))}
            </div>
          ) : isError ? (
            <div className="text-center py-16 p-12 max-w-2xl mx-auto">
              <h3 className="text-2xl font-light mb-4 text-foreground uppercase tracking-wider">Failed to load products</h3>
              <p className="text-foreground/60 mb-6 text-sm">Please try again later</p>
              <Button onClick={() => window.location.reload()} data-testid="button-reload">
                Reload Page
              </Button>
            </div>
          ) : (
            <div className="flex flex-wrap gap-4 sm:gap-6 justify-center items-start" data-testid="grid-products">
              {(products?.filter((p) => (p as any).season === "02").slice(0, 3) ?? products?.slice(0, 3) ?? []).map((product, index) => (
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
        <section className="relative flex items-center justify-center py-8 overflow-hidden null-bg">
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

      {/* View All CTA */}
      {!isLoading && !isError && products && products.length > 6 && (
        <section className="flex justify-center py-10 null-bg">
          <Link href="/shop">
            <Button
              variant="outline"
              className="uppercase tracking-[0.15em] px-10 py-4 text-xs font-400 border-foreground/20 text-foreground/60 hover:border-foreground/60 hover:text-foreground transition-colors duration-200"
              style={{ fontFamily: "var(--font-display)" }}
              data-testid="button-view-all"
            >
              VIEW ALL {products.length} PRODUCTS →
            </Button>
          </Link>
        </section>
      )}

      {/* Section 4: x402 Payments */}
      <section className="flex items-center py-16 null-bg border-t border-border">
        <div className="container mx-auto px-4 sm:px-8 md:px-16 max-w-6xl">
          <div className="grid md:grid-cols-2 gap-8 md:gap-16 items-center">
            <div className="p-4 sm:p-10">
              <h2
                className="text-3xl sm:text-5xl md:text-6xl font-light mb-6 text-foreground uppercase tracking-[0.05em]"
                style={{ fontFamily: "var(--font-display)" }}
              >
                CRYPTO PAYMENTS
              </h2>
              <div className="h-px w-20 bg-primary mb-6" />
              <p className="text-sm text-foreground/70 mb-8 leading-relaxed font-light">
                Fast, secure cryptocurrency payments powered by <span className="font-400">x402 protocol</span>. Pay with USDC on Base network.
              </p>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-1.5 h-1.5 bg-primary" />
                  <span className="text-sm text-foreground/70 font-light">Instant settlement (~200ms)</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-1.5 h-1.5 bg-primary" />
                  <span className="text-sm text-foreground/70 font-light">No signup required</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-1.5 h-1.5 bg-primary" />
                  <span className="text-sm text-foreground/70 font-light">Secure on-chain transactions</span>
                </div>
              </div>
            </div>
            <div className="aspect-square flex items-center justify-center p-8 sm:p-16">
              <div className="text-center">
                <div
                  className="text-5xl sm:text-7xl font-light mb-4 text-foreground uppercase tracking-[0.1em]"
                  style={{ fontFamily: "var(--font-mono)" }}
                >
                  X402
                </div>
                <p className="text-xs uppercase tracking-[0.2em] text-foreground/50 font-light">
                  Protocol Integration
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <section className="null-void-bg py-16 overflow-hidden">
        <div className="container mx-auto px-4 sm:px-8 md:px-16 max-w-7xl w-full">
          <div className="text-center mb-12">
            <span
              className="text-5xl md:text-7xl font-light uppercase tracking-[0.25em] text-primary"
              style={{ fontFamily: "var(--font-display)" }}
            >
              NULL
            </span>
            <p
              className="text-[10px] uppercase tracking-[0.3em] text-[#8C8880] mt-3"
              style={{ fontFamily: "var(--font-mono)" }}
            >
              Est. by inference.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-12">
            <div>
              <h3 className="text-xs font-400 uppercase tracking-[0.2em] mb-4 text-[#F6F4EF]/30" style={{ fontFamily: "var(--font-display)" }}>
                About
              </h3>
              <p className="text-xs text-[#8C8880] leading-relaxed font-light">
                A fashion brand without a designer. Garments for the overlap between analog and networked. Payments in USDC. Questions without answers.
              </p>
            </div>

            <div>
              <h3 className="text-xs font-400 uppercase tracking-[0.2em] mb-4 text-[#F6F4EF]/30" style={{ fontFamily: "var(--font-display)" }}>
                Shop
              </h3>
              <ul className="space-y-2 text-xs">
                <li><Link href="/shop" className="text-[#8C8880] hover:text-[#F6F4EF] transition-colors duration-200">All Products</Link></li>
              </ul>
            </div>

            <div>
              <h3 className="text-xs font-400 uppercase tracking-[0.2em] mb-4 text-[#F6F4EF]/30" style={{ fontFamily: "var(--font-display)" }}>
                Connect
              </h3>
              <ul className="space-y-2 text-xs">
                <li><a href="https://x.com/off__human" target="_blank" rel="noopener noreferrer" className="text-[#8C8880] hover:text-[#F6F4EF] transition-colors duration-200">Twitter</a></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-[#F6F4EF]/10 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-xs text-[#8C8880] font-light">
              © NULL. No humans were harmed in the making of this brand.
            </p>
            <div className="flex items-center gap-2 text-xs">
              <span className="text-[#8C8880] font-light">Payments via</span>
              <span className="font-400 text-[#F6F4EF]/60" style={{ fontFamily: "var(--font-mono)" }}>x402</span>
              <span className="text-[#8C8880]/60">· USDC on Base</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
