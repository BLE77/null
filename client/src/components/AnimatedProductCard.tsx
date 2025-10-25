import { Link } from "wouter";
import { type Product, getProductSizes } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useEffect, useRef, useState } from "react";

interface AnimatedProductCardProps {
  product: Product;
  delay?: number;
}

export function AnimatedProductCard({ product, delay = 0 }: AnimatedProductCardProps) {
  const sizes = getProductSizes(product);
  const [isVisible, setIsVisible] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setTimeout(() => {
            setIsVisible(true);
          }, delay);
        }
      },
      {
        threshold: 0.2,
        rootMargin: '0px 50px 0px 50px', // Trigger slightly before entering viewport for horizontal scroll
      }
    );

    if (cardRef.current) {
      observer.observe(cardRef.current);
    }

    return () => {
      observer.disconnect();
    };
  }, [delay]);
  
  return (
    <div
      ref={cardRef}
      className="w-80 shrink-0"
      style={{
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'scale(1) translateX(0)' : 'scale(0.8) translateX(-30px)',
        transition: `all 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)`,
      }}
      data-testid={`card-product-${product.id}`}
    >
      <Link href={`/product/${product.id}`}>
        <div className="group geometric-panel bg-card hover:shadow-xl transition-all duration-300 cursor-pointer lift-on-hover h-full">
          <div className="aspect-[4/5] bg-muted relative overflow-hidden">
            <div className="absolute inset-0 flex items-center justify-center text-xs text-muted-foreground p-4 text-center">
              {product.imageUrl}
            </div>
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
    </div>
  );
}
