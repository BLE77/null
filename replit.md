# Y2K E-Commerce Clothing Brand

## Project Overview
An early 2000s Flash-inspired e-commerce clothing brand website with cryptocurrency payment integration via x402 protocol. Features dark, grungy Y2K aesthetics with modern React functionality.

## Architecture
- **Frontend**: React SPA with Wouter routing, TanStack Query for data fetching
- **Backend**: Express.js with in-memory storage
- **Payment**: x402 protocol for USDC cryptocurrency payments on Base network
- **Styling**: Tailwind CSS with custom Y2K/retro theme

## Key Features
1. **Full-screen immersive hero section** with Y2K aesthetic
2. **Product catalog** with asymmetric grid layout
3. **Product detail pages** with image galleries and size selection
4. **Shopping cart** with slide-in sidebar interface
5. **Cryptocurrency checkout** via x402 protocol (USDC on Base)
6. **Responsive design** maintaining nostalgic vibe across devices
7. **VHS scan-line effects** and grain overlays for authentic retro feel
8. **Distressed typography** using Bebas Neue and Teko fonts

## Design System
- **Colors**: Dark background (#0F0F0F), neon pink primary (#FF2E63), cyan accent (#2AC3BC)
- **Typography**: 
  - Display: Bebas Neue (uppercase headers)
  - Headings: Teko (condensed secondary)
  - Body: Inter (clean, readable)
- **Effects**: VHS scanlines, grain overlays, glitch animations
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
1. **Home** (`/`) - Hero + product grid + footer
2. **Product Detail** (`/product/:id`) - Individual product with size selector
3. **Checkout** (`/checkout`) - Shipping info + crypto payment
4. **About** (`/about`) - Brand story and mission

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
- Initial project setup with dark Y2K theme
- Complete frontend with all pages and components
- In-memory storage with sample products
- Cart management with robust localStorage persistence (SSR-safe)
- Responsive navigation and mobile menu
- VHS/retro visual effects system
- Backend API routes for products and orders
- Order creation with backend integration
- Comprehensive error handling across all pages
- Loading states with skeleton screens
- Fixed Link component nesting issues

## User Preferences
- Early 2000s Flash website aesthetic (Donnie Darko inspiration)
- Cryptocurrency-first payment approach
- Dark, grungy, experimental design
- Clear asset replacement system for brand customization
