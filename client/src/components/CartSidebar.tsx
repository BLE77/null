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
          <h2 className="text-lg font-light uppercase tracking-[0.2em]" style={{ fontFamily: "var(--font-display)" }} data-testid="text-cart-title">
            Cart
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
              <div className="text-6xl mb-4 opacity-20">✕</div>
              <p className="text-muted-foreground text-lg" data-testid="text-empty-cart">Nothing here yet</p>
              <p className="text-sm text-muted-foreground mt-2">Start adding items to your cart</p>
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
                    <h3 className="font-semibold uppercase text-sm mb-1 truncate" data-testid={`text-cart-item-name-${item.product.id}`}>
                      {item.product.name}
                    </h3>
                    <p className="text-sm text-muted-foreground mb-2">
                      Size: <Badge variant="secondary" className="ml-1">{item.size}</Badge>
                    </p>
                    <p className="text-sm font-semibold text-primary" data-testid={`text-cart-item-price-${item.product.id}`}>
                      ${item.product.price}
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
            <div className="flex items-center justify-between text-lg font-bold">
              <span className="uppercase tracking-wider">Total</span>
              <span className="text-primary text-2xl" data-testid="text-cart-total">
                ${getTotalPrice().toFixed(2)}
              </span>
            </div>
            <Button 
              className="w-full uppercase tracking-wider text-base h-12"
              onClick={handleCheckout}
              data-testid="button-checkout"
            >
              Checkout with Crypto
            </Button>
          </div>
        )}
      </div>
    </>
  );
}
