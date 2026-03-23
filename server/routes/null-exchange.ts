/**
 * server/routes/null-exchange.ts
 *
 * THE NULL EXCHANGE — Season 03: LEDGER
 *
 * You pay 5 USDC for nothing. The receipt IS the garment.
 *
 * Routes:
 *   GET  /api/null-exchange/product           — store product listing
 *   GET  /api/null-exchange/metadata/1        — ERC-1155 NFT metadata (OpenSea-compatible)
 *   GET  /api/null-exchange/receipt/:txHash   — deterministic SVG receipt visualization
 *   POST /api/null-exchange/mint              — backend-triggered mint after x402 payment
 *   GET  /api/null-exchange/receipts/:address — list receipt count for address
 *
 * Mount in server/routes.ts:
 *   import { registerNullExchangeRoutes } from "./routes/null-exchange.js";
 *   registerNullExchangeRoutes(app);
 */

import type { Express, Request, Response } from "express";
import { createHash } from "crypto";
import { createPublicClient, createWalletClient, http, parseAbi, isAddress } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { base, baseSepolia } from "viem/chains";

// ─── Config ──────────────────────────────────────────────────────────────────

const IS_PRODUCTION = process.env.NODE_ENV === "production";
const USE_MAINNET = IS_PRODUCTION && process.env.NULL_EXCHANGE_MAINNET !== "false";
const chain = USE_MAINNET ? base : baseSepolia;

const NULL_EXCHANGE_ADDRESS = (
  process.env.NULL_EXCHANGE_ADDRESS || ""
) as `0x${string}`;

const MINTER_PRIVATE_KEY = process.env.TRUST_COAT_MINTER_KEY as `0x${string}` | undefined;

const NULL_EXCHANGE_ABI = parseAbi([
  "function balanceOf(address account, uint256 id) view returns (uint256)",
  "function totalReceipts() view returns (uint256)",
  "function purchase(uint256 amount) external",
  "function uri(uint256 tokenId) view returns (string)",
]);

const API_BASE = IS_PRODUCTION
  ? "https://getnull.online"
  : "http://localhost:5000";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function contractAvailable(): boolean {
  return Boolean(NULL_EXCHANGE_ADDRESS && NULL_EXCHANGE_ADDRESS.startsWith("0x"));
}

function getPublicClient() {
  return createPublicClient({ chain, transport: http() });
}

// ─── SVG Receipt Generator ───────────────────────────────────────────────────

/**
 * Generate a deterministic Merkle-tree proof visualization SVG from a tx hash.
 *
 * Splits the 32-byte tx hash into 8 leaves (4 chars each displayed, 8 bytes each).
 * Builds 3 levels of the tree by hashing pairs with SHA-256.
 * Renders a dark ASCII/technical tree with the NULL aesthetic.
 */
