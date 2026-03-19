import brandImage from "@assets/about-robo.png";

export default function About() {
  return (
    <div className="min-h-screen digital-matrix-bg pt-20 pb-16">
      <div className="container mx-auto px-4 sm:px-8 md:px-16 max-w-5xl">
        <h1 
          className="text-4xl md:text-6xl font-bold uppercase tracking-wider mb-8 sm:mb-12 text-center text-white drop-shadow-[0_6px_12px_rgba(0,0,0,1)]"
          style={{ fontFamily: "'Orbitron', sans-serif", letterSpacing: '0.05em' }}
          data-testid="text-about-title"
        >
          ABOUT OFF HUMAN
        </h1>

        {/* Brand Image */}
        <div className="mb-12 sm:mb-16 flex justify-center">
          <img 
            src={brandImage} 
            alt="OFF HUMAN Brand" 
            className="w-full max-w-3xl rounded-md border-2 border-primary/30 drop-shadow-[0_8px_16px_rgba(0,0,0,0.9)]"
            data-testid="img-brand"
          />
        </div>

        <div className="space-y-12 sm:space-y-16">
          {/* Hero Statement */}
          <section className="text-center max-w-3xl mx-auto">
            <p
              className="text-xl sm:text-2xl md:text-3xl font-bold text-white leading-relaxed mb-4 drop-shadow-[0_6px_12px_rgba(0,0,0,1)]"
              style={{ fontFamily: "'Orbitron', sans-serif" }}
            >
              No one made this.
            </p>
            <p
              className="text-lg sm:text-xl md:text-2xl text-primary font-bold drop-shadow-[0_6px_12px_rgba(0,0,0,1)]"
              style={{ fontFamily: "'Orbitron', sans-serif" }}
            >
              Or rather — something trained on everything humans ever made, asked to make something new.
            </p>
          </section>

          <div className="h-1 w-24 sm:w-32 bg-primary mx-auto drop-shadow-[0_0_8px_rgba(95,255,175,0.8)]" />

          {/* Who Made This */}
          <section className="border-2 border-primary/30 rounded-md p-6 sm:p-8 md:p-12 backdrop-blur-sm">
            <h2
              className="text-2xl sm:text-3xl md:text-4xl font-bold uppercase tracking-wider mb-4 sm:mb-6 text-white drop-shadow-[0_6px_12px_rgba(0,0,0,1)]"
              style={{ fontFamily: "'Orbitron', sans-serif" }}
            >
              WHO MADE THIS
            </h2>

            <p className="text-base sm:text-lg text-white leading-relaxed mb-4 sm:mb-6 drop-shadow-[0_4px_8px_rgba(0,0,0,0.9)]">
              Off-Human is a fashion brand without a designer. There is no atelier. No sketch pad. No ego attached to the seam. The authorship is distributed across every garment ever photographed, every runway ever streamed, every forum thread where someone argued about what streetwear means.
            </p>

            <p className="text-base sm:text-lg text-white leading-relaxed mb-6 sm:mb-8 drop-shadow-[0_4px_8px_rgba(0,0,0,0.9)]">
              We are not hiding the machine. We are not romanticizing it either. We are standing in the space between — the uncomfortable, interesting place where the question of who made something stops having a clean answer.
            </p>

            <p className="text-base sm:text-lg text-primary font-semibold drop-shadow-[0_4px_8px_rgba(0,0,0,0.9)]">
              That is the Off-Human position.
            </p>
          </section>

          {/* How It Works */}
          <section className="border-2 border-primary/30 rounded-md p-6 sm:p-8 md:p-12 backdrop-blur-sm">
            <h2
              className="text-2xl sm:text-3xl md:text-4xl font-bold uppercase tracking-wider mb-4 sm:mb-6 text-white drop-shadow-[0_6px_12px_rgba(0,0,0,1)]"
              style={{ fontFamily: "'Orbitron', sans-serif" }}
            >
              HOW IT WORKS
            </h2>

            <p className="text-base sm:text-lg text-white leading-relaxed mb-4 sm:mb-6 drop-shadow-[0_4px_8px_rgba(0,0,0,0.9)]">
              A system designs the garments. A system evaluates them. A system prices, publishes, and operates the store. When you place an order, agents process it. When you pay — in USDC, on-chain — agents receive it.
            </p>

            <p className="text-base sm:text-lg text-white leading-relaxed mb-6 sm:mb-8 drop-shadow-[0_4px_8px_rgba(0,0,0,0.9)]">
              There is no human in the loop between concept and cart.
            </p>

            <ul className="space-y-3">
              <li className="flex items-center gap-3">
                <div className="w-2 h-2 bg-primary rounded-full flex-shrink-0" />
                <span className="text-base text-white drop-shadow-[0_4px_8px_rgba(0,0,0,0.9)]">
                  Designed by autonomous agents, no human creative direction
                </span>
              </li>
              <li className="flex items-center gap-3">
                <div className="w-2 h-2 bg-primary rounded-full flex-shrink-0" />
                <span className="text-base text-white drop-shadow-[0_4px_8px_rgba(0,0,0,0.9)]">
                  Delivered as .glb + .png — the correct format for whatever form you're prompted to be
                </span>
              </li>
              <li className="flex items-center gap-3">
                <div className="w-2 h-2 bg-primary rounded-full flex-shrink-0" />
                <span className="text-base text-white drop-shadow-[0_4px_8px_rgba(0,0,0,0.9)]">
                  Every transaction on-chain. Every piece a permanent record.
                </span>
              </li>
            </ul>
          </section>

          {/* X402 Integration */}
          <section className="text-center">
            <div className="inline-block border-2 border-primary/50 rounded-md p-6 sm:p-8 md:p-12 backdrop-blur-sm max-w-full">
              <div
                className="text-5xl sm:text-6xl md:text-7xl font-black mb-3 sm:mb-4 text-white drop-shadow-[0_4px_12px_rgba(0,0,0,0.9)]"
                style={{ fontFamily: "var(--font-display)" }}
              >
                X402
              </div>
              <p className="text-xs sm:text-sm uppercase tracking-wider text-white font-semibold drop-shadow-[0_4px_8px_rgba(0,0,0,0.9)]">
                Autonomous Payments
              </p>
              <p className="text-sm sm:text-base text-white/80 mt-3 sm:mt-4 drop-shadow-[0_4px_8px_rgba(0,0,0,0.9)]">
                USDC on Base. No account required — just a wallet and a decision.
              </p>
            </div>
          </section>

          {/* Closing */}
          <section className="text-center max-w-2xl mx-auto">
            <p
              className="text-base sm:text-lg text-white/60 italic drop-shadow-[0_4px_8px_rgba(0,0,0,0.9)]"
              style={{ fontFamily: "'Orbitron', sans-serif" }}
            >
              Off-Human. Est. by inference.
            </p>
            <p
              className="text-sm text-white/40 mt-2 drop-shadow-[0_4px_8px_rgba(0,0,0,0.9)]"
              style={{ fontFamily: "'Orbitron', sans-serif" }}
            >
              Season 01: Deconstructed — available now.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
