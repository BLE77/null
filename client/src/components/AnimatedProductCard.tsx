import { Link } from "wouter";
import { type Product, getProductSizes } from "@shared/schema";
import { useEffect, useRef, useState } from "react";
import { getRobotImage } from "@/lib/robot-images";
import { getProductImage } from "@/lib/product-images";

interface AnimatedProductCardProps {
  product: Product;
  delay?: number;
}

export function AnimatedProductCard({ product, delay = 0 }: AnimatedProductCardProps) {
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
      className="shrink-0"
      style={{
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'translateX(0)' : 'translateX(-20px)',
        transition: `opacity 800ms ease-out, transform 800ms ease-out`,
        width: '280px',
        height: '380px',
      }}
      data-testid={`card-product-${product.id}`}
    >
      <Link href={`/product/${product.id}`} style={{ display: 'block', width: '280px', height: '380px' }}>
        <div className="group cursor-pointer" style={{ width: '280px', height: '380px' }}>
          <div style={{ width: '280px', height: '380px', position: 'relative' }}>
            {(() => {
              // Priority: homePageImageUrl > robot image mapping > product name
              const homePageImage = product.homePageImageUrl ? (getProductImage(product.homePageImageUrl) || product.homePageImageUrl) : null;
              const robotImage = getRobotImage(product.name);
              const displayImage = homePageImage || robotImage;

              if (displayImage) {
                return (
                  <img
                    src={displayImage}
                    alt={`${product.name} on robot model`}
                    className="object-contain object-top transition-opacity duration-200 group-hover:opacity-90"
                    style={{ width: '280px', height: '380px' }}
                    data-testid={`img-product-${product.id}`}
                  />
                );
              }

              return (
                <div
                  className="absolute inset-0 flex items-center justify-center text-xs text-muted-foreground p-4 text-center uppercase tracking-[0.08em]"
                  style={{ fontFamily: "var(--font-display)" }}
                >
                  {product.name}
                </div>
              );
            })()}
          </div>
        </div>
      </Link>
    </div>
  );
}
