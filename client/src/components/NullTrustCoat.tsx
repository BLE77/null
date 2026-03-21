const TIERS = [
  {
    n: 0,
    name: "VOID",
    trust: "ABSENT",
    status: "NO TRANSACTIONS",
    span: 2,
    abstraction: "·",
    rows: 1,
  },
  {
    n: 1,
    name: "SAMPLE",
    trust: "PENDING",
    status: "1–4 TXS",
    span: 1,
    abstraction: "0x · · ·\n· · 0x ·",
    rows: 2,
  },
  {
    n: 2,
    name: "RTW",
    trust: "ESTABLISHED",
    status: "5–19 TXS",
    span: 1,
    abstraction: "a3f · 0x2b\n· d7 · · c1\n8e · · 4a ·",
    rows: 3,
  },
  {
    n: 3,
    name: "COUTURE",
    trust: "CONFIRMED",
    status: "20–99 TXS",
    span: 1,
    abstraction:
      "0x4a7f · 2c3d · 8e9f\n1b2a · 5c6d · 7e8f\n· 9a0b · 1c2d · 3e\n4f5a · 6b7c · 8d9e",
    rows: 4,
  },
  {
    n: 4,
    name: "ARCHIVE",
    trust: "EXTENDED",
    status: "100–499 TXS",
    span: 1,
    abstraction:
      "0x4a7f2c3d8e9f1b2a\n5c6d7e8f9a0b1c2d\n3e4f5a6b7c8d9e0f\n1a2b3c4d5e6f7a8b\n9c0d1e2f3a4b5c6d",
    rows: 5,
  },
  {
    n: 5,
    name: "SOVEREIGN",
    trust: "COMPLETE",
    status: "500+ TXS",
    span: 2,
    abstraction:
      "0x4a7f2c3d8e9f1b2a5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b\n9c0d1e2f3a4b5c6d7e8f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c\n1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d\n2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e",
    rows: 4,
  },
];

function TierAbstraction({ text }: { text: string }) {
  return (
    <pre className="null-tier-abstraction">
      {text}
    </pre>
  );
}

export function NullTrustCoat() {
  return (
    <section style={{ padding: "96px 0", background: "#EFEDE7" }}>
      <div
        style={{ maxWidth: "1024px", margin: "0 auto", padding: "0 24px", marginBottom: "64px" }}
      >
        <div style={{ borderTop: "1px solid #D8D4C8", paddingTop: "16px" }}>
          <samp
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "10px",
              letterSpacing: "0.3em",
              color: "#8C8880",
              textTransform: "uppercase",
            }}
          >
            [ TRUSTCOAT — ON-CHAIN IDENTITY ]
          </samp>
          <p
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "11px",
              color: "#8C8880",
              marginTop: "8px",
              letterSpacing: "0.1em",
              maxWidth: "480px",
            }}
          >
            Trust accumulates on-chain. Each transaction inscribes the coat.
            <br />
            Six tiers from absence to sovereignty.
          </p>
        </div>
      </div>

      <div style={{ maxWidth: "1024px", margin: "0 auto", padding: "0 24px" }}>
        <div className="null-trustcoat-grid">
          {TIERS.map((tier) => (
            <article
              key={tier.n}
              className={`null-tier-cell${tier.span === 2 ? " null-tier-cell--full" : ""}`}
              style={tier.span === 2 ? { gridColumn: "span 2" } : undefined}
            >
              <samp
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "10px",
                  letterSpacing: "0.3em",
                  color: "#8C8880",
                  textTransform: "uppercase",
                  flexShrink: 0,
                }}
              >
                [ TIER {tier.n} / {tier.name} ]
              </samp>

              <div
                className="null-tier-visual"
                style={
                  tier.span === 2
                    ? { flex: 1, display: "flex", alignItems: "center" }
                    : {}
                }
              >
                <TierAbstraction text={tier.abstraction} />
              </div>

              <dl className="null-tier-data">
                <dt>TRUST</dt>
                <dd>{tier.trust}</dd>
                <dt>STATUS</dt>
                <dd>{tier.status}</dd>
              </dl>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
