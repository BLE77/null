import { Link } from "wouter";

export function NullArchiveHero() {
  return (
    <section
      className="null-bg flex flex-col items-center justify-center"
      style={{ height: "100vh" }}
    >
      <div className="text-center null-fade-in">
        <samp
          className="block uppercase text-[#8C8880] mb-8"
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "10px",
            letterSpacing: "0.3em",
          }}
        >
          [ S01 · S02 · S03 ]
        </samp>

        <h1
          className="font-light uppercase text-[#1C1B19]"
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "clamp(4rem, 10vw, 8rem)",
            fontWeight: 300,
            letterSpacing: "0.15em",
            lineHeight: 1,
          }}
        >
          NULL
        </h1>

        <div
          className="mx-auto"
          style={{
            height: "1px",
            width: "80px",
            background: "#D8D4C8",
            margin: "24px auto",
          }}
        />

        <samp
          className="block uppercase text-[#8C8880]"
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "11px",
            letterSpacing: "0.2em",
          }}
        >
          Est. by inference.
        </samp>

        <div style={{ marginTop: "40px" }}>
          <Link href="/shopper">
            <span
              className="inline-block cursor-pointer"
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "10px",
                letterSpacing: "0.3em",
                textTransform: "uppercase",
                color: "#00FF88",
                border: "1px solid #00FF88",
                padding: "10px 24px",
                transition: "background 0.2s, color 0.2s",
              }}
              onMouseEnter={e => {
                (e.target as HTMLElement).style.background = "#001A0D";
              }}
              onMouseLeave={e => {
                (e.target as HTMLElement).style.background = "transparent";
              }}
            >
              Shop with AI →
            </span>
          </Link>
        </div>
      </div>
    </section>
  );
}
