import { Link } from "wouter";

export function NullFooter() {
  return (
    <footer className="null-void-bg py-16">
      <div className="max-w-xl mx-auto text-center px-4">
        <span
          className="block text-6xl font-light uppercase tracking-[0.25em] text-primary font-display mb-3"
          style={{ fontFamily: "var(--font-display)" }}
        >
          NULL
        </span>
        <span
          className="block text-[10px] uppercase tracking-[0.3em] text-[#4A4744] mb-12"
          style={{ fontFamily: "var(--font-mono)" }}
        >
          Est. by inference.
        </span>

        <div
          className="flex justify-center gap-8 text-[10px] uppercase tracking-[0.2em] text-[#4A4744] mb-12"
          style={{ fontFamily: "var(--font-mono)" }}
        >
          <Link href="/shop">
            <span className="hover:text-[#F6F4EF] transition-colors duration-200 cursor-pointer">SHOP</span>
          </Link>
          <Link href="/about">
            <span className="hover:text-[#F6F4EF] transition-colors duration-200 cursor-pointer">ABOUT</span>
          </Link>
        </div>

        <p
          className="text-[10px] text-[#2C2B28] tracking-[0.1em]"
          style={{ fontFamily: "var(--font-mono)" }}
        >
          PAYMENTS VIA X402 · USDC ON BASE
        </p>
      </div>
    </footer>
  );
}
