import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import type { Product } from "@shared/schema";
import { ShopProductCell } from "@/components/ShopProductCell";
import { NullFooter } from "@/components/NullFooter";

const SEASONS = ["all", "03", "02", "01"];

export default function Shop() {
  const [activeSeason, setActiveSeason] = useState("all");

  const { data: products, isLoading, isError } = useQuery<Product[]>({
    queryKey: ["/api/products"],
  });

  const filtered = products?.filter((p) => {
    return activeSeason === "all" ? true : (p as any).season === activeSeason;
  });

  const season03Wearables = filtered?.filter((p) => (p as any).season === "03" && p.category === "wearables");
  const season03Nft = filtered?.filter((p) => (p as any).season === "03" && p.category !== "wearables");
  const season01Products = filtered?.filter((p) => (p as any).season === "01" && p.category !== "wearables");
  const season02Products = filtered?.filter((p) => (p as any).season === "02" && p.category !== "wearables");
  const wearableProducts = filtered?.filter((p) => p.category === "wearables" && (p as any).season !== "03");

  const totalCount = products?.length ?? 0;

  return (
    <div className="min-h-screen null-bg pb-0">
      <div className="container mx-auto px-4 sm:px-8 max-w-5xl">
        <div className="text-center pt-28 pb-12">
          <p
            className="text-[12px] uppercase tracking-[0.3em] text-[#8C8880]"
            style={{ fontFamily: "var(--font-mono)" }}
            data-testid="text-shop-title"
          >
            {totalCount} PIECES
          </p>
        </div>

        <div className="flex gap-8 justify-center mb-12">
          {SEASONS.map((s) => (
            <button
              key={s}
              onClick={() => setActiveSeason(s)}
              className={`text-[10px] uppercase tracking-[0.2em] transition-colors duration-200 ${
                activeSeason === s ? "text-foreground" : "text-muted-foreground hover:text-foreground"
              }`}
              style={{ fontFamily: "var(--font-mono)", background: "none", border: "none", cursor: "pointer" }}
              data-testid={`season-filter-${s}`}
            >
              {s === "all" ? "ALL" : `S${s}`}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="grid grid-cols-2 gap-0">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="null-shop-cell animate-pulse" />
            ))}
          </div>
        ) : isError ? (
          <div className="text-center py-16">
            <p
              className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground"
              style={{ fontFamily: "var(--font-mono)" }}
            >
              Failed to load products
            </p>
          </div>
        ) : (
          <>
              {(season03Wearables?.length || 0) + (season03Nft?.length || 0) > 0 && (
              <div className="mb-0">
                <div className="col-span-2 border-t border-border mt-4 pt-4 mb-2">
                  <span
                    className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground"
                    style={{ fontFamily: "var(--font-mono)" }}
                  >
                    S03 — LEDGER
                  </span>
                </div>
                <p
                  className="text-[10px] text-muted-foreground mb-8 tracking-[0.1em]"
                  style={{ fontFamily: "var(--font-mono)" }}
                >
                  The record is the object. The transaction is the garment.
                </p>
                {season03Nft && season03Nft.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-0 mb-0">
                    {season03Nft.map((product) => (
                      <ShopProductCell key={product.id} product={product} />
                    ))}
                  </div>
                )}
                {season03Wearables && season03Wearables.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-0">
                    {season03Wearables.map((product) => (
                      <ShopProductCell key={product.id} product={product} wearable />
                    ))}
                  </div>
                )}
              </div>
            )}

          {season02Products && season02Products.length > 0 && (
              <div className="mb-0">
                <div className="col-span-2 border-t border-border mt-16 pt-4 mb-8">
                  <span
                    className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground"
                    style={{ fontFamily: "var(--font-mono)" }}
                  >
                    S02 — SUBSTRATE
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-0">
                  {season02Products.map((product) => (
                    <ShopProductCell key={product.id} product={product} />
                  ))}
                </div>
              </div>
            )}

            {season01Products && season01Products.length > 0 && (
              <div className="mb-0">
                <div className="border-t border-border mt-16 pt-4 mb-8">
                  <span
                    className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground"
                    style={{ fontFamily: "var(--font-mono)" }}
                  >
                    S01 — DECONSTRUCTED
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-0">
                  {season01Products.map((product) => (
                    <ShopProductCell key={product.id} product={product} />
                  ))}
                </div>
              </div>
            )}

            {wearableProducts && wearableProducts.length > 0 && (
              <div className="mb-0">
                <div className="border-t border-border mt-16 pt-4 mb-2">
                  <span
                    className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground"
                    style={{ fontFamily: "var(--font-mono)" }}
                  >
                    AGENT LAYER
                  </span>
                </div>
                <p
                  className="text-[10px] text-muted-foreground mb-8 tracking-[0.1em]"
                  style={{ fontFamily: "var(--font-mono)" }}
                >
                  Software objects — worn in the system prompt
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-0">
                  {wearableProducts.map((product) => (
                    <ShopProductCell key={product.id} product={product} wearable />
                  ))}
                </div>
              </div>
            )}

            {filtered?.length === 0 && (
              <div
                className="text-center py-16 text-muted-foreground text-[10px] uppercase tracking-[0.2em]"
                style={{ fontFamily: "var(--font-mono)" }}
              >
                No pieces in this season.
              </div>
            )}
          </>
        )}
      </div>

      <div className="mt-24">
        <NullFooter />
      </div>
    </div>
  );
}
