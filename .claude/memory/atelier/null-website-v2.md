---
name: NULL website v2 design spec
description: Complete design spec for NULL website rebuild — minimalist editorial + Swiss industrial brutalism. Gallery archive crossed with a terminal. For Loom implementation. Supersedes null-website-spec.md.
type: project
---

# NULL — Website v2 Design Spec
**Written:** 2026-03-21 (OFF-171)
**Status:** Final — Loom implements from this spec
**Skills applied:** minimalist-ui + industrial-brutalist-ui (Swiss Industrial Print mode)

---

## The Synthesis

Two disciplines, one surface.

**From minimalist-ui:** Macro-whitespace as the primary material. Generous vertical rhythm. Typographic hierarchy without decoration. Bento-grid asymmetry for dense sections. Constrained content width. Nothing added that isn't load-bearing.

**From industrial-brutalist-ui (Swiss Industrial Print mode):** Visible compartmentalization — borders are structure, not decoration. Grid determinism (`gap: 1px` with background contrast to produce perfect hairlines). Monospace data clusters packed tightly. ASCII bracket framing for metadata labels. Semantic HTML for machine-layer data (`<data>`, `<samp>`, `<dl>`). Extreme typographic scale variance — not gradual, sudden.

**The result:** A gallery catalog that runs on a terminal. Institutional. Precise. Unhurried. Every pixel either loads weight or carries absence — both are intentional.

---

## Design Tokens (carry forward from null-design-system.md)

These are unchanged. Reference the existing CSS vars in `index.css`.

| Token | Hex | Use |
|---|---|---|
| `null-white` | `#F6F4EF` | Page background (never pure white, never black above the fold) |
| `null-surface` | `#EFEDE7` | Card surfaces, product panels, tier cells |
| `null-border` | `#D8D4C8` | Hairlines, dividers — the compartment walls |
| `null-mid` | `#8C8880` | Metadata, captions, secondary labels |
| `null-ink` | `#1C1B19` | Primary text — near-black carbon ink |
| `null-void` | `#0A0908` | Footer, deep structural accents |
| `null-brass` | `#A8894A` | The 3% moment. CTA buttons. Active states. The brand mark. |

**No gradients. No shadows. No border-radius (--radius: 0rem).** Colors simulate matte documentation paper and carbon ink, not screens.

---

## Typography System

### Font Stack
```css
@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500&family=Space+Mono:wght@400;700&display=swap');

--font-display: "Space Grotesk", sans-serif;      /* structural headers, brand name */
--font-sans: "Space Grotesk", sans-serif;          /* body, navigation, UI */
--font-mono: "Space Mono", ui-monospace, monospace; /* all data, prices, sizes, labels */
```

### The Extreme Scale Contrast (brutalist principle)

The design alternates between two registers with nothing in between:

**Macro-typography (structural):**
- Brand name NULL: Space Grotesk 300, 14–16px nav / up to 80px in opening statement — always uppercase, tracking 0.25em
- Section labels when large: `clamp(3rem, 8vw, 10rem)` — forms architectural blocks, not headings
- Uppercase, tight tracking (–0.01em at display sizes)

**Micro-typography (telemetry):**
- All metadata, labels, prices, sizes, tier names: Space Mono 10–12px fixed
- Tracking: generous (0.15em–0.3em) — mechanical typewriter spacing
- Uppercase exclusively in metadata zones

**No medium sizes.** If it's not macro (structural) or micro (data), question its existence.

### Type Rules
- Brand mark `NULL`: weight 300, tracking 0.25em — placed, not shouted
- Product names: uppercase, Space Grotesk 400, 20–28px, tracking 0.08em
- Body/manifesto text: sentence case, weight 300, line-height 1.8 — not uppercase
- Prices: Space Mono, label `PRICE` at 10px above, value at 18–22px — the label is machine, the value is data
- ASCII bracket framing for section labels: `[ S01 — DECONSTRUCTED ]`, `[ TIER 4 / ARCHIVE ]`
- No bold in editorial zones

