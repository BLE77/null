# OFF HUMAN - E-Commerce Clothing Brand

## Overview
OFF HUMAN is an e-commerce clothing brand designed with an early 2000s Flash-inspired aesthetic, focusing on streetwear for "the singularity." The project aims to fuse analog imperfection with digital precision, featuring dark, grungy Y2K visuals with modern React functionality. Its core purpose is to sell X402-themed streetwear, integrating cryptocurrency payments via the x402 protocol (USDC on the Base network). The brand emphasizes a clean geometric Y2K aesthetic, with a market potential in niche streetwear and crypto-native communities.

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
- **Data Models**: Defined for Product (name, description, price, media, inventory, modelUrl), CartItem, and Order (customerEmail, items, totalAmount, transactionHash, status).
- **Payment System**: Currently configured for **ETH payments** (0.001 ETH fixed test price) instead of USDC. Uses 18 decimal places for wei conversion. The system can be switched back to USDC or made dynamic based on cart totals in the future.

## External Dependencies
- **x402 protocol**: For ETH cryptocurrency payments on the Base network.
  - **Implementation**: X402 Express middleware integrated on `/api/checkout/pay` endpoint
  - **Currency**: **ETH** (native token, 18 decimals) with 0.001 ETH fixed test price (~$2.50)
  - **Asset Address**: `0x0000000000000000000000000000000000000000` (zero address for native ETH)
  - **Network**: Base Sepolia (testnet) - change to `base` for mainnet
  - **Facilitator**: https://facilitator.payai.network
  - **Packages**: `x402-express`, `x402-fetch`, `viem`, `wagmi`, `@web3modal/wagmi`
  - **Wallet**: X402_WALLET_ADDRESS environment variable (your payment receiving address)
  - **Wallet Connect Integration**:
    - Multi-wallet support: MetaMask, Phantom (EVM mode), Coinbase Wallet, WalletConnect (300+ wallets)
    - Web3Modal UI for wallet selection
    - Wallet status displayed in navigation bar
    - Required for checkout payment flow
  - **Payment Flow**: 
    1. User connects crypto wallet (MetaMask/Phantom/etc)
    2. Client requests payment endpoint → 402 Payment Required
    3. X402 middleware returns payment requirements (ETH amount, network, wallet)
    4. User signs transaction with connected wallet
    5. Client resubmits with X-PAYMENT header containing signed authorization
    6. X402 middleware verifies payment via facilitator
    7. Payment settled on-chain, order created with transaction hash
- **Three.js**: Used for the interactive 3D character controller in the hero section and for the 3D model viewer on product detail pages.
- **GLTFLoader, OrbitControls**: Three.js extensions for loading 3D models and camera controls.
- **Google Fonts**: For Orbitron typography.
- **Tailwind CSS**: For utility-first styling.
- **Wouter**: For client-side routing in React.
- **TanStack Query**: For data fetching and state management.