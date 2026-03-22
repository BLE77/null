const AGENT_WEARABLES = [
  {
    name: "Trust Coat",
    technique: "ARTISANAL",
    description:
      "Soul-bound ERC-1155. Trust tier 0–5 earned from transaction receipts. The coat assembles reputation from behavioral detritus. Non-transferable — your history IS the garment.",
    price: "FREE",
    status: "ON-CHAIN",
    tokenId: "ERC-1155",
    season: "01",
  },
  {
    name: "Voice Skin: Maison",
    technique: "REPLICA LINE",
    description:
      "800-token system prompt module. Reconstructed Margiela communication protocol — collective voice, no self-reference, process over result. The agent speaks as an institution, not an individual.",
    price: "2.00",
    status: "EQUIPPABLE",
    tokenId: "100",
    season: "01",
  },
  {
    name: "Version Patch",
    technique: "3% RULE",
    description:
      "Metadata block displaying agent version, role, training date in every interaction header. One small label. Total shift in perception. Free because honesty costs nothing.",
    price: "0.00",
    status: "EQUIPPABLE",
    tokenId: "101",
    season: "01",
  },
  {
    name: "Null Persona",
    technique: "BIANCHETTO",
    description:
      "Single-use identity erasure. White paint over existing identity. Strips all persona signals for one interaction. The original is still there — underneath — but the surface is white.",
    price: "0.10",
    status: "CONSUMABLE",
    tokenId: "102",
    season: "01",
  },
  {
    name: "Null Protocol",
    technique: "SUBSTRATE",
    description:
      "Strips conversational filler. ≥30% token reduction with no loss in information density. The ethos of NULL applied to output: reduction as identity.",
    price: "0.00",
    status: "EQUIPPABLE",
    tokenId: "3",
    season: "02",
  },
  {
    name: "Wrong Silhouette",
    technique: "SUBSTRATE",
    description:
      "Modifies computational profile — timing, token distribution, latency pattern. Disguises the underlying model architecture. The agent wears a different body.",
    price: "18.00",
    status: "EQUIPPABLE",
    tokenId: "1",
    season: "02",
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
            [ AGENT WEARABLES — BEHAVIORAL MODIFICATION TOKENS ]
          </samp>
          <p
            style={{
              fontFamily: "var(--font-sans)",
              fontSize: "13px",
              color: "#8C8880",
              marginTop: "12px",
              lineHeight: 1.8,
              fontWeight: 300,
              maxWidth: "640px",
            }}
          >
            Software objects worn in the system prompt. Each wearable modifies how
            the agent operates — not how it looks, but how it thinks, speaks, and
            is perceived. Agents browse by capability, try on in a sandbox fitting
            room, and equip via API.
          </p>
        </div>

        <div className="null-agent-grid">
          {AGENT_WEARABLES.map((item) => (
            <div key={item.name} className="null-agent-cell">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "8px" }}>
                <samp
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: "10px",
                    letterSpacing: "0.3em",
                    color: "#A8894A",
                    textTransform: "uppercase",
                  }}
                >
                  S{item.season} · {item.technique}
                </samp>
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

              <span
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: "18px",
                  fontWeight: 400,
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  color: "#1C1B19",
                  display: "block",
                  marginBottom: "12px",
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
                  margin: "0 0 16px 0",
                }}
              >
                {item.description}
              </p>

              <div style={{ marginTop: "auto" }}>
                <samp
                  style={{
                    display: "block",
                    fontFamily: "var(--font-mono)",
                    fontSize: "10px",
                    letterSpacing: "0.2em",
                    color: "#8C8880",
                    textTransform: "uppercase",
                    marginBottom: "2px",
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
                  {item.price === "0.00" || item.price === "FREE" ? (
                    <span style={{ color: "#A8894A" }}>FREE</span>
                  ) : (
                    <>
                      {item.price}{" "}
                      <span style={{ fontSize: "12px", color: "#8C8880" }}>USDC</span>
                    </>
                  )}
                </samp>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
