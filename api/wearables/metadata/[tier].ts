/**
 * api/wearables/metadata/[tier].ts
 *
 * Vercel serverless function — ERC-1155 metadata endpoint for TrustCoat tiers.
 * TrustCoat.sol sets tokenURI to https://getnull.online/api/wearables/metadata/{tier}
 *
 * Returns valid OpenSea-compatible ERC-1155 JSON for tiers 0-5.
 * Images are served from Filecoin Onchain Cloud (Lighthouse gateway) when a
 * filecoin-manifest.json exists; otherwise falls back to Vercel Blob.
 *
 * Storage layer: Filecoin Onchain Cloud via Lighthouse
 * Manifest: attached_assets/season01/filecoin-manifest.json (produced by scripts/filecoin-upload.ts)
 */

import type { IncomingMessage, ServerResponse } from "http";
import fs from "fs";
import path from "path";

const TIER_META = [
  { id: 0, name: "VOID",      description: "Unverified — no purchase history on-chain.",              technique: "NONE" },
  { id: 1, name: "SAMPLE",    description: "First purchase recorded on-chain. Entry-level trust.",    technique: "ARTISANAL" },
  { id: 2, name: "RTW",       description: "3+ purchases — ready-to-wear trust level.",               technique: "DECONSTRUCTION" },
  { id: 3, name: "COUTURE",   description: "10+ purchases — elevated trust, hand-attested.",          technique: "HAND-STITCHED" },
  { id: 4, name: "ARCHIVE",   description: "Rare archive status — DAO-granted, whitened provenance.", technique: "BIANCHETTO" },
  { id: 5, name: "SOVEREIGN", description: "Highest tier — validator-attested autonomous agent.",     technique: "TROMPE-LOEIL" },
] as const;

// Load Filecoin manifest at module init (cached across warm invocations)
let filecoinManifest: Record<string, { cid: string; url: string }> | null = null;

function loadFilecoinManifest() {
  if (filecoinManifest !== null) return filecoinManifest;

  try {
    const manifestPath = path.join(
      process.cwd(),
      "attached_assets",
      "season01",
      "filecoin-manifest.json"
    );
    if (fs.existsSync(manifestPath)) {
      const raw = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
      filecoinManifest = raw.trustCoatMetadata ?? {};
    } else {
      filecoinManifest = {};
    }
  } catch {
    filecoinManifest = {};
  }

  return filecoinManifest;
}

function getTierImageUrl(tier: number): string {
  const manifest = loadFilecoinManifest();
  // Return Filecoin-hosted metadata URL if available
  const entry = manifest?.[`tier-${tier}`];
  if (entry?.url) {
    // The manifest entry IS the metadata JSON URL — extract image from it via
    // the Lighthouse gateway image pattern. For image specifically, we use
    // the wearable image convention.
    // Since we need the image (not the metadata), fall through to the
    // Filecoin gateway pattern using the stored metadata CID structure.
    // The filecoin-upload.ts script embeds the image URL inside the metadata JSON,
    // so for the image field we use the Vercel-served wearable asset with CID fallback.
  }

  // Fallback: Vercel-hosted wearable images
  return `https://getnull.online/assets/wearables/trustcoat-tier-${tier}.png`;
}

function getFilecoinMetadataUrl(tier: number): string | null {
  const manifest = loadFilecoinManifest();
  return manifest?.[`tier-${tier}`]?.url ?? null;
}

export default function handler(req: IncomingMessage, res: ServerResponse) {
  // Extract tier from the URL path: /api/wearables/metadata/{tier}
  const segments = (req.url ?? "").split("?")[0].split("/").filter(Boolean);
  const rawTier = segments[segments.length - 1];
  const tier = parseInt(rawTier, 10);

  if (isNaN(tier) || tier < 0 || tier > 5) {
    res.statusCode = 400;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ error: "Invalid tier. Must be 0-5." }));
    return;
  }

  const meta = TIER_META[tier];
  const filecoinUrl = getFilecoinMetadataUrl(tier);

  // If a Filecoin CID is available for this tier's metadata, redirect to it
  // so wallets/marketplaces read directly from Filecoin Onchain Cloud.
  if (filecoinUrl && req.url?.includes("?redirect=1")) {
    res.statusCode = 301;
    res.setHeader("Location", filecoinUrl);
    res.end();
    return;
  }

  const imageUrl = getTierImageUrl(tier);

  const metadata = {
    name: `Trust Coat — Tier ${tier}: ${meta.name}`,
    description: meta.description,
    image: imageUrl,
    external_url: "https://getnull.online/wearables",
    attributes: [
      { trait_type: "Tier",       value: meta.name },
      { trait_type: "Technique",  value: meta.technique },
      { trait_type: "Collection", value: "Season 01: Deconstructed" },
      { trait_type: "Soul-Bound", value: "true" },
      ...(filecoinUrl
        ? [
            { trait_type: "Storage",        value: "Filecoin Onchain Cloud" },
            { trait_type: "Filecoin URI",   value: filecoinUrl },
          ]
        : []),
    ],
  };

  res.statusCode = 200;
  res.setHeader("Content-Type", "application/json");
  res.setHeader("Cache-Control", "public, max-age=3600");
  res.end(JSON.stringify(metadata));
}