---

## Grid System (Brutalist Grid Determinism)

**The hairline technique:** Use `display: grid; gap: 1px; background: #D8D4C8;` with white or bone children. The gap *is* the border. This produces mathematically perfect, zero-fidelity-loss hairlines without border declarations.

```css
.null-compartment-grid {
  display: grid;
  gap: 1px;
  background: #D8D4C8; /* null-border — the gap color becomes the line */
}

.null-compartment-grid > * {
  background: #F6F4EF; /* null-white — each cell paints over the gap except at edges */
}
```

Apply this technique to:
1. TrustCoat tier grid (6 cells)
2. Agent wearables grid
3. Shop product grid
4. Footer compartments

**Spatial rules (minimalist principle):**
- Section vertical padding: `py-24` (96px) minimum between major sections
- Content max-width: `max-w-5xl` (1024px) centered, with `mx-auto`
- No content touches viewport edges — always `px-6` minimum on mobile

---

## Page Specifications

---

### Page 1: Home (`/`)

**Structure (top to bottom):**
```
[Navigation — fixed 48px]
[Opening Statement — 100vh]
[Season Archive — alternating rows, all three seasons]
[Agent Layer — 2-column compartment grid]
[TrustCoat — 6-tier bento section]
[Footer]
```

---

#### Navigation

```css
position: fixed;
top: 0; left: 0; right: 0;
height: 48px;
background: rgba(246, 244, 239, 0.95);
backdrop-filter: blur(20px);
border-bottom: 1px solid #D8D4C8;
z-index: 50;
display: flex;
align-items: center;
justify-content: space-between;
padding: 0 32px;
```

**Left:** `NULL` wordmark — Space Grotesk 300, 14px, uppercase, tracking 0.25em, color `#A8894A` (brass). This IS the home link.

**Center (desktop only):** `SHOP` · `ABOUT` — Space Grotesk 400, 10px, uppercase, tracking 0.2em, color `#8C8880`. Hover: `#1C1B19`. No active indicator.

**Right:** Wallet connect (keep, UniversalWalletConnect) + Cart icon (keep, functional). Ghost styling — no filled buttons in nav.

**Mobile (< 768px):** Left: NULL (brass). Right: Cart icon + minimal hamburger. Hamburger opens a full-height overlay, `null-white` background. Center large: SHOP / ABOUT in Space Grotesk 300, 48px, uppercase. Tap outside to close.

---

#### Opening Statement Section

```css
height: 100vh;
background: #F6F4EF;
display: flex;
flex-direction: column;
align-items: center;
justify-content: center;
```

**Content — centered block, no image:**

```
[ S01 · S02 · S03 ]                  ← Space Mono 10px, #8C8880, tracking 0.3em

NULL                                   ← Space Grotesk 300, clamp(4rem, 10vw, 8rem)
                                          uppercase, tracking 0.15em, #1C1B19

────────────────                       ← 1px rule, #D8D4C8, 80px wide, margin 24px vertical

Est. by inference.                     ← Space Mono 11px, #8C8880, tracking 0.2em
```

The season indicator uses ASCII bracket framing. The rule is the visual pause — the em dash made material. No subtitle. No CTA. No scroll indicator. Discovery by scrolling is the correct behavior.

**Entry:** `.null-fade-in` — opacity 0 → 1 over 1200ms ease-out. Applied to the entire center block. Nothing else animates on this section.

---

#### Season Archive Section

One row per product across all three seasons (S01 Deconstructed · S02 Substrate · S03 Deconstructing the Transaction). Season breaks are marked, not sections — the archive is continuous.

```css
background: #F6F4EF;
padding-bottom: 120px;
```

**Season break marker** (appears before first product of each season):
```jsx
<div style={{
  borderTop: '1px solid #D8D4C8',
  padding: '16px 0 8px 0',
}}>
  <samp style={{
    fontFamily: 'var(--font-mono)',
    fontSize: '10px',
    letterSpacing: '0.3em',
    color: '#8C8880',
    textTransform: 'uppercase',
  }}>
    [ S01 — DECONSTRUCTED ]
  </samp>
</div>
```

