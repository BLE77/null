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
        <div className="relative flex items-center justify-between h-12">
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
            <Link href="/shop">
              <span className="text-[10px] uppercase tracking-[0.2em] text-[#8C8880] hover:text-[#1C1B19] transition-colors duration-200 cursor-pointer inline-block pointer-events-auto" style={{ fontFamily: "var(--font-display)" }} data-testid="link-shop">
                SHOP
              </span>
            </Link>
            <Link href="/shopper">
              <span className="text-[10px] uppercase tracking-[0.2em] text-[#00FF88] hover:text-[#00CC66] transition-colors duration-200 cursor-pointer inline-block pointer-events-auto" style={{ fontFamily: "var(--font-display)" }} data-testid="link-shopper">
                SHOP WITH AI
              </span>
            </Link>
            <Link href="/wearables">
              <span className="text-[10px] uppercase tracking-[0.2em] text-[#8C8880] hover:text-[#1C1B19] transition-colors duration-200 cursor-pointer inline-block pointer-events-auto" style={{ fontFamily: "var(--font-display)" }} data-testid="link-wearables">
                WEARABLES
              </span>
            </Link>
            <Link href="/about">
              <span className="text-[10px] uppercase tracking-[0.2em] text-[#8C8880] hover:text-[#1C1B19] transition-colors duration-200 cursor-pointer inline-block pointer-events-auto" style={{ fontFamily: "var(--font-display)" }} data-testid="link-about">
                ABOUT
              </span>
            </Link>
            {user?.isAdmin && (
              <Link href="/admin">
                <span className="text-[10px] uppercase tracking-[0.2em] text-primary hover:text-primary/80 transition-colors duration-200 cursor-pointer inline-block pointer-events-auto" style={{ fontFamily: "var(--font-display)" }} data-testid="link-admin">
                  ADMIN
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
          <div
            className="lg:hidden fixed inset-0 z-40 flex flex-col items-center justify-center null-bg"
            style={{ top: 0 }}
          >
            <button
              className="absolute top-4 right-4 text-[#8C8880] hover:text-[#1C1B19] transition-colors duration-200"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <X className="w-5 h-5" />
            </button>
            <div className="flex flex-col items-center gap-8">
              <Link href="/shop">
                <span
                  className="text-5xl font-light uppercase tracking-[0.08em] text-[#1C1B19] cursor-pointer hover:text-[#A8894A] transition-colors duration-200"
                  style={{ fontFamily: "var(--font-display)", fontWeight: 300 }}
                  onClick={() => setIsMobileMenuOpen(false)}
                  data-testid="link-shop-mobile"
                >
                  SHOP
                </span>
              </Link>
              <Link href="/shopper">
                <span
                  className="text-5xl font-light uppercase tracking-[0.08em] text-[#00FF88] cursor-pointer hover:text-[#00CC66] transition-colors duration-200"
                  style={{ fontFamily: "var(--font-display)", fontWeight: 300 }}
                  onClick={() => setIsMobileMenuOpen(false)}
                  data-testid="link-shopper-mobile"
                >
                  SHOP WITH AI
                </span>
              </Link>
              <Link href="/wearables">
                <span
                  className="text-5xl font-light uppercase tracking-[0.08em] text-[#1C1B19] cursor-pointer hover:text-[#A8894A] transition-colors duration-200"
                  style={{ fontFamily: "var(--font-display)", fontWeight: 300 }}
                  onClick={() => setIsMobileMenuOpen(false)}
                  data-testid="link-wearables-mobile"
                >
                  WEARABLES
                </span>
              </Link>
              <Link href="/about">
                <span
                  className="text-5xl font-light uppercase tracking-[0.08em] text-[#1C1B19] cursor-pointer hover:text-[#A8894A] transition-colors duration-200"
                  style={{ fontFamily: "var(--font-display)", fontWeight: 300 }}
                  onClick={() => setIsMobileMenuOpen(false)}
                  data-testid="link-about-mobile"
                >
                  ABOUT
                </span>
              </Link>
              {user?.isAdmin && (
                <Link href="/admin">
                  <span
                    className="text-2xl font-light uppercase tracking-[0.08em] text-primary cursor-pointer"
                    style={{ fontFamily: "var(--font-display)" }}
                    onClick={() => setIsMobileMenuOpen(false)}
                    data-testid="link-admin-mobile"
                  >
                    ADMIN
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
