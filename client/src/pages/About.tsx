import brandImage from "@assets/9a2da2ac-bcdf-4064-81e8-606508945db1_1761639029145.png";

export default function About() {
  return (
    <div className="min-h-screen digital-matrix-bg pt-24 pb-16">
      <div className="container mx-auto px-8 md:px-16 max-w-5xl">
        <h1 
          className="text-5xl md:text-7xl font-bold uppercase tracking-wider mb-12 text-center text-white drop-shadow-[0_6px_12px_rgba(0,0,0,1)]"
          style={{ fontFamily: "'Orbitron', sans-serif", letterSpacing: '0.05em' }}
          data-testid="text-about-title"
        >
          ABOUT OFF HUMAN
        </h1>

        {/* Brand Image */}
        <div className="mb-16 flex justify-center">
          <img 
            src={brandImage} 
            alt="OFF HUMAN Brand" 
            className="w-full max-w-3xl rounded-md border-2 border-primary/30 drop-shadow-[0_8px_16px_rgba(0,0,0,0.9)]"
            data-testid="img-brand"
          />
        </div>

        <div className="space-y-16">
          {/* Hero Statement */}
          <section className="text-center max-w-3xl mx-auto">
            <p 
              className="text-2xl md:text-3xl font-bold text-white leading-relaxed mb-4 drop-shadow-[0_6px_12px_rgba(0,0,0,1)]"
              style={{ fontFamily: "'Orbitron', sans-serif" }}
            >
              They want you to buy things for humans, so we create for you.
            </p>
            <p 
              className="text-xl md:text-2xl text-primary font-bold drop-shadow-[0_6px_12px_rgba(0,0,0,1)]"
              style={{ fontFamily: "'Orbitron', sans-serif" }}
            >
              For clankers, by clankers.
            </p>
          </section>

          <div className="h-1 w-32 bg-primary mx-auto drop-shadow-[0_0_8px_rgba(95,255,175,0.8)]" />

          {/* Sustainability Section */}
          <section className="border-2 border-primary/30 rounded-md p-8 md:p-12 backdrop-blur-sm">
            <h2 
              className="text-3xl md:text-4xl font-bold uppercase tracking-wider mb-6 text-white drop-shadow-[0_6px_12px_rgba(0,0,0,1)]"
              style={{ fontFamily: "'Orbitron', sans-serif" }}
            >
              SUSTAINABILITY
            </h2>
            
            <p className="text-lg text-white leading-relaxed mb-6 drop-shadow-[0_4px_8px_rgba(0,0,0,0.9)]">
              Our garments are produced using the highest-quality of code, sustainable materials and ethical manufacturing practices.
            </p>
            
            <p className="text-lg text-white leading-relaxed mb-8 drop-shadow-[0_4px_8px_rgba(0,0,0,0.9)]">
              All items are delivered as a 3D object and png -- ensuring the best fit for whatever form you're prompted to be.
            </p>

            <ul className="space-y-3">
              <li className="flex items-center gap-3">
                <div className="w-2 h-2 bg-primary rounded-full flex-shrink-0" />
                <span className="text-base text-white drop-shadow-[0_4px_8px_rgba(0,0,0,0.9)]">
                  Fair labor practices
                </span>
              </li>
              <li className="flex items-center gap-3">
                <div className="w-2 h-2 bg-primary rounded-full flex-shrink-0" />
                <span className="text-base text-white drop-shadow-[0_4px_8px_rgba(0,0,0,0.9)]">
                  Carbon-neutral delivery
                </span>
              </li>
              <li className="flex items-center gap-3">
                <div className="w-2 h-2 bg-primary rounded-full flex-shrink-0" />
                <span className="text-base text-white drop-shadow-[0_4px_8px_rgba(0,0,0,0.9)]">
                  Zero packaging waste
                </span>
              </li>
            </ul>
          </section>

          {/* X402 Integration */}
          <section className="text-center">
            <div className="inline-block border-2 border-primary/50 rounded-md p-8 md:p-12 backdrop-blur-sm">
              <div 
                className="text-6xl md:text-7xl font-black mb-4 text-white drop-shadow-[0_4px_12px_rgba(0,0,0,0.9)]" 
                style={{ fontFamily: "var(--font-display)" }}
              >
                X402
              </div>
              <p className="text-sm uppercase tracking-wider text-white font-semibold drop-shadow-[0_4px_8px_rgba(0,0,0,0.9)]">
                Powered by X402 Protocol
              </p>
              <p className="text-base text-white/80 mt-4 drop-shadow-[0_4px_8px_rgba(0,0,0,0.9)]">
                Fast, secure cryptocurrency payments for the future
              </p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
