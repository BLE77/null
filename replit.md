# OFF HUMAN - E-Commerce Clothing Brand

## Overview
OFF HUMAN is an e-commerce clothing brand designed with an early 2000s Flash-inspired aesthetic, focusing on streetwear for "the singularity." The project aims to fuse analog imperfection with digital precision, featuring dark, grungy Y2K visuals with modern React functionality. Its core purpose is to sell X402-themed streetwear, integrating cryptocurrency payments via the x402 protocol (USDC on the Base network). The brand emphasizes a clean geometric Y2K aesthetic, with a market potential in niche streetwear and crypto-native communities.

## Recent Changes

### Digital Product Delivery System (October 30, 2025)
Implemented complete product delivery system for digital goods:
- **Email Integration**: Resend connector setup for transactional order confirmation emails
- **Tracking Tokens**: Unique tracking tokens generated for each order (format: `OFF-XXXX-XXXX`) stored in database with unique constraint
- **Order Schema Updates**: Added `trackingToken` (unique) and `network` fields to orders table
- **Email Service** (`server/email.ts`): Sends Y2K-styled HTML emails with:
  - Tracking token for customer records
  - Transaction details (hash, network, amount)
  - Direct download links to GLB 3D models and PNG thumbnails for each purchased product
  - Re-download page link using tracking token
- **Post-Payment Flow**: Both Base and Solana checkout endpoints now:
  1. Generate unique tracking token
  2. Create order with token and network info
  3. Send delivery email with product files
  4. Log email success/failure (non-blocking - payment still succeeds if email fails)
- **Download Endpoint**: `/api/orders/download/:trackingToken` allows customers to re-download products anytime using their tracking token
- **Product Data Fix**: Checkout endpoints now retain full product objects in validatedItems to access modelUrl and imageUrl for email generation

### Solana Mainnet Support with PayAI Fee Payer (October 30, 2025)
Implemented full Solana mainnet USDC payments with PayAI facilitator integration:
- **PayAI Settlement**: Uses `/settle` endpoint (not `/verify`) - PayAI submits transactions to Solana blockchain and returns signatures
- **Response Fields**: Settlement response returns `success` and `transaction` fields (not `isValid` and `signature`)
- **Fee Payer Configuration**: Added `extra: { feePayer: "2wKupLR9q6wXYppw8Gr2NvWxKBUqm4PPJKkQfoxHDBg4" }` to payment requirements - PayAI's wallet pays transaction fees, enabling gasless payments for users
- **Dual Network Support**: Configured both mainnet (`EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v`) and devnet USDC mint addresses
- **Manual Verification**: Direct facilitator API integration for full control over payment flow
- **Dynamic Pricing**: Implemented server-side cart validation and dynamic payment amounts (same as Base)
- **Network Selection**: Environment variable `SOLANA_NETWORK` controls mainnet vs devnet (defaults to mainnet)
- **Base Payment Fix**: Corrected verification to check `isValid` field instead of `valid` - payments were being verified but rejected due to field name typo

### Dynamic Pricing Implementation (October 30, 2025)
Replaced fixed $2.50 test pricing with full dynamic pricing system:
- **Backend**: Replaced x402-express paymentMiddleware with direct facilitator API integration to support variable payment amounts. Server-side cart validation fetches products from DB, calculates totals, and rejects requests with price mismatches (>$0.01 tolerance) to prevent client-side price manipulation.
- **Frontend**: Cart context calculates totals using `product.price × quantity` for all items. Checkout displays actual totals dynamically and sets x402 max payment amount to `cart total + 10% buffer` instead of hardcoded limits.
- **Agent Script**: Increased autonomous shopping budget from $10 to $100 to handle higher-priced products.
- **Testing**: End-to-end checkout test verified multi-item cart totals ($4.00 + $1.00 = $5.00) display and calculate correctly.
- **x402 Protocol**: Both Base and Solana endpoints now use dynamic payment requirements calculated per-request based on actual cart contents.

