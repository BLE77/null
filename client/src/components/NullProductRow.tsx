import { Link } from "wouter";
import type { Product } from "@shared/schema";
import { getProductImage } from "@/lib/product-images";

interface NullProductRowProps {
  product: Product;
  index: number;
}

function isOutOfStock(product: Product): boolean {
  const inventory = product.inventory as Record<string, number> | null;
  if (!inventory) return false;
  return Object.values(inventory).every((qty) => qty === 0);
}

export function NullProductRow({ product, index }: NullProductRowProps) {
  const flip = index % 2 === 1;
  const imgSrc = product.shopImageUrl
    ? (getProductImage(product.shopImageUrl) || product.shopImageUrl)
    : (getProductImage(product.imageUrl) || product.imageUrl);

  const outOfStock = isOutOfStock(product);
  const season = (product as any).season || "01";

  return (
    <div className={`null-archive-row${flip ? " null-archive-row--flip" : ""}`}>
      {/* Image cell */}
      <div
        className="flex items-center justify-center p-12"
        style={{ background: "#EFEDE7" }}
      >
        <img
          src={imgSrc}
          alt={product.name}
          className="null-fade-in"
          style={{
            width: "80%",
            maxWidth: "400px",
            height: "auto",
            objectFit: "contain",
          }}
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = "none";
          }}
        />
      </div>

      {/* Text cell */}
      <div
        className="flex flex-col justify-center px-16 py-16 md:px-16 sm:px-8"
        style={{ background: "#F6F4EF", padding: "clamp(32px, 5vw, 64px)" }}
      >
        <span
          className="block text-[10px] uppercase tracking-[0.3em] text-[#8C8880] mb-4"
          style={{ fontFamily: "var(--font-mono)" }}
        >
          S{season}
        </span>

        <h2
          className="uppercase tracking-[0.08em] text-[#1C1B19] mb-6"
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "clamp(22px, 3vw, 28px)",
            fontWeight: 300,
          }}
        >
          {product.name}
        </h2>

        <div style={{ height: "1px", background: "#D8D4C8", marginBottom: "24px" }} />

        <div className="flex items-baseline gap-3 mb-8">
          <span
            className="text-[10px] uppercase tracking-[0.2em] text-[#8C8880]"
            style={{ fontFamily: "var(--font-mono)" }}
          >
            USDC
          </span>
          <span
            className="text-[20px] text-[#1C1B19]"
            style={{ fontFamily: "var(--font-mono)" }}
          >
            {product.price}
          </span>
        </div>

        <span
          className="block text-[10px] uppercase tracking-[0.2em] text-[#8C8880] mb-2"
          style={{ fontFamily: "var(--font-mono)" }}
        >
          {product.category}
        </span>

        {outOfStock && (
          <span
            className="block text-[10px] uppercase tracking-[0.1em] text-[#8C8880] mb-4"
            style={{ fontFamily: "var(--font-mono)" }}
          >
            UNAVAILABLE
          </span>
        )}

        <div style={{ height: "48px" }} />

        <Link href={`/product/${product.id}`}>
          <span
            className="text-[11px] uppercase tracking-[0.2em] text-[#1C1B19] cursor-pointer transition-colors duration-200"
            style={{
              fontFamily: "var(--font-display)",
              fontWeight: 400,
            }}
            onMouseEnter={(e) => { (e.target as HTMLElement).style.color = "#A8894A"; }}
            onMouseLeave={(e) => { (e.target as HTMLElement).style.color = "#1C1B19"; }}
          >
            → VIEW PIECE
          </span>
        </Link>
      </div>
    </div>
  );
}
