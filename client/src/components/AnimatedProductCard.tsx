import { Link } from "wouter";
import { type Product, getProductSizes } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useEffect, useRef, useState } from "react";
import { getProductImage } from "@/lib/product-images";

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
        <div className="group cursor-pointer transition-all duration-300 hover-elevate">
          <div className="aspect-[4/5] relative">
            {getProductImage(product.imageUrl) ? (
              <img 
                src={getProductImage(product.imageUrl)} 
                alt={product.name}
                className="w-full h-full object-contain object-center transition-transform duration-300 group-hover:scale-105"
                data-testid={`img-product-${product.id}`}
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-xs text-muted-foreground p-4 text-center">
                {product.name}
              </div>
            )}
          </div>
        </div>
      </Link>
    </div>
  );
}