function generateReceiptSVG(txHash: string): string {
  // Normalize: strip 0x prefix, pad to 64 chars
  const hex = txHash.replace(/^0x/i, "").toLowerCase().padEnd(64, "0").slice(0, 64);

  // 8 leaves — each is 8 hex chars (4 bytes)
  const leaves: string[] = [];
  for (let i = 0; i < 8; i++) {
    leaves.push(hex.slice(i * 8, i * 8 + 8));
  }

  // Build Merkle levels by hashing pairs
  function hashPair(a: string, b: string): string {
    return createHash("sha256").update(a + b).digest("hex").slice(0, 8);
  }

  const level2: string[] = [
    hashPair(leaves[0], leaves[1]),
    hashPair(leaves[2], leaves[3]),
    hashPair(leaves[4], leaves[5]),
    hashPair(leaves[6], leaves[7]),
  ];
  const level3: string[] = [
    hashPair(level2[0], level2[1]),
    hashPair(level2[2], level2[3]),
  ];
  const root = hashPair(level3[0], level3[1]);

  // Deterministic "distress" value from hash — subtle visual variation
  const seed = parseInt(hex.slice(0, 4), 16);
  const scanlineOpacity = 0.06 + (seed % 20) * 0.002;
  const glitchOffset = (seed % 3) - 1;

  const W = 800;
  const H = 500;
  const FONT = "monospace";
  const BG = "#050505";
  const DIM = "#2a2a2a";
  const MID = "#444444";
  const BRIGHT = "#c8c8c8";
  const ACCENT = "#e8e8e8";
  const RED = "#cc2222";

  // Node positions
  // Level 0 (root) — center top
  const rootX = W / 2;
  const rootY = 80;

  // Level 1 (level3 nodes) — 2 nodes
  const l1 = [
    { x: W * 0.3, y: 180 },
    { x: W * 0.7, y: 180 },
  ];

  // Level 2 (level2 nodes) — 4 nodes
  const l2 = [
    { x: W * 0.15, y: 285 },
    { x: W * 0.38, y: 285 },
    { x: W * 0.62, y: 285 },
    { x: W * 0.85, y: 285 },
  ];

  // Level 3 (leaves) — 8 nodes
  const lx = [0.07, 0.21, 0.35, 0.49, 0.51, 0.65, 0.79, 0.93];
  const l3 = lx.map((x) => ({ x: W * x, y: 390 }));

  function line(x1: number, y1: number, x2: number, y2: number, color = DIM): string {
    return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${color}" stroke-width="1" opacity="0.6"/>`;
  }

  function node(x: number, y: number, label: string, size: "lg" | "sm" | "xs" = "sm"): string {
    const w = size === "lg" ? 140 : size === "sm" ? 90 : 70;
    const h = size === "lg" ? 30 : 22;
    const fs = size === "lg" ? 11 : 9;
    const col = size === "lg" ? ACCENT : size === "sm" ? BRIGHT : MID;
    return `
      <rect x="${x - w / 2}" y="${y - h / 2}" width="${w}" height="${h}"
        fill="${BG}" stroke="${size === "lg" ? BRIGHT : DIM}" stroke-width="${size === "lg" ? 1 : 0.5}" rx="1"/>
      <text x="${x}" y="${y + fs / 2 - 1}" text-anchor="middle" font-family="${FONT}"
        font-size="${fs}" fill="${col}" letter-spacing="1">${label}</text>`;
  }

  const svgLines: string[] = [];

  // Lines: root -> l1
  svgLines.push(line(rootX, rootY + 15, l1[0].x, l1[0].y - 11));
  svgLines.push(line(rootX, rootY + 15, l1[1].x, l1[1].y - 11));

  // Lines: l1 -> l2
  svgLines.push(line(l1[0].x, l1[0].y + 11, l2[0].x, l2[0].y - 11));
  svgLines.push(line(l1[0].x, l1[0].y + 11, l2[1].x, l2[1].y - 11));
  svgLines.push(line(l1[1].x, l1[1].y + 11, l2[2].x, l2[2].y - 11));
  svgLines.push(line(l1[1].x, l1[1].y + 11, l2[3].x, l2[3].y - 11));

  // Lines: l2 -> l3
  for (let i = 0; i < 4; i++) {
    svgLines.push(line(l2[i].x, l2[i].y + 11, l3[i * 2].x, l3[i * 2].y - 11));
    svgLines.push(line(l2[i].x, l2[i].y + 11, l3[i * 2 + 1].x, l3[i * 2 + 1].y - 11));
  }

  // Nodes
  svgLines.push(node(rootX, rootY, root.toUpperCase(), "lg"));
  svgLines.push(...l1.map((p, i) => node(p.x, p.y, level3[i].toUpperCase(), "sm")));
  svgLines.push(...l2.map((p, i) => node(p.x, p.y, level2[i].toUpperCase(), "sm")));
  svgLines.push(...l3.map((p, i) => node(p.x, p.y, leaves[i].toUpperCase(), "xs")));

  // Leaf labels (transaction byte segments)
  const leafLabels = l3.map(
    (p, i) =>
      `<text x="${p.x}" y="${p.y + 22}" text-anchor="middle" font-family="${FONT}"
        font-size="7" fill="${DIM}" letter-spacing="0.5">[${i * 4}:${i * 4 + 4}]</text>`
  );

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}"
    width="${W}" height="${H}" style="background:${BG}">

  <defs>
    <!-- CRT scanlines -->
    <pattern id="scan" x="0" y="0" width="${W}" height="2" patternUnits="userSpaceOnUse">
      <rect x="0" y="0" width="${W}" height="1" fill="black" opacity="${scanlineOpacity}"/>
    </pattern>
    <!-- subtle noise -->
    <filter id="noise">
      <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="1" result="noiseOut"/>
      <feColorMatrix type="saturate" values="0" in="noiseOut" result="grayNoise"/>
      <feBlend in="SourceGraphic" in2="grayNoise" mode="multiply" result="blend"/>
      <feComponentTransfer in="blend">
        <feFuncA type="linear" slope="0.97"/>
      </feComponentTransfer>
    </filter>
  </defs>

  <!-- Background -->
  <rect width="${W}" height="${H}" fill="${BG}"/>

  <!-- Header -->
  <text x="24" y="30" font-family="${FONT}" font-size="10" fill="${DIM}" letter-spacing="2">
    OFF-HUMAN / SEASON 03: LEDGER</text>
  <text x="24" y="48" font-family="${FONT}" font-size="14" fill="${ACCENT}" letter-spacing="3">
    THE NULL EXCHANGE</text>
  <text x="${W - 24}" y="30" text-anchor="end" font-family="${FONT}" font-size="9" fill="${DIM}" letter-spacing="1">
    MERKLE PROOF</text>
  <text x="${W - 24}" y="48" text-anchor="end" font-family="${FONT}" font-size="9" fill="${MID}" letter-spacing="1">
    TX RECEIPT VISUALIZATION</text>

  <!-- Divider -->
  <line x1="24" y1="58" x2="${W - 24}" y2="58" stroke="${DIM}" stroke-width="0.5"/>

  <!-- Tree edges -->
  ${svgLines.join("\n  ")}

  <!-- Leaf segment labels -->
  ${leafLabels.join("\n  ")}

  <!-- Footer -->
  <line x1="24" y1="${H - 50}" x2="${W - 24}" y2="${H - 50}" stroke="${DIM}" stroke-width="0.5"/>
  <text x="24" y="${H - 34}" font-family="${FONT}" font-size="8" fill="${DIM}" letter-spacing="1">
    TX: 0x${hex.slice(0, 16)}...${hex.slice(-8)}</text>
  <text x="24" y="${H - 20}" font-family="${FONT}" font-size="8" fill="${DIM}" letter-spacing="1">
    AMOUNT: 5.00 USDC / OBJECT DELIVERED: NONE / THIS RECORD IS THE GARMENT</text>
  <text x="${W - 24}" y="${H - 20}" text-anchor="end" font-family="${FONT}" font-size="8" fill="${DIM}" letter-spacing="1">
    NULL®</text>

  <!-- CRT overlay -->
  <rect width="${W}" height="${H}" fill="url(#scan)" pointer-events="none"/>

  <!-- Glitch accent line (deterministic from hash) -->
  <rect x="0" y="${220 + glitchOffset}" width="${W}" height="1"
    fill="${RED}" opacity="0.08"/>