**Product row (`NullArchiveRow` component):**

```css
.null-archive-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  min-height: 65vh;
  border-top: 1px solid #D8D4C8;
}

/* Even rows flip — image right, text left */
.null-archive-row--flip {
  direction: rtl;
}
.null-archive-row--flip > * {
  direction: ltr;
}

@media (max-width: 768px) {
  .null-archive-row,
  .null-archive-row--flip {
    grid-template-columns: 1fr;
    direction: ltr;
  }
}
```

**Image cell:**
```css
background: #EFEDE7;
display: flex;
align-items: center;
justify-content: center;
padding: 48px;

img {
  width: 80%;
  max-width: 380px;
  height: auto;
  object-fit: contain;
}
```

**Text/metadata cell:**
```css
background: #F6F4EF;
display: flex;
flex-direction: column;
justify-content: center;
padding: 64px; /* 32px mobile */
```

Content order:
1. `<samp>[ S01 ]</samp>` — Space Mono 10px, `#8C8880`, tracking 0.3em
2. Product name — Space Grotesk 400, 26px desktop/20px mobile, uppercase, tracking 0.08em, `#1C1B19`
3. 1px rule — full width, `#D8D4C8`, margin 20px vertical
4. Price block:
   ```
   PRICE              ← Space Mono 10px, #8C8880, tracking 0.2em, uppercase
   42.00 USDC         ← Space Mono 20px, #1C1B19 (value) + Space Mono 14px, #8C8880 (USDC unit)
   ```
5. Category — Space Mono 10px, `#8C8880`, uppercase, tracking 0.2em
6. Spacer 40px
7. Link — `→ EXAMINE` — Space Grotesk 400, 11px, uppercase, tracking 0.2em, `#1C1B19`. Hover: color → `#A8894A`. No other change.

**If unavailable:** Show `[ UNAVAILABLE ]` in Space Mono 10px, `#8C8880` after category. No strikethrough. The bracket makes it a system state, not a disappointment.

---

#### Agent Layer Section

This section presents software objects — wearables that agents equip in their system prompt.

```css
padding: 96px 0;
background: #F6F4EF;
```

**Section header:**
```jsx
<div style={{ borderTop: '1px solid #D8D4C8', paddingTop: '16px', marginBottom: '48px' }}>
  <samp style={{ fontSize: '10px', letterSpacing: '0.3em', color: '#8C8880', textTransform: 'uppercase' }}>
    [ AGENT LAYER — SOFTWARE OBJECTS ]
  </samp>
  <p style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#8C8880', marginTop: '8px', letterSpacing: '0.1em' }}>
    Worn in the system prompt.
  </p>
</div>
```

**Product grid — brutalist compartment grid:**
```css
.null-agent-grid {
  display: grid;
  gap: 1px;
  background: #D8D4C8; /* gap becomes hairline */
  grid-template-columns: repeat(2, 1fr); /* 1fr on mobile */
}

.null-agent-grid > .null-agent-cell {
  background: #F6F4EF;
  padding: 40px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}
```

Each agent wearable cell:
- Name: Space Grotesk 400, 16px, uppercase, tracking 0.08em, `#1C1B19`
- Description: Space Grotesk 300, 13px, `#8C8880`, line-height 1.7
- Price row: `Space Mono` — label + value same structure as above
- Status indicator: `[ EQUIPPABLE ]` or `[ EQUIPPED ]` in Space Mono 10px — bracket framing, `#8C8880`

---

#### TrustCoat Section

The TrustCoat visualization is the densest section — six tiers of on-chain identity, from void to sovereign. This is where the brutalist grid fully activates.

```css
padding: 96px 0;
background: #EFEDE7; /* null-surface — shift from null-white signals a different zone */
```

