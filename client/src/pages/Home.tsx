import { useQuery } from "@tanstack/react-query";
import type { Product } from "@shared/schema";
import { NullArchiveHero } from "@/components/NullArchiveHero";
import { NullProductRow } from "@/components/NullProductRow";
import { NullFooter } from "@/components/NullFooter";
import { NullAgentLayer } from "@/components/NullAgentLayer";
import { NullTrustCoat } from "@/components/NullTrustCoat";

const SEASON_LABELS: Record<string, string> = {
  "01": "S01 — DECONSTRUCTED",
  "02": "S02 — SUBSTRATE",
  "03": "S03 — DECONSTRUCTING THE TRANSACTION",
};

function SeasonBreak({ season }: { season: string }) {
  const label = SEASON_LABELS[season] ?? `S${season}`;
  return (
    <div
      style={{
        maxWidth: "100%",
        padding: "16px 0 8px 0",
        borderTop: "1px solid #D8D4C8",
      }}
    >
      <samp
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: "10px",
          letterSpacing: "0.3em",
          color: "#8C8880",
          textTransform: "uppercase",
        }}
      >
        [ {label} ]
      </samp>
    </div>
  );
}

export default function Home() {
  const { data: products, isLoading } = useQuery<Product[]>({
    queryKey: ["/api/products"],
  });

  // Group products by season, preserving order
  const productsBySeason: { season: string; products: Product[] }[] = [];
  const seenSeasons: string[] = [];
  for (const product of products ?? []) {
    const season = String((product as any).season ?? "01").padStart(2, "0");
    if (!seenSeasons.includes(season)) {
      seenSeasons.push(season);
      productsBySeason.push({ season, products: [] });
    }
    productsBySeason[seenSeasons.indexOf(season)].products.push(product);
  }

  // Flat index for alternating row direction
  let rowIndex = 0;

  return (
    <div className="min-h-screen null-bg overflow-x-hidden" data-testid="timeline-container">
      <NullArchiveHero />

      <section style={{ background: "#F6F4EF", paddingBottom: "120px" }}>
        {isLoading ? (
          <div className="flex items-center justify-center py-32">
            <samp
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "10px",
                letterSpacing: "0.3em",
                color: "#8C8880",
                textTransform: "uppercase",
              }}
            >
              Loading archive...
            </samp>
          </div>
        ) : (
          productsBySeason.map(({ season, products: seasonProducts }) => (
            <div key={season}>
              <SeasonBreak season={season} />
              {seasonProducts.map((product) => (
                <NullProductRow
                  key={product.id}
                  product={product}
                  index={rowIndex++}
                />
              ))}
            </div>
          ))
        )}
      </section>

      <NullAgentLayer />
      <NullTrustCoat />
      <NullFooter />
    </div>
  );
}
