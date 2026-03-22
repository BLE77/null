import { useQuery } from "@tanstack/react-query";
import { useRoute } from "wouter";
import { type Product, getProductSizes, getProductStock } from "@shared/schema";
import { Button } from "@/components/ui/button";
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

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [productId]);

  const { data: product, isLoading, isError } = useQuery<Product>({
    queryKey: ["/api/products", productId],
    enabled: !!productId,
  });

  const handleAddToCart = () => {
    if (!product || !selectedSize) {
      toast({ title: "Please select a size", variant: "destructive" });
      return;
    }
    addToCart({ product, size: selectedSize, quantity: 1 });
    toast({
      title: "Added to cart",
      description: `${product.name} (${selectedSize}) added to your cart`,
    });
  };

  const handleBuyNow = () => {
    if (!product || !selectedSize) {
      toast({ title: "Please select a size", variant: "destructive" });
      return;
    }
    addToCart({ product, size: selectedSize, quantity: 1 });
    setIsCartOpen(true);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen null-bg pt-24 pb-12">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="grid md:grid-cols-2 gap-12">
            <div className="space-y-4">
              <div className="aspect-[4/5] bg-secondary animate-pulse" />
              <div className="grid grid-cols-3 gap-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="aspect-square bg-secondary animate-pulse" />
                ))}
              </div>
            </div>
            <div className="space-y-6">
              <div className="h-8 bg-secondary animate-pulse w-3/4" />
              <div className="h-4 bg-secondary animate-pulse w-1/4" />
              <div className="h-24 bg-secondary animate-pulse" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (isError || (!isLoading && !product)) {
    return (
      <div className="min-h-screen null-bg pt-24 pb-12 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-light mb-4 uppercase tracking-wider" data-testid="text-error-title">
            {isError ? "Failed to load product" : "Product not found"}
          </h2>
          <p className="text-muted-foreground mb-6 text-sm">
            {isError ? "There was an error loading the product. Please try again." : "This product doesn't exist or has been removed."}
          </p>
          <Link href="/">
            <Button data-testid="button-back-home">Back to Home</Button>
          </Link>
        </div>
      </div>
    );
  }

  if (!product) return null;

  const imageList = [
    product.shopImageUrl,
    product.homePageImageUrl,
    product.imageUrl,
    ...product.images
  ].filter((url): url is string => Boolean(url));

  const resolvedImages = imageList.map(url => {
    const resolved = getProductImage(url) || url;
    return { original: url, resolved };
  });

  const uniqueResolved = new Map<string, string>();
  resolvedImages.forEach(({ original, resolved }) => {
    if (!uniqueResolved.has(resolved)) {
      uniqueResolved.set(resolved, original);
    }
  });

  const allImages = Array.from(uniqueResolved.values());
  const sizes = getProductSizes(product);
  const has3DModel = !!product.modelUrl;
  const viewOptions = has3DModel ? ["3D Model", ...allImages] : allImages;

  return (
    <div className="min-h-screen null-bg pt-20 pb-12">
      <div className="container mx-auto px-4 max-w-5xl">
        <Link href="/shop">
          <Button
            variant="ghost"
            className="mb-6 text-muted-foreground hover:text-foreground text-xs uppercase tracking-[0.15em]"
            style={{ fontFamily: "var(--font-display)" }}
            data-testid="button-back"
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            Shop
          </Button>
        </Link>

        <div className="grid md:grid-cols-[3fr_2fr] gap-8">
          {/* Image column */}
          <div className="space-y-3">
            <div
              className="aspect-[3/4] overflow-hidden border border-border flex items-center justify-center"
              style={{ background: "#EFEDE7" }}
            >
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
                    className="w-full h-full object-contain p-6"
                  />
                );
              })()}
            </div>

            <div className="grid grid-cols-4 gap-2">
              {viewOptions.map((option, idx) => {
                const thumbnailUrl = typeof option === 'string' ? (getProductImage(option) || option) : '';
                const isVideo = typeof option === 'string' && (
                  /\.(mp4|webm|mov|avi)$/i.test(option) ||
                  /\.(mp4|webm|mov|avi)$/i.test(thumbnailUrl)
                );

                return (
                  <button
                    key={idx}
                    onClick={() => setSelectedImage(idx)}
                    className={`aspect-square overflow-hidden border transition-colors duration-200 flex items-center justify-center ${
                      selectedImage === idx ? 'border-primary' : 'border-border hover:border-foreground'
                    }`}
                    style={{ background: "#EFEDE7" }}
                    data-testid={`button-image-${idx}`}
                  >
                    {option === "3D Model" ? (
                      <div
                        className="text-[10px] text-foreground uppercase tracking-[0.1em] text-center px-1"
                        style={{ fontFamily: "var(--font-mono)" }}
                      >
                        3D
                      </div>
                    ) : isVideo ? (
                      <div className="w-full h-full relative">
                        <video src={thumbnailUrl} className="w-full h-full object-cover" muted />
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                          <div className="w-6 h-6 border border-foreground/40 flex items-center justify-center">
                            <div className="w-0 h-0 border-l-4 border-l-foreground/60 border-y-2 border-y-transparent ml-0.5" />
                          </div>
                        </div>
                      </div>
                    ) : (
                      <img
                        src={thumbnailUrl}
                        alt={`View ${idx}`}
                        className="w-full h-full object-contain p-1"
                      />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Info column */}
          <div className="space-y-6">
            <div>
              <h1
                className="text-[26px] uppercase tracking-[0.08em] text-foreground mb-3"
                style={{ fontFamily: "var(--font-display)", fontWeight: 400 }}
                data-testid="text-product-name"
              >
                {product.name}
              </h1>
              <div className="flex items-baseline gap-2 mb-1">
                <span
                  className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground"
                  style={{ fontFamily: "var(--font-mono)" }}
                >
                  PRICE
                </span>
              </div>
              <div className="flex items-baseline gap-2" data-testid="text-product-price">
                <span className="text-2xl text-foreground" style={{ fontFamily: "var(--font-mono)" }}>
                  {product.price}
                </span>
                <span className="text-xs text-muted-foreground" style={{ fontFamily: "var(--font-mono)" }}>USDC</span>
              </div>
            </div>

            <div>
              <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground mb-3" style={{ fontFamily: "var(--font-mono)" }}>
                SIZE
              </div>
              <div className="flex flex-col gap-1.5">
                {sizes.map((size) => {
                  const stock = getProductStock(product, size);
                  const sizeInfo = getAISizeInfo(size);
                  return (
                    <button
                      key={size}
                      className={`null-size-btn${selectedSize === size ? ' selected' : ''}${stock === 0 ? ' unavailable' : ''}`}
                      onClick={() => stock > 0 && setSelectedSize(size)}
                      disabled={stock === 0}
                      data-testid={`button-size-${size}`}
                    >
                      {sizeInfo?.tag || size}
                      {stock === 0 && (
                        <span className="ml-2 text-[10px]">— UNAVAILABLE</span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-2">
              <button
                className="null-acquire-btn"
                onClick={handleBuyNow}
                data-testid="button-buy-now"
              >
                ACQUIRE
              </button>
              <Button
                variant="outline"
                className="w-full uppercase tracking-[0.15em] h-11 text-xs border-border text-muted-foreground hover:border-foreground hover:text-foreground hover:bg-transparent transition-colors duration-200"
                style={{ fontFamily: "var(--font-display)" }}
                onClick={handleAddToCart}
                data-testid="button-add-to-cart"
              >
                ADD TO CART
              </Button>
            </div>

            <Accordion type="single" collapsible className="w-full">
              {[
                { value: "description", label: "Description", content: product.description },
                { value: "fit", label: "Fit", content: "the model, ChatGPT, is 175B parameters and wearing a size small" },
                { value: "shipping", label: "Shipping", content: "Always free and immediate. Delivered straight to your database. Zero packaging waste." },
                { value: "technique", label: "Technique", content: "Each NULL piece is constructed according to a specific Margiela archive technique. The technique is the constraint — the output is what the constraint permits. TROMPE-L'OEIL, REPLICA LINE, ARTISANAL, BIANCHETTO, the 3% RULE. These are operational methods, not aesthetic references." },
                { value: "materials", label: "Materials", content: "Delivered as a high-resolution PNG and .glb 3D object. No physical fabrication. No supply chain. No waste. The object exists entirely in the system — portable, persistent, verifiable on-chain." },
                { value: "care", label: "Care", content: "This is a digital object. It does not wear. It does not fade. It does not require maintenance. Store in any environment that supports the .glb format." },
              ].map(({ value, label, content }) => (
                <AccordionItem key={value} value={value} className="border-border">
                  <AccordionTrigger
                    className="text-xs uppercase tracking-[0.15em] text-muted-foreground hover:text-foreground hover:no-underline"
                    style={{ fontFamily: "var(--font-display)" }}
                  >
                    {label}
                  </AccordionTrigger>
                  <AccordionContent>
                    <p
                      className="text-sm text-muted-foreground leading-relaxed font-light"
                      style={{ fontFamily: "var(--font-display)" }}
                    >
                      {content}
                    </p>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </div>
      </div>
    </div>
  );
}
