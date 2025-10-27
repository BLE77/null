# OFF HUMAN - E-Commerce Clothing Brand

## Project Overview
OFF HUMAN — streetwear for the singularity. An early 2000s Flash-inspired e-commerce clothing brand website with cryptocurrency payment integration via x402 protocol. Built at the edge of human and machine, fusing analog imperfection with digital precision. Features dark, grungy Y2K aesthetics with modern React functionality.

## Architecture
- **Frontend**: React SPA with Wouter routing, TanStack Query for data fetching
- **Backend**: Express.js with in-memory storage
- **Payment**: x402 protocol for USDC cryptocurrency payments on Base network
- **Styling**: Tailwind CSS with custom Y2K/retro theme

## Key Features
1. **Horizontal timeline layout** - Entire website scrolls left-to-right like an early 2000s Flash site
2. **Mouse wheel hijacking** - Vertical scroll converts to horizontal navigation
3. **Product animations** - Items pop up with scale/fade effects as they scroll into view
4. **Full-screen immersive sections** - Hero, products, crypto, footer snap to viewport
5. **Product detail pages** with image galleries and size selection
6. **Shopping cart** with slide-in sidebar interface
7. **Cryptocurrency checkout** via x402 protocol (USDC on Base)
8. **Clean geometric Y2K aesthetic** - Neon green (Matrix), black, white palette with glitch effects

