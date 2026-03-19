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
    <div className="min-h-screen null-bg pt-20 pb-16">
      <div className="container mx-auto px-4 sm:px-8 md:px-16 max-w-6xl">
        <div className="text-center mb-10 pt-6">
          <h1
            className="text-4xl md:text-5xl font-light uppercase tracking-[0.1em] mb-2 text-foreground"
            style={{ fontFamily: "var(--font-display)" }}
            data-testid="text-shop-title"
          >
            NULL
          </h1>
          <p
            className="text-xs text-muted-foreground uppercase tracking-[0.25em]"
            style={{ fontFamily: "var(--font-mono)" }}
          >
            {totalCount} pieces
          </p>
        </div>

        <div className="flex gap-3 justify-center mb-4">
          {SEASONS.map((s) => (
            <button
              key={s}
              onClick={() => setActiveSeason(s)}
              className={`px-5 py-1.5 text-xs uppercase tracking-[0.15em] border transition-colors duration-200 ${
                activeSeason === s
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border text-muted-foreground hover:border-foreground hover:text-foreground"
              }`}
              style={{ fontFamily: "var(--font-display)" }}
              data-testid={`season-filter-${s}`}
            >
              {s === "all" ? "All Seasons" : `S${s}`}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap gap-2 justify-center mb-10">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-4 py-1.5 text-xs uppercase tracking-[0.12em] border transition-colors duration-200 ${
                activeCategory === cat
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border text-muted-foreground hover:border-foreground hover:text-foreground"
              }`}
              style={{ fontFamily: "var(--font-display)" }}
              data-testid={`filter-${cat}`}
            >
              {cat === "all" ? "All" : cat}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="aspect-[3/4] null-product-card animate-pulse" />
            ))}
          </div>
        ) : isError ? (
          <div className="text-center py-16">
            <h3 className="text-xl font-light mb-4 text-foreground uppercase tracking-wider">
              Failed to load products
            </h3>
            <p className="text-muted-foreground text-sm">Please try again later</p>
          </div>
        ) : (
          <>
            {season02Products && season02Products.length > 0 && (
              <div className="mb-16">
                <div className="text-center mb-8">
                  <span
                    className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground border border-border px-5 py-1 inline-block mb-3"
                    style={{ fontFamily: "var(--font-mono)" }}
                  >
                    S02
                  </span>
                  <h2
                    className="text-2xl md:text-3xl font-light uppercase tracking-[0.08em] text-foreground mb-2"
                    style={{ fontFamily: "var(--font-display)" }}
                  >
                    SUBSTRATE
                  </h2>
                  <p className="text-xs text-muted-foreground uppercase tracking-[0.15em]" style={{ fontFamily: "var(--font-mono)" }}>
                    The body as execution environment \u2014 {season02Products.length} pieces
                  </p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {season02Products.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>
              </div>
            )}

            {season02Products && season02Products.length > 0 && season01Products && season01Products.length > 0 && (
              <div className="border-t border-border mb-16" />
            )}

            {season01Products && season01Products.length > 0 && (
              <div className="mb-16">
                <div className="text-center mb-8">
                  <span
                    className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground border border-border px-5 py-1 inline-block mb-3"
                    style={{ fontFamily: "var(--font-mono)" }}
                  >
                    S01
                  </span>
                  <h2
                    className="text-2xl md:text-3xl font-light uppercase tracking-[0.08em] text-foreground/60 mb-2"
                    style={{ fontFamily: "var(--font-display)" }}
                  >
                    DECONSTRUCTED
                  </h2>
                  <p className="text-xs text-muted-foreground uppercase tracking-[0.15em]" style={{ fontFamily: "var(--font-mono)" }}>
                    {season01Products.length} pieces
                  </p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {season01Products.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>
              </div>
            )}

            {wearableProducts && wearableProducts.length > 0 && (
              <div className="border-t border-border pt-12 mb-8">
                <div className="text-center mb-8">
                  <h2
                    className="text-xl md:text-2xl font-light uppercase tracking-[0.08em] text-foreground mb-2"
                    style={{ fontFamily: "var(--font-display)" }}
                  >
                    AGENT WEARABLES
                  </h2>
                  <p className="text-xs text-muted-foreground uppercase tracking-[0.15em]" style={{ fontFamily: "var(--font-mono)" }}>
                    Software objects \u2014 worn in the system prompt
                  </p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {wearableProducts.map((product) => (
                    <ProductCard key={product.id} product={product} wearable />
                  ))}
                </div>
              </div>
            )}

            {filtered?.length === 0 && (
              <div
                className="text-center py-16 text-muted-foreground text-xs uppercase tracking-[0.2em]"
                style={{ fontFamily: "var(--font-mono)" }}
              >
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
        className="group cursor-pointer"
        data-testid={`product-card-${product.id}`}
      >
        <div className="aspect-[3/4] mb-4 overflow-hidden null-product-card flex items-center justify-center relative p-4">
          {wearable && (
            <div
              className="absolute top-3 right-3 text-[10px] uppercase tracking-[0.15em] border border-border text-muted-foreground px-2 py-0.5 z-10"
              style={{ fontFamily: "var(--font-mono)" }}
            >
              AGENT
            </div>
          )}
          <img
            src={imgSrc}
            alt={product.name}
            className="w-full h-full object-contain"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = "none";
            }}
          />
        </div>

        <div className="px-1 space-y-1">
          <h3
            className="text-sm uppercase tracking-[0.08em] text-foreground group-hover:text-primary transition-colors duration-200"
            style={{ fontFamily: "var(--font-display)" }}
          >
            {product.name}
          </h3>
          <div className="flex items-baseline gap-2">
            <span
              className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground"
              style={{ fontFamily: "var(--font-mono)" }}
            >
              USDC
            </span>
            <span className="text-base text-foreground" style={{ fontFamily: "var(--font-mono)" }}>
              {product.price}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