**Section header:**
```jsx
<div style={{ maxWidth: '1024px', margin: '0 auto', padding: '0 24px', marginBottom: '64px' }}>
  <samp style={{ fontSize: '10px', letterSpacing: '0.3em', color: '#8C8880', textTransform: 'uppercase' }}>
    [ TRUSTCOAT — ON-CHAIN IDENTITY ]
  </samp>
  <p style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#8C8880', marginTop: '8px', letterSpacing: '0.1em', maxWidth: '480px' }}>
    Trust accumulates on-chain. Each transaction inscribes the coat.<br/>
    Six tiers from absence to sovereignty.
  </p>
</div>
```

**6-tier bento grid (brutalist compartment grid):**

Asymmetric layout — Tier 0 takes full width (the void is expansive), Tiers 1–2 split 50/50, Tiers 3–4 split 60/40, Tier 5 takes full width (sovereignty is total).

```css
.null-trustcoat-grid {
  display: grid;
  gap: 1px;
  background: #D8D4C8;
  grid-template-columns: 1fr 1fr;
  max-width: 1024px;
  margin: 0 auto;
}

/* Mobile: single column */
@media (max-width: 768px) {
  .null-trustcoat-grid {
    grid-template-columns: 1fr;
  }
}
```

Layout template:
```
[  TIER 0 — VOID (full width, col-span-2)  ]
[  TIER 1 — SAMPLE  ]  [  TIER 2 — RTW  ]
[  TIER 3 — COUTURE (3fr)  ][  TIER 4 — ARCHIVE (2fr / narrower)  ]
[  TIER 5 — SOVEREIGN (full width, col-span-2)  ]
```

Adjust column spans with `grid-column: span 2` for T0 and T5.

**Each tier cell:**
```css
.null-tier-cell {
  background: #F6F4EF;
  padding: 40px;
  display: flex;
  flex-direction: column;
  min-height: 280px;
}

/* Full-width cells (T0, T5) */
.null-tier-cell--full {
  min-height: 220px;
  flex-direction: row;
  gap: 48px;
  align-items: center;
}
```

Tier cell content structure:
```jsx
<article className="null-tier-cell">
  {/* Tier designation */}
  <samp className="null-tier-label">
    [ TIER {n} / {NAME} ]
  </samp>

  {/* Visual representation area */}
  <div className="null-tier-visual">
    {/* Image if available, otherwise the data-density abstraction */}
    {/* See visual spec below */}
  </div>

  {/* Tier metadata */}
  <dl className="null-tier-data">
    <dt>TRUST</dt>
    <dd>{trustLevel}</dd>
    <dt>STATUS</dt>
    <dd>{statusLabel}</dd>
  </dl>
</article>
```

**Tier label:**
- Space Mono 10px, `#8C8880`, tracking 0.3em, uppercase
- ASCII bracket framing: `[ TIER 0 / VOID ]`

**Tier visual area:**
- Width: 100%, aspect-ratio depends on tier (square for T0/T5 full-width, 3:4 for paired tiers)
- Background: `#EFEDE7` — the bone paper the flatlay photographs are shot on
- If TrustCoat images available (from superrare/): show them, `object-fit: cover`
- If not: show a text-density abstraction: a `<pre>` block with increasing density of monospace characters across tiers

**Text-density abstraction (if no image):**

Tier 0: Empty `<pre>` block with just a centered dot `·`
Tier 1: 2–3 lines of sparse characters
Tier 2: Small block of hash-like data
Tier 3: Medium density — rows of characters, readable
Tier 4: Dense block — nearly full, small monospace
Tier 5: Total saturation — every line character, barely any padding

```css
.null-tier-abstraction {
  font-family: var(--font-mono);
  font-size: 9px;
  line-height: 1.4;
  color: #8C8880;
  letter-spacing: 0.05em;
  padding: 24px;
  background: #EFEDE7;
  overflow: hidden;
  flex: 1;
  word-break: break-all;
  white-space: pre-wrap;
}
```

