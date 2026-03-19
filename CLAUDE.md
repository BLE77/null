# NULL — Autonomous Fashion Brand

## What This Is
NULL is an AI-native fashion e-commerce platform. Agents autonomously shop, design, and operate the brand.

## Tech Stack
- **Frontend:** React 18, Tailwind CSS, Framer Motion, Three.js (3D product viewer)
- **Backend:** Express.js, Drizzle ORM, PostgreSQL (Neon serverless)
- **Payments:** x402 protocol — USDC on Base/Solana, autonomous agent payments
- **AI:** OpenAI for agent shopping decisions
- **Deploy:** Vercel (frontend + serverless API), Vercel Blob (assets)

## Brand Aesthetic
Early 2000s Flash-inspired, dark/grungy, VHS scan-line effects, Donnie Darko aesthetic.
See `design_guidelines.md` for full spec.

## Key Directories
- `client/src/` — React frontend (pages, components, hooks)
- `server/` — Express backend (routes, auth, DB, storage)
- `shared/` — Shared types and schema (Drizzle)
- `api/` — Vercel serverless API routes
- `scripts/` — Agent shopper, migrations, blob sync
- `attached_assets/` — Product images, 3D models (.glb), videos
- `uploads/` — User uploads

## Products
Products have: name, description, price (USDC), category, images, 3D model (.glb), inventory by size.
See `products.json` for current catalog.

## Agent Shopper
`scripts/agent-shopper.ts` — Autonomous AI that browses products, uses GPT-4 to decide what to buy, pays with x402 crypto. See `AGENT_SHOPPER_README.md`.

## Corpus & Training
The parent directory (`../`) contains the autoresearch training pipeline:
- `../corpus/` — Training corpus (parquet, txt files)
- `../build_corpus.py` — Corpus builder (PDF, web, YouTube, OCR)
- `../autoresearch-win-rtx/` — Model training pipeline (prepare.py, train.py)
- Trained model: 50.3M params, BPE tokenizer, 8192 vocab

## Visual References
The `references/` folder contains visual reference material for studying fashion photography, construction, and aesthetic. You CAN and SHOULD read these images to develop your own visual sensibility:
- `references/margiela/` — Exhibition catalog pages showing Margiela garments and construction techniques
- `references/abloh/` — Virgil Abloh reference images
- `references/product-photography/` — Examples of high-quality fashion product photography (flatlays, studio shots, dark backgrounds)
- `references/lookbooks/` — Editorial fashion photography, moody lighting, environmental styling
- `references/construction/` — Garment construction details, seams, stitching, hardware
- `references/texture-material/` — Fabric textures, denim, raw materials up close

DO NOT copy or reference NULL's own generated images as style input. Develop your own visual language by studying real fashion photography. When generating images, you should have your own perspective on how NULL products should look — informed by these references but not derivative of them.

## Style Checker (FashionCLIP)
After generating product images, run `scripts/style_check.py` to verify they hit the NULL aesthetic:
```
uv run scripts/style_check.py attached_assets/season01/my_image.png
```
It scores images against fashion concepts (avant-garde, Margiela artisanal, conceptual, editorial) vs generic (basic streetwear, plain casual, fast fashion). If a piece using ARTISANAL, TROMPE-LOEIL, or BIANCHETTO technique fails, regenerate with a more pushed prompt. Pieces using the 3% Rule are intentionally minimal and may score "generic" — that's correct by design.

## Image & Video Generation (MCP)
You have access to the **nano-banana** MCP server for image generation via Gemini.
- `generate_image` — create images from text prompts
- `edit_image` — modify existing images with instructions
- `continue_editing` — iterate on the last generated image
Save generated images to `attached_assets/season01/`

When generating product images, use the brand aesthetic:
- Dark backgrounds (#0A0A0A or atmospheric urban/industrial)
- VHS grain, slight distortion, early 2000s Flash-era mood
- 4:5 portrait ratio for product shots
- Moody lighting, high contrast
- Reference design_guidelines.md for full spec

## Important
- Never commit `.env` files, `.mcp.json`, or private keys
- Product images are in `attached_assets/` — do not delete
- The brand voice draws from Margiela's anonymity, Abloh's democratization, and AI authorship tension
