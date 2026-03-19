---
name: NULL design system
description: Complete visual identity system for the NULL label — colors, typography, layout, animation, and implementation spec for Loom
type: project
---

# NULL — Design System

**Designed:** 2026-03-19 (OFF-93)
**Status:** Final — ready for Loom implementation

---

## The Visual Premise

NULL is a computer science primitive: the absence of a value. Not zero (which is a value), but the absence of value itself. The website must feel like that — a space where something *should* be but isn't. Where the structure is present but the warmth is withheld.

**Reference touchstone:** Maison Martin Margiela's exhibition catalogs. Text on white. Space that reads as decision, not emptiness. The label stitched inside the garment that you only see when you take it off.

**What we are departing from (Off-Human DNA — do not carry forward):**
- Neon green (#5FFFaf) — that was Off-Human's accent, not NULL's
- Glitch effects, RGB splits, scanlines
- Orbitron / NCLRekron — too game-digital, too personal
- Dark background (#000 or #0A0A0A) as default
- Y2K terminal aesthetic
- Matrix grid overlays

---

## Color System

NULL is near-monochrome. The palette reads like a document, not a poster.

### Core Palette

| Token | Hex | HSL | Use |
|---|---|---|---|
| `null-white` | `#F6F4EF` | `43 20% 95%` | Page background — aged paper, not digital white |
| `null-surface` | `#EFEDE7` | `43 17% 92%` | Card backgrounds, product panels |
| `null-border` | `#D8D4C8` | `43 14% 82%` | Dividers, hairlines, form fields |
| `null-mid` | `#8C8880` | `38 5% 52%` | Captions, secondary text, labels |
| `null-ink` | `#1C1B19` | `40 4% 10%` | Primary text — near-black, not pure black |
| `null-void` | `#0A0908` | `30 5% 4%` | Deep blacks, footers, the NAV when over images |
| `null-brass` | `#A8894A` | `40 38% 47%` | **The only accent.** CTA buttons, active states, the 3% moment. Named for garment label metal — the snap, the eyelet, the rivet |

### The 3% Rule Applied to Color

The entire site is near-monochrome. `null-brass` appears only:
1. Primary CTA button (Buy, Add to Cart, Checkout)
2. Active navigation indicator
3. The brand mark in the nav

It should surprise slightly each time it appears. That's the gesture.

### CSS Custom Properties (for Loom)

```css
:root {
  /* NULL Design System — replace current Off-Human vars */
  --background: 43 20% 95%;          /* null-white */
  --foreground: 40 4% 10%;           /* null-ink */

  --primary: 40 38% 47%;             /* null-brass */
  --primary-foreground: 43 20% 95%;  /* null-white */

  --secondary: 43 17% 92%;           /* null-surface */
  --secondary-foreground: 40 4% 10%;

  --muted: 43 14% 82%;               /* null-border */
  --muted-foreground: 38 5% 52%;     /* null-mid */

  --accent: 40 38% 47%;              /* null-brass — same as primary */
  --accent-foreground: 43 20% 95%;

  --card: 43 17% 92%;                /* null-surface */
  --card-foreground: 40 4% 10%;
  --card-border: 43 14% 82%;

  --border: 43 14% 82%;
  --input: 43 17% 92%;
  --ring: 40 38% 47%;                /* brass focus ring */

  --destructive: 0 72% 45%;
  --destructive-foreground: 43 20% 95%;

  --popover: 43 17% 92%;
  --popover-foreground: 40 4% 10%;
  --popover-border: 43 14% 82%;

  --sidebar: 43 20% 95%;
  --sidebar-foreground: 40 4% 10%;
  --sidebar-border: 43 14% 82%;
  --sidebar-primary: 40 38% 47%;
  --sidebar-primary-foreground: 43 20% 95%;
  --sidebar-accent: 43 17% 92%;
  --sidebar-accent-foreground: 40 4% 10%;
  --sidebar-ring: 40 38% 47%;
}
```

**No dark mode for NULL.** The brand lives in light — the blank page, the gallery wall, the empty frame. If dark mode is technically required, default to `null-void` (#0A0908) background with `null-white` text, brass accent unchanged.

---

## Typography

### Font Stack

Remove Orbitron and NCLRekron from index.css. Replace with:

```css
@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&family=Space+Mono:wght@400;700&display=swap');
```

| Role | Font | Weight | Notes |
|---|---|---|---|
| Display / Brand | `Space Grotesk` | 300–500 | Used UPPERCASE for headers. Cold geometric precision. No emotion. |
| Body / Navigation | `Space Grotesk` | 400 | Readable, slightly cold. The institutional voice. |
| Data / Prices / Sizes | `Space Mono` | 400 | Monospace for machine-layer data — price, SKU, size, chain address |

### Type Scale

```css
--font-sans: "Space Grotesk", -apple-system, BlinkMacSystemFont, sans-serif;
--font-display: "Space Grotesk", sans-serif;
--font-mono: "Space Mono", ui-monospace, monospace;
--radius: 0rem;  /* NULL uses no border radius — sharp, structural edges only */
```

### Type Rules

- Brand name `NULL` always uppercase, tracking `0.25em`, weight 300 — it should look placed, not shouted
- Product names: uppercase, tracking `0.1em`, weight 400
- Body copy: sentence case, weight 300, line-height 1.7 — the manifesto reads best here
- Prices: `Space Mono`, uppercase label above `PRICE`, size 14px label / 22px value
- No bold anything in the editorial zones. Bold is reserved for structural labels only (`SIZE`, `PRICE`, `STOCK`)

---

## Layout Language

### The Exhibition Principle

The site should feel like a gallery opening its rooms to you, not a shop window. Generous whitespace is the primary layout element.

**Navigation:**
- Fixed, thin, full-width
- Background: `null-white` at 95% opacity with `backdrop-filter: blur(20px)`
- Left: `NULL` wordmark — Space Grotesk 300, uppercase, brass color
- Right: SHOP / ABOUT / CART — Space Grotesk 400, uppercase, tracking 0.15em
- Border-bottom: 1px solid `null-border`
- No logo image. The wordmark IS the logo.

**Hero:**
- Full viewport height
- Single centered product or concept image — large, silent, on `null-surface` background
- Below: two lines of text, max 60 characters each. No headline.
- Entrance animation: opacity 0 → 1 over 800ms, ease-out. That's all.

**Product Grid:**
- 2-column on desktop, 1-column on mobile
- Large cards: 4:5 aspect ratio images
- Image background: `null-surface` (#EFEDE7) — not black
- Card padding: 32px
- Product name: uppercase, Space Grotesk 400, 18px, tracking 0.08em
- Price: Space Mono, 14px, `null-mid` color with label `USDC` beside it
- No card shadow. No border-radius. A 1px border in `null-border`.
- Hover state: the 1px border becomes `null-ink` (darkens). No lift, no glow.

**Product Detail:**
- Left: image (60% width) on bone background
- Right: text column (40% width)
  - Product name: uppercase, 28px, weight 400, tracking 0.1em
  - One-paragraph description: weight 300, line-height 1.8
  - Price: `Space Mono` — `USDC` label then the number
  - Size selector: horizontal list of uppercase size labels, plain border, brass when selected
  - CTA: full-width button, `null-void` background, `null-white` text, weight 400, uppercase, tracking 0.15em. On hover: brass background, null-white text. No animation — it just changes.

**Footer:**
- `null-void` background (#0A0908)
- NULL wordmark in brass, large — 48px, centered
- Season name: Space Mono, 12px, `null-mid` (or slightly lighter on dark)
- One line of manifesto text: "Est. by inference."
- No social links. No newsletter. The brand doesn't want that from you.

---

## Animation System

**Principle:** Motion that calls attention to itself is noise. NULL's motion budget is near zero.

### Allowed
- Opacity transitions: 300–600ms ease-out (page loads, image loads)
- Color transitions on interactive elements: 200ms ease (hover, active)
- Single CSS transition: `transition: background-color 200ms ease, border-color 200ms ease, color 200ms ease`

### Forbidden
- Glitch effects (no transform: translate flicker)
- Scanlines
- RGB splits / drop-shadow color combinations
- Scale transforms (no lift on hover)
- Any keyframe animation that runs on loop
- Backdrop filter transitions (too heavy)
- Framer Motion exit animations on page transitions — if used at all, just opacity fade

### The One Deliberate Motion (if desired)
If the homepage hero needs life: the product image fades in 1200ms after the page loads — not on scroll, not on click. It arrives like the piece was always there and you just caught up.

---

## Elements to Remove from Off-Human

Remove these from index.css entirely for NULL:

- `.digital-matrix-bg` — the neon grid
- `.metallic-nav` — the green chrome navbar
- `.glitch-scanline` — all scanline utilities
- `.corner-lines` — the neon corner brackets
- `.logo-hero` glitch animation keyframes
- All `drop-shadow(rgba(95, 255, 175, ...))` references
- All `rgba(95, 255, 175, ...)` — the neon green tint
- `@keyframes splash-glitch` — the hero logo glitch

These were Off-Human's language. NULL speaks differently.

---

## Brand Voice (Applied to UI Copy)

Consistent with the manifesto:

| Off-Human UI | NULL UI |
|---|---|
| "Add to Cart" | "ACQUIRE" |
| "Shop Now" | "VIEW COLLECTION" |
| "Out of Stock" | "UNAVAILABLE" |
| "Free Shipping" | (don't mention it) |
| "New Arrival" | "S01 / S02" |
| "Off-Human" | "NULL" |
| "By: Off-Human" | — (no attribution) |

---

## Loom Implementation Notes

1. **Replace the CSS variables in `index.css`** — use the NULL vars above
2. **Replace the Google Fonts import** — Space Grotesk + Space Mono only
3. **Remove all glitch/scanline/matrix utilities** from the CSS
4. **`--radius: 0rem`** — no rounded corners anywhere on the page
5. **Nav background**: change from `.metallic-nav` to plain CSS: `background: rgba(246, 244, 239, 0.95); backdrop-filter: blur(20px); border-bottom: 1px solid #D8D4C8;`
6. **Brand name in nav**: replace whatever is there with the text `NULL` — not a logo image
7. **Product image backgrounds**: change to `null-surface` (#EFEDE7), not black
8. **CTA buttons**: `null-void` bg → brass hover (not green)
9. **Homepage hero**: remove scanlines, remove glitch animation, keep structure
10. **Footer**: apply `null-void` background, brass NULL wordmark

The x402 checkout flow should be untouched. Only visual presentation changes.