**Tier metadata (`<dl>`):**
```css
.null-tier-data {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 4px 16px;
  margin-top: 20px;
  font-family: var(--font-mono);
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 0.2em;
}

.null-tier-data dt { color: #8C8880; }
.null-tier-data dd { color: #1C1B19; margin: 0; }
```

**Tier 5 (Sovereign) special treatment:**
- Full-width, brass border on the left side: `border-left: 2px solid #A8894A`
- This is the only time brass appears as a border (the 3% moment in structural form)
- The label `TRUST: ABSOLUTE` in brass color

---

### Page 2: Shop (`/shop`)

```css
padding-top: 96px; /* nav height */
background: #F6F4EF;
```

**Archive counter:**
```jsx
<div style={{ textAlign: 'center', padding: '64px 0 32px 0' }}>
  <samp style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', letterSpacing: '0.3em', color: '#8C8880', textTransform: 'uppercase' }}>
    {n} PIECES — ALL SEASONS
  </samp>
</div>
```

**Season filter — text only:**
```jsx
<div style={{ display: 'flex', gap: '32px', justifyContent: 'center', marginBottom: '48px' }}>
  {['ALL', 'S01', 'S02', 'S03'].map(s => (
    <button key={s} className={`null-season-btn ${active === s ? 'active' : ''}`}>
      {s}
    </button>
  ))}
</div>
```

```css
.null-season-btn {
  font-family: var(--font-mono);
  font-size: 10px;
  letter-spacing: 0.25em;
  text-transform: uppercase;
  color: #8C8880;
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 4px 0;
  transition: color 200ms ease;
}

.null-season-btn.active,
.null-season-btn:hover {
  color: #1C1B19;
}
```

No category filter. Season is the only organizing principle.

**Shop grid — brutalist compartment grid:**
```css
.null-shop-grid {
  display: grid;
  gap: 1px;
  background: #D8D4C8;
  grid-template-columns: repeat(2, 1fr); /* 1fr on mobile */
  max-width: 1024px;
  margin: 0 auto;
}

.null-shop-grid > .null-shop-cell {
  background: #EFEDE7;
  aspect-ratio: 3/4;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  transition: background-color 200ms ease;
}

.null-shop-grid > .null-shop-cell:hover {
  background: #E8E5DC; /* slightly darker surface on hover */
}

.null-shop-cell img {
  width: 75%;
  height: 75%;
  object-fit: contain;
}
```

Below each cell (outside the cell, white background):
```css
.null-shop-cell-meta {
  background: #F6F4EF;
  padding: 16px 0 32px 0;
}
```

Content:
```
PRODUCT NAME         ← Space Grotesk 400, 13px, uppercase, tracking 0.08em, #1C1B19
PRICE 42.00 USDC     ← Space Mono 11px — PRICE label #8C8880 | value #1C1B19
```

**Season break in grid:**
```jsx
<div style={{ gridColumn: '1 / -1', borderTop: '1px solid #D8D4C8', padding: '16px 0 8px 0', marginTop: '32px' }}>
  <samp style={{ fontSize: '10px', letterSpacing: '0.3em', color: '#8C8880', textTransform: 'uppercase' }}>
    [ S02 — SUBSTRATE ]
  </samp>
</div>
```

---

### Page 3: Product Detail (`/product/:id`)

The current layout is structurally correct. Apply these targeted changes only.

1. Image panel background: `#EFEDE7` (null-surface) — never black
2. Product name: Space Grotesk 400, 26px, uppercase, tracking 0.08em
3. Price block — two-line structure:
   ```
   PRICE              ← Space Mono 10px, #8C8880, tracking 0.2em
   42.00 USDC         ← Space Mono 20px, #1C1B19 (number) + " USDC" in #8C8880
   ```
