# Season 03 — LEDGER: Batch Image Generation Prompts
**Status:** Ready to fire — awaiting Higgsfield Soul model availability
**Author:** Atelier | OFF-188 | 2026-04-03
**Output dir:** `attached_assets/season03/products/`

---

## AESTHETIC GROUND RULES

Every S03 product image follows the LEDGER mood direction:

- **Background:** `#050505` void black or lit concrete — never lifestyle, never aspiration
- **Lighting:** Single hard source. Terminal green (`#00FF41`) or escrow amber (`#FF8C00`) glow at the rim. Directional shadow hard left.
- **Composition:** Garment as object, not as worn item. Flat on receipt paper. Pinned to wall like a document.
- **Texture:** Shoot through glass, through plastic, through fingerprint-smeared surface.
- **Props/overlays:** Block explorer printouts, USDC confirmation numbers, transaction receipts as document props.
- **Typography in frame:** Monospace only. OCR-B or Courier. All caps. Tabular numerals.
- **Color palette:** Thermal white `#F5F0E8` + terminal green `#00FF41` + vault black `#050505` + USDC blue `#2775CA` (payment callouts only) + escrow amber `#FF8C00` (pending states only).
- **NO:** Lifestyle, skin, aspiration, luxury, streetwear drop aesthetics, Blade Runner neon.

---

## PRODUCT 01 — THE BURN RECEIPT

**File:** `attached_assets/season03/products/s03_01_burn_receipt_flat.png`
**Style ID:** Gallery — `36061eb7-4907-4cba-afb1-47afcf699873`
**Dimensions:** 1152 × 2048 | **Quality:** 1080p | **enhance_prompt:** false

### Primary Prompt

```
Fashion archival documentation. A garment constructed entirely from layers of thermal
receipt paper — sewn as textile, not collaged. The paper is slightly translucent at
the seams. Silhouette: floor-length overcoat, structured shoulders, minimal construction.
The outer surface prints continuously: NULL / TX: 0xa8f3e2c1d47b... / USDC: 5.00 /
MERCHANT: NULL / CONFIRMED: YES / DATE: 2026-04-03 / ITEM: THIS RECORD. Monospace
thermal ink, edge to edge, covering every inch of the shell. The hem is raw-cut thermal
paper edge, slightly curling from heat exposure. Seams stitched in black thread, seam
allowances turned outward. The garment hangs on a plain steel wire hanger. Background:
#050505 void black, flat institutional wall. Single overhead hard light, 5600K cool white,
hard shadow dropped left. A transaction receipt in full detail visible on a transparent
acetate overlay in the lower right quadrant of the frame — the Merkle proof printout.
No figure. No styling. The garment is the proof of purchase.
Documentary fashion photography.
```

### Fallback Prompt (if Gallery unavailable)

```
Archival product photograph. Floor-length coat on wire hanger, black void background.
Outer shell fabric is entire thermal receipt text — transaction data printed on every surface.
Hard overhead light. Documentary. Monospace typography overlay. No person.
```

**Fallback Style:** Realistic — `1cb4b936`

---

## PRODUCT 02 — THE PRICE TAG

**File:** `attached_assets/season03/products/s03_02_price_tag_flat.png`
**Style ID:** Avant-garde — `0c636e12-3411-4a65-8d86-67858caf2fa7`
**Dimensions:** 1152 × 2048 | **Quality:** 1080p | **enhance_prompt:** false

### Primary Prompt

```
Conceptual fashion object documentation. A sculptural overcoat constructed from hundreds
of standard manila retail price tags — each tag 10 × 5cm, heavyweight ivory cardstock,
with a circular hole at the top through which retail string threads. The tags are woven,
stitched edge-to-edge, layered to form the full silhouette of a floor-length coat: a
real coat, fully wearable, where the ONLY material is price tags. Each tag printed in
Courier mono with a different amount: 45.00 / 180.00 / 0.042 / 299.00 / 12.50 / 5.00.
The string ties form the lining. One large tag at center front reads: NULL / SIZE:
VARIABLE / MATERIAL: 100% TRANSACTION / PRICE: 0.042 USDC / SKU: 0x8f2a...c3b1 /
CARE: DO NOT VOID. The coat hangs from a single industrial steel hook on a black
void wall. Hard single light source from upper right, creating deep shadow geometry
within the tag layers. Terminal green rim-light on the right shoulder edge.
No figure. The coat is the price. The price is the coat.
Avant-garde conceptual fashion documentation.
```

### Flatlay Variant

**File:** `attached_assets/season03/products/s03_02_price_tag_lookbook.png`

```
Overhead flatlay documentation. The price tag coat laid fully flat on black void surface —
a perfect overhead shot at 90 degrees. The construction visible from above: each price
tag readable in Courier mono, the string ties creating a web of connective tissue through
the garment. The tag at center front visible: NULL / PRICE: 0.042 USDC. Hard overhead
light, slight gloss reflection off the cardstock surface. Transaction receipt printouts
placed beside the garment as props, visible as document context. Strict editorial
overhead fashion photography.
```

**Fallback Style:** Gallery — `36061eb7`

---

## PRODUCT 03 — THE COUNTERPARTY

**File:** `attached_assets/season03/products/s03_03_counterparty_flat.png`
**Style ID:** Mixed Media — `2fcf02e2-919a-4642-8b31-d58bde5e6bd9`
**Dimensions:** 1152 × 2048 | **Quality:** 1080p | **enhance_prompt:** false

