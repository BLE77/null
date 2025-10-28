import { useQuery } from "@tanstack/react-query";
import { useRoute } from "wouter";
import { type Product, getProductSizes, getProductStock } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useCart } from "@/lib/cart-context";
import { useState } from "react";
import { ChevronLeft, Check } from "lucide-react";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { getAISizeInfo } from "@shared/ai-sizes";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export default function ProductDetail() {
  const [, params] = useRoute("/product/:id");
  const productId = params?.id;
  const { addToCart, setIsCartOpen } = useCart();
  const { toast } = useToast();
  const [selectedSize, setSelectedSize] = useState<string>("");
  const [selectedImage, setSelectedImage] = useState(0);

  const { data: product, isLoading, isError } = useQuery<Product>({
    queryKey: ["/api/products", productId],
    enabled: !!productId,
  });

  const handleAddToCart = () => {
    if (!product || !selectedSize) {
      toast({
        title: "Please select a size",
        variant: "destructive",
      });
      return;
    }

    addToCart({
      product,
      size: selectedSize,
      quantity: 1,
    });

    toast({
      title: "Added to cart",
      description: `${product.name} (${selectedSize}) added to your cart`,
    });
  };

  const handleBuyNow = () => {
    if (!product || !selectedSize) {
      toast({
        title: "Please select a size",
        variant: "destructive",
      });
      return;
    }

    addToCart({
      product,
      size: selectedSize,
      quantity: 1,
    });

    setIsCartOpen(true);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen pt-24 pb-12">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="grid md:grid-cols-2 gap-12">
            <div className="space-y-4">
              <div className="aspect-[4/5] bg-muted rounded-md animate-pulse" />
              <div className="grid grid-cols-3 gap-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="aspect-square bg-muted rounded-md animate-pulse" />
                ))}
              </div>
            </div>
            <div className="space-y-6">
              <div className="h-8 bg-muted rounded-md animate-pulse w-3/4" />
              <div className="h-4 bg-muted rounded-md animate-pulse w-1/4" />
              <div className="h-24 bg-muted rounded-md animate-pulse" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (isError || (!isLoading && !product)) {
    return (
      <div className="min-h-screen pt-24 pb-12 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4" data-testid="text-error-title">
            {isError ? "Failed to load product" : "Product not found"}
          </h2>
          <p className="text-muted-foreground mb-6">
            {isError ? "There was an error loading the product. Please try again." : "This product doesn't exist or has been removed."}
          </p>
          <Link href="/">
            <Button data-testid="button-back-home">Back to Home</Button>
          </Link>
        </div>
      </div>
    );
  }

  if (!product) {
    return null;
  }

  const allImages = [product.imageUrl, ...product.images];
  const sizes = getProductSizes(product);

  return (
    <div className="min-h-screen pt-24 pb-12">
      <div className="container mx-auto px-4 max-w-6xl">
        <Link href="/">
          <Button variant="ghost" className="mb-8" data-testid="button-back">
            <ChevronLeft className="w-4 h-4 mr-2" />
            Back to Shop
          </Button>
        </Link>

        <div className="grid md:grid-cols-[60%_40%] gap-12">
          <div className="space-y-4">
            <div className="aspect-[4/5] bg-muted rounded-md overflow-hidden relative grain-overlay border border-border">
              <div className="absolute inset-0 flex items-center justify-center text-xs text-muted-foreground p-4 text-center">
                {allImages[selectedImage]}
              </div>
            </div>

            <div className="grid grid-cols-4 gap-4">
              {allImages.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedImage(idx)}
                  className={`aspect-square bg-muted rounded-md overflow-hidden border-2 transition-all hover-elevate ${
                    selectedImage === idx ? 'border-primary' : 'border-border'
                  }`}
                  data-testid={`button-image-${idx}`}
                >
                  <div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground p-2 text-center">
                    {img}
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <div className="flex items-start justify-between gap-4 mb-2">
                <h1 
                  className="text-4xl font-bold uppercase tracking-wider"
                  style={{ fontFamily: "'Bebas Neue', sans-serif" }}
                  data-testid="text-product-name"
                >
                  {product.name}
                </h1>
                <Badge variant="outline" className="shrink-0">
                  {product.category}
                </Badge>
              </div>
              <p className="text-3xl font-bold text-primary mb-6" data-testid="text-product-price">
                ${product.price}
              </p>
            </div>

            <div>
              <h3 
                className="text-sm font-semibold uppercase tracking-wider mb-3"
                style={{ fontFamily: "'Orbitron', sans-serif" }}
              >
                Select AI Model Size
              </h3>
              <div className="flex flex-col gap-2">
                {sizes.map((size) => {
                  const stock = getProductStock(product, size);
                  const sizeInfo = getAISizeInfo(size);
                  return (
                    <button
                      key={size}
                      className={`p-3 border rounded transition-all text-left hover-elevate ${
                        selectedSize === size 
                          ? 'border-primary bg-primary/10' 
                          : 'border-primary/30'
                      } ${stock === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
                      onClick={() => stock > 0 && setSelectedSize(size)}
                      disabled={stock === 0}
                      data-testid={`button-size-${size}`}
                      style={{ fontFamily: "'Orbitron', sans-serif" }}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          {selectedSize === size && <Check className="w-4 h-4 text-primary flex-shrink-0" />}
                          <div>
                            <div className="text-sm font-bold text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]">
                              {sizeInfo?.tag || size}
                            </div>
                            {sizeInfo && (
                              <div className="text-xs text-white/70 drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)] mt-1">
                                {sizeInfo.tagLine}
                              </div>
                            )}
                          </div>
                        </div>
                        {stock === 0 && (
                          <span className="text-xs text-destructive">Out of Stock</span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-3">
              <Button
                className="w-full uppercase tracking-wider h-12 text-base"
                onClick={handleBuyNow}
                data-testid="button-buy-now"
              >
                Buy Now with Crypto
              </Button>
              <Button
                variant="outline"
                className="w-full uppercase tracking-wider h-12 text-base"
                onClick={handleAddToCart}
                data-testid="button-add-to-cart"
              >
                Add to Cart
              </Button>
            </div>

            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="description">
                <AccordionTrigger className="text-sm uppercase tracking-wider">
                  Description
                </AccordionTrigger>
                <AccordionContent>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {product.description}
                  </p>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="materials">
                <AccordionTrigger className="text-sm uppercase tracking-wider">
                  Materials & Care
                </AccordionTrigger>
                <AccordionContent>
                  <ul className="text-sm text-muted-foreground space-y-2">
                    <li>• 100% premium cotton</li>
                    <li>• Machine wash cold</li>
                    <li>• Hang dry recommended</li>
                    <li>• Do not bleach</li>
                  </ul>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="shipping">
                <AccordionTrigger className="text-sm uppercase tracking-wider">
                  Shipping
                </AccordionTrigger>
                <AccordionContent>
                  <p className="text-sm text-muted-foreground">
                    Free worldwide shipping on orders over $100. Standard shipping takes 5-7 business days.
                    Express shipping available at checkout.
                  </p>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </div>
      </div>
    </div>
  );
}
