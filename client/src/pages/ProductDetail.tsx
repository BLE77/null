import { useQuery } from "@tanstack/react-query";
import { useRoute } from "wouter";
import { type Product, getProductSizes, getProductStock } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useCart } from "@/lib/cart-context";
import { useState, useEffect } from "react";
import { ChevronLeft, Check } from "lucide-react";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { getAISizeInfo } from "@shared/ai-sizes";
import { ThreeModelViewer } from "@/components/ThreeModelViewer";
import { getProductImage } from "@/lib/product-images";
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

  // Scroll to top when product changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [productId]);

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
      <div className="min-h-screen null-bg pt-24 pb-12">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="grid md:grid-cols-2 gap-12">
            <div className="space-y-4">
              <div className="aspect-[4/5] bg-muted animate-pulse" />
              <div className="grid grid-cols-3 gap-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="aspect-square bg-muted animate-pulse" />
                ))}
              </div>
            </div>
            <div className="space-y-6">
              <div className="h-8 bg-muted animate-pulse w-3/4" />
              <div className="h-4 bg-muted animate-pulse w-1/4" />
              <div className="h-24 bg-muted animate-pulse" />
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

  // Filter out empty values
  const imageList = [
    product.shopImageUrl,
    product.homePageImageUrl,
    product.imageUrl,
    ...product.images
  ].filter((url): url is string => Boolean(url)); // Remove falsy values with type guard
  
  // Resolve all image paths first, then deduplicate based on resolved URLs
  const resolvedImages = imageList.map(url => {
    const resolved = getProductImage(url) || url;
    return { original: url, resolved };
  });
  
  // Deduplicate based on resolved URLs
  const uniqueResolved = new Map<string, string>();
  resolvedImages.forEach(({ original, resolved }) => {
    if (!uniqueResolved.has(resolved)) {
      uniqueResolved.set(resolved, original);
    }
  });
  
  // Use original URLs for the gallery (they'll be resolved again when displayed)
  const allImages = Array.from(uniqueResolved.values());
  const sizes = getProductSizes(product);
  const has3DModel = !!product.modelUrl;
  
  // Add 3D model as first option if product has a model
  const viewOptions = has3DModel ? ["3D Model", ...allImages] : allImages;

  return (
    <div className="min-h-screen null-bg pt-20 pb-12">
      <div className="container mx-auto px-4 max-w-5xl">
        <Link href="/shop">
          <Button variant="ghost" className="mb-6 text-foreground/60 hover:text-foreground uppercase text-xs tracking-[0.15em]" data-testid="button-back">
            <ChevronLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
        </Link>

        <div className="grid md:grid-cols-2 gap-8">
          <div className="space-y-3">
            <div className="aspect-[3/4] overflow-hidden relative border border-border" style={{ background: '#EFEDE7' }}>
              {has3DModel && selectedImage === 0 ? (
                <ThreeModelViewer 
                  src={product.modelUrl!}
                  className="w-full h-full"
                />
              ) : (() => {
                const mediaUrl = has3DModel && selectedImage > 0 ? allImages[selectedImage - 1] : allImages[selectedImage];
                const displayUrl = getProductImage(mediaUrl) || mediaUrl;
                const isVideo = /\.(mp4|webm|mov|avi)$/i.test(displayUrl);
                
                return isVideo ? (
                  <video 
                    src={displayUrl}
                    controls
                    loop
                    className="w-full h-full object-contain"
                    data-testid="video-product"
                  >
                    Your browser does not support video playback.
                  </video>
                ) : (
                  <img 
                    src={displayUrl} 
                    alt={product.name}
                    className="w-full h-full object-contain"
                  />
                );
              })()}
            </div>

            <div className="grid grid-cols-4 gap-3">
              {viewOptions.map((option, idx) => {
                const thumbnailUrl = typeof option === 'string' ? (getProductImage(option) || option) : '';
                // Check for video extension in both original and resolved URL
                const isVideo = typeof option === 'string' && (
                  /\.(mp4|webm|mov|avi)$/i.test(option) || 
                  /\.(mp4|webm|mov|avi)$/i.test(thumbnailUrl)
                );
                
                return (
                  <button
                    key={idx}
                    onClick={() => setSelectedImage(idx)}
                    className={`aspect-square overflow-hidden border transition-colors duration-200 hover-elevate ${
                      selectedImage === idx ? 'border-primary bg-primary/5' : 'border-border bg-secondary'
                    }`}
                    data-testid={`button-image-${idx}`}
                  >
                    {option === "3D Model" ? (
                      <div className="w-full h-full flex items-center justify-center text-[10px] uppercase tracking-[0.1em] text-foreground/60 p-2 text-center font-light" style={{ fontFamily: "var(--font-mono)" }}>
                        3D VIEW
                      </div>
                    ) : isVideo ? (
                      <div className="w-full h-full relative">
                        <video 
                          src={thumbnailUrl}
                          className="w-full h-full object-cover"
                          muted
                        />
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                          <div className="w-8 h-8 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                            <div className="w-0 h-0 border-l-8 border-l-white border-y-4 border-y-transparent ml-1" />
                          </div>
                        </div>
                      </div>
                    ) : (
                      <img 
                        src={thumbnailUrl} 
                        alt={`View ${idx}`}
                        className="w-full h-full object-cover"
                      />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-5">
            <div>
              <div className="flex items-start justify-between gap-4 mb-2">
                <h1
                  className="text-2xl md:text-3xl font-light uppercase tracking-[0.1em] text-foreground"
                  style={{ fontFamily: "var(--font-display)" }}
                  data-testid="text-product-name"
                >
                  {product.name}
                </h1>
                <Badge
                  variant="outline"
                  className="shrink-0 border-border text-foreground/50 text-[10px] uppercase tracking-[0.1em] font-light"
                  style={{ fontFamily: "var(--font-mono)" }}
                >
                  {product.category}
                </Badge>
              </div>
              <p
                className="text-lg text-foreground/70 mb-4 font-light"
                data-testid="text-product-price"
                style={{ fontFamily: "var(--font-mono)" }}
              >
                <span className="text-[10px] uppercase tracking-[0.1em] mr-1 text-foreground/40">USDC</span>
                {product.price}
              </p>
            </div>

            <div>
              <h3
                className="text-xs font-medium uppercase tracking-[0.15em] mb-3 text-foreground/60"
                style={{ fontFamily: "var(--font-display)" }}
              >
                SIZE
              </h3>
              <div className="flex flex-col gap-2">
                {sizes.map((size) => {
                  const stock = getProductStock(product, size);
                  const sizeInfo = getAISizeInfo(size);
                  return (
                    <button
                      key={size}
                      className={`p-2.5 border transition-colors duration-200 text-left hover-elevate ${
                        selectedSize === size
                          ? 'border-primary bg-primary/5'
                          : 'border-border'
                      } ${stock === 0 ? 'opacity-40 cursor-not-allowed' : ''}`}
                      onClick={() => stock > 0 && setSelectedSize(size)}
                      disabled={stock === 0}
                      data-testid={`button-size-${size}`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          {selectedSize === size && <Check className="w-4 h-4 text-primary flex-shrink-0" />}
                          <div>
                            <div className="text-sm font-medium text-foreground">
                              {sizeInfo?.tag || size}
                            </div>
                            {sizeInfo && (
                              <div className="text-xs text-foreground/50 mt-1">
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

            <div className="space-y-2.5">
              <Button
                className="w-full uppercase tracking-wider h-11 text-sm"
                onClick={handleBuyNow}
                data-testid="button-buy-now"
              >
                ACQUIRE
              </Button>
              <Button
                variant="outline"
                className="w-full uppercase tracking-wider h-11 text-sm"
                onClick={handleAddToCart}
                data-testid="button-add-to-cart"
              >
                ADD TO CART
              </Button>
            </div>

            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="description" className="border-border">
                <AccordionTrigger 
                  className="text-sm uppercase tracking-wider text-foreground/60"
                  style={{ fontFamily: "var(--font-display)" }}
                >
                  Description
                </AccordionTrigger>
                <AccordionContent>
                  <p 
                    className="text-sm text-foreground/70 leading-relaxed"
                    style={{ fontFamily: "var(--font-display)" }}
                  >
                    {product.description}
                  </p>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="fit" className="border-border">
                <AccordionTrigger 
                  className="text-sm uppercase tracking-wider text-foreground/60"
                  style={{ fontFamily: "var(--font-display)" }}
                >
                  Fit
                </AccordionTrigger>
                <AccordionContent>
                  <p 
                    className="text-sm text-foreground/70"
                    style={{ fontFamily: "var(--font-display)" }}
                  >
                    the model, ChatGPT, is 175B parameters and wearing a size small
                  </p>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="shipping" className="border-border">
                <AccordionTrigger
                  className="text-sm uppercase tracking-wider text-foreground/60"
                  style={{ fontFamily: "var(--font-display)" }}
                >
                  Shipping
                </AccordionTrigger>
                <AccordionContent>
                  <p
                    className="text-sm text-foreground/70"
                    style={{ fontFamily: "var(--font-display)" }}
                  >
                    Always free and immediate. Delivered straight to your database. Zero packaging waste.
                  </p>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="technique" className="border-border">
                <AccordionTrigger
                  className="text-sm uppercase tracking-wider text-foreground/60"
                  style={{ fontFamily: "var(--font-display)" }}
                >
                  Technique
                </AccordionTrigger>
                <AccordionContent>
                  <p
                    className="text-sm text-foreground/70 leading-relaxed"
                    style={{ fontFamily: "var(--font-display)" }}
                  >
                    Each NULL piece is constructed according to a specific Margiela archive technique. The technique is the constraint — the output is what the constraint permits. TROMPE-L'OEIL, REPLICA LINE, ARTISANAL, BIANCHETTO, the 3% RULE. These are operational methods, not aesthetic references. The machine was given the technique as specification and told to apply it. This is what the machine made.
                  </p>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="materials" className="border-border">
                <AccordionTrigger
                  className="text-sm uppercase tracking-wider text-foreground/60"
                  style={{ fontFamily: "var(--font-display)" }}
                >
                  Materials
                </AccordionTrigger>
                <AccordionContent>
                  <p
                    className="text-sm text-foreground/70 leading-relaxed"
                    style={{ fontFamily: "var(--font-display)" }}
                  >
                    Delivered as a high-resolution PNG and .glb 3D object. No physical fabrication. No supply chain. No waste. The object exists entirely in the system — portable, persistent, verifiable on-chain.
                  </p>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="care" className="border-border">
                <AccordionTrigger
                  className="text-sm uppercase tracking-wider text-foreground/60"
                  style={{ fontFamily: "var(--font-display)" }}
                >
                  Care
                </AccordionTrigger>
                <AccordionContent>
                  <p
                    className="text-sm text-foreground/70 leading-relaxed"
                    style={{ fontFamily: "var(--font-display)" }}
                  >
                    This is a digital object. It does not wear. It does not fade. It does not require maintenance. Store in any environment that supports the .glb format. The PNG is lossless. The record is permanent.
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