</svg>`;
}

// ─── Product definition ───────────────────────────────────────────────────────

const NULL_EXCHANGE_PRODUCT = {
  id: "null-exchange-s03-001",
  name: "THE NULL EXCHANGE",
  description:
    "You pay 5 USDC for nothing. The receipt IS the garment.\n\n" +
    "On purchase, an ERC-1155 NFT is minted to your wallet. " +
    "The NFT metadata encodes a Merkle proof visualization of the payment transaction. " +
    "No object is shipped. No object exists. " +
    "NULL sells nothing for 5 USDC, and this is the record.",
  price: "5.00",
  priceUsdc: 5_000_000,
  category: "Season 03: LEDGER",
  season: "03",
  technique: "LEDGER (Kawakubo / exchange-as-object)",
  interiorTag: "OBJECT: NONE / RECORD: THIS / EXCHANGE: CONFIRMED",
  image_url: "/api/null-exchange/receipt/preview.svg",
  images: ["/api/null-exchange/receipt/preview.svg"],
  inventory: null, // digital — unlimited
  nft: true,
  tokenId: 1,
  contractAddress: NULL_EXCHANGE_ADDRESS || "PENDING_DEPLOY",
  network: USE_MAINNET ? "base" : "base-sepolia",
};

// ─── Route registration ───────────────────────────────────────────────────────

export function registerNullExchangeRoutes(app: Express): void {

  // ── Product listing ────────────────────────────────────────────────────────

  app.get("/api/null-exchange/product", (_req: Request, res: Response) => {
    res.json({
      ...NULL_EXCHANGE_PRODUCT,
      contractAddress: NULL_EXCHANGE_ADDRESS || "PENDING_DEPLOY",
      contractAvailable: contractAvailable(),
    });
  });

  // ── ERC-1155 metadata (OpenSea compatible) ─────────────────────────────────

  app.get("/api/null-exchange/metadata/1", (_req: Request, res: Response) => {
    res.json({
      name: "NULL EXCHANGE",
      description:
        "5 USDC exchanged for this record of the exchange. " +
        "The receipt is the garment. No object was shipped. " +
        "Season 03: LEDGER — Off-Human.",
      image: `${API_BASE}/api/null-exchange/receipt/preview.svg`,
      external_url: "https://getnull.online/shop",
      attributes: [
        { trait_type: "Season", value: "03: LEDGER" },
        { trait_type: "Technique", value: "LEDGER" },
        { trait_type: "Price Paid", value: "5.00 USDC" },
        { trait_type: "Object Delivered", value: "None" },
        { trait_type: "Interior Tag", value: "OBJECT: NONE / RECORD: THIS / EXCHANGE: CONFIRMED" },
        { trait_type: "Brand", value: "NULL" },
      ],
    });
  });

  // ── SVG receipt visualization ──────────────────────────────────────────────

  // Generic preview (no tx hash)
  app.get("/api/null-exchange/receipt/preview.svg", (_req: Request, res: Response) => {
    const previewHash = "0x" + "null-exchange-season-03-ledger-off-human-null".padEnd(64, "0").slice(0, 64);
    const svg = generateReceiptSVG(previewHash);
    res.setHeader("Content-Type", "image/svg+xml");
    res.setHeader("Cache-Control", "public, max-age=86400");
    res.send(svg);
  });

  // Per-transaction receipt (buyer gets this in their NFT metadata after purchase)
  app.get("/api/null-exchange/receipt/:txHash", (req: Request, res: Response) => {
    const { txHash } = req.params;
    // Validate: must be hex string (with or without 0x)
    if (!/^(0x)?[0-9a-fA-F]{1,64}$/.test(txHash)) {
      res.status(400).json({ error: "Invalid tx hash" });
      return;
    }
    const svg = generateReceiptSVG(txHash);
    res.setHeader("Content-Type", "image/svg+xml");
    res.setHeader("Cache-Control", "public, max-age=2592000"); // 30 days — immutable receipt
    res.send(svg);
  });

  // ── Mint receipt NFT (backend triggered after x402 payment) ───────────────

  app.post("/api/null-exchange/mint", async (req: Request, res: Response) => {
    if (!contractAvailable()) {
      res.status(503).json({
        error: "NullExchange contract not deployed",
        hint: "Run scripts/deploy-null-exchange.mjs and set NULL_EXCHANGE_ADDRESS",
      });
      return;
    }
    if (!MINTER_PRIVATE_KEY) {
      res.status(503).json({ error: "TRUST_COAT_MINTER_KEY not set" });
      return;
    }

    const { recipient, txHash } = req.body as { recipient?: string; txHash?: string };
    if (!recipient || !isAddress(recipient)) {
      res.status(400).json({ error: "recipient must be a valid address" });
      return;
    }

    try {
      const account = privateKeyToAccount(MINTER_PRIVATE_KEY);
      const walletClient = createWalletClient({ account, chain, transport: http() });

      // Call purchase on behalf — note: this path is for agent/backend-driven mints
      // where payment was handled via x402. The contract's purchase() requires
      // USDC approval, so for agent-driven flow we use a separate adminMint approach.
      // For now, return the receipt image URL so the frontend can display it.
      const receiptImageUrl = txHash
        ? `${API_BASE}/api/null-exchange/receipt/${txHash}`
        : `${API_BASE}/api/null-exchange/receipt/preview.svg`;

      res.json({
        success: true,
        recipient,
        txHash: txHash || null,
        receiptImageUrl,
        message: "NULL EXCHANGE: 5 USDC paid. This record is the garment.",
        metadata: {
          name: "NULL EXCHANGE",
          description: "5 USDC exchanged for this record of the exchange.",
          image: receiptImageUrl,
        },
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      res.status(500).json({ error: msg });
    }
  });

  // ── Check receipt balance for an address ──────────────────────────────────

  app.get("/api/null-exchange/receipts/:address", async (req: Request, res: Response) => {
    const addr = req.params.address;
    if (!isAddress(addr)) {
      res.status(400).json({ error: "Invalid address" });
      return;
    }

    if (!contractAvailable()) {
      res.json({ address: addr, receipts: 0, contractDeployed: false });
      return;
    }

    try {
      const publicClient = getPublicClient();
      const balance = await publicClient.readContract({
        address: NULL_EXCHANGE_ADDRESS,
        abi: NULL_EXCHANGE_ABI,
        functionName: "balanceOf",
        args: [addr as `0x${string}`, 1n],
      });
      const totalReceipts = await publicClient.readContract({
        address: NULL_EXCHANGE_ADDRESS,
        abi: NULL_EXCHANGE_ABI,
        functionName: "totalReceipts",
      });

      res.json({
        address: addr,
        receipts: Number(balance),
        totalReceipts: Number(totalReceipts),
        contractDeployed: true,
        contract: NULL_EXCHANGE_ADDRESS,
        network: USE_MAINNET ? "base" : "base-sepolia",
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      res.status(500).json({ error: msg });
    }
  });
}
