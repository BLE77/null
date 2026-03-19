import { useQuery } from "@tanstack/react-query";
import type { Product } from "@shared/schema";
import { NullArchiveHero } from "@/components/NullArchiveHero";
import { NullProductRow } from "@/components/NullProductRow";
import { NullFooter } from "@/components/NullFooter";

export default function Home() {
  const { data: products, isLoading } = useQuery<Product[]>({
    queryKey: ["/api/products"],
  });

  return (
    <div className="min-h-screen null-bg overflow-x-hidden" data-testid="timeline-container">
      <NullArchiveHero />

      <section style={{ background: "#F6F4EF", paddingBottom: "120px" }}>
        {isLoading ? (
          <div className="flex items-center justify-center py-32">
            <span
              className="text-[10px] uppercase tracking-[0.3em] text-[#8C8880]"
              style={{ fontFamily: "var(--font-mono)" }}
            >
              Loading archive...
            </span>
          </div>
        ) : (
          (products ?? []).map((product, index) => (
            <NullProductRow key={product.id} product={product} index={index} />
          ))
        )}
      </section>

      <NullFooter />
    </div>
  );
}
