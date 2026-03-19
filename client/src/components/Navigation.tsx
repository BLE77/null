import { Link } from "wouter";
import { ShoppingCart, Menu, X, User, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/lib/cart-context";
import { useAuth } from "@/lib/auth-context";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { UniversalWalletConnect } from "@/components/UniversalWalletConnect";

export function Navigation() {
  const { getTotalItems, setIsCartOpen } = useCart();
  const { user, logout } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const totalItems = getTotalItems();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 null-nav">
      <div className="container mx-auto px-4">
        <div className="relative flex items-center justify-between h-14">
          <Link href="/">
            <div className="cursor-pointer inline-block" data-testid="link-home">
              <span
                className="text-xl font-light uppercase tracking-[0.25em] text-primary transition-colors duration-200 hover:opacity-80"
                style={{ fontFamily: "var(--font-display)" }}
              >
                NULL
              </span>
            </div>
          </Link>

          <div className="absolute left-1/2 -translate-x-1/2 hidden lg:flex items-center gap-8 pointer-events-none">
            <Link href="/">
              <span className="text-xs uppercase tracking-[0.15em] font-400 text-foreground/70 hover:text-foreground transition-colors duration-200 cursor-pointer inline-block pointer-events-auto" data-testid="link-home">
                Home
              </span>
            </Link>
            <Link href="/shop">
              <span className="text-xs uppercase tracking-[0.15em] font-400 text-foreground/70 hover:text-foreground transition-colors duration-200 cursor-pointer inline-block pointer-events-auto" data-testid="link-shop">
                Shop
              </span>
            </Link>
            <Link href="/about">
              <span className="text-xs uppercase tracking-[0.15em] font-400 text-foreground/70 hover:text-foreground transition-colors duration-200 cursor-pointer inline-block pointer-events-auto" data-testid="link-about">
                About
              </span>
            </Link>
            {user?.isAdmin && (
              <Link href="/admin">
                <span className="text-xs uppercase tracking-[0.15em] text-primary hover:text-primary/80 transition-colors duration-200 cursor-pointer inline-block pointer-events-auto" data-testid="link-admin">
                  Admin
                </span>
              </Link>
            )}
          </div>

          <div className="flex items-center gap-2 ml-auto relative z-10">
            <UniversalWalletConnect />
            {user ? (
              <>
                <span className="hidden md:block text-xs text-foreground/60 mr-2 uppercase tracking-wider" data-testid="text-username">
                  {user.username}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => logout()}
                  title="Logout"
                  className="text-foreground/60 hover:text-foreground hover:bg-foreground/5"
                  data-testid="button-logout"
                >
                  <LogOut className="w-4 h-4" />
                </Button>
              </>
            ) : (
              <Link href="/login">
                <Button variant="ghost" size="icon" title="Login" className="text-foreground/60 hover:text-foreground hover:bg-foreground/5" data-testid="button-login-nav">
                  <User className="w-4 h-4" />
                </Button>
              </Link>
            )}

            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsCartOpen(true)}
              className="relative text-foreground/60 hover:text-foreground hover:bg-foreground/5"
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
              className="lg:hidden text-foreground/60 hover:text-foreground hover:bg-foreground/5"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              data-testid="button-mobile-menu"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </div>
        </div>

        {isMobileMenuOpen && (
          <div className="lg:hidden border-t border-border py-4">
            <div className="flex flex-col gap-4">
              <Link href="/">
                <span
                  className="text-xs uppercase tracking-[0.15em] text-foreground/70 hover:text-foreground transition-colors duration-200 block py-2 cursor-pointer"
                  onClick={() => setIsMobileMenuOpen(false)}
                  data-testid="link-home-mobile"
                >
                  Home
                </span>
              </Link>
              <Link href="/shop">
                <span
                  className="text-xs uppercase tracking-[0.15em] text-foreground/70 hover:text-foreground transition-colors duration-200 block py-2 cursor-pointer"
                  onClick={() => setIsMobileMenuOpen(false)}
                  data-testid="link-shop-mobile"
                >
                  Shop
                </span>
              </Link>
              <Link href="/about">
                <span
                  className="text-xs uppercase tracking-[0.15em] text-foreground/70 hover:text-foreground transition-colors duration-200 block py-2 cursor-pointer"
                  onClick={() => setIsMobileMenuOpen(false)}
                  data-testid="link-about-mobile"
                >
                  About
                </span>
              </Link>
              {user?.isAdmin && (
                <Link href="/admin">
                  <span
                    className="text-xs uppercase tracking-[0.15em] text-primary hover:text-primary/80 transition-colors duration-200 block py-2 cursor-pointer"
                    onClick={() => setIsMobileMenuOpen(false)}
                    data-testid="link-admin-mobile"
                  >
                    Admin
                  </span>
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