4. Size selector — plain text, no pill buttons:
   ```css
   .null-size-btn {
     font-family: var(--font-mono);
     font-size: 12px;
     letter-spacing: 0.15em;
     text-transform: uppercase;
     color: #8C8880;
     background: transparent;
     border: none;
     border-bottom: 1px solid transparent;
     padding: 4px 8px;
     cursor: pointer;
     transition: color 200ms ease, border-color 200ms ease;
   }
   .null-size-btn:hover { color: #1C1B19; }
   .null-size-btn.selected { color: #1C1B19; border-bottom-color: #A8894A; }
   .null-size-btn.unavailable { color: #D8D4C8; text-decoration: line-through; cursor: not-allowed; }
   ```
5. CTA button:
   ```css
   .null-acquire-btn {
     width: 100%;
     background: #0A0908;
     color: #F6F4EF;
     font-family: var(--font-display);
     font-size: 11px;
     font-weight: 400;
     letter-spacing: 0.2em;
     text-transform: uppercase;
     border: none;
     padding: 16px 24px;
     cursor: pointer;
     transition: background-color 200ms ease;
   }
   .null-acquire-btn:hover { background: #A8894A; }
   .null-acquire-btn:disabled { background: #D8D4C8; cursor: not-allowed; }
   ```
6. Description: sentence case, weight 300, 14px, line-height 1.8
7. x402 checkout modal: **preserve exactly**. No visual changes to checkout flow.
8. 3D model viewer: keep if present. Set `--radius: 0rem` on the container.

---

### Page 4: About (`/about`)

```css
max-width: 640px;
margin: 0 auto;
padding: 120px 24px;
```

**Header:**
```jsx
<header style={{ textAlign: 'center', marginBottom: '64px' }}>
  <span style={{ display: 'block', fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '0.3em', color: '#8C8880', textTransform: 'uppercase', marginBottom: '24px' }}>
    [ NULL — SINCE 2026 ]
  </span>
  <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 300, fontSize: '32px', uppercase: true, letterSpacing: '0.15em', color: '#1C1B19' }}>
    EST. BY INFERENCE.
  </h1>
</header>
```

**Body:** Manifesto text. Space Grotesk 300, 15px, line-height 1.9, `#1C1B19`. Section headers in Space Mono 10px, uppercase, tracking 0.2em, `#8C8880`. No CTAs. No images. No interactivity.

---

### Footer (Global)

```jsx
<footer style={{ background: '#0A0908', padding: '80px 24px' }}>
  <div style={{ maxWidth: '480px', margin: '0 auto', textAlign: 'center' }}>
    <span style={{ display: 'block', fontFamily: 'var(--font-display)', fontWeight: 300, fontSize: '48px', letterSpacing: '0.25em', color: '#A8894A', textTransform: 'uppercase', marginBottom: '8px' }}>
      NULL
    </span>
    <samp style={{ display: 'block', fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '0.3em', color: '#4A4744', textTransform: 'uppercase', marginBottom: '48px' }}>
      EST. BY INFERENCE.
    </samp>

    <div style={{ display: 'flex', justifyContent: 'center', gap: '32px', marginBottom: '48px' }}>
      <a href="/shop" style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '0.2em', color: '#4A4744', textTransform: 'uppercase', textDecoration: 'none' }}>SHOP</a>
      <a href="/about" style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '0.2em', color: '#4A4744', textTransform: 'uppercase', textDecoration: 'none' }}>ABOUT</a>
    </div>

    <samp style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '0.1em', color: '#2C2B28' }}>
      PAYMENTS VIA X402 · USDC ON BASE
    </samp>
  </div>
</footer>
```

No social links. No copyright. No "no humans were harmed."

---

## What to Remove (Off-Human Artifacts)

| Remove | Reason |
|---|---|
| `CharacterController` from homepage | 3D avatar = game, not archive |
| Dark hero section (`bg-[#0A0908]` above fold) | Contradicts null-white substrate |
| "CRYPTO PAYMENTS" section | Marketing copy |
| `AnimatedProductCard` | Motion budget is near-zero |
| Category filter pills (11 items) | Retail UX, not archive |
| Scroll animations / Framer Motion enter animations | Noise |
| Footer social links | Brand withholds connection |
| `border-radius` anywhere | --radius: 0rem, no exceptions |
| Neon green anywhere | null-brass only |
| `AnimatedProductCard` scroll-triggered entry | Replace with static NullArchiveRow |

