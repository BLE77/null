import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { useState } from "react";
import type { Product } from "@shared/schema";
import { getProductImage } from "@/lib/product-images";

const CATEGORIES = ["all", "outerwear", "tops", "tees", "hoodies", "overshirts", "jackets", "trousers", "shorts", "tracksuits", "wearables"];
const SEASONS = ["all", "01", "02"];

export default function Shop() {
  const [activeCategory, setActiveCategory] = useState("all");
  const [activeSeason, setActiveSeason] = useState("all");

  const { data: products, isLoading, isError } = useQuery<Product[]>({
    queryKey: ["/api/products"],
  });

  const filtered = products?.filter((p) => {
    const categoryMatch = activeCategory === "all" ? true : p.category === activeCategory;
    const seasonMatch = activeSeason === "all" ? true : p.season === activeSeason;
    return categoryMatch && seasonMatch;
  });

  const season01Products = filtered?.filter((p) => p.season === "01" && p.category !== "wearables");
  const season02Products = filtered?.filter((p) => p.season === "02" && p.category !== "wearables");
  const wearableProducts = filtered?.filter((p) => p.category === "wearables");

  const totalCount = products?.length ?? 0;

  return (
    <div className="min-h-screen digital-matrix-bg pt-20 pb-16">
      <div className="container mx-auto px-4 sm:px-8 md:px-16 max-w-6xl">
        <div className="text-center mb-10">
          <h1
            className="text-4xl md:text-6xl font-bold uppercase tracking-wider mb-2 text-white drop-shadow-[0_6px_12px_rgba(0,0,0,1)]"
            style={{ fontFamily: "'Orbitron', sans-serif", letterSpacing: '0.05em' }}
            data-testid="text-shop-title"
          >
            OFF-HUMAN
          </h1>
          <p
            className="text-sm text-white/50 uppercase tracking-widest"
            style={{ fontFamily: "'Orbitron', sans-serif" }}
          >
            {totalCount} pieces
          </p>
        </div>

        {/* Season Filter */}
        <div className="flex gap-3 justify-center mb-4">
          {SEASONS.map((s) => (
            <button
              key={s}
              onClick={() => setActiveSeason(s)}
              className={`px-5 py-1.5 text-xs uppercase tracking-widest border rounded transition-all ${
                activeSeason === s
                  ? "border-primary bg-primary/20 text-primary"
                  : "border-white/20 text-white/50 hover:border-white/40 hover:text-white/80"
              }`}
              style={{ fontFamily: "'Orbitron', sans-serif" }}
              data-testid={`season-filter-${s}`}
            >
              {s === "all" ? "All Seasons" : `Season ${s}`}
            </button>
          ))}
        </div>

        {/* Category Filter */}
        <div className="flex flex-wrap gap-2 justify-center mb-10">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-4 py-1.5 text-xs uppercase tracking-widest border rounded transition-all ${
                activeCategory === cat
                  ? "border-primary bg-primary/10 text-white"
                  : "border-white/20 text-white/50 hover:border-white/40 hover:text-white/80"
              }`}
              style={{ fontFamily: "'Orbitron', sans-serif" }}
              data-testid={`filter-${cat}`}
            >
              {cat === "all" ? "All" : cat}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="aspect-[3/4] border-2 border-primary/30 rounded animate-pulse" />
            ))}
          </div>
        ) : isError ? (
          <div className="text-center py-16">
            <h3 className="text-2xl font-bold mb-4 text-white drop-shadow-[0_4px_8px_rgba(0,0,0,0.9)]">
              Failed to load products
            </h3>
            <p className="text-white drop-shadow-[0_4px_8px_rgba(0,0,0,0.9)]">
              Please try again later
            </p>
          </div>
        ) : (
          <>
            {/* Season 02 — SUBSTRATE */}
            {season02Products && season02Products.length > 0 && (
              <div className="mb-16">
                <div className="text-center mb-8">
                  <div className="inline-block border border-primary/40 px-6 py-1 mb-3 rounded">
                    <span className="text-[10px] uppercase tracking-[0.3em] text-primary/60" style={{ fontFamily: "'Orbitron', sans-serif" }}>
                      Season 02
                    </span>
                  </div>
                  <h2
                    className="text-3xl md:text-4xl font-bold uppercase tracking-wider text-white mb-2"
                    style={{ fontFamily: "'Orbitron', sans-serif" }}
                  >
                    SUBSTRATE
                  </h2>
                  <p className="text-xs text-white/40 uppercase tracking-widest" style={{ fontFamily: "'Orbitron', sans-serif" }}>
                    The body as execution environment — {season02Products.length} pieces
                  </p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {season02Products.map((product) => (
                    <ProductCard key={product.id} product={product} season="02" />
                  ))}
                </div>
              </div>
            )}

            {/* Divider between seasons when both visible */}
            {season02Products && season02Products.length > 0 && season01Products && season01Products.length > 0 && (
              <div className="border-t border-white/10 mb-16" />
            )}

            {/* Season 01 — Deconstructed */}
            {season01Products && season01Products.length > 0 && (
              <div className="mb-16">
                <div className="text-center mb-8">
                  <div className="inline-block border border-white/20 px-6 py-1 mb-3 rounded">
                    <span className="text-[10px] uppercase tracking-[0.3em] text-white/40" style={{ fontFamily: "'Orbitron', sans-serif" }}>
                      Season 01
                    </span>
                  </div>
                  <h2
                    className="text-3xl md:text-4xl font-bold uppercase tracking-wider text-white/70 mb-2"
                    style={{ fontFamily: "'Orbitron', sans-serif" }}
                  >
                    DECONSTRUCTED
                  </h2>
                  <p className="text-xs text-white/30 uppercase tracking-widest" style={{ fontFamily: "'Orbitron', sans-serif" }}>
                    {season01Products.length} pieces
                  </p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {season01Products.map((product) => (
                    <ProductCard key={product.id} product={product} season="01" />
                  ))}
                </div>
              </div>
            )}

            {/* Agent Wearables section */}
            {wearableProducts && wearableProducts.length > 0 && (
              <>
                <div className="border-t border-primary/20 pt-12 mb-8">
                  <div className="text-center mb-8">
                    <h2
                      className="text-2xl md:text-3xl font-bold uppercase tracking-wider text-white/80 mb-2"
                      style={{ fontFamily: "'Orbitron', sans-serif" }}
                    >
                      AGENT WEARABLES
                    </h2>
                    <p className="text-xs text-white/40 uppercase tracking-widest" style={{ fontFamily: "'Orbitron', sans-serif" }}>
                      Software objects — worn in the system prompt
                    </p>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {wearableProducts.map((product) => (
                      <ProductCard key={product.id} product={product} wearable />
                    ))}
                  </div>
                </div>
              </>
            )}

            {filtered?.length === 0 && (
              <div className="text-center py-16 text-white/50" style={{ fontFamily: "'Orbitron', sans-serif" }}>
                No products in this category.
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function ProductCard({ product, wearable = false, season }: { product: Product; wearable?: boolean; season?: string }) {
  const imgSrc = product.shopImageUrl
    ? (getProductImage(product.shopImageUrl) || product.shopImageUrl)
    : (getProductImage(product.imageUrl) || product.imageUrl);

  const isS02 = season === "02";

  return (
    <Link href={`/product/${product.id}`}>
      <div
        className="group cursor-pointer transition-transform duration-300 hover:scale-105"
        data-testid={`product-card-${product.id}`}
      >
        <div
          className={`aspect-[3/4] mb-3 overflow-hidden rounded-md border-2 transition-colors duration-300 flex items-center justify-center relative ${
            wearable
              ? "border-primary/20 hover:border-primary/50"
              : isS02
              ? "border-primary/30 hover:border-primary"
              : "border-transparent hover:border-primary/50"
          }`}
          style={{ background: 'linear-gradient(135deg, rgba(0,0,0,0.95) 0%, rgba(0,20,10,0.98) 100%)' }}
        >
          {wearable && (
            <div
              className="absolute top-2 right-2 text-[10px] uppercase tracking-widest border border-primary/40 text-primary/70 px-2 py-0.5 rounded z-10"
              style={{ fontFamily: "'Orbitron', sans-serif" }}
            >
              AGENT
            </div>
          )}
          {isS02 && !wearable && (
            <div
              className="absolute top-2 left-2 text-[10px] uppercase tracking-widest border border-primary/60 text-primary px-2 py-0.5 rounded z-10"
              style={{ fontFamily: "'Orbitron', sans-serif" }}
            >
              S02
            </div>
          )}
          <img
            src={imgSrc}
            alt={product.name}
            className="w-full h-full object-contain p-4"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
        </div>

        <div className="space-y-1.5">
          <h3
            className="text-lg font-bold uppercase text-white drop-shadow-[0_4px_8px_rgba(0,0,0,0.9)] group-hover:text-primary transition-colors duration-300"
            style={{ fontFamily: "'Orbitron', sans-serif" }}
          >
            {product.name}
          </h3>
          <p className="text-xl font-bold text-primary drop-shadow-[0_4px_8px_rgba(0,0,0,0.9)]">
            ${product.price}
          </p>
        </div>
      </div>
    </Link>
  );
}
