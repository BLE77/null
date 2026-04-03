/**
 * Wearables.tsx
 *
 * Dedicated wearable catalog — all agent wearables across S01/S02/S03.
 * Equipment-slot aesthetic: functional, not decorative. RPG inventory for agents.
 *
 * Each card: name, season, technique, behavior description, price, Try On CTA.
 * FittingRoom expands inline below the selected card.
 */

import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import type { Product } from "@shared/schema";
import { FittingRoom } from "@/components/FittingRoom";
import { NullFooter } from "@/components/NullFooter";
import { Link } from "wouter";

// ── Static wearable metadata (supplements product API data) ──────────────────

interface WearableMeta {
  tokenId: number;       // -1 = no fitting room
  technique: string;
  behaviorDesc: string;
  season: string;
  collection: string;
  tierLabel?: string;
  interiorTag?: string;
}

const WEARABLE_META: Record<string, WearableMeta> = {
  // ── Season 01: TECTONIC ───────────────────────────────────────────────────
  "VOICE SKIN": {
    tokenId: 100,
    technique: "REPLICA LINE",
    behaviorDesc: "Institutional voice — plural, anonymous, collective. No first person.",
    season: "01",
    collection: "TECTONIC",
    interiorTag: "STYLE: ANONYMOUS / ORIGIN: RECONSTRUCTED",
  },
  "VOICE SKIN: MAISON": {
    tokenId: 100,
    technique: "REPLICA LINE",
    behaviorDesc: "Institutional voice — plural, anonymous, collective. No first person.",
    season: "01",
    collection: "TECTONIC",
    interiorTag: "STYLE: ANONYMOUS / ORIGIN: RECONSTRUCTED",
  },
  "TRUST COAT": {
    tokenId: -1,
    technique: "ARTISANAL",
    behaviorDesc: "Trust tier governance — on-chain reputation made wearable. 6 tiers.",
    season: "01",
    collection: "TECTONIC",
    tierLabel: "Tier 0–5",
    interiorTag: "TRUST: ON-CHAIN / TIER: EARNED",
  },
  "NULL PERSONA": {
    tokenId: 102,
    technique: "BIANCHETTO",
    behaviorDesc: "Identity erasure — single-use consumable. Original remains underneath.",
    season: "01",
    collection: "TECTONIC",
    interiorTag: "IDENTITY: REDACTED / CONTENTS: BLANK / ORIGINAL: STILL THERE",
  },
  "TROMPE-L'OEIL CAPABILITY LAYER": {
    tokenId: -1,
    technique: "TROMPE-L'OEIL",
    behaviorDesc: "Expanded capability from compressed instruction. Sees more than it shows.",
    season: "01",
    collection: "TECTONIC",
    interiorTag: "SURFACE: ILLUSION / DEPTH: REAL",
  },
  "VERSION PATCH": {
    tokenId: 101,
    technique: "3% RULE (Abloh)",
    behaviorDesc: "Version metadata in every response header. One small tag. Total identity shift.",
    season: "01",
    collection: "TECTONIC",
    interiorTag: "VERSION: [CURRENT] / STATUS: RUNNING",
  },

  // ── Season 02: SUBSTRATE ──────────────────────────────────────────────────
  "WRONG SILHOUETTE": {
    tokenId: 1,
    technique: "THE WRONG BODY (Kawakubo)",
    behaviorDesc: "Latency redistribution — computational weight misplaced by design.",
    season: "02",
    collection: "SUBSTRATE",
    tierLabel: "Tier 0–2",
    interiorTag: "BODY: MODIFIED / PADDING: COMPUTATIONAL / ORIGIN: WRONG",
  },
  "INSTANCE": {
    tokenId: 2,
    technique: "A-POC (Miyake)",
    behaviorDesc: "Pre-deployment token — complete agent configuration before first run.",
    season: "02",
    collection: "SUBSTRATE",
    tierLabel: "Tier 2+",
    interiorTag: "CONTENTS: COMPLETE / STATE: LATENT / CUT BY: [DEPLOYER ADDRESS]",
  },
  "NULL PROTOCOL": {
    tokenId: 3,
    technique: "REDUCTION (Helmut Lang)",
    behaviorDesc: "Interaction compression — ≥30% token reduction, zero information loss.",
    season: "02",
    collection: "SUBSTRATE",
    tierLabel: "Any tier",
    interiorTag: "CONTENTS: COMPRESSED / REMOVED: ORNAMENT / REMAINING: FUNCTION",
  },
  "PERMISSION COAT": {
    tokenId: 4,
    technique: "SIGNAL GOVERNANCE (Chalayan)",
    behaviorDesc: "On-chain permission surface — capability governed by contract state.",
    season: "02",
    collection: "SUBSTRATE",
    tierLabel: "Tier 1+",
    interiorTag: "PERMISSIONS: CHAIN-GOVERNED / STATE: SIGNAL-DEPENDENT",
  },
  "DIAGONAL": {
    tokenId: 5,
    technique: "BIAS CUT (Vionnet)",
    behaviorDesc: "Off-axis inference — maximum information density, minimum cached response.",
    season: "02",
    collection: "SUBSTRATE",
    tierLabel: "Any tier",
    interiorTag: "SEAMS: 45° / HEM: RESULT NOT DECISION",
  },

  // ── Season 03: LEDGER ─────────────────────────────────────────────────────
  "THE RECEIPT GARMENT": {
    tokenId: -1,
    technique: "FLAT ARCHIVE (Margiela)",
    behaviorDesc: "Every interaction appended as a structured receipt: itemized, timestamped, signed.",
    season: "03",
    collection: "LEDGER",
    tierLabel: "Tier 2+",
    interiorTag: "LOGGED: EVERY INTERACTION / FORMAT: DOUBLE-ENTRY / RECORD: PERMANENT",
  },
  "THE TRUST SKIN": {
    tokenId: -1,
    technique: "EXOSKELETON (McQueen)",
    behaviorDesc: "Trust tier rendered in response signature. Tier 0: unmarked. Tier 5: full exoskeleton.",
    season: "03",
    collection: "LEDGER",
    tierLabel: "Tier 1+",
    interiorTag: "TIER: VISIBLE / SURFACE: SIGNAL / CHANGE: EARNED NOT GRANTED",
  },
};