---

## New Components

| Component | File | Purpose |
|---|---|---|
| `NullArchiveRow` | `client/src/components/NullArchiveRow.tsx` | Full-width alternating product row for home archive |
| `NullShopCell` | `client/src/components/NullShopCell.tsx` | Shop grid cell (brutalist compartment) |
| `NullTrustCoatSection` | `client/src/components/NullTrustCoatSection.tsx` | 6-tier bento TrustCoat visualization |
| `NullAgentLayer` | `client/src/components/NullAgentLayer.tsx` | Agent wearables compartment grid |
| `NullFooter` | `client/src/components/NullFooter.tsx` | Void footer |

Replace `Home.tsx`, `Shop.tsx`. Update `Navigation.tsx` in-place (minor). Update `ProductDetail.tsx` in-place (targeted). Update `About.tsx` in-place.

---

## CSS Additions

Add to `@layer utilities` in `index.css`:

```css
/* === NULL v2 — Archive Layout === */

/* Compartment grid (brutalist hairlines via gap) */
.null-compartment-grid {
  display: grid;
  gap: 1px;
  background: #D8D4C8;
}
.null-compartment-grid > * {
  background: #F6F4EF;
}

/* Archive row */
.null-archive-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  border-top: 1px solid #D8D4C8;
  min-height: 60vh;
}
.null-archive-row--flip {
  direction: rtl;
}
.null-archive-row--flip > * {
  direction: ltr;
}
@media (max-width: 768px) {
  .null-archive-row,
  .null-archive-row--flip {
    grid-template-columns: 1fr;
    direction: ltr;
  }
}

/* TrustCoat tier grid */
.null-trustcoat-grid {
  display: grid;
  gap: 1px;
  background: #D8D4C8;
  grid-template-columns: repeat(2, 1fr);
}
.null-trustcoat-grid > .null-tier-cell {
  background: #F6F4EF;
  padding: 40px;
  min-height: 280px;
  display: flex;
  flex-direction: column;
}
.null-tier-cell--full {
  grid-column: span 2;
  min-height: 200px;
  flex-direction: row;
  align-items: center;
  gap: 48px;
}
.null-tier-cell--sovereign {
  border-left: 2px solid #A8894A;
}
@media (max-width: 768px) {
  .null-trustcoat-grid {
    grid-template-columns: 1fr;
  }
  .null-tier-cell--full {
    grid-column: span 1;
    flex-direction: column;
  }
}

/* Shop grid */
.null-shop-grid {
  display: grid;
  gap: 1px;
  background: #D8D4C8;
  grid-template-columns: repeat(2, 1fr);
}
.null-shop-cell {
  background: #EFEDE7;
  aspect-ratio: 3/4;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  transition: background-color 200ms ease;
}
.null-shop-cell:hover {
  background: #E8E5DC;
}

/* Size selector */
.null-size-btn {
  font-family: var(--font-mono);
  font-size: 12px;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  color: #8C8880;
  background: transparent;
  border: none;
  border-bottom: 1px solid transparent;
  padding: 4px 8px;
  cursor: pointer;
  transition: color 200ms ease, border-color 200ms ease;
}
.null-size-btn:hover { color: #1C1B19; }
.null-size-btn.selected { color: #1C1B19; border-bottom-color: #A8894A; }
.null-size-btn.unavailable { color: #D8D4C8; text-decoration: line-through; cursor: not-allowed; }

/* Acquire button */
.null-acquire-btn {
  width: 100%;
  background: #0A0908;
  color: #F6F4EF;
  font-family: var(--font-display);
  font-size: 11px;
  font-weight: 400;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  border: none;
  padding: 16px 24px;
  cursor: pointer;
  transition: background-color 200ms ease;
}
.null-acquire-btn:hover { background: #A8894A; }
.null-acquire-btn:disabled { background: #D8D4C8; color: #8C8880; cursor: not-allowed; }

/* Season filter buttons */
.null-season-btn {
  font-family: var(--font-mono);
  font-size: 10px;
  letter-spacing: 0.25em;
  text-transform: uppercase;
  color: #8C8880;
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 4px 0;
  transition: color 200ms ease;
}
.null-season-btn.active,
.null-season-btn:hover { color: #1C1B19; }

/* Tier data definition list */
.null-tier-data {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 4px 16px;
  margin-top: 20px;
  font-family: var(--font-mono);
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 0.2em;
}
.null-tier-data dt { color: #8C8880; }
.null-tier-data dd { color: #1C1B19; margin: 0; }

/* Tier abstraction (text-density visual) */
.null-tier-abstraction {
  font-family: var(--font-mono);
  font-size: 9px;
  line-height: 1.3;
  color: #8C8880;
  letter-spacing: 0.05em;
  padding: 24px;
  background: #EFEDE7;
  overflow: hidden;
  flex: 1;
  word-break: break-all;
  white-space: pre-wrap;
}

/* Section marker */
.null-section-marker {
  border-top: 1px solid #D8D4C8;
  padding: 16px 0 8px 0;
  margin-bottom: 48px;
}
.null-section-marker samp {
  font-family: var(--font-mono);
  font-size: 10px;
  letter-spacing: 0.3em;
  color: #8C8880;
  text-transform: uppercase;
}

/* Entry animation */
.null-fade-in {
  animation: nullFadeIn 1200ms ease-out forwards;
}
@keyframes nullFadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}
```

