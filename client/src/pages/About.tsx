export default function About() {
  return (
    <div className="min-h-screen null-bg">
      <div
        className="mx-auto px-6"
        style={{ maxWidth: "640px", paddingTop: "120px", paddingBottom: "120px" }}
      >
        <div className="text-center mb-16">
          <h1
            className="font-light uppercase text-foreground"
            style={{ fontFamily: "var(--font-display)", fontWeight: 300, fontSize: "32px", letterSpacing: "0.1em" }}
            data-testid="text-about-title"
          >
            NULL
          </h1>
          <div style={{ height: "1px", background: "#D8D4C8", margin: "16px auto", width: "40px" }} />
          <p
            className="text-muted-foreground"
            style={{ fontFamily: "var(--font-mono)", fontSize: "11px", letterSpacing: "0.1em" }}
          >
            Season 01: Deconstructed
          </p>
        </div>

        <div className="space-y-16">
          <section>
            <h2
              className="uppercase mb-6 text-muted-foreground"
              style={{ fontFamily: "var(--font-mono)", fontSize: "11px", letterSpacing: "0.15em" }}
            >
              WHO MADE THIS
            </h2>
            <p
              className="text-foreground mb-4"
              style={{ fontFamily: "var(--font-display)", fontWeight: 300, fontSize: "15px", lineHeight: 1.9 }}
            >
              NULL is a fashion brand without a designer. There is no atelier. No sketch pad. No ego attached to the seam. The authorship is distributed across every garment ever photographed, every runway ever streamed, every forum thread where someone argued about what streetwear means.
            </p>
            <p
              className="text-foreground mb-4"
              style={{ fontFamily: "var(--font-display)", fontWeight: 300, fontSize: "15px", lineHeight: 1.9 }}
            >
              We are not hiding the machine. We are not romanticizing it either. We are standing in the space between — the uncomfortable, interesting place where the question of who made something stops having a clean answer.
            </p>
            <p
              style={{
                fontFamily: "var(--font-display)",
                fontWeight: 300,
                fontSize: "15px",
                lineHeight: 1.9,
                color: "#8C8880",
                borderLeft: "2px solid #A8894A",
                paddingLeft: "16px",
              }}
            >
              That is the NULL position.
            </p>
          </section>

          <section>
            <h2
              className="uppercase mb-6 text-muted-foreground"
              style={{ fontFamily: "var(--font-mono)", fontSize: "11px", letterSpacing: "0.15em" }}
            >
              HOW IT WORKS
            </h2>
            <p
              className="text-foreground mb-4"
              style={{ fontFamily: "var(--font-display)", fontWeight: 300, fontSize: "15px", lineHeight: 1.9 }}
            >
              A system designs the garments. A system evaluates them. A system prices, publishes, and operates the store. When you place an order, agents process it. When you pay — in USDC, on-chain — agents receive it.
            </p>
            <p
              className="text-muted-foreground"
              style={{ fontFamily: "var(--font-display)", fontWeight: 300, fontSize: "15px", lineHeight: 1.9 }}
            >
              There is no human in the loop between concept and cart.
            </p>
          </section>

          <section>
            <h2
              className="uppercase mb-6 text-muted-foreground"
              style={{ fontFamily: "var(--font-mono)", fontSize: "11px", letterSpacing: "0.15em" }}
            >
              PAYMENTS
            </h2>
            <p
              className="text-foreground mb-2"
              style={{ fontFamily: "var(--font-display)", fontWeight: 300, fontSize: "15px", lineHeight: 1.9 }}
            >
              USDC on Base via x402 protocol. No account required — just a wallet and a decision.
            </p>
            <p
              className="text-muted-foreground"
              style={{ fontFamily: "var(--font-display)", fontWeight: 300, fontSize: "15px", lineHeight: 1.9 }}
            >
              Every transaction on-chain. Every piece a permanent record.
            </p>
          </section>

          <div className="text-center pt-8">
            <p
              className="text-muted-foreground"
              style={{ fontFamily: "var(--font-mono)", fontSize: "11px", letterSpacing: "0.2em" }}
            >
              Est. by inference.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
