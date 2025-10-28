import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import type { Product } from "@shared/schema";
import { getProductImage } from "@/lib/product-images";

export default function Shop() {
  const { data: products, isLoading, isError } = useQuery<Product[]>({
    queryKey: ["/api/products"],
  });

  return (
    <div className="min-h-screen digital-matrix-bg pt-24 pb-16">
      <div className="container mx-auto px-8 md:px-16">
        <h1 
          className="text-5xl md:text-7xl font-bold uppercase tracking-wider mb-12 text-center text-white drop-shadow-[0_6px_12px_rgba(0,0,0,1)]"
          style={{ fontFamily: "'Orbitron', sans-serif", letterSpacing: '0.05em' }}
          data-testid="text-shop-title"
        >
          ALL PRODUCTS
        </h1>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="aspect-[3/4] border-2 border-primary/30 rounded animate-pulse" />
            ))}
          </div>
        ) : isError ? (
          <div className="text-center py-16">
            <h3 className="text-2xl font-bold mb-4 text-white drop-shadow-[0_4px_8px_rgba(0,0,0,0.9)]">
              Failed to load products
            </h3>
            <p className="text-white drop-shadow-[0_4px_8px_rgba(0,0,0,0.9)]">
              Please try again later
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {products?.map((product) => (
              <Link key={product.id} href={`/product/${product.id}`}>
                <div 
                  className="group cursor-pointer transition-transform duration-300 hover:scale-105"
                  data-testid={`product-card-${product.id}`}
                >
                  <div className="aspect-[3/4] mb-4 overflow-hidden rounded-md border-2 border-transparent hover:border-primary/50 transition-colors duration-300">
                    <img 
                      src={
                        product.shopImageUrl 
                          ? (getProductImage(product.shopImageUrl) || product.shopImageUrl)
                          : (getProductImage(product.imageUrl) || product.imageUrl)
                      } 
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <h3 
                      className="text-xl font-bold uppercase text-white drop-shadow-[0_4px_8px_rgba(0,0,0,0.9)] group-hover:text-primary transition-colors duration-300"
                      style={{ fontFamily: "'Orbitron', sans-serif" }}
                    >
                      {product.name}
                    </h3>
                    
                    <p className="text-2xl font-bold text-primary drop-shadow-[0_4px_8px_rgba(0,0,0,0.9)]">
                      ${product.price}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
