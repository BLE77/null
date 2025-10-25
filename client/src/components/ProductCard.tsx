import { Link } from "wouter";
import type { Product } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  return (
    <Link href={`/product/${product.id}`}>
      <div className="group relative overflow-hidden rounded-md border border-border bg-card hover-elevate transition-all duration-300 cursor-pointer" data-testid={`card-product-${product.id}`}>
          <div className="aspect-[4/5] bg-muted relative overflow-hidden">
            <div className="absolute inset-0 flex items-center justify-center text-xs text-muted-foreground p-4 text-center grain-overlay">
              {product.imageUrl}
            </div>
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            
            <div className="absolute bottom-4 left-0 right-0 flex justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <Button 
                variant="secondary" 
                className="uppercase tracking-wider text-sm backdrop-blur-sm"
                data-testid={`button-quick-view-${product.id}`}
              >
                View Details
              </Button>
            </div>
          </div>

          <div className="p-4">
            <div className="flex items-start justify-between gap-2 mb-2">
              <h3 
                className="font-bold uppercase tracking-wide text-base leading-tight" 
                style={{ fontFamily: "'Teko', sans-serif" }}
                data-testid={`text-product-name-${product.id}`}
              >
                {product.name}
              </h3>
              <Badge variant="outline" className="shrink-0">
                {product.category}
              </Badge>
            </div>
            
            <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
              {product.description}
            </p>
            
            <div className="flex items-center justify-between">
              <span className="text-xl font-bold text-primary" data-testid={`text-product-price-${product.id}`}>
                ${product.price}
              </span>
              <span className="text-xs text-muted-foreground">
                {product.sizes.length} sizes
              </span>
            </div>
          </div>
        </div>
    </Link>
  );
}
