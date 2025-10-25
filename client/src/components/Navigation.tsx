import { Link } from "wouter";
import { ShoppingCart, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/lib/cart-context";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";

export function Navigation() {
  const { getTotalItems, setIsCartOpen } = useCart();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const totalItems = getTotalItems();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link href="/">
            <span className="text-2xl font-bold tracking-wider uppercase hover-elevate active-elevate-2 px-3 py-1 rounded-md cursor-pointer inline-block" style={{ fontFamily: "'Bebas Neue', sans-serif" }} data-testid="link-home">
              <span className="text-primary">YOUR-BRAND</span>
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-8">
            <Link href="/">
              <span className="text-sm uppercase tracking-wider hover:text-primary transition-colors hover-elevate px-3 py-2 rounded-md cursor-pointer inline-block" data-testid="link-shop">
                Shop
              </span>
            </Link>
            <Link href="/about">
              <span className="text-sm uppercase tracking-wider hover:text-primary transition-colors hover-elevate px-3 py-2 rounded-md cursor-pointer inline-block" data-testid="link-about">
                About
              </span>
            </Link>
          </div>

          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsCartOpen(true)}
              className="relative"
              data-testid="button-cart"
            >
              <ShoppingCart className="w-5 h-5" />
              {totalItems > 0 && (
                <Badge 
                  variant="destructive" 
                  className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs rounded-full"
                  data-testid="badge-cart-count"
                >
                  {totalItems}
                </Badge>
              )}
            </Button>

            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              data-testid="button-mobile-menu"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </div>
        </div>

        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-border py-4">
            <div className="flex flex-col gap-4">
              <Link href="/">
                <span 
                  className="text-sm uppercase tracking-wider hover:text-primary transition-colors block py-2 cursor-pointer"
                  onClick={() => setIsMobileMenuOpen(false)}
                  data-testid="link-shop-mobile"
                >
                  Shop
                </span>
              </Link>
              <Link href="/about">
                <span 
                  className="text-sm uppercase tracking-wider hover:text-primary transition-colors block py-2 cursor-pointer"
                  onClick={() => setIsMobileMenuOpen(false)}
                  data-testid="link-about-mobile"
                >
                  About
                </span>
              </Link>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