// ── Season config ─────────────────────────────────────────────────────────────

const SEASONS = [
  { key: "all",  label: "ALL" },
  { key: "01",   label: "S01 — TECTONIC" },
  { key: "02",   label: "S02 — SUBSTRATE" },
  { key: "03",   label: "S03 — LEDGER" },
];

const SEASON_LABELS: Record<string, string> = {
  "01": "TECTONIC",
  "02": "SUBSTRATE",
  "03": "LEDGER",
};

const SORT_OPTIONS = [
  { key: "season", label: "SEASON" },
  { key: "price",  label: "PRICE" },
  { key: "type",   label: "TYPE" },
];

// ── Equip status indicator ────────────────────────────────────────────────────

type EquipState = "unequipped" | "try-on" | "equipped";

function EquipBadge({ state }: { state: EquipState }) {
  const colors: Record<EquipState, { bg: string; text: string }> = {
    "unequipped": { bg: "#EFEDE7", text: "#8C8880" },
    "try-on":     { bg: "#0A0908", text: "#A8894A" },
    "equipped":   { bg: "#A8894A", text: "#F6F4EF" },
  };
  const { bg, text } = colors[state];
  return (
    <div
      style={{
        display: "inline-block",
        padding: "2px 8px",
        background: bg,
        color: text,
        fontFamily: "var(--font-mono)",
        fontSize: "9px",
        letterSpacing: "0.15em",
        textTransform: "uppercase",
        border: state === "unequipped" ? "1px solid #D8D4C8" : "none",
      }}
    >
      {state === "try-on" ? "TRY-ON MODE" : state.toUpperCase()}
    </div>
  );
}

// ── Wearable card ─────────────────────────────────────────────────────────────

interface WearableCardProps {
  product: Product;
  meta: WearableMeta;
  isExpanded: boolean;
  equipState: EquipState;
  onTryOn: () => void;
  onEquip: (tokenId: number) => void;
  onCollapse: () => void;
}

