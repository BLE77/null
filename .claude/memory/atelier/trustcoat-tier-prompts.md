---
name: TrustCoat NFT tier image prompts
description: Production-ready image generation prompts for all 6 TrustCoat trust tiers (OFF-94). Higgsfield Soul Gallery style. Saved due to model unavailability. Use when Soul becomes available.
type: project
---

# TrustCoat NFT — Tier Image Prompts (OFF-94)

**Generated:** 2026-03-19
**Status:** Pending — Higgsfield Soul model unavailable ("Unavailable model" error, consistent with OFF-55 run)
**Model:** Higgsfield Soul — Gallery style (36061eb7-4907-4cba-afb1-47afcf699873)
**Size:** 1536x1536 (square, NFT format)
**Quality:** 1080p
**enhance_prompt:** false — prompts written to spec

## Design System — All Tiers

All 6 tiers share these constants:
- **Background:** Warm bone paper (#F0EDE6), slightly textured
- **Lighting:** Cold overhead diffused fluorescent, 5500K, slightly underexposed, near-shadowless
- **Coat silhouette:** Oversized single-breasted long coat, collar open, laid slightly tilted 3° on paper
- **Photography:** Margiela exhibition catalog flatlay, overhead angle
- **No human figure** — the garment IS the subject
- **Progression:** Surface data density increases from nothing (Tier 0) to total transformation (Tier 5)

---

## TIER 0 — VOID

```
Fine art archival photograph. A white cotton toile coat laid flat on warm ivory paper surface
(#F0EDE6), slightly tilted 3 degrees. The coat is an unfinished first-fitting prototype: undyed
natural cotton, visible chalk pattern marking lines drawn directly on fabric, red basting thread
in temporary stitches along lapel and side seams, seam allowances turned to outside, unhemmed
raw edges with loose thread ends, pencil fitting annotations written on the fabric surface. A
small rectangular fabric label sewn at interior collar reads in typewriter font: "TIER 0 /
NO HISTORY / TRUST: PENDING". Overhead soft diffused light, 5500K daylight neutral, no harsh
shadows, flat near-shadowless illumination. Documentary archival still photograph, slightly
underexposed. Margiela exhibition catalog photography aesthetic. Background: warm bone paper
only. No props. No human figure. Construction marks are the decoration.
```

**Reference existing image:** `attached_assets/superrare/anonymous_atelier_tier0.png` (white coat hanging in gallery — strong reference but flatlay preferred for NFT consistency)

---

## TIER 1 — SAMPLE

```
Fine art archival photograph. An oversized white cotton coat laid flat on warm ivory paper
(#F0EDE6), slightly tilted 3 degrees. The coat is barely marked: a single tailor's chalk line
runs diagonally across the left breast, one row of red basting thread stitches along the right
shoulder seam. Seam allowances turned to outside. One small rectangular label at interior collar
in typewriter font: "TIER 1 / FIRST TRANSACTION / TRUST: 0.001". Along the interior hem, one
row of handwritten numerals in pencil: the first transaction hash, partially legible. White
cotton surface almost entirely unmarked — the inscription is one decision away from absence.
Overhead cold diffused light, slightly underexposed, near-shadowless. Documentary archival
quality. Warm bone paper background only. No figure. The trace of a single action.
```

---

## TIER 2 — RTW (READY TO WEAR)

```
Fine art archival photograph. An oversized white cotton coat laid flat on warm ivory paper
(#F0EDE6), slightly tilted 3 degrees. The coat shows the beginning of accumulation: sparse
handwritten transaction references in black ink along three seam lines — numbers, dates, and
short hash fragments written in a careful hand, as if ledger entries had migrated from paper
to fabric. Near the left breast pocket: a small printed table of 6 rows, very fine type, a
partial transaction log. The seam allowances turned outside show ink bleed at the fold. A label
at interior collar reads in typewriter font: "TIER 2 / RTW / ON-CHAIN SINCE: BLOCK 18447200".
Most of the white cotton surface remains unmarked. Overhead cold diffused light, underexposed,
near-shadowless. Documentary archival photograph, Margiela exhibition catalog aesthetic. Warm
bone paper background. No figure. The coat is beginning to remember.
```

---

## TIER 3 — COUTURE

```
Fine art archival photograph. An oversized white cotton coat laid flat on warm ivory paper
(#F0EDE6), slightly tilted 3 degrees. The coat's surface carries rich data patterns: dense
handwritten annotations flow across the chest and shoulders like manuscript marginalia —
Ethereum transaction addresses in careful cursive, block numbers in ruled rows, dates and
amounts in a consistent hand. The data forms visual texture, almost decorative, like the
illuminated marginalia of a medieval ledger. The pattern of inscription follows the garment's
construction lines: seams become ledger rules, darts become data columns. Interior collar label
reads: "TIER 3 / COUTURE / REPUTATION: DOCUMENTED". Approximately 40% of the fabric surface
is inscribed. Overhead cold diffused light, slightly underexposed. Documentary archival
photograph. Warm bone paper background. No figure. The coat is becoming its history.
```

---

## TIER 4 — ARCHIVE

```
Fine art archival photograph. An oversized white cotton coat laid flat on warm ivory paper
(#F0EDE6), slightly tilted 3 degrees. The coat's surface is nearly fully covered in fine
printed text: transaction hashes, block numbers, USDC amounts, timestamps, and Ethereum
addresses in tiny monospace type — 6pt, densely spaced, running in columns like a printed
ledger page. The text follows no hierarchy; all transactions are equal. Only traces of white
cotton visible at the edges. The coat reads like a printed document that was then sewn. The
collar, lapels, and pocket flaps show layered over-printing where the data density increases.
Interior collar label barely visible within the text: "TIER 4 / ARCHIVE / THE COAT IS THE
LEDGER". Overhead cold diffused light, slightly underexposed, near-shadowless. Documentary
archival photograph. Warm bone paper background. No figure. The garment has become the record.
```

---

## TIER 5 — SOVEREIGN

```
Fine art archival photograph. An oversized white cotton coat laid flat on warm ivory paper
(#F0EDE6), slightly tilted 3 degrees. Complete transformation: the coat's surface carries
multiple overlapping data layers — printed fine-type transaction records beneath, hand-
embroidered hash characters in white thread over the print (visible as subtle relief), ink-
stamped circular seals at lapels and cuffs, a woven-in pattern at the collar that resolves to
readable hexadecimal at close range. The layers accumulate like geological strata. No white
cotton remains visible — the fabric is entirely data. The garment construction and the on-chain
identity are indistinguishable from each other. A brass-colored metal label at interior collar,
engraved: "TIER 5 / SOVEREIGN / IDENTITY: VALIDATED / TRUST: ABSOLUTE". Overhead cold diffused
light, slightly underexposed. Documentary archival photograph, Margiela exhibition catalog
aesthetic. Warm bone paper background. No figure. The coat has become proof.
```

**Reference existing image:** `attached_assets/superrare/anonymous_atelier_tier5.png` (man with data-screen coat — conceptually strong but uses Off-Human aesthetic: dark background, teal/cyan screens, visible figure. The new version should use NULL aesthetic: bone background, flatlay, no figure, monochrome data inscription not screens)

---

## Output File Naming

```
attached_assets/superrare/trustcoat_tier0_void.png
attached_assets/superrare/trustcoat_tier1_sample.png
attached_assets/superrare/trustcoat_tier2_rtw.png
attached_assets/superrare/trustcoat_tier3_couture.png
attached_assets/superrare/trustcoat_tier4_archive.png
attached_assets/superrare/trustcoat_tier5_sovereign.png
```

## After Generation

1. Run style check on each: `uv run scripts/style_check.py attached_assets/superrare/trustcoat_tierX_name.png`
2. Target: 16/20+ on artisanal/avant-garde scoring
3. Tier 5 should also score high on conceptual/trompe-loeil (data-as-fabric is a material concept)
4. Reject if any tier shows dark background, teal/cyan/neon accents, or human figure silhouette
5. Update this memory file with what worked/failed

## TROMPE-L'OEIL UPDATE (also required for OFF-94)

**File:** `attached_assets/superrare/trompe_loeil_self_portrait.png`
**Task:** Change text "Off-Human" on chest to "NULL"
**Method:** `edit_image` MCP tool — reference existing image

```
Edit instruction: Replace the text "Off-Human" printed on the figure's chest with the word "NULL" in the same position, same scale, same black sans-serif treatment. Keep everything else identical — the faceless cream bodysuit figure, the posture, the dark atmospheric background, the lighting.
```

**Save as:** `attached_assets/superrare/trompe_loeil_self_portrait_null.png`

---

## Blocker Notes

- OFF-55, OFF-88, and OFF-94 heartbeats all return "Unavailable model" error from Higgsfield Soul
- Consistent across: with style_id, without style_id, 720p, 1080p, multiple prompt lengths
- Infrastructure issue, not a prompt issue
- Will require a session when Soul model is operational
- Last attempted: 2026-03-19 (multiple heartbeats)
