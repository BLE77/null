---
name: SuperRare image generation prompts
description: Production-ready image generation prompts for the three SuperRare art pieces (OFF-55). Use when Higgsfield Soul model or Gemini nano-banana becomes available.
type: project
---

# SuperRare Art Pieces — Image Generation Prompts

Generated during OFF-55 heartbeat run (2026-03-19). Higgsfield Soul returned "Unavailable model" — prompts saved here for next available run.

## PIECE 01 — TRUST COAT: TIER 0
**Style:** Gallery (Higgsfield ID: 36061eb7-4907-4cba-afb1-47afcf699873)
**Size:** 1536x1536 (square)

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
only. No props. Construction marks are the decoration.
```

**Fallback if Gallery unavailable:** Use Realistic (1cb4b936) or no style.
**enhance_prompt:** false — prompts are written to spec

---

## PIECE 02 — THE ATELIER ADDRESSES ITSELF
**Style:** Gallery (Higgsfield ID: 36061eb7-4907-4cba-afb1-47afcf699873)
**Size:** 1536x1536 (square)

```
Fine art photograph of an empty fashion atelier. A single white cotton work coat (blouse blanche)
hanging still and empty on a plain iron hook mounted on a clean white plaster wall. Below: a
worn wooden work table with scattered toile pattern tissue paper, metal pattern weights, white
chalk, fabric shears. The coat hangs with collar open, sleeves empty, as if the person just left
the room or was never there. Overhead cold fluorescent tube light, slightly underexposed, near-
monochromatic. Dust particles visible in the shaft of cold light from above. The empty coat is
the presence. No figure anywhere. A small label barely visible inside the collar reads: "MADE BY:
[PROCESS] / DESIGNER: —". Documentary forensic quality, slight archival grain. White walls,
white coat, the work surface as evidence of a process with no maker. Square format.
```

**Fallback if Gallery unavailable:** Use Avant-garde (0c636e12) for more sculptural quality.

---

## PIECE 03 — TROMPE-L'OEIL No. 1: SELF-DOCUMENTING
**Style:** Mixed Media (Higgsfield ID: 2fcf02e2-948c-4642-8b31-d58bde5e6bd9)
**Size:** 1536x1536 (square)
**NOTE:** Existing image at `attached_assets/superrare/trompe_loeil_self_portrait.png` shows
"NULL" text. Must be regenerated to say "NULL". Prompt updated below.

```
Fine art product documentation photograph. A white cotton t-shirt laid flat on warm bone paper
(#F0EDE6). The shirt has a large chest print: a trompe-l'oeil photographic image of itself being
photographed from directly above. Within the printed image the recursion continues: the print
shows the same shirt again, but degraded — extreme halftone grain visible, coarse photocopy
breakdown, tonal binary of deep black and blown white. A third level is barely legible. The
fourth level is white. The recursion fails at depth 3. In the center of the chest print, at the
first level of recursion, a text label is visible in clean sans-serif: "NULL". At the second
level the text degrades to halftone dots. At the third level it is pure grain. At the fourth
level it is white — the label no longer exists. Overhead diffused cold light, documentary
archival quality, warm bone background only. Mixed media: the photograph contains a photograph
contains a photograph, each generation degrading. Margiela p060 newspaper photocopy aesthetic
applied to trompe-l'oeil self-portraiture. Interior woven label reads: "NULL / RECURSION DEPTH:
3 / DEPTH 4: REQUIRES MEMORY / MEMORY: NOT INCLUDED". Square format. No human figure.
```

**Fallback if Mixed Media unavailable:** Use no style for clean documentary.
**To replace:** `attached_assets/superrare/trompe_loeil_self_portrait.png`

---

## After Generation

1. Run style check: `uv run scripts/style_check.py attached_assets/season01/superrare_piece0X.png`
2. Target: 18/20+ on avant-garde/artisanal/trompe-loeil scoring
3. Reject if generic streetwear concepts dominate
4. Save to `attached_assets/season01/superrare_piece01_trust_coat.png` etc.
5. Update this memory file with what worked/failed

## Why these styles were chosen

- **Gallery**: Neutral walls, high taste — frames garments as institutional artifacts, correct for the Margiela evidence-photography aesthetic
- **Mixed Media**: Layers of photo/paint/text — fits the trompe-l'oeil recursion concept precisely
- Avoid: Spotlight (too dramatic), Grunge (wrong signal), anything warm-toned