## Design System
- **Colors**: Neon green primary (#00FF41/Matrix green) for accents, white text for readability
  - Green accents: buttons, borders, dividers, logo glow, focus rings
  - White text: all copy for maximum readability over dark cityscape background
- **Typography**: 
  - Headers: NCLRekron (custom Y2K font with 4 TTF variants: Regular, Slant, Outline, OutlineSlant)
  - Body: Orbitron (bold geometric futuristic font from Google Fonts)
  - All text: White (`text-white`) with dark drop shadows (`drop-shadow-[0_4px_8px_rgba(0,0,0,0.9)]`) for readability over cityscape
- **Logo**: Glitchy OFF HUMAN logo with scan line effect
  - Hero: Large animated logo with RGB split, horizontal jitter, and scrolling scan lines (3s cycle)
  - Nav: Compact logo with subtle glow on hover
  - Accessibility: Animations disabled for users with reduced motion preference
- **Background**: Futuristic city street with modern buildings and wet pavement (background-size: cover, repeats horizontally)
- **Product Sizing**: Fixed 240px × 300px dimensions for uniform robot figures
- **Effects**: Transparent sections, cityscape visible throughout, no opaque panels
- **Layout**: Horizontal timeline with smooth continuous scrolling
- **Spacing**: 4, 8, 12, 16, 24, 32 (Tailwind units)

## Real Product Catalog
The store now features 6 authentic X402-themed streetwear designs:

1. **X402 PROTOCOL TEE** ($75) - Cybernetic hands exchanging encrypted data with airbrushed gradient graphics
2. **CLANKERS SKULL TEE** ($70) - Neon green skull with Japanese text, dark distressed aesthetic
3. **PROVE YOU'RE NOT HUMAN** ($68) - Green glitch verification graphic with Y2K tech vibes
4. **X402 CALL TEE** ($72) - Retro phone with robotic hand, nostalgic tech design
5. **CLANKERS BMX HOODIE** ($125) - Robot on BMX bike, premium heavyweight hoodie
6. **CYBER ARMS LONGSLEEVE** ($85) - Geometric robotic arms on long sleeve premium cotton

Products display as robot/human figure PNGs showing the clothing on models, creating a seamless overlay on the cityscape background:
- Robot images imported from `attached_assets/` and mapped via `client/src/lib/robot-images.ts`
- Transparent PNG backgrounds blend seamlessly with cityscape
- Full descriptions and pricing (shown on detail pages only)
- Size-specific inventory (S, M, L, XL, XXL)
- Multiple angles/images for detail pages
- Clickable robot figures navigate to product detail pages

## Pages
1. **Home** (`/`) - Horizontal timeline: Hero → Products (3) → More Products (3) → Crypto → Footer
2. **Product Detail** (`/product/:id`) - Individual product with size selector
3. **Checkout** (`/checkout`) - Shipping info + crypto payment
4. **About** (`/about`) - Brand story and mission

## Horizontal Timeline Structure
The homepage uses a unique horizontal scrolling timeline layout:
- **Section 1 (0vw)**: Hero with "OFF HUMAN" branding and CTA
- **Section 2 (100vw)**: First 3 products with "Latest Collection"
- **Section 3 (200vw)**: Next 3 products (if available)
- **Section 4 (300vw)**: Crypto payment information with X402 integration
- **Section 5 (400vw)**: Footer with links and contact info

### Technical Implementation
- Mouse wheel events convert vertical scroll to horizontal movement
- Each section uses `flex-none` and `minWidth: '100vw'` to prevent shrinking
- Smooth continuous scrolling (no snap points) for natural flow
- Intersection Observer triggers product animations as they scroll into view
- Total timeline width: ~500vw (5 sections × 100vw each)

## Data Models
- **Product**: name, description, price, category, imageUrl, images[], sizes[], inStock
- **CartItem**: product, size, quantity
- **Order**: customerEmail, items, totalAmount, transactionHash, status

## Payment Integration (x402)
The site is designed to integrate with x402 protocol for cryptocurrency payments:
- Accepts USDC on Base network
- Instant settlement (~200ms)
- No accounts or subscriptions required
- Currently mocked for development (ready for x402-express integration)

## Recent Changes
- **Neon green Matrix color** - Changed from light blue to electric neon green (#00FF41) for all accents
- **Glitchy logo integration** - Replaced text with animated OFF HUMAN logo featuring RGB split, scan lines, and Y2K glitch effects  
- **Brand refresh** - Changed name from "CYBER VOID" to "OFF HUMAN" with singularity-focused messaging
- **Perfect vertical alignment** - All robot figures now align from the same top position using items-start and object-cover
- **Smaller uniform product PNGs** - Robot figures now use fixed 240px × 300px dimensions for consistent sizing
- **Fixed-dimension layout** - Text elements no longer affect product card sizing using inline styles
- **Updated background** - New futuristic city street background with modern buildings and wet pavement
- **Smooth scrolling** - Changed from snap scrolling to continuous smooth horizontal scrolling for natural feel
- **Seamless cityscape design** - Cityscape background now covers full viewport (background-size: cover), visible across all sections with no opaque panels blocking the view
- **White text with drop shadows** - All text styled as `text-white` with `drop-shadow-[0_4px_8px_rgba(0,0,0,0.9)]` for maximum readability over dark cityscape
- **Robot figure products** - Replaced shirt PNGs with robot/human figure PNGs showing products on models, seamlessly overlaid on cityscape
- **Transparent sections** - Removed all opaque backgrounds (bg-white, bg-card, bg-background, bg-secondary) for unified visual continuity
- **Robot image mapping** - Created `robot-images.ts` helper with case-insensitive product name lookups, serves images from /attached_assets/
- **Fixed NCLRekron font loading** - Configured Express to serve font files with proper MIME types (font/otf)
- **Custom NCLRekron + Orbitron typography** - NCLRekron OTF font for headers, Orbitron for all body text
- **Real product integration** - 6 authentic X402 streetwear designs with robot model imagery
- Implemented full horizontal timeline layout (entire site scrolls left-to-right)
- Mouse wheel hijacking for horizontal navigation
- Product pop-up animations using Intersection Observer
- Backend API routes for products and orders
- Cart management with localStorage persistence
- Authentication system with Passport.js
- PostgreSQL database with size-specific inventory

## User Preferences
- Early 2000s Flash website aesthetic with horizontal timeline
- Seamless cityscape-first design - futuristic skyline background visible throughout entire site
- All text white with dark drop shadows for readability over cityscape
- No opaque panels or backgrounds blocking the cityscape view
- Robot/human figure product images overlaid on cityscape background
- Horizontal scroll experience where mouse wheel controls left/right navigation
- Products pop up with animations as users scroll through timeline
- Cryptocurrency-first payment approach via x402 protocol