## User Preferences
- Early 2000s Flash website aesthetic with Y2K design
- Seamless digital Matrix design - black background with green grid pattern visible throughout entire site
- All text white with dark drop shadows for readability over dark background
- No opaque panels or backgrounds blocking the background view
- Robot/human figure product images overlaid on black digital background
- Normal vertical scrolling (up/down) for intuitive navigation
- Products pop up with animations as users scroll through the page
- Cryptocurrency-first payment approach via x402 protocol

## System Architecture
The project utilizes a React SPA frontend with Wouter for routing and TanStack Query for data fetching. The backend is an Express.js server using in-memory storage. Styling is handled by Tailwind CSS with a custom Y2K/retro theme.

**UI/UX Decisions:**
- **Color Scheme**: Neon green (Matrix #00FF41) for accents, white text, and a black digital Matrix-style background with subtle green grid lines and radial dots.
- **Typography**: Headers use NCLRekron (custom Y2K font), and body text uses Orbitron (bold geometric futuristic font) from Google Fonts, all in white with dark drop shadows for readability.
- **Logo**: Glitchy OFF HUMAN logo with RGB split, horizontal jitter, and scrolling scan line effects. A compact version for navigation.
- **Product Display**: Fixed 280px × 380px dimensions for robot figures, allowing seamless overlay on the digital background. Transparent PNGs are used for products.
- **Layout**: Traditional vertical scrolling layout. Full-screen immersive sections (`min-h-screen`) for Hero, Products, Crypto, and Footer. Intersection Observer triggers product animations on scroll.
- **Interactive Elements**: Hero section features an interactive 3D character controller scene using Three.js with animations, OrbitControls, and a splash screen with intro audio. WebGL detection includes a graceful fallback.
- **Admin Dashboard**: A full-featured admin system allows product creation, editing, deletion, media uploads (thumbnails, galleries, 3D models), and inventory management.

**Technical Implementations:**
- **Product Catalog**: Features 6 X402-themed streetwear designs displayed on robot/human figure PNGs. Product detail pages include image galleries, size selection, and an AI model-based sizing system (S/M/L/XL corresponding to parameter ranges).
- **Shopping Cart**: Implemented with a slide-in sidebar interface.
- **Pages**: Home (`/`), Shop (`/shop`), Product Detail (`/product/:id`), Checkout (`/checkout`), and About (`/about`).
- **Data Models**: Defined for Product (name, description, price, media, inventory, modelUrl), CartItem, and Order (customerEmail, items, totalAmount, transactionHash, network, trackingToken, status).
- **Payment System**: Dual-network cryptocurrency payments supporting **USDC on both Base and Solana networks**. **Dynamic pricing** - charges actual cart total based on product prices and quantities. Uses 6 decimal places for USDC micro-units. Network selection UI on checkout page. Server-side validation prevents price manipulation by recalculating totals from database prices.
- **Checkout Flow**: Email-only requirement (no shipping address). Users select network (Base/Solana), connect appropriate wallet, enter email, and complete payment. Payment amount is calculated dynamically based on cart contents. After successful payment, customers receive delivery email with tracking token and product download links.
- **Product Delivery**: Digital products (GLB 3D models + PNG thumbnails) delivered via email immediately after payment. Customers can re-download anytime using their unique tracking token at `/api/orders/download/:trackingToken`.

## External Dependencies
- **x402 protocol**: For USDC cryptocurrency payments on dual networks (Base + Solana).
  
  **Base Network Implementation:**
  - **Endpoint**: `/api/checkout/pay` with direct facilitator API integration (manual x402 handling)
  - **Currency**: USDC (6 decimals) with **dynamic pricing** based on actual cart totals
  - **Asset Address**: `0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913` (USDC on Base Mainnet)
  - **Network**: **Base Mainnet** (production) - real USDC payments enabled
  - **Packages**: `x402-fetch`, `viem`, `wagmi`, `@web3modal/wagmi`
  - **Wallets**: MetaMask, Coinbase Wallet, WalletConnect (300+ wallets), Phantom (EVM mode)
  - **Payment Flow**: 
    1. User connects EVM wallet via Web3Modal
    2. Client calculates cart total from product prices × quantities
    3. Client requests payment endpoint with cart items → 402 Payment Required
    4. Server fetches products from DB, calculates server-side total, validates against client total
    5. Server returns 402 with dynamic payment requirements (actual cart amount, network, wallet)
    6. wrapFetchWithPayment automatically signs transaction with connected wallet
    7. Client resubmits with X-PAYMENT header containing signed authorization
    8. Server verifies payment with facilitator using direct HTTP POST to /verify endpoint
    9. Payment settled on-chain, order created with transaction hash, tracking token, and network
    10. Server sends delivery email with tracking token and product download links (GLB + PNG files)
  
  **Solana Network Implementation:**
  - **Endpoint**: `/api/checkout/pay/solana` with manual x402 verification (direct facilitator integration)
  - **Currency**: USDC (6 decimals) with **dynamic pricing** based on actual cart totals
  - **Asset Addresses**: 
    - Mainnet: `EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v` (USDC SPL token)
    - Devnet: `4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU` (USDC test token)
  - **Network**: Configurable via `SOLANA_NETWORK` environment variable (`"solana"` for mainnet, `"solana-devnet"` for devnet). Defaults to mainnet.
  - **CRITICAL REQUIREMENT**: Payment requirements must include PayAI's fee payer wallet in `extra` field: `{ feePayer: "2wKupLR9q6wXYppw8Gr2NvWxKBUqm4PPJKkQfoxHDBg4" }`. This wallet pays Solana transaction fees, enabling gasless payments for end users.
  - **Packages**: `x402-solana`, `@solana/web3.js`, `bs58`
  - **Wallets**: Phantom (Solana mode), Backpack
  - **Payment Flow**:
    1. User connects Solana wallet via window.solana
    2. Client calculates cart total from product prices × quantities
    3. Client requests payment endpoint with cart items → 402 Payment Required
    4. Server fetches products from DB, calculates server-side total, validates against client total
    5. Server returns 402 with dynamic payment requirements including PayAI fee payer in `extra` field
    6. Client creates x402 client with wallet adapter and network config
    7. Client calls x402Client.fetch() which automatically handles transaction signing and payment submission
    8. Server decodes payment header and submits to facilitator via direct HTTP POST to /settle endpoint
    9. PayAI submits transaction to Solana blockchain and returns signature in response
    10. Order created with transaction signature, tracking token, and network
    11. Server sends delivery email with tracking token and product download links (GLB + PNG files)
  
  **Shared Configuration:**
  - **Facilitator**: https://facilitator.payai.network
  - **Fee Payer**: `2wKupLR9q6wXYppw8Gr2NvWxKBUqm4PPJKkQfoxHDBg4` (PayAI's Solana wallet for transaction fees)
  - **Wallet Address**: X402_WALLET_ADDRESS environment variable (payment receiving address)
  - **Network Selection**: Users choose Base or Solana on checkout page
  - **Status**: 
    - ✅ **Base mainnet payments: ENABLED** - Production-ready with real USDC on Base network
    - ✅ **Solana mainnet payments: ENABLED** - Production-ready with PayAI fee payer configuration
    - ✅ Solana devnet payments: **Available for testing**
- **Three.js**: Used for the interactive 3D character controller in the hero section and for the 3D model viewer on product detail pages.
- **GLTFLoader, OrbitControls**: Three.js extensions for loading 3D models and camera controls.
- **Google Fonts**: For Orbitron typography.
- **Tailwind CSS**: For utility-first styling.
- **Wouter**: For client-side routing in React.
- **TanStack Query**: For data fetching and state management.