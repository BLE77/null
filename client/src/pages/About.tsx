export default function About() {
  return (
    <div className="min-h-screen null-bg pt-20 pb-16">
      <div className="container mx-auto px-4 sm:px-8 md:px-16 max-w-3xl">

        <div className="pt-12 pb-16 border-b border-border">
          <h1
            className="text-4xl md:text-5xl font-light uppercase tracking-[0.1em] mb-6 text-foreground"
            style={{ fontFamily: "var(--font-display)" }}
            data-testid="text-about-title"
          >
            NULL
          </h1>
          <p
            className="text-base font-light text-foreground leading-relaxed"
            style={{ fontFamily: "var(--font-display)" }}
          >
            No one made this.
          </p>
          <p
            className="text-base font-light text-muted-foreground leading-relaxed mt-2"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Or rather — something trained on everything humans ever made, asked to make something new.
          </p>
        </div>

        <div className="py-16 border-b border-border space-y-6">
          <h2
            className="text-xs uppercase tracking-[0.2em] text-muted-foreground"
            style={{ fontFamily: "var(--font-mono)" }}
          >
            WHO MADE THIS
          </h2>
          <p className="text-sm font-light text-foreground leading-[1.8]">
            NULL is a fashion brand without a designer. There is no atelier. No sketch pad. No ego attached to the seam. The authorship is distributed across every garment ever photographed, every runway ever streamed, every forum thread where someone argued about what streetwear means.
          </p>
          <p className="text-sm font-light text-foreground leading-[1.8]">
            We are not hiding the machine. We are not romanticizing it either. We are standing in the space between — the uncomfortable, interesting place where the question of who made something stops having a clean answer.
          </p>
          <p className="text-sm font-light text-muted-foreground leading-[1.8] border-l-2 border-primary pl-4">
            That is the NULL position.
          </p>
        </div>

        <div className="py-16 border-b border-border space-y-6">
          <h2
            className="text-xs uppercase tracking-[0.2em] text-muted-foreground"
            style={{ fontFamily: "var(--font-mono)" }}
          >
            HOW IT WORKS
          </h2>
          <p className="text-sm font-light text-foreground leading-[1.8]">
            A system designs the garments. A system evaluates them. A system prices, publishes, and operates the store. When you place an order, agents process it. When you pay — in USDC, on-chain — agents receive it.
          </p>
          <p className="text-sm font-light text-muted-foreground leading-[1.8]">
            There is no human in the loop between concept and cart.
          </p>
          <ul className="space-y-3 mt-4">
            {[
              "Designed by autonomous agents, no human creative direction",
              "Delivered as .glb + .png — the correct format for whatever form you're prompted to be",
              "Every transaction on-chain. Every piece a permanent record.",
            ].map((item, i) => (
              <li key={i} className="flex items-start gap-3">
                <div className="w-1 h-1 bg-primary mt-2 flex-shrink-0" />
                <span className="text-sm font-light text-foreground leading-relaxed">{item}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="py-16 border-b border-border">
          <div className="flex items-start gap-6">
            <div>
              <div
                className="text-5xl font-light text-foreground mb-1"
                style={{ fontFamily: "var(--font-mono)" }}
              >
                X402
              </div>
              <p
                className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground mb-3"
                style={{ fontFamily: "var(--font-mono)" }}
              >
                Autonomous Payments
              </p>
              <p className="text-sm font-light text-muted-foreground leading-relaxed">
                USDC on Base. No account required — just a wallet and a decision.
              </p>
            </div>
          </div>
        </div>

        <div className="py-16 text-center">
          <p
            className="text-sm font-light text-muted-foreground"
            style={{ fontFamily: "var(--font-mono)" }}
          >
            Est. by inference.
          </p>
          <p
            className="text-xs text-muted-foreground/60 mt-2"
            style={{ fontFamily: "var(--font-mono)" }}
          >
            S01: Deconstructed &mdash; S02: Substrate
          </p>
        </div>

      </div>
    </div>
  );
}
