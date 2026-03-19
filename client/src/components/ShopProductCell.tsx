import { Link } from "wouter";
import type { Product } from "@shared/schema";
import { getProductImage } from "@/lib/product-images";

interface ShopProductCellProps {
  product: Product;
  wearable?: boolean;
}

export function ShopProductCell({ product, wearable = false }: ShopProductCellProps) {
  const imgSrc = product.shopImageUrl
    ? (getProductImage(product.shopImageUrl) || product.shopImageUrl)
    : (getProductImage(product.imageUrl) || product.imageUrl);

  return (
    <Link href={`/product/${product.id}`}>
      <div className="cursor-pointer" data-testid={`product-card-${product.id}`}>
        <div className="null-shop-cell relative">
          {wearable && (
            <div
              className="absolute top-3 right-3 text-[10px] uppercase tracking-[0.15em] border border-[#D8D4C8] text-[#8C8880] px-2 py-0.5 z-10"
              style={{ fontFamily: "var(--font-mono)" }}
            >
              AGENT
            </div>
          )}
          <img
            src={imgSrc}
            alt={product.name}
            style={{ width: "75%", height: "75%", objectFit: "contain" }}
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = "none";
            }}
          />
        </div>

        <div style={{ padding: "16px 0 32px 0" }}>
          <h3
            className="text-[13px] uppercase tracking-[0.08em] text-[#1C1B19]"
            style={{ fontFamily: "var(--font-display)", fontWeight: 400 }}
          >
            {product.name}
          </h3>
          <div className="flex items-baseline gap-2 mt-1">
            <span
              className="text-[10px] uppercase tracking-[0.15em] text-[#8C8880]"
              style={{ fontFamily: "var(--font-mono)" }}
            >
              USDC
            </span>
            <span
              className="text-[14px] text-[#1C1B19]"
              style={{ fontFamily: "var(--font-mono)" }}
            >
              {product.price}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
