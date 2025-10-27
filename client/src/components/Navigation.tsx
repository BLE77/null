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
    <nav className="fixed top-0 left-0 right-0 z-50 metallic-nav">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link href="/">
            <div className="cursor-pointer inline-block" data-testid="link-home">
              <img 
                src="/attached_assets/off human transparent white_1761604456550.png" 
                alt="OFF HUMAN"
                className="h-10 transition-all duration-300 hover:scale-105"
                style={{ filter: 'drop-shadow(0 3px 8px rgba(0,0,0,0.7)) drop-shadow(0 0 12px rgba(0,0,0,0.5))' }}
              />
            </div>
          </Link>

          <div className="hidden md:flex items-center gap-8">
            <Link href="/shop">
              <span className="text-sm uppercase tracking-wider hover:brightness-125 transition-all font-semibold cursor-pointer inline-block text-white drop-shadow-md" data-testid="link-shop">
                Shop
              </span>
            </Link>
            <Link href="/about">
              <span className="text-sm uppercase tracking-wider hover:brightness-125 transition-all font-semibold cursor-pointer inline-block text-white drop-shadow-md" data-testid="link-about">
                About
              </span>
            </Link>
          </div>

          <div className="flex items-center gap-2">
            {user ? (
              <>
                <span className="hidden md:block text-sm text-white mr-2 font-medium drop-shadow-md" data-testid="text-username">
                  {user.username}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => logout()}
                  title="Logout"
                  className="text-white hover:bg-white/20"
                  data-testid="button-logout"
                >
                  <LogOut className="w-4 h-4" />
                </Button>
              </>
            ) : (
              <Link href="/login">
                <Button variant="ghost" size="icon" title="Login" className="text-white hover:bg-white/20" data-testid="button-login-nav">
                  <User className="w-4 h-4" />
                </Button>
              </Link>
            )}

            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsCartOpen(true)}
              className="relative text-white hover:bg-white/20"
              data-testid="button-cart"
            >
              <ShoppingCart className="w-5 h-5" />
              {totalItems > 0 && (
                <Badge 
                  className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs rounded-full bg-white/30 text-white font-bold backdrop-blur-sm"
                  data-testid="badge-cart-count"
                >
                  {totalItems}
                </Badge>
              )}
            </Button>

            <Button
              variant="ghost"
              size="icon"
              className="md:hidden text-white hover:bg-white/20"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              data-testid="button-mobile-menu"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </div>
        </div>

        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-white/30 py-4">
            <div className="flex flex-col gap-4">
              <Link href="/">
                <span 
                  className="text-sm uppercase tracking-wider hover:brightness-125 transition-all block py-2 cursor-pointer font-semibold text-white drop-shadow-md"
                  onClick={() => setIsMobileMenuOpen(false)}
                  data-testid="link-shop-mobile"
                >
                  Shop
                </span>
              </Link>
              <Link href="/about">
                <span 
                  className="text-sm uppercase tracking-wider hover:brightness-125 transition-all block py-2 cursor-pointer font-semibold text-white drop-shadow-md"
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
