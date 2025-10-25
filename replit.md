# Y2K E-Commerce Clothing Brand

## Project Overview
An early 2000s Flash-inspired e-commerce clothing brand website with cryptocurrency payment integration via x402 protocol. Features dark, grungy Y2K aesthetics with modern React functionality.

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
8. **Clean geometric Y2K aesthetic** - Light blue, black, white palette with subtle effects

## Design System
- **Colors**: Light blue primary (#87CEEB/sky blue), black, white - clean professional palette
- **Typography**: 
  - Display: Space Grotesk (geometric headings)
  - Body: Inter (clean, readable)
- **Effects**: Subtle 3% texture overlay, clean geometric panels, minimal shadows
- **Layout**: Horizontal timeline with snap scrolling
- **Spacing**: 4, 8, 12, 16, 24, 32 (Tailwind units)

## Asset Replacement Guide
All placeholder assets are clearly marked in the code:
- `YOUR-BRAND-LOGO` - Brand logo (navigation, footer)
- `HERO-IMAGE-VIDEO` - Hero section background
- `PRODUCT-IMG-*` - Product photography (catalog and detail pages)
- `BRAND-STORY-IMG-*` - About page images

Replace these placeholders with your actual brand assets while maintaining:
- Product images: 4:5 aspect ratio
- Hero images: 16:9 aspect ratio
- Dark, moody lighting for consistency

## Pages
1. **Home** (`/`) - Horizontal timeline: Hero → Products (3) → More Products (3) → Crypto → Footer
2. **Product Detail** (`/product/:id`) - Individual product with size selector
3. **Checkout** (`/checkout`) - Shipping info + crypto payment
4. **About** (`/about`) - Brand story and mission

## Horizontal Timeline Structure
The homepage uses a unique horizontal scrolling timeline layout:
- **Section 1 (0vw)**: Hero with "CYBER VOID" branding and CTA
- **Section 2 (100vw)**: First 3 products with "Latest Collection"
- **Section 3 (200vw)**: Next 3 products (if available)
- **Section 4 (300vw)**: Crypto payment information with X402 integration
- **Section 5 (400vw)**: Footer with links and contact info

### Technical Implementation
- Mouse wheel events convert vertical scroll to horizontal movement
- Each section uses `flex-none` and `minWidth: '100vw'` to prevent shrinking
- CSS snap scrolling (`snap-x snap-mandatory`) aligns sections to viewport
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
- Complete redesign from neon cyberpunk to clean geometric Y2K aesthetic
- Implemented full horizontal timeline layout (entire site scrolls left-to-right)
- Mouse wheel hijacking for horizontal navigation
- Product pop-up animations using Intersection Observer
- Light blue/black/white color palette (Theory7 2001 inspired)
- Clean geometric panels with subtle texture overlays
- Removed heavy VHS/glitch effects for minimal professional look
- Inter & Space Grotesk typography
- Snap scrolling between full-screen sections
- Backend API routes for products and orders
- Cart management with localStorage persistence
- Authentication system with Passport.js
- PostgreSQL database with size-specific inventory

## User Preferences
- Early 2000s Flash website aesthetic with horizontal timeline
- Clean, professional Y2K geometric design (NOT neon cyberpunk)
- Light sky blue, black, white color scheme
- Horizontal scroll experience where mouse wheel controls left/right navigation
- Products should pop up as users scroll through timeline
- Cryptocurrency-first payment approach via x402 protocol
