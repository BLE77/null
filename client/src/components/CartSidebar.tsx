import { useCart } from "@/lib/cart-context";
import { X, Minus, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useLocation } from "wouter";
import { getProductImage } from "@/lib/product-images";

export function CartSidebar() {
  const { cart, isCartOpen, setIsCartOpen, updateQuantity, removeFromCart, getTotalPrice } = useCart();
  const [, setLocation] = useLocation();

  if (!isCartOpen) return null;

  const handleCheckout = () => {
    setIsCartOpen(false);
    setLocation("/checkout");
  };

  return (
    <>
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
        onClick={() => setIsCartOpen(false)}
        data-testid="overlay-cart"
      />
      
      <div className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-card border-l border-card-border z-50 flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-card-border">
          <h2 className="text-xs font-light uppercase tracking-[0.25em]" style={{ fontFamily: "var(--font-mono)" }} data-testid="text-cart-title">
            CART
          </h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsCartOpen(false)}
            data-testid="button-close-cart"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {cart.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="text-2xl mb-6 text-muted-foreground" style={{ fontFamily: "var(--font-mono)" }}>—</div>
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground" style={{ fontFamily: "var(--font-mono)" }} data-testid="text-empty-cart">NOTHING ACQUIRED</p>
            </div>
          ) : (
            <div className="space-y-6">
              {cart.map((item) => (
                <div 
                  key={`${item.product.id}-${item.size}`} 
                  className="flex gap-4 border border-border p-4"
                  data-testid={`cart-item-${item.product.id}`}
                >
                  <div className="w-20 h-20 bg-muted overflow-hidden" style={{ background: "#EFEDE7" }}>
                    <img 
                      src={getProductImage(item.product.imageUrl) || item.product.imageUrl} 
                      alt={item.product.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <h3 className="font-light uppercase text-xs tracking-[0.08em] mb-2 truncate" style={{ fontFamily: "var(--font-display)" }} data-testid={`text-cart-item-name-${item.product.id}`}>
                      {item.product.name}
                    </h3>
                    <p className="text-xs text-muted-foreground mb-2 uppercase tracking-[0.1em]" style={{ fontFamily: "var(--font-mono)" }}>
                      SIZE — {item.size}
                    </p>
                    <p className="text-sm text-foreground" style={{ fontFamily: "var(--font-mono)" }} data-testid={`text-cart-item-price-${item.product.id}`}>
                      {item.product.price} <span className="text-muted-foreground text-xs">USDC</span>
                    </p>
                  </div>

                  <div className="flex flex-col justify-between items-end">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => removeFromCart(item.product.id, item.size)}
                      data-testid={`button-remove-${item.product.id}`}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>

                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => updateQuantity(item.product.id, item.size, item.quantity - 1)}
                        data-testid={`button-decrease-${item.product.id}`}
                      >
                        <Minus className="w-3 h-3" />
                      </Button>
                      <span className="w-8 text-center font-semibold" data-testid={`text-quantity-${item.product.id}`}>
                        {item.quantity}
                      </span>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => updateQuantity(item.product.id, item.size, item.quantity + 1)}
                        data-testid={`button-increase-${item.product.id}`}
                      >
                        <Plus className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {cart.length > 0 && (
          <div className="border-t border-card-border p-6 space-y-4">
            <div className="flex items-center justify-between mb-4">
              <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground" style={{ fontFamily: "var(--font-mono)" }}>TOTAL</span>
              <span className="text-foreground" style={{ fontFamily: "var(--font-mono)" }} data-testid="text-cart-total">
                {getTotalPrice().toFixed(2)} <span className="text-muted-foreground text-xs">USDC</span>
              </span>
            </div>
            <button
              className="null-acquire-btn"
              onClick={handleCheckout}
              data-testid="button-checkout"
            >
              CHECKOUT — USDC
            </button>
          </div>
        )}
      </div>
    </>
  );
}
