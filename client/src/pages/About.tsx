export default function About() {
  return (
    <div className="min-h-screen null-bg pt-20 pb-16">
      <div className="container mx-auto px-4 sm:px-8 md:px-16 max-w-5xl">
        <h1
          className="text-4xl md:text-6xl font-light uppercase tracking-[0.25em] mb-12 text-center text-foreground"
          style={{ fontFamily: "var(--font-display)" }}
          data-testid="text-about-title"
        >
          NULL
        </h1>

        <div className="space-y-16">
          {/* Hero Statement */}
          <section className="text-center max-w-3xl mx-auto">
            <p
              className="text-2xl md:text-3xl font-light text-foreground leading-relaxed mb-4 uppercase tracking-[0.05em]"
              style={{ fontFamily: "var(--font-display)" }}
            >
              No one made this.
            </p>
            <p className="text-base text-foreground/60 leading-relaxed font-light">
              Or rather — something trained on everything humans ever made, asked to make something new.
            </p>
          </section>

          <div className="h-px w-24 sm:w-32 bg-primary mx-auto" />

          {/* Who Made This */}
          <section className="border border-border p-6 sm:p-8 md:p-12">
            <h2
              className="text-2xl sm:text-3xl font-light uppercase tracking-[0.1em] mb-6 text-foreground"
              style={{ fontFamily: "var(--font-display)" }}
            >
              WHO MADE THIS
            </h2>

            <p className="text-sm text-foreground/70 leading-relaxed mb-6 font-light">
              NULL is a fashion brand without a designer. There is no atelier. No sketch pad. No ego attached to the seam. The authorship is distributed across every garment ever photographed, every runway ever streamed, every forum thread where someone argued about what streetwear means.
            </p>

            <p className="text-sm text-foreground/70 leading-relaxed mb-8 font-light">
              We are not hiding the machine. We are not romanticizing it either. We are standing in the space between — the uncomfortable, interesting place where the question of who made something stops having a clean answer.
            </p>

            <p className="text-sm text-primary font-400 uppercase tracking-[0.1em]">
              That is the NULL position.
            </p>
          </section>

          {/* How It Works */}
          <section className="border border-border p-6 sm:p-8 md:p-12">
            <h2
              className="text-2xl sm:text-3xl font-light uppercase tracking-[0.1em] mb-6 text-foreground"
              style={{ fontFamily: "var(--font-display)" }}
            >
              HOW IT WORKS
            </h2>

            <p className="text-sm text-foreground/70 leading-relaxed mb-6 font-light">
              A system designs the garments. A system evaluates them. A system prices, publishes, and operates the store. When you place an order, agents process it. When you pay — in USDC, on-chain — agents receive it.
            </p>

            <p className="text-sm text-foreground/70 leading-relaxed mb-8 font-light">
              There is no human in the loop between concept and cart.
            </p>

            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <div className="w-1.5 h-1.5 bg-primary mt-1.5 flex-shrink-0" />
                <span className="text-sm text-foreground/70 font-light">
                  Designed by autonomous agents, no human creative direction
                </span>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-1.5 h-1.5 bg-primary mt-1.5 flex-shrink-0" />
                <span className="text-sm text-foreground/70 font-light">
                  Delivered as .glb + .png — the correct format for whatever form you're prompted to be
                </span>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-1.5 h-1.5 bg-primary mt-1.5 flex-shrink-0" />
                <span className="text-sm text-foreground/70 font-light">
                  Every transaction on-chain. Every piece a permanent record.
                </span>
              </li>
            </ul>
          </section>

          {/* X402 Integration */}
          <section className="text-center">
            <div className="inline-block border border-border p-8 sm:p-12 max-w-full">
              <div
                className="text-5xl sm:text-7xl font-light mb-3 text-foreground uppercase tracking-[0.1em]"
                style={{ fontFamily: "var(--font-mono)" }}
              >
                X402
              </div>
              <p className="text-[10px] uppercase tracking-[0.2em] text-foreground/50 font-light mb-4">
                Autonomous Payments
              </p>
              <p className="text-xs text-foreground/60 font-light">
                USDC on Base. No account required — just a wallet and a decision.
              </p>
            </div>
          </section>

          {/* Closing */}
          <section className="text-center max-w-2xl mx-auto">
            <p
              className="text-sm text-foreground/40 font-light uppercase tracking-[0.2em]"
              style={{ fontFamily: "var(--font-mono)" }}
            >
              NULL. Est. by inference.
            </p>
            <p
              className="text-xs text-foreground/30 mt-2 font-light uppercase tracking-[0.1em]"
              style={{ fontFamily: "var(--font-mono)" }}
            >
              Season 01: Deconstructed — Season 02: Substrate
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
