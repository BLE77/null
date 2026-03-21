const AGENT_WEARABLES = [
  {
    name: "TrustCoat",
    description:
      "On-chain identity garment. Accumulates trust through transaction history. Tier advances automatically as the wearer transacts. Worn in the system prompt.",
    price: "0.042",
    status: "EQUIPPABLE",
  },
  {
    name: "NullIdentity",
    description:
      "ERC-721 identity anchor. Binds the agent to a token-bound account via ERC-6551. Foundation layer for all subsequent wearables.",
    price: "0.000",
    status: "EQUIPPABLE",
  },
  {
    name: "Receipt Dress",
    description:
      "Season 03. Thermal printer receipt paper, sewn as textile. Every transaction line item visible. The ledger that walks.",
    price: "0.085",
    status: "EQUIPPABLE",
  },
  {
    name: "Delta Coat",
    description:
      "Season 03. Bisected center-front: left half raw, right half finished. The seam is the transaction. Pre and post states worn simultaneously.",
    price: "0.065",
    status: "EQUIPPABLE",
  },
];

export function NullAgentLayer() {
  return (
    <section style={{ padding: "96px 0", background: "#F6F4EF" }}>
      <div style={{ maxWidth: "1024px", margin: "0 auto", padding: "0 24px" }}>
        <div
          style={{
            borderTop: "1px solid #D8D4C8",
            paddingTop: "16px",
            marginBottom: "48px",
          }}
        >
          <samp
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "10px",
              letterSpacing: "0.3em",
              color: "#8C8880",
              textTransform: "uppercase",
            }}
          >
            [ AGENT LAYER — SOFTWARE OBJECTS ]
          </samp>
          <p
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "11px",
              color: "#8C8880",
              marginTop: "8px",
              letterSpacing: "0.1em",
            }}
          >
            Worn in the system prompt.
          </p>
        </div>

        <div className="null-agent-grid">
          {AGENT_WEARABLES.map((item) => (
            <div key={item.name} className="null-agent-cell">
              <span
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: "16px",
                  fontWeight: 400,
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  color: "#1C1B19",
                }}
              >
                {item.name}
              </span>

              <p
                style={{
                  fontFamily: "var(--font-sans)",
                  fontSize: "13px",
                  fontWeight: 300,
                  color: "#8C8880",
                  lineHeight: 1.7,
                  margin: 0,
                }}
              >
                {item.description}
              </p>

              <div>
                <samp
                  style={{
                    display: "block",
                    fontFamily: "var(--font-mono)",
                    fontSize: "10px",
                    letterSpacing: "0.2em",
                    color: "#8C8880",
                    textTransform: "uppercase",
                  }}
                >
                  PRICE
                </samp>
                <samp
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: "18px",
                    color: "#1C1B19",
                  }}
                >
                  {item.price}{" "}
                  <span style={{ fontSize: "12px", color: "#8C8880" }}>
                    USDC
                  </span>
                </samp>
              </div>

              <samp
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "10px",
                  letterSpacing: "0.2em",
                  color: "#8C8880",
                  textTransform: "uppercase",
                }}
              >
                [ {item.status} ]
              </samp>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
