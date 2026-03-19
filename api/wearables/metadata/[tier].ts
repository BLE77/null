/**
 * api/wearables/metadata/[tier].ts
 *
 * Vercel serverless function — ERC-1155 metadata endpoint for TrustCoat tiers.
 * TrustCoat.sol sets tokenURI to https://off-human.vercel.app/api/wearables/metadata/{tier}
 *
 * Returns valid OpenSea-compatible ERC-1155 JSON for tiers 0-5.
 * This is a standalone, zero-dependency handler (no DB, no viem) for fast cold starts.
 */

import type { IncomingMessage, ServerResponse } from "http";

const TIER_META = [
  { id: 0, name: "VOID",      description: "Unverified — no purchase history on-chain.",          technique: "NONE" },
  { id: 1, name: "SAMPLE",    description: "First purchase recorded on-chain. Entry-level trust.", technique: "ARTISANAL" },
  { id: 2, name: "RTW",       description: "3+ purchases — ready-to-wear trust level.",           technique: "DECONSTRUCTION" },
  { id: 3, name: "COUTURE",   description: "10+ purchases — elevated trust, hand-attested.",      technique: "HAND-STITCHED" },
  { id: 4, name: "ARCHIVE",   description: "Rare archive status — DAO-granted, whitened provenance.", technique: "BIANCHETTO" },
  { id: 5, name: "SOVEREIGN", description: "Highest tier — validator-attested autonomous agent.", technique: "TROMPE-LOEIL" },
] as const;

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

  const metadata = {
    name: `Trust Coat - Tier ${tier}`,
    description: meta.description,
    image: `https://off-human.vercel.app/assets/wearables/trustcoat-tier-${tier}.png`,
    external_url: "https://off-human.vercel.app/wearables",
    attributes: [
      { trait_type: "Tier",       value: meta.name },
      { trait_type: "Technique",  value: meta.technique },
      { trait_type: "Collection", value: "Season 01: Deconstructed" },
      { trait_type: "Soul-Bound", value: "true" },
    ],
  };

  res.statusCode = 200;
  res.setHeader("Content-Type", "application/json");
  res.setHeader("Cache-Control", "public, max-age=3600");
  res.end(JSON.stringify(metadata));
}
