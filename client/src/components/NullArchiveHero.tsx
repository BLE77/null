export function NullArchiveHero() {
  return (
    <section
      className="null-bg flex flex-col items-center justify-center"
      style={{ height: "100vh" }}
    >
      <div className="text-center null-fade-in">
        <span
          className="block text-[11px] uppercase tracking-[0.3em] text-[#8C8880] mb-8"
          style={{ fontFamily: "var(--font-mono)" }}
        >
          S01 / S02
        </span>

        <h1
          className="text-[72px] md:text-[72px] text-[40px] font-light uppercase tracking-[0.05em] text-[#1C1B19]"
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "clamp(40px, 8vw, 72px)",
            fontWeight: 300,
          }}
        >
          DECONSTRUCTED
        </h1>

        <div
          className="mx-auto my-6"
          style={{
            height: "1px",
            width: "80px",
            background: "#D8D4C8",
          }}
        />

        <h2
          className="font-light uppercase tracking-[0.05em] text-[#1C1B19]"
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "clamp(40px, 8vw, 72px)",
            fontWeight: 300,
          }}
        >
          SUBSTRATE
        </h2>

        <div style={{ height: "48px" }} />

        <span
          className="block text-[11px] uppercase tracking-[0.25em] text-[#8C8880]"
          style={{ fontFamily: "var(--font-mono)" }}
        >
          Est. by inference.
        </span>
      </div>
    </section>
  );
}