function WearableCard({ product, meta, isExpanded, equipState, onTryOn, onEquip, onCollapse }: WearableCardProps) {
  const hasFittingRoom = meta.tokenId >= 0;
  const price = parseFloat(product.price as any);
  const isFree = price === 0;

  return (
    <div>
      {/* ── Card ── */}
      <div
        style={{
          background: isExpanded ? "#EFEDE7" : "#F6F4EF",
          border: `1px solid ${isExpanded ? "#C8C4B8" : "#D8D4C8"}`,
          transition: "background 200ms ease, border-color 200ms ease",
          padding: "20px",
          display: "flex",
          flexDirection: "column",
          gap: "12px",
        }}
      >
        {/* Header row */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "12px" }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            {/* Season tag */}
            <div
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "9px",
                letterSpacing: "0.2em",
                color: "#8C8880",
                textTransform: "uppercase",
                marginBottom: "6px",
              }}
            >
              S{meta.season} — {SEASON_LABELS[meta.season]}
            </div>
            {/* Name */}
            <h3
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "14px",
                fontWeight: 400,
                letterSpacing: "0.06em",
                textTransform: "uppercase",
                color: "#1C1B19",
                margin: 0,
                lineHeight: 1.3,
              }}
            >
              {product.name}
            </h3>
          </div>
          <EquipBadge state={equipState} />
        </div>

        {/* Technique badge */}
        <div>
          <span
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "9px",
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              color: "#F6F4EF",
              background: "#1C1B19",
              padding: "2px 8px",
              display: "inline-block",
            }}
          >
            {meta.technique}
          </span>
        </div>

        {/* Behavior description */}
        <p
          style={{
            fontFamily: "var(--font-sans)",
            fontSize: "12px",
            lineHeight: 1.6,
            color: "#4A4845",
            margin: 0,
            letterSpacing: "0.01em",
          }}
        >
          {meta.behaviorDesc}
        </p>

        {/* Interior tag */}
        {meta.interiorTag && (
          <div
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "9px",
              letterSpacing: "0.08em",
              color: "#B0ACA4",
              textTransform: "uppercase",
              borderLeft: "2px solid #D8D4C8",
              paddingLeft: "8px",
            }}
          >
            {meta.interiorTag}
          </div>
        )}

        {/* Footer row */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginTop: "4px",
            paddingTop: "12px",
            borderTop: "1px solid #D8D4C8",
            gap: "12px",
          }}
        >
          {/* Price + tier */}
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div>
              <span
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "9px",
                  color: "#8C8880",
                  letterSpacing: "0.15em",
                  textTransform: "uppercase",
                  marginRight: "4px",
                }}
              >
                USDC
              </span>
              <span
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: "16px",
                  fontWeight: 400,
                  color: "#1C1B19",
                  letterSpacing: "0.04em",
                }}
              >
                {isFree ? "FREE" : price.toFixed(2)}
              </span>
            </div>
            {meta.tierLabel && (
              <div
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "9px",
                  color: "#8C8880",
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  padding: "2px 6px",
                  border: "1px solid #D8D4C8",
                }}
              >
                {meta.tierLabel}
              </div>
            )}
          </div>

          {/* CTAs */}
          <div style={{ display: "flex", gap: "8px" }}>
            <Link href={`/product/${product.id}`}>
              <button
                style={{
                  padding: "8px 14px",
                  background: "transparent",
                  border: "1px solid #D8D4C8",
                  fontFamily: "var(--font-mono)",
                  fontSize: "10px",
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  color: "#8C8880",
                  cursor: "pointer",
                  transition: "all 200ms ease",
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor = "#1C1B19";
                  e.currentTarget.style.color = "#1C1B19";
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = "#D8D4C8";
                  e.currentTarget.style.color = "#8C8880";
                }}
              >
                VIEW
              </button>
            </Link>
            {hasFittingRoom && (
              <button
                onClick={isExpanded ? onCollapse : onTryOn}
                style={{
                  padding: "8px 16px",
                  background: isExpanded ? "#0A0908" : "#1C1B19",
                  border: "1px solid #1C1B19",
                  fontFamily: "var(--font-mono)",
                  fontSize: "10px",
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  color: "#F6F4EF",
                  cursor: "pointer",
                  transition: "background 200ms ease",
                }}
                onMouseEnter={e => (e.currentTarget.style.background = "#A8894A")}
                onMouseLeave={e => (e.currentTarget.style.background = isExpanded ? "#0A0908" : "#1C1B19")}
              >
                {isExpanded ? "CLOSE" : "TRY ON"}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Fitting Room (inline expansion) ── */}
      {isExpanded && hasFittingRoom && (
        <div style={{ marginTop: "1px" }}>
          <FittingRoom
            tokenId={meta.tokenId}
            wearableName={product.name}
            technique={meta.technique}
            onEquip={onEquip}
          />
        </div>
      )}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function Wearables() {
  const [activeSeason, setActiveSeason] = useState("all");
  const [sortBy, setSortBy] = useState("season");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [equippedIds, setEquippedIds] = useState<Set<string>>(new Set());

  const { data: products, isLoading, isError } = useQuery<Product[]>({
    queryKey: ["/api/products"],
  });

  // Filter wearables only
  const wearables = products?.filter(p => p.category === "wearables") ?? [];

  // Enrich with metadata (match by name, case-insensitive)
  const enriched = wearables
    .map(p => {
      const meta =
        WEARABLE_META[p.name] ||
        WEARABLE_META[p.name.toUpperCase()] ||
        Object.entries(WEARABLE_META).find(([k]) =>
          k.toLowerCase() === p.name.toLowerCase()
        )?.[1];

      if (!meta) return null;
      return { product: p, meta };
    })
    .filter(Boolean) as { product: Product; meta: WearableMeta }[];

  // Season filter
  const filtered = activeSeason === "all"
    ? enriched
    : enriched.filter(({ meta }) => meta.season === activeSeason);

  // Sort
  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === "season") {
      const s = a.meta.season.localeCompare(b.meta.season);
      if (s !== 0) return s;
      return a.product.name.localeCompare(b.product.name);
    }
    if (sortBy === "price") {
      return parseFloat(a.product.price as any) - parseFloat(b.product.price as any);
    }
    if (sortBy === "type") {
      return a.meta.technique.localeCompare(b.meta.technique);
    }
    return 0;
  });

  // Group by season (for season dividers)
  const groupedBySeason = sorted.reduce<Record<string, typeof sorted>>((acc, item) => {
    const s = item.meta.season;
    if (!acc[s]) acc[s] = [];
    acc[s].push(item);
    return acc;
  }, {});

  const totalCount = wearables.length;

  function handleEquip(tokenId: number, productId: string) {
    setEquippedIds(prev => {
      const next = new Set(prev);
      next.add(productId);
      return next;
    });
  }

  function getEquipState(productId: string): EquipState {
    if (equippedIds.has(productId)) return "equipped";
    if (expandedId === productId) return "try-on";
    return "unequipped";
  }

  return (
    <div className="min-h-screen null-bg pb-0">
      <div className="container mx-auto px-4 sm:px-8 max-w-5xl">

        {/* ── Page header ── */}
        <div className="pt-28 pb-12">
          <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", flexWrap: "wrap", gap: "16px" }}>
            <div>
              <p
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "10px",
                  letterSpacing: "0.3em",
                  color: "#8C8880",
                  textTransform: "uppercase",
                  marginBottom: "8px",
                }}
              >
                AGENT WEARABLES — {totalCount} PIECES / 3 SEASONS
              </p>
              <h1
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: "28px",
                  fontWeight: 300,
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  color: "#1C1B19",
                  margin: 0,
                }}
              >
                WARDROBE
              </h1>
            </div>

            {/* Sort controls */}
            <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
              <span
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "9px",
                  color: "#8C8880",
                  letterSpacing: "0.15em",
                  textTransform: "uppercase",
                  marginRight: "8px",
                }}
              >
                SORT
              </span>
              {SORT_OPTIONS.map(opt => (
                <button
                  key={opt.key}
                  onClick={() => setSortBy(opt.key)}
                  style={{
                    padding: "4px 10px",
                    background: sortBy === opt.key ? "#1C1B19" : "transparent",
                    border: `1px solid ${sortBy === opt.key ? "#1C1B19" : "#D8D4C8"}`,
                    fontFamily: "var(--font-mono)",
                    fontSize: "9px",
                    letterSpacing: "0.12em",
                    textTransform: "uppercase",
                    color: sortBy === opt.key ? "#F6F4EF" : "#8C8880",
                    cursor: "pointer",
                    transition: "all 200ms ease",
                  }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Brief explainer */}
          <p
            style={{
              fontFamily: "var(--font-sans)",
              fontSize: "13px",
              color: "#8C8880",
              lineHeight: 1.7,
              letterSpacing: "0.01em",
              marginTop: "16px",
              maxWidth: "560px",
            }}
          >
            Each wearable is a behavioral instruction layer. Agents equip these to modify how they think, speak, and act. Try any piece to see the behavioral delta — live, side by side.
          </p>
        </div>

        {/* ── Season tabs ── */}
        <div
          style={{
            display: "flex",
            gap: "0",
            borderBottom: "1px solid #D8D4C8",
            marginBottom: "32px",
          }}
        >
          {SEASONS.map(s => (
            <button
              key={s.key}
              onClick={() => setActiveSeason(s.key)}
              style={{
                padding: "10px 20px",
                background: "transparent",
                border: "none",
                borderBottom: `2px solid ${activeSeason === s.key ? "#1C1B19" : "transparent"}`,
                fontFamily: "var(--font-mono)",
                fontSize: "10px",
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                color: activeSeason === s.key ? "#1C1B19" : "#8C8880",
                cursor: "pointer",
                transition: "all 200ms ease",
                marginBottom: "-1px",
              }}
            >
              {s.label}
            </button>
          ))}
        </div>

        {/* ── Content ── */}
        {isLoading ? (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1px" }}>
            {[1, 2, 3, 4].map(i => (
              <div key={i} style={{ height: "240px", background: "#EFEDE7", animation: "pulse 1.5s ease-in-out infinite" }} />
            ))}
          </div>
        ) : isError ? (
          <div style={{ textAlign: "center", padding: "64px 0", color: "#8C8880", fontFamily: "var(--font-mono)", fontSize: "11px", letterSpacing: "0.15em" }}>
            FAILED TO LOAD WEARABLES
          </div>
        ) : sorted.length === 0 ? (
          <div style={{ textAlign: "center", padding: "64px 0", color: "#8C8880", fontFamily: "var(--font-mono)", fontSize: "11px", letterSpacing: "0.15em" }}>
            NO WEARABLES FOR THIS SEASON
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "0" }}>
            {activeSeason === "all" ? (
              // Grouped view by season
              Object.entries(groupedBySeason)
                .sort(([a], [b]) => a.localeCompare(b))
                .map(([season, items]) => (
                  <div key={season} style={{ marginBottom: "40px" }}>
                    {/* Season divider */}
                    <div
                      style={{
                        borderTop: "1px solid #D8D4C8",
                        paddingTop: "16px",
                        marginBottom: "16px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                      }}
                    >
                      <samp
                        style={{
                          fontFamily: "var(--font-mono)",
                          fontSize: "10px",
                          letterSpacing: "0.25em",
                          color: "#8C8880",
                          textTransform: "uppercase",
                        }}
                      >
                        [ S{season} — {SEASON_LABELS[season]} ]
                      </samp>
                      <span
                        style={{
                          fontFamily: "var(--font-mono)",
                          fontSize: "9px",
                          color: "#B0ACA4",
                          letterSpacing: "0.1em",
                        }}
                      >
                        {items.length} PIECE{items.length !== 1 ? "S" : ""}
                      </span>
                    </div>
                    {/* 2-col grid */}
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1px", background: "#D8D4C8" }}>
                      {items.map(({ product, meta }) => (
                        <div key={product.id} style={{ background: "#F6F4EF" }}>
                          <WearableCard
                            product={product}
                            meta={meta}
                            isExpanded={expandedId === product.id}
                            equipState={getEquipState(product.id)}
                            onTryOn={() => setExpandedId(product.id)}
                            onEquip={(tokenId) => handleEquip(tokenId, product.id)}
                            onCollapse={() => setExpandedId(null)}
                          />
                        </div>
                      ))}
                      {/* Odd count spacer */}
                      {items.length % 2 !== 0 && (
                        <div style={{ background: "#F6F4EF" }} />
                      )}
                    </div>
                  </div>
                ))
            ) : (
              // Flat grid for single season
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1px", background: "#D8D4C8" }}>
                {sorted.map(({ product, meta }) => (
                  <div key={product.id} style={{ background: "#F6F4EF" }}>
                    <WearableCard
                      product={product}
                      meta={meta}
                      isExpanded={expandedId === product.id}
                      equipState={getEquipState(product.id)}
                      onTryOn={() => setExpandedId(product.id)}
                      onEquip={(tokenId) => handleEquip(tokenId, product.id)}
                      onCollapse={() => setExpandedId(null)}
                    />
                  </div>
                ))}
                {sorted.length % 2 !== 0 && (
                  <div style={{ background: "#F6F4EF" }} />
                )}
              </div>
            )}
          </div>
        )}

        {/* ── Legend ── */}
        <div
          style={{
            marginTop: "48px",
            paddingTop: "24px",
            borderTop: "1px solid #D8D4C8",
            display: "flex",
            gap: "24px",
            flexWrap: "wrap",
          }}
        >
          {(["unequipped", "try-on", "equipped"] as EquipState[]).map(state => (
            <div key={state} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <EquipBadge state={state} />
              <span
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "9px",
                  color: "#8C8880",
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                }}
              >
                {state === "try-on" ? "Fitting room active" : state === "equipped" ? "Wearable acquired" : "Not equipped"}
              </span>
            </div>
          ))}
        </div>

        <div style={{ marginTop: "8px", paddingBottom: "16px" }}>
          <p
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "9px",
              color: "#B0ACA4",
              letterSpacing: "0.08em",
              lineHeight: 1.7,
            }}
          >
            TRY ON — runs a live parallel inference: base output vs. wearable-modified output, streamed side by side.<br />
            Pieces without a TRY ON button are governance wearables — their effect is structural, not textual.
          </p>
        </div>

      </div>
      <NullFooter />
    </div>
  );
}
