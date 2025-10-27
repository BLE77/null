# OFF HUMAN - E-Commerce Clothing Brand

## Project Overview
OFF HUMAN — streetwear for the singularity. An early 2000s Flash-inspired e-commerce clothing brand website with cryptocurrency payment integration via x402 protocol. Built at the edge of human and machine, fusing analog imperfection with digital precision. Features dark, grungy Y2K aesthetics with modern React functionality.

## Architecture
- **Frontend**: React SPA with Wouter routing, TanStack Query for data fetching
- **Backend**: Express.js with in-memory storage
- **Payment**: x402 protocol for USDC cryptocurrency payments on Base network
- **Styling**: Tailwind CSS with custom Y2K/retro theme

## Key Features
1. **Vertical scrolling layout** - Traditional up/down scrolling for intuitive navigation
2. **Product animations** - Items pop up with scale/fade effects as they scroll into view
3. **Full-screen immersive sections** - Hero, products, crypto, footer use min-h-screen
4. **Product detail pages** with image galleries and size selection
5. **Shopping cart** with slide-in sidebar interface
6. **Cryptocurrency checkout** via x402 protocol (USDC on Base)
7. **Clean geometric Y2K aesthetic** - Neon green (Matrix), black, white palette with glitch effects

## Design System
- **Colors**: Neon green primary (#00FF41/Matrix green) for accents, white text for readability
  - Green accents: buttons, borders, dividers, logo glow, focus rings
  - White text: all copy for maximum readability over dark cityscape background
- **Typography**: 
  - Headers: NCLRekron (custom Y2K font with 4 TTF variants: Regular, Slant, Outline, OutlineSlant)
  - Body: Orbitron (bold geometric futuristic font from Google Fonts)
  - All text: White (`text-white`) with dark drop shadows (`drop-shadow-[0_4px_8px_rgba(0,0,0,0.9)]`) for readability over dark background
- **Logo**: Glitchy OFF HUMAN logo with scan line effect
  - Hero: Large animated logo with RGB split, horizontal jitter, and scrolling scan lines (3s cycle)
  - Nav: Compact logo with subtle glow on hover
  - Accessibility: Animations disabled for users with reduced motion preference
- **Background**: Black digital Matrix-style pattern with subtle green grid lines and radial dots
- **Product Sizing**: Fixed 280px × 380px dimensions for full robot figures (heads visible)
- **Effects**: Transparent sections, background visible throughout, no opaque panels
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
1. **Home** (`/`) - Vertical scrolling: Hero → Products (3) → More Products (3) → Crypto → Footer
2. **Shop** (`/shop`) - Grid layout showing all products with images, prices, and available sizes
3. **Product Detail** (`/product/:id`) - Individual product with size selector
4. **Checkout** (`/checkout`) - Shipping info + crypto payment
5. **About** (`/about`) - Brand story focused on "clankers" and sustainability

## Page Structure
The homepage uses a traditional vertical scrolling layout:
- **Section 1**: Hero with "OFF HUMAN" branding and CTA
- **Section 2**: First 3 products with "Latest Collection" background text
- **Section 3**: Next 3 products (if available)
- **Section 4**: Crypto payment information with X402 integration
- **Section 5**: Footer with links and contact info

### Technical Implementation
- Normal vertical scrolling (up/down)
- Each section uses `min-h-screen` for full viewport height
- Smooth scroll behavior for anchor navigation
- Intersection Observer triggers product animations as they scroll into view
- Sections stack vertically in natural reading order

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
- **Shop page created** - New /shop route with grid layout showing all products (images, prices, sizes) matching landing page design
- **About page redesign** - Updated with "clankers" messaging and sustainability focus (3D objects, fair labor, carbon-neutral, zero waste)
- **Footer updates** - Instagram/Discord show "Coming Soon!" on hover, Twitter links to https://x.com/off__human
- **Reduced spacing** - Removed min-h-screen from second product row and crypto section for tighter layout
- **Text updates** - "LATEST COLLECTION" centered and higher, button says "Explore ↓", About text shortened
- **Vertical scrolling** - Converted from horizontal timeline to traditional up/down scrolling for better usability
- **LATEST COLLECTION background text** - Repositioned behind robots (z-0) as subtle background element with 40% opacity, single line (whitespace-nowrap), and larger text (text-6xl md:text-8xl)
- **Enhanced CRYPTO PAYMENTS header** - Larger Orbitron uppercase typography (text-5xl md:text-6xl) with darker shadows for visibility
- **Metallic green chrome navigation** - Navigation bar and CTA button feature chrome-like metallic green gradient with shine effects
- **Lighter neon green accents** - Updated from HSL(123, 100%, 50%) to HSL(140, 90%, 65%) for better logo cohesion
- **Transparent logo with dark shadow** - OFF HUMAN logo now uses transparent background with enhanced dark shadow/glow for visibility
- **Black digital background** - Replaced cityscape with Matrix-style black pattern featuring green grid lines and dots
- **Larger robot sizing** - Increased from 240px × 300px to 280px × 380px so heads aren't cut off
- **Glitchy logo integration** - Replaced text with animated OFF HUMAN logo featuring RGB split, scan lines, and Y2K glitch effects  
- **Brand refresh** - Changed name from "CYBER VOID" to "OFF HUMAN" with singularity-focused messaging
- **Perfect vertical alignment** - All robot figures now align from the same top position using items-start and object-cover
- **Fixed-dimension layout** - Text elements no longer affect product card sizing using inline styles
- **Smooth scrolling** - Changed from snap scrolling to continuous smooth horizontal scrolling for natural feel
- **White text with drop shadows** - All text styled for maximum readability over dark background
- **Robot figure products** - Robot/human figure PNGs showing products on models with transparent backgrounds
- **Transparent sections** - Removed all opaque backgrounds for unified visual continuity
- **Robot image mapping** - Created `robot-images.ts` helper with case-insensitive product name lookups
- **Custom typography** - NCLRekron OTF font for hero logo, Orbitron for all body text and headers
- **Real product integration** - 6 authentic X402 streetwear designs with robot model imagery

## User Preferences
- Early 2000s Flash website aesthetic with Y2K design
- Seamless digital Matrix design - black background with green grid pattern visible throughout entire site
- All text white with dark drop shadows for readability over dark background
- No opaque panels or backgrounds blocking the background view
- Robot/human figure product images overlaid on black digital background
- Normal vertical scrolling (up/down) for intuitive navigation
- Products pop up with animations as users scroll through the page
- Cryptocurrency-first payment approach via x402 protocol