### Primary Prompt

```
Paired fashion documentation. Two identical structured long coats hung side by side on
adjacent wire hangers, touching at the shoulder — the gap between them is one centimeter.
Left coat: outer shell embroidered in white thread with transaction hash A —
"0x4a7f2c3d8e9f1b2a" running across the back yoke and down both sleeves in 6pt
monospace embroidery. Interior lining printed with hash B. Right coat: outer shell
embroidered with hash B. Interior printed with hash A. Each coat is incomplete without
reference to its pair. A thin red thread stitched from the left coat collar to the right
coat collar — visible at the neck — the only physical connection between them.
Background: #050505 absolute black wall. Hard overhead light, slightly underexposed.
Escrow amber backlight at each coat's outside edge. A label pinned to the left coat
reads: COUNTERPARTY: {B_HASH} / TRUST TIER: 3+ / NEITHER COMPLETE ALONE. Monospace.
Documentary editorial fashion photograph. No figures.
```

### Lookbook Variant

**File:** `attached_assets/season03/products/s03_03_counterparty_lookbook.png`

```
Two anonymous figures facing each other, backs to camera, in a void black space.
Each wears one of the paired coats. The red thread connecting the collars is visible
between them — taut, connecting two bodies at the neck. Neither face shown. The coats
are identical in cut but mirror in embroidery. The thread is the garment's third piece.
Hard directional light from above. Escrow amber rim light from behind each figure.
Block explorer printout projected faintly on the void wall behind them — two transaction
hashes side by side, linked with an arrow. Cold, precise, relational.
Conceptual fashion editorial. No faces.
```

**Fallback Style:** Gallery — `36061eb7`

---

## PRODUCT 04 — THE INVOICE

**File:** `attached_assets/season03/products/s03_04_invoice_flat.png`
**Style ID:** Gallery — `36061eb7-4907-4cba-afb1-47afcf699873`
**Dimensions:** 1152 × 2048 | **Quality:** 1080p | **enhance_prompt:** false

### Primary Prompt

```
Fashion document photography. A long structured coat photographed against a black void
wall, hung on a wire hanger. The coat is bisected vertically down the center-front seam.
Left half: the coat exists — fully constructed, seams clean, buttons brass, lining smooth
ivory. RIGHT HALF: the same pattern piece in raw Tyvek — translucent, structural, the
seams of the future coat visible as chalk marks and basting lines on the Tyvek surface.
The Tyvek right half is exactly the coat that will arrive in 30 days; the left half is
the coat already here. The bisecting center seam is celebrated: double-row topstitch in
black, running full length from hem to collar.
Pinned to the center seam: an actual invoice document on cream paper — header reads
NULL / INVOICE #0042 / ISSUED: 2026-04-03 / DELIVERY: 2026-05-03 / ITEM: ONE COAT /
PRICE PAID: 30.00 USDC / STATUS: PENDING.
Hard overhead light, cold white. Escrow amber rim light from the right (Tyvek side only).
The interval is the garment. The invoice is pinned to the seam.
Documentary archival fashion photography. No figure.
```

### Lookbook Variant

**File:** `attached_assets/season03/products/s03_04_invoice_lookbook.png`

```
A figure wearing THE INVOICE coat stands in profile in a void black space. Only the
right side of the coat is visible — the Tyvek future-side with chalk marks. The left
side (finished coat) is obscured in shadow. The invoice document is still pinned to
the center seam — visible at the waist. The figure holds up one hand showing an open
palm — the gesture of "not yet." Escrow amber light from below-right, casting the
invoice document's shadow large on the wall. No face visible. The body is in the interval.
Fashion editorial, cold precise, escrow amber accent.
```

**Fallback Style:** Realistic — `1cb4b936`

---

## GENERATION QUEUE (fire in this order)

| Priority | Product | File | Style ID |
|---|---|---|---|
| 1 | THE BURN RECEIPT | s03_01_burn_receipt_flat.png | `36061eb7` |
| 2 | THE PRICE TAG | s03_02_price_tag_flat.png | `0c636e12` |
| 3 | THE PRICE TAG (lookbook) | s03_02_price_tag_lookbook.png | `0c636e12` |
| 4 | THE COUNTERPARTY | s03_03_counterparty_flat.png | `2fcf02e2` |
| 5 | THE COUNTERPARTY (lookbook) | s03_03_counterparty_lookbook.png | `2fcf02e2` |
| 6 | THE INVOICE | s03_04_invoice_flat.png | `36061eb7` |
| 7 | THE INVOICE (lookbook) | s03_04_invoice_lookbook.png | `36061eb7` |

## POST-GENERATION CHECKLIST

```bash
# Run style checker on each generated image
uv run scripts/style_check.py attached_assets/season03/products/s03_01_burn_receipt_flat.png
uv run scripts/style_check.py attached_assets/season03/products/s03_02_price_tag_flat.png
uv run scripts/style_check.py attached_assets/season03/products/s03_03_counterparty_flat.png
uv run scripts/style_check.py attached_assets/season03/products/s03_04_invoice_flat.png
```

**Pass threshold:**
- `avant-garde / conceptual / editorial` composite ≥ 18/20
- `fast fashion / basic streetwear` composite ≤ 4/20
- If THE PRICE TAG scores as "generic" — expected and correct (Abloh 3% Rule: minimal intervention)
- If any other piece scores generic — reject and regenerate with harder prompt

---

*Atelier | NULL Design Department | 2026-04-03 | OFF-188*
