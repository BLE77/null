import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { useState } from "react";
import type { Product } from "@shared/schema";
import { getProductImage } from "@/lib/product-images";

const CATEGORIES = ["all", "tees", "hoodies", "overshirts", "jackets", "outerwear", "trousers", "shorts", "tracksuits", "wearables"];

export default function Shop() {
  const [activeCategory, setActiveCategory] = useState("all");

  const { data: products, isLoading, isError } = useQuery<Product[]>({
    queryKey: ["/api/products"],
  });

  const filtered = products?.filter((p) =>
    activeCategory === "all" ? true : p.category === activeCategory
  );

  const physicalProducts = filtered?.filter((p) => p.category !== "wearables");
  const wearableProducts = filtered?.filter((p) => p.category === "wearables");

  return (
    <div className="min-h-screen digital-matrix-bg pt-20 pb-16">
      <div className="container mx-auto px-4 sm:px-8 md:px-16 max-w-6xl">
        <div className="text-center mb-10">
          <h1
            className="text-4xl md:text-6xl font-bold uppercase tracking-wider mb-2 text-white drop-shadow-[0_6px_12px_rgba(0,0,0,1)]"
            style={{ fontFamily: "'Orbitron', sans-serif", letterSpacing: '0.05em' }}
            data-testid="text-shop-title"
          >
            SEASON 01
          </h1>
          <p
            className="text-sm text-white/50 uppercase tracking-widest"
            style={{ fontFamily: "'Orbitron', sans-serif" }}
          >
            Deconstructed — {products?.length ?? 0} pieces
          </p>
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
            {/* Physical garments */}
            {physicalProducts && physicalProducts.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
                {physicalProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
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

function ProductCard({ product, wearable = false }: { product: Product; wearable?: boolean }) {
  const imgSrc = product.shopImageUrl
    ? (getProductImage(product.shopImageUrl) || product.shopImageUrl)
    : (getProductImage(product.imageUrl) || product.imageUrl);

  return (
    <Link href={`/product/${product.id}`}>
      <div
        className="group cursor-pointer transition-transform duration-300 hover:scale-105"
        data-testid={`product-card-${product.id}`}
      >
        <div
          className={`aspect-[3/4] mb-3 overflow-hidden rounded-md border-2 border-transparent hover:border-primary/50 transition-colors duration-300 flex items-center justify-center relative ${
            wearable ? "border-primary/20" : ""
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
