import { Link } from "wouter";
import { type Product, getProductSizes } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getProductImage } from "@/lib/product-images";

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const sizes = getProductSizes(product);
  
  return (
    <Link href={`/product/${product.id}`}>
      <div className="group geometric-panel bg-card hover:shadow-xl transition-all duration-300 cursor-pointer lift-on-hover" data-testid={`card-product-${product.id}`}>
          <div className="aspect-[4/5] bg-muted relative overflow-hidden">
            <img 
              src={getProductImage(product.imageUrl) || product.imageUrl} 
              alt={product.name}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            
            <div className="absolute bottom-6 left-0 right-0 flex justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0">
              <Button 
                variant="outline" 
                size="sm"
                className="uppercase tracking-wider text-xs backdrop-blur-md bg-white/90 border-primary font-semibold"
                data-testid={`button-quick-view-${product.id}`}
              >
                View Details
              </Button>
            </div>
          </div>

          <div className="p-5">
            <div className="flex items-start justify-between gap-3 mb-3">
              <h3 
                className="font-bold text-lg leading-tight text-foreground" 
                style={{ fontFamily: "var(--font-display)" }}
                data-testid={`text-product-name-${product.id}`}
              >
                {product.name}
              </h3>
              <Badge variant="secondary" className="shrink-0 text-xs uppercase font-semibold">
                {product.category}
              </Badge>
            </div>
            
            <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
              {product.description}
            </p>
            
            <div className="flex items-center justify-between border-t border-border pt-3">
              <span className="text-2xl font-bold text-primary" style={{ fontFamily: "var(--font-display)" }} data-testid={`text-product-price-${product.id}`}>
                ${product.price}
              </span>
              <span className="text-xs text-muted-foreground uppercase tracking-wide font-medium">
                {sizes.length} sizes
              </span>
            </div>
          </div>
        </div>
    </Link>
  );
}
