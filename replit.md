# OFF HUMAN - E-Commerce Clothing Brand

## Overview
OFF HUMAN is an e-commerce clothing brand that merges an early 2000s Flash-inspired aesthetic with modern React functionality. It specializes in X402-themed streetwear, targeting niche streetwear and crypto-native communities. The brand aims to fuse analog imperfection with digital precision, utilizing dark, grungy Y2K visuals and integrating cryptocurrency payments via the x402 protocol (USDC on Base and Solana networks). Its core purpose is to sell streetwear and digital products with a clean, geometric Y2K design.

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
The project uses a React SPA frontend with Wouter for routing and TanStack Query for data fetching, styled with Tailwind CSS. The backend is an Express.js server using in-memory storage.

**UI/UX Decisions:**
- **Color Scheme**: Neon green (#00FF41) accents, white text, and a black digital Matrix-style background with subtle green grid lines and radial dots.
- **Typography**: NCLRekron for headers and Orbitron from Google Fonts for body text, all white with dark drop shadows.
- **Logo**: Glitchy OFF HUMAN logo with RGB split, horizontal jitter, and scrolling scan line effects.
- **Product Display**: Fixed 280px × 380px transparent PNGs of robot figures, seamlessly overlaid on the digital background.
- **Layout**: Traditional vertical scrolling with full-screen immersive sections for Hero, Products, Crypto, and Footer. Product animations are triggered via Intersection Observer on scroll.
- **Interactive Elements**: Hero section features an interactive 3D character controller using Three.js with animations and OrbitControls. Includes a splash screen with intro audio and WebGL detection with fallback.
- **Admin Dashboard**: Comprehensive system for product management (creation, editing, deletion), media uploads (thumbnails, galleries, 3D models), and inventory.

**Technical Implementations:**
- **Product Catalog**: Features 6 X402-themed streetwear designs displayed on robot/human figure PNGs. Product detail pages include image galleries, size selection, and an AI model-based sizing system.
- **Shopping Cart**: Implemented as a slide-in sidebar.
- **Pages**: Home, Shop, Product Detail, Checkout, and About.
- **Data Models**: Defined for Product (name, description, price, media, inventory, modelUrl, nftMintAddress), CartItem, and Order (customerEmail, items, totalAmount, transactionHash, network, trackingToken, nftTransferSignature, status).
- **Payment System**: Supports **USDC on Base and Solana networks** with **dynamic pricing** based on actual cart totals (6 decimal places). Network selection is available on the checkout page. Server-side validation prevents price manipulation.
- **Checkout Flow**: Requires email only. Users select network, connect wallet, enter email, and complete payment. After successful payment, a delivery email with a tracking token and product download links is sent.
- **Product Delivery**:
    - **Digital Files**: GLB 3D models and PNG thumbnails are delivered via email immediately after payment. Customers can re-download using a unique tracking token.
    - **Solana NFTs** (Optional): If `VAULT_SECRET_KEY` is configured and products have `nftMintAddress`, NFTs are automatically transferred from a vault wallet to the customer's payment wallet. Transfer confirmations, including Solscan explorer links, are part of the delivery email. This feature gracefully degrades if the vault wallet is not configured.

## External Dependencies
- **x402 protocol**: For USDC cryptocurrency payments on Base and Solana networks.
    - **Facilitator**: https://facilitator.payai.network
    - **Fee Payer (Solana)**: `2wKupLR9q6wXYppw8Gr2NvWxKBUqm4PPJKkQfoxHDBg4` (PayAI's Solana wallet for transaction fees, enabling gasless payments).
    - **Wallet Address**: `X402_WALLET_ADDRESS` environment variable (payment receiving address).
    - **Base Network**:
        - **Asset Address**: `0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913` (USDC on Base Mainnet).
        - **Packages**: `x402-fetch`, `viem`, `wagmi`, `@web3modal/wagmi`.
        - **Wallets**: MetaMask, Coinbase Wallet, WalletConnect, Phantom (EVM mode).
    - **Solana Network**:
        - **Asset Addresses**: Mainnet: `EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v` (USDC SPL token); Devnet: `4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU`.
        - **Network**: Configurable via `SOLANA_NETWORK` environment variable (defaults to mainnet).
        - **Packages**: `x402-solana`, `@solana/web3.js`, `bs58`.
        - **Wallets**: Phantom (Solana mode), Backpack.
- **Three.js**: Interactive 3D character controller in the hero section and 3D model viewer on product pages.
- **GLTFLoader, OrbitControls**: Three.js extensions.
- **Google Fonts**: For Orbitron typography.
- **Tailwind CSS**: For styling.
- **Wouter**: For client-side routing.
- **TanStack Query**: For data fetching and state management.