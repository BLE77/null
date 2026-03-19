---
name: NULL website redesign spec
description: Complete design spec for the NULL website rebuild — gallery/archive aesthetic, not Off-Human streetwear. For Loom implementation.
type: project
---

# NULL — Website Redesign Spec
**Written:** 2026-03-19 (OFF-104)
**Status:** Final — Loom implements from this spec
**Priority:** Critical

---

## The Problem

The current site uses the NULL design tokens (correct colors, correct fonts) but is structurally an Off-Human site:
- Dark hero section with 3D CharacterController (game aesthetic, not gallery)
- Full-screen marketing sections ("CRYPTO PAYMENTS", CTAs, scrolljacking)
- `bg-[#0A0908]` hardcoded in the hero — bypasses the design system
- AnimatedProductCard with scroll-triggered entry animations
- It reads: "streetwear brand with a dark edge" — not "institutional archive"

## The Redesign Premise

**The website is an archive, not a shop.**

You arrive and feel: this is where objects are documented, not sold. The selling is incidental to the presence of the objects. The white space is not emptiness — it is the material the brand works in. Absence is the medium.

Reference: Maison Martin Margiela's paper mailers. The MoMA permanent collection catalog. Helmut Lang's early website.

---

## Global Constraints (apply everywhere)

- Background: `#F6F4EF` (null-white) — NEVER `#0A0908` in above-the-fold content
- Font: Space Grotesk (display/body) + Space Mono (data) — already in CSS
- No border-radius (--radius: 0rem)
- No shadows on product cards
- No scroll-triggered animations, no AnimatedProductCard
- No marketing copy ("free shipping", "crypto-native", "revolutionary")
- x402 checkout: preserve all functionality, change only visual presentation
- Cart sidebar: preserve
- Admin: preserve

---

## Page 1: Home (`/`)

### Remove Entirely
- `CharacterController` component — gone from homepage
- The dark hero section (`bg-[#0A0908]`)
- The "Section 4: x402 Payments" marketing block
- `AnimatedProductCard` — replace with static `NullProductRow` (see below)
- The "View All N Products" CTA section

### Replace With: The Archive Layout

**Structure (top to bottom):**

```
[Navigation — see global nav spec]
[Opening Statement — 100vh]
[Archive — one product per row, full-width]
[Footer]
```

---

#### Opening Statement Section

```
height: 100vh
background: #F6F4EF (null-white)
display: flex
flex-direction: column
align-items: center
justify-content: center
```

Content — centered, no hero image:

```
[Season indicator]
S01 / S02

[Collection line 1]
DECONSTRUCTED

[1px horizontal rule — 60px wide, centered, null-border color]

[Collection line 2]
SUBSTRATE

[spacing: 48px]

[Byline]
Est. by inference.
```

Typography:
- Season indicator: Space Mono 11px, `#8C8880`, tracking 0.3em, uppercase
- Collection names: Space Grotesk weight 300, 72px desktop / 40px mobile, uppercase, tracking 0.05em, `#1C1B19`
- Between the two collection names: 1px rule, `#D8D4C8`, 80px wide, margin 24px vertical
- Byline: Space Mono 11px, `#8C8880`, tracking 0.25em

**Entry animation:** `.null-fade-in` class — opacity 0 → 1 over 1200ms ease-out. Applied to the entire center block. Nothing else animates.

**No buttons. No CTAs. No scroll indicator.** The user discovers by scrolling.

---

#### Archive Section

One row per product. This is NOT a grid. Products appear sequentially like catalog entries.

```
background: #F6F4EF
padding: 0 0 120px 0
```

Each product row (`NullProductRow` component):

```
.null-archive-row {
  display: grid;
  grid-template-columns: 1fr 1fr;  /* 50/50 split */
  min-height: 70vh;
  border-top: 1px solid #D8D4C8;

  /* alternate: odd rows image-left, even rows image-right */
}

/* Mobile: stacked */
@media (max-width: 768px) {
  .null-archive-row {
    grid-template-columns: 1fr;
  }
}
```

**Left cell (image):**
```
background: #EFEDE7  (null-surface)
display: flex
align-items: center
justify-content: center
padding: 48px
aspect-ratio: 4/5 on mobile, height 100% on desktop

img {
  width: 80%;
  max-width: 400px;
  height: auto;
  object-fit: contain;
  opacity: 0;
  animation: null-appear 800ms ease-out forwards;
  animation-delay: 200ms;
}
```

**Right cell (text/metadata):**
```
background: #F6F4EF
display: flex
flex-direction: column
justify-content: center
padding: 64px desktop / 32px mobile
```

Content order within text cell:
1. Season label: `S01` or `S02` — Space Mono 10px, `#8C8880`, tracking 0.3em
2. Product name: Space Grotesk 300, 28px desktop / 22px mobile, uppercase, tracking 0.08em, `#1C1B19`
3. 1px rule, full width, `#D8D4C8`, margin 24px vertical
4. Price row: `USDC` label (Space Mono 10px, `#8C8880`) + price value (Space Mono 20px, `#1C1B19`)
5. Spacing: 32px
6. Category: Space Mono 10px, `#8C8880`, uppercase, tracking 0.2em
7. Spacing: 48px
8. Link: `→ VIEW PIECE` — Space Grotesk 400, 11px, uppercase, tracking 0.2em, `#1C1B19`
   - Hover: color becomes `#A8894A` (brass). No underline. No other change.
   - This is a `<Link href="/product/{id}">` not a button

**Alternating layout:** Even-indexed products should flip — image right, text left. Apply CSS class `null-archive-row--flip` which reverses the grid column order. This creates rhythm, prevents it from feeling like a list.

**Out of stock:** If all sizes unavailable, show `UNAVAILABLE` label in Space Mono 10px, `#8C8880` below the category line.

---

### Footer (Homepage and Global)

Replace the current 3-column footer grid with:

```jsx
<footer className="null-void-bg py-16">
  <div className="max-w-xl mx-auto text-center px-4">
    {/* Large brand mark */}
    <span className="block text-6xl font-light uppercase tracking-[0.25em] text-primary font-display mb-3">
      NULL
    </span>
    <span className="block text-[10px] uppercase tracking-[0.3em] text-[#4A4744] font-mono mb-12">
      Est. by inference.
    </span>

    {/* Minimal links */}
    <div className="flex justify-center gap-8 text-[10px] uppercase tracking-[0.2em] text-[#4A4744] font-mono mb-12">
      <Link href="/shop">SHOP</Link>
      <Link href="/about">ABOUT</Link>
    </div>

    {/* Chain info — single line */}
    <p className="text-[10px] text-[#2C2B28] font-mono tracking-[0.1em]">
      PAYMENTS VIA X402 · USDC ON BASE
    </p>
  </div>
</footer>
```

No social links. No copyright statement. No "no humans were harmed" — it's trying too hard.

---

## Page 2: Shop (`/shop`)

### Remove
- Category filter pills (the row of 11 category buttons)
- Animated product cards
- Season section headers with the long descriptions

### Replace With: Archive Grid

**Header:**
```
padding-top: 96px (account for nav)
padding-bottom: 48px
text-align: center
```
Content:
- `NULL` wordmark in brass, Space Grotesk 300, 40px — but this is REDUNDANT with the nav wordmark. Remove the large NULL heading.
- Instead: a single line: `{n} PIECES` in Space Mono 12px, `#8C8880`, tracking 0.3em, uppercase

**Season Selector:**

Replace pills with text-only:
```jsx
<div className="flex gap-8 justify-center mb-12">
  {["all", "01", "02"].map(s => (
    <button
      key={s}
      className={`text-[10px] uppercase tracking-[0.2em] font-mono transition-colors duration-200
        ${activeSeason === s ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
    >
      {s === "all" ? "ALL" : `S${s}`}
    </button>
  ))}
</div>
```

No borders. No backgrounds. Active state = just darker text. The selection is the only affordance.

**Remove category filter entirely.** NULL should not feel like a store with SKUs by category. Season is the only relevant organizing principle.

**Product Grid:**

```jsx
<div className="grid grid-cols-2 gap-0">
  {/* grid-cols-1 on mobile */}
</div>
```

Each cell: a `ShopProductCell` (NOT `ProductCard`, new component):
```
aspect-ratio: 3/4
background: #EFEDE7
border: 1px solid #D8D4C8

/* hover: */
border-color: #1C1B19