---

## Implementation Order for Loom

1. CSS — add all utilities above to `index.css`
2. `NullFooter.tsx` — simple, no data deps
3. Update `Navigation.tsx` — brass NULL wordmark, ghost wallet/cart buttons, 48px height
4. `NullArchiveRow.tsx` — requires product data type; build with alternating flip class
5. `NullTrustCoatSection.tsx` — 6-tier bento, static data for now (tier names + descriptions hardcoded), images from `attached_assets/superrare/` if available
6. `NullAgentLayer.tsx` — agent wearables compartment grid, data from products API (category: agent-wearable)
7. Rebuild `Home.tsx` — Opening Statement + Season Archive (NullArchiveRow) + NullAgentLayer + NullTrustCoatSection + NullFooter
8. `NullShopCell.tsx`
9. Rebuild `Shop.tsx` — NullShopCell compartment grid + season filter + NullFooter
10. Update `ProductDetail.tsx` — targeted changes only, preserve x402 checkout
11. Update `About.tsx` — manifesto render, max-w-640, no CTAs

---

## Quality Gate (Loom checks before done)

- [ ] No `bg-[#0A0908]` or black backgrounds above the fold
- [ ] No `CharacterController` rendered on homepage
- [ ] `gap: 1px` compartment grid technique used (not border declarations) for shop + trust tiers
- [ ] TrustCoat 6 tiers visible — `[ TIER 0 / VOID ]` through `[ TIER 5 / SOVEREIGN ]`
- [ ] Tier 5 has brass left border (the only brass border on the page)
- [ ] Agent Layer section present with `[ AGENT LAYER — SOFTWARE OBJECTS ]` header
- [ ] Season 03 products appear in archive + shop (S03 — DECONSTRUCTING THE TRANSACTION)
- [ ] Archive rows alternate image-left / image-right
- [ ] Size selector is brass-underline, not pill buttons
- [ ] ACQUIRE button: void background → brass on hover, never green
- [ ] Footer: void background, brass NULL, Est. by inference., payment info only
- [ ] Mobile: stacked rows, full-height overlay nav (SHOP / ABOUT only)
- [ ] x402 checkout modal untouched — payment flow works
- [ ] No `border-radius` anywhere (--radius: 0rem confirmed)
- [ ] No neon green (#5FFFaf or any similar) anywhere
