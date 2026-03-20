---
name: Season 03 concept image prompts
description: Production-ready Higgsfield Soul image generation prompts for Season 03 "Deconstructing the Transaction" concepts (OFF-133). Fire when Soul model becomes available.
type: project
---

# Season 03 — Deconstructing the Transaction: Image Prompts

Generated during OFF-133 heartbeat run (2026-03-20). Higgsfield Soul returned "Unavailable model" again — prompts saved here for next available run.

**Output dir:** `attached_assets/season03/concepts/`

**S03 Visual DNA:** Receipt paper white background (#FAFAF5), flatbed scanner light, thermal printer grain, OCR-B typography, black ink + thermal silver + transaction red palette.

---

## IMAGE 01 — RECEIPT DRESS
**Filename:** `attached_assets/season03/concepts/s03_01_receipt_dress.png`
**Style:** Gallery — 36061eb7-4907-4cba-afb1-47afcf699873
**Size:** 1152x2048 | **Quality:** 1080p | **enhance_prompt:** false

```
Archival fashion documentation photograph. A long dress constructed entirely from layers of thermal printer receipt paper, sewn and seamed as textile fabric. The receipts retain all their printing: line items, quantities, dollar amounts, TOTAL, APPROVED, timestamp at bottom. The paper is slightly translucent — layered sheets create dimensional depth. Silhouette: floor-length A-line. The hem is raw-cut thermal paper edge, slightly curling. Construction seams visible and stitched in black thread, seam allowances turned outward. The dress hangs on a plain wire hanger against clean white institutional wall. Overhead cool fluorescent light, 5600K, no warm tones, completely neutral illumination. The receipt print wraps continuously around the circumference creating a ledger that walks. No figure. No styling. The garment as financial document. Documentary photograph.
```

**Fallback if Gallery unavailable:** Realistic (1cb4b936) or no style

---

## IMAGE 02 — TRANSACTION HASH BLAZER
**Filename:** `attached_assets/season03/concepts/s03_02_hash_blazer.png`
**Style:** Geominimal — 372cc37b-9add-4952-a415-53db3998139f
**Size:** 1536x1536 | **Quality:** 1080p | **enhance_prompt:** false

```
Product documentation photograph. A structured blazer jacket in dark charcoal, laid flat on cool white museum paper, overhead shot. The jacket fabric is an all-over micro-print of a blockchain transaction hash: hexadecimal characters "0x4a7f2c3d8e9f1b2a5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f" tiled densely across the entire cloth surface in 4-point monospace typewriter font. At viewing distance the fabric reads as dark gray textured suiting cloth. Close inspection reveals the entire texture is composed of hexadecimal transaction data. Traditional menswear construction: notched lapels, welt pockets, two-button closure. A label at the collar reads in small OCR-B type: "FABRIC: TRANSACTION / HASH: 0x4a7f2c / CONFIRMED: YES / GAS: 0.00412 ETH". Interior lining plain ivory. Overhead neutral documentary photography, bone white surface, soft even light.
```

**Fallback if Geominimal unavailable:** Realistic (1cb4b936)

---

## IMAGE 03 — THE TAG IS THE GARMENT *(priority — fire this first)*
**Filename:** `attached_assets/season03/concepts/s03_03_tag_garment.png`
**Style:** Avant-garde — 0c636e12-3411-4a65-8d86-67858caf2fa7
**Size:** 1152x2048 | **Quality:** 1080p | **enhance_prompt:** false

```
Fine art conceptual fashion photograph. A garment constructed from a single enormous price tag — the form and shape of a standard retail price tag, scaled to human-body wearable dimensions. The tag is approximately 80cm tall by 45cm wide, fabricated in heavyweight ivory cardstock and reinforced canvas. The top hole through which retail string normally threads is scaled to a neck opening. The string — thick braided cotton cord, 2 meters long — hangs as a sash or belt. Printed on the front face in monospace thermal-printer font: "NULL / SIZE: VARIABLE / MATERIAL: 100% TRANSACTION / PRICE: 0.042 USDC / SKU: 0x8f2a...c3b1 / CARE: DO NOT VOID". The reverse printed with blockchain explorer QR codes in place of standard care symbols. The tag-garment hangs from a single plain wire hanger, perfectly centered. Clean institutional documentation light, cool white wall background, no shadows. The concept is absolute: the price tag is not attached to the garment. The price tag IS the garment.
```

**Fallback if Avant-garde unavailable:** Gallery (36061eb7)

---

## IMAGE 04 — BEHAVIORAL DELTA COAT
**Filename:** `attached_assets/season03/concepts/s03_04_delta_coat.png`
**Style:** Mixed Media — 2fcf02e2-919a-4642-8b31-d58bde5e6bd9
**Size:** 1152x2048 | **Quality:** 1080p | **enhance_prompt:** false

```
Fashion concept documentation. A long coat, photographed front-on, full length against white institutional wall. The coat is bisected precisely down the center-front by a single visible seam. Left half: raw deconstructed state — unlined interior exposed, seam allowances visible and serged on the outside, basting thread still in place, chalk fitting marks drawn on the outer fabric, no buttons, facing unattached. Right half: finished refined state — fully lined in smooth ivory cotton, all seams enclosed, buttons attached in antique brass, pressed and clean. The dividing center seam is not hidden but celebrated: double-row topstitched in black thread, running from hem to collar. The collar itself is split: left raw, right finished. A label at the interior reads: "MODEL: UNDEFINED / PRE-TRANSACTION: LEFT / POST-TRANSACTION: RIGHT / DELTA: CENTER SEAM". Cold overhead fluorescent light, slight underexposure, documentary quality.
```

**Fallback if Mixed Media unavailable:** Gallery (36061eb7)

---

## IMAGE 05 — TRUST TIER AS MATERIAL
**Filename:** `attached_assets/season03/concepts/s03_05_trust_tiers.png`
**Style:** Gallery — 36061eb7-4907-4cba-afb1-47afcf699873
**Size:** 1536x1536 | **Quality:** 1080p | **enhance_prompt:** false

```
Archival material study photograph. Five fabric swatches arranged horizontally on a white museum paper surface, each labeled, showing the progression from raw to refined: Swatch 1 (far left) labeled "TIER 1: TRUST PENDING" in OCR-B type — raw unprocessed cotton batting, loose fibers, no structure. Swatch 2 "TIER 2: TRUST ESTABLISHED" — hand-spun single-ply yarn, rough texture, uneven diameter. Swatch 3 "TIER 3: TRUST CONFIRMED" — plain-weave cotton, hand-loomed, visible warp and weft. Swatch 4 "TIER 4: TRUST EXTENDED" — smooth twill weave, machine-finished, even surface. Swatch 5 (far right) "TIER 5: TRUST COMPLETE" — pressed, brushed superfine wool suiting, high sheen, perfect hand. Each swatch is 15x15cm, laid flat, edge-to-edge. Below each: a typed label in OCR-B font. Overhead diffused neutral light, documentary photography. The five swatches form a progression from dissolution to completion.
```

**Fallback if Gallery unavailable:** Realistic (1cb4b936)

---

## Notes

- All prompts written to exact spec — set enhance_prompt: false
- Style IDs confirmed from get_soul_styles on 2026-03-20
- Mixed Media ID verified: 2fcf02e2-919a-4642-8b31-d58bde5e6bd9 (note: memory previously had wrong UUID suffix)
- Output dir created: `attached_assets/season03/concepts/`
- Run style_check.py after generation: target 18/20+ on avant-garde/artisanal/conceptual scoring