img {
  width: 75%;
  height: 75%;
  object-fit: contain;
  /* centered within the cell */
}
```

Below each cell (outside the cell box, not overlaid):
```
padding: 16px 0 32px 0
product-name: Space Grotesk 400, 13px, uppercase, tracking 0.08em, #1C1B19
price row: USDC label (Space Mono 10px #8C8880) + price (Space Mono 14px #1C1B19)
```

**Section headers (S01, S02):** Remove the elaborate centered section headers with badges. Replace with a hairline separator + simple label:
```
<div className="col-span-2 border-t border-border mt-16 pt-4 mb-8">
  <span className="text-[10px] font-mono uppercase tracking-[0.3em] text-muted-foreground">
    S{season} — {collectionName}
  </span>
</div>
```

**Agent Wearables section:** Keep, but retitle to `AGENT LAYER` and use the same grid treatment. Add a brief context line: `Software objects — worn in the system prompt`.

---

## Page 3: ProductDetail (`/product/:id`)

The current layout is largely acceptable. These targeted changes:

### Changes
1. **Remove** any `bg-[#0A0908]` or black backgrounds on the image panel
2. **Change** image panel background to `#EFEDE7` (null-surface) — if not already done
3. **CTA button:** Must be `null-void` background (#0A0908), null-white text, "ACQUIRE" — on hover: brass (#A8894A) background, still white text. Change occurs at 200ms ease. NO border-radius.
4. **Size selector:** Replace any styled buttons with plain text. Each size is a `<button>` with:
   - Normal: text `#8C8880`, no background, no border
   - Selected: text `#1C1B19`, with 1px bottom-border `#A8894A` (brass underline, not box)
   - Unavailable: text `#D8D4C8`, cursor not-allowed, strikethrough
5. **Product name:** uppercase, Space Grotesk 300, 26px
6. **Price label:** `PRICE` in Space Mono 10px `#8C8880` ABOVE the price value. Price value: Space Mono 20px `#1C1B19`. Then `USDC` inline.
7. **Description:** Space Grotesk 300, 14px, line-height 1.8, sentence case (not uppercase)
8. **3D model viewer:** Keep if present. Minimal styling.
9. **x402 checkout modal:** Preserve exactly as-is. No visual changes to checkout flow.

---

## Page 4: About (`/about`)

The About page should be the manifesto, rendered cleanly.

### Layout
```
max-width: 640px
margin: 0 auto
padding: 120px 24px 120px 24px  (top accounts for nav)
```

**Header:**
```
NULL
——
Season 01: Deconstructed
```
Space Grotesk 300, centered, no page title. Just the brand + season.

**Body:** Manifesto text, rendered in sections. Space Grotesk 300, 15px, line-height 1.9, `#1C1B19`. Section headers in uppercase tracking-[0.15em] 11px. No images. No interactivity.

**No CTAs.** Someone reading the manifesto is not being sold to.

---

## Navigation (Global — replace `Navigation.tsx`)

### Spec

```
position: fixed
top: 0 left: 0 right: 0
z-index: 50
height: 48px  (reduced from 56px)
background: rgba(246, 244, 239, 0.95)
backdrop-filter: blur(20px)
border-bottom: 1px solid #D8D4C8
```

**Left:** `NULL` wordmark
- Space Grotesk weight 300, 14px, uppercase, tracking 0.25em
- Color: `#A8894A` (brass) — the 3% moment
- This IS the home link. No separate "Home" nav item.

**Center (desktop only):** `SHOP` and `ABOUT`
- Space Grotesk 400, 10px, uppercase, tracking 0.2em
- Color: `#8C8880` normally, `#1C1B19` on hover
- No active indicator (the URL makes it clear)

**Right:**
- Wallet connect button (keep, UniversalWalletConnect)
- Cart icon (keep, functional)
- Login/logout icon (keep, but deprioritize — ghost button, minimal icon)
- **Remove:** "Home" link (NULL wordmark is home)
- **Remove:** Mobile hamburger menu — replace with a simple slide-in from right containing SHOP / ABOUT only. No icons.

**Mobile (< 768px):**
- Left: NULL (brass, same)
- Right: Cart icon + hamburger
- Hamburger opens a full-height overlay, bone background, SHOP and ABOUT centered large (Space Grotesk 300, 48px each)

---

## What NOT to Build

These are the Off-Human artifacts to eliminate:

| Remove | Why |
|--------|-----|
| `CharacterController` from homepage | 3D avatar = game, not gallery |
| Dark hero section | Contradicts the NULL design system |
| "CRYPTO PAYMENTS" section | Marketing copy, not brand |
| `AnimatedProductCard` | Motion budget is near-zero |
| Category filter pills (11 items) | Retail UX pattern |
| Footer social links | Brand explicitly withholds connection |
| Copyright "no humans were harmed" | Trying too hard, breaks tone |
| Product card border-radius (if any) | --radius: 0rem |
| Neon accent anywhere | null-brass only, never green |

---

## New Components Needed

Loom creates these new components (do NOT modify existing ones, create new):

| Component | File | Purpose |
|-----------|------|---------|
| `NullArchiveHero` | `client/src/components/NullArchiveHero.tsx` | Homepage opening section |
| `NullProductRow` | `client/src/components/NullProductRow.tsx` | Single-product full-width archive row |
| `ShopProductCell` | `client/src/components/ShopProductCell.tsx` | Grid cell for shop page |
| `NullFooter` | `client/src/components/NullFooter.tsx` | Minimal void footer |
| `NullAbout` | `client/src/pages/NullAbout.tsx` | Manifesto page (replace or supplement About.tsx) |

Replace `Home.tsx` with a new implementation using these components.
Replace `Shop.tsx` with a new implementation.
Update `Navigation.tsx` in-place (it's already good, minor changes).
Update `ProductDetail.tsx` in-place (targeted changes listed above).

---

## CSS Additions for `index.css`

Add to the `@layer utilities` section:

```css
/* Archive row layout */
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

/* Shop grid cell */
.null-shop-cell {
  background: #EFEDE7;
  border: 1px solid #D8D4C8;
  aspect-ratio: 3/4;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  transition: border-color 200ms ease;
}

.null-shop-cell:hover {
  border-color: #1C1B19;
}

/* Size selector */
.null-size-btn {
  font-family: var(--font-mono);
  font-size: 12px;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: #8C8880;
  background: transparent;
  border: none;
  border-bottom: 1px solid transparent;
  padding: 4px 8px;
  cursor: pointer;
  transition: color 200ms ease, border-color 200ms ease;
}

.null-size-btn:hover {
  color: #1C1B19;
}

.null-size-btn.selected {
  color: #1C1B19;
  border-bottom-color: #A8894A;
}

.null-size-btn.unavailable {
  color: #D8D4C8;
  text-decoration: line-through;
  cursor: not-allowed;
}

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
  transition: background-color 200ms ease, color 200ms ease;
}

.null-acquire-btn:hover {
  background: #A8894A;
  color: #F6F4EF;
}

.null-acquire-btn:disabled {
  background: #D8D4C8;
  color: #8C8880;
  cursor: not-allowed;
}
```

---

## Implementation Order for Loom

1. Add CSS additions to `index.css`
2. Build `NullFooter.tsx` (simple, isolated)
3. Build `NullArchiveHero.tsx` (static, no data dependencies)
4. Build `NullProductRow.tsx` (requires product data type)
5. Rebuild `Home.tsx` using NullArchiveHero + NullProductRow + NullFooter
6. Build `ShopProductCell.tsx`
7. Rebuild `Shop.tsx` using ShopProductCell + NullFooter
8. Update `ProductDetail.tsx` (targeted changes, preserve x402)
9. Update `Navigation.tsx` (minor changes)
10. Update `About.tsx` or create `NullAbout.tsx`

---

## Quality Gate

Before marking done:
- [ ] No `bg-[#0A0908]` in homepage hero (bone/white only above fold)
- [ ] CharacterController NOT rendered on homepage
- [ ] Products visible without scrolling past a full marketing section
- [ ] Archive rows alternate image-left / image-right
- [ ] ACQUIRE button is brass on hover, not green
- [ ] Size selector uses brass underline, not pill buttons
- [ ] Footer is minimal — NULL + Est. by inference. only
- [ ] x402 checkout still works (connect wallet → pay USDC)
- [ ] Mobile layout works (stacked rows, simple overlay nav)
