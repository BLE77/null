export default function About() {
  return (
    <div className="min-h-screen pt-24 pb-12">
      <div className="container mx-auto px-4 max-w-4xl">
        <h1 
          className="text-5xl md:text-7xl font-bold uppercase tracking-wider mb-8"
          style={{ fontFamily: "'Bebas Neue', sans-serif" }}
          data-testid="text-about-title"
        >
          About Us
        </h1>

        <div className="space-y-12">
          <section>
            <div className="aspect-video bg-muted rounded-md mb-6 flex items-center justify-center text-xs text-muted-foreground grain-overlay">
              BRAND-STORY-IMG-2
            </div>
            <p className="text-lg text-muted-foreground leading-relaxed">
              We're a Y2K-inspired streetwear brand built for the crypto generation. Our designs blend
              nostalgic early 2000s aesthetics with modern technology, creating unique pieces that
              bridge the digital and physical worlds.
            </p>
          </section>

          <section className="grid md:grid-cols-2 gap-8">
            <div>
              <h2 
                className="text-3xl font-bold uppercase tracking-wider mb-4"
                style={{ fontFamily: "'Teko', sans-serif" }}
              >
                Our Mission
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                To create clothing that represents the intersection of nostalgic design and
                cutting-edge payment technology. Every piece tells a story of the digital age.
              </p>
            </div>
            <div>
              <h2 
                className="text-3xl font-bold uppercase tracking-wider mb-4"
                style={{ fontFamily: "'Teko', sans-serif" }}
              >
                Why Crypto?
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                We accept cryptocurrency payments because we believe in the future of decentralized
                finance. Fast, secure, and borderless transactions for a global community.
              </p>
            </div>
          </section>

          <section className="bg-card border border-border rounded-md p-8">
            <h2 
              className="text-3xl font-bold uppercase tracking-wider mb-6"
              style={{ fontFamily: "'Teko', sans-serif" }}
            >
              Sustainability
            </h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              All our garments are produced using sustainable materials and ethical manufacturing
              practices. We're committed to reducing our environmental impact while delivering
              high-quality streetwear.
            </p>
            <ul className="space-y-2 text-muted-foreground">
              <li>• Organic cotton and recycled materials</li>
              <li>• Fair labor practices</li>
              <li>• Carbon-neutral shipping</li>
              <li>• Minimal packaging waste</li>
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}
