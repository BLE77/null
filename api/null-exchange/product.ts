// Vercel serverless function — NULL Exchange product listing (standalone, no Express)
import type { IncomingMessage, ServerResponse } from "http";

const IS_PRODUCTION = process.env.NODE_ENV === "production";
const USE_MAINNET = IS_PRODUCTION && process.env.NULL_EXCHANGE_MAINNET !== "false";

const NULL_EXCHANGE_ADDRESS = process.env.NULL_EXCHANGE_ADDRESS || "";

function contractAvailable(): boolean {
  return Boolean(NULL_EXCHANGE_ADDRESS && NULL_EXCHANGE_ADDRESS.startsWith("0x"));
}

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
  network: USE_MAINNET ? "base" : "base-sepolia",
};

export default function handler(_req: IncomingMessage, res: ServerResponse) {
  res.setHeader("Content-Type", "application/json");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Cache-Control", "public, max-age=60");
  res.end(
    JSON.stringify({
      ...NULL_EXCHANGE_PRODUCT,
      contractAddress: NULL_EXCHANGE_ADDRESS || "PENDING_DEPLOY",
      contractAvailable: contractAvailable(),
    })
  );
}
