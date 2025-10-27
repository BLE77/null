import { Link } from "wouter";
import { ShoppingCart, Menu, X, User, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/lib/cart-context";
import { useAuth } from "@/lib/auth-context";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";

export function Navigation() {
  const { getTotalItems, setIsCartOpen } = useCart();
  const { user, logout } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const totalItems = getTotalItems();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-lg border-b-2 border-primary shadow-sm">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link href="/">
            <span className="text-2xl font-bold tracking-tight cursor-pointer inline-block text-foreground" style={{ fontFamily: "var(--font-display)" }} data-testid="link-home">
              OFF HUMAN
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-8">
            <Link href="/">
              <span className="text-sm uppercase tracking-wider hover:text-primary transition-colors font-semibold cursor-pointer inline-block" data-testid="link-shop">
                Shop
              </span>
            </Link>
            <Link href="/about">
              <span className="text-sm uppercase tracking-wider hover:text-primary transition-colors font-semibold cursor-pointer inline-block" data-testid="link-about">
                About
              </span>
            </Link>
          </div>

          <div className="flex items-center gap-2">
            {user ? (
              <>
                <span className="hidden md:block text-sm text-muted-foreground mr-2 font-medium" data-testid="text-username">
                  {user.username}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => logout()}
                  title="Logout"
                  data-testid="button-logout"
                >
                  <LogOut className="w-4 h-4" />
                </Button>
              </>
            ) : (
              <Link href="/login">
                <Button variant="ghost" size="icon" title="Login" data-testid="button-login-nav">
                  <User className="w-4 h-4" />
                </Button>
              </Link>
            )}

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
                  className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs rounded-full bg-primary text-primary-foreground font-bold"
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
                  className="text-sm uppercase tracking-wider hover:text-primary transition-colors block py-2 cursor-pointer font-semibold"
                  onClick={() => setIsMobileMenuOpen(false)}
                  data-testid="link-shop-mobile"
                >
                  Shop
                </span>
              </Link>
              <Link href="/about">
                <span 
                  className="text-sm uppercase tracking-wider hover:text-primary transition-colors block py-2 cursor-pointer font-semibold"
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
