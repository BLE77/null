/**
 * FittingRoom.tsx
 *
 * The fitting room — agents try on wearables before acquiring.
 * Uses POST /api/wearables/:tokenId/try/stream (SSE) for live parallel OpenAI
 * inference. Streams base output and wearable-modified output side-by-side,
 * then shows a behavioral delta score analyzed by LLM.
 */

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";

// ── Types ─────────────────────────────────────────────────────────────────────

interface MetaData {
  wearable: string;
  technique: string;
  function: string;
  wearableId: number;
  agentAddress: string | null;
  systemPromptModule: string;
}

interface DeltaData {
  delta_score: number;
  tone_shift: string;
  vocabulary_change: string;
  constraints_applied: string[];
  avg_token_reduction: string;
  information_preserved: boolean;
  patterns_suppressed: number;
  methodology: string;
}

interface DiffSegment {
  text: string;
  removed: boolean;
  added: boolean;
}

interface FittingRoomProps {
  tokenId: number;
  wearableName?: string;
  technique?: string;
  /** Optional agent address for personalization */
  agentAddress?: string;
  /** Callback when agent equips the wearable after trial */
  onEquip?: (tokenId: number) => void;
}

// ── Diff utilities ────────────────────────────────────────────────────────────

/** Word-level diff between two strings — highlights structural changes */
function computeDiff(before: string, after: string): { before: DiffSegment[]; after: DiffSegment[] } {
  const beforeWords = before.split(/\b/);
  const afterWords = after.split(/\b/);

  const beforeSet = new Set(beforeWords.map(w => w.toLowerCase().trim()).filter(Boolean));
  const afterSet = new Set(afterWords.map(w => w.toLowerCase().trim()).filter(Boolean));

  const beforeSegments: DiffSegment[] = beforeWords.map(word => ({
    text: word,
    removed: word.trim().length > 4 && !afterSet.has(word.toLowerCase().trim()),
    added: false,
  }));

  const afterSegments: DiffSegment[] = afterWords.map(word => ({
    text: word,
    added: word.trim().length > 4 && !beforeSet.has(word.toLowerCase().trim()),
    removed: false,
  }));

  return { before: beforeSegments, after: afterSegments };
}

function DiffText({ segments, streaming }: { segments: DiffSegment[]; streaming?: boolean }) {
  if (streaming) {
    return <span>{segments.map(s => s.text).join("")}</span>;
  }
  return (
    <span>
      {segments.map((seg, i) => {
        if (seg.removed) {
          return (
            <span key={i} style={{ textDecoration: "line-through", color: "#8C8880", opacity: 0.6 }}>
              {seg.text}
            </span>
          );
        }
        if (seg.added) {
          return (
            <span key={i} style={{ color: "#A8894A", fontWeight: 500 }}>
              {seg.text}
            </span>
          );
        }
        return <span key={i}>{seg.text}</span>;
      })}
    </span>
  );
}

// ── Delta score display ───────────────────────────────────────────────────────

function DeltaScoreBar({ score }: { score: number }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
      <div
        style={{
          flex: 1,
          height: "2px",
          background: "#D8D4C8",
          position: "relative",
        }}
      >
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            height: "100%",
            width: `${Math.min(score, 100)}%`,
            background: score > 60 ? "#A8894A" : score > 30 ? "#8C8880" : "#D8D4C8",
            transition: "width 800ms ease-out",
          }}
        />
      </div>
      <span
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: "11px",
          color: "#A8894A",
          minWidth: "36px",
          textAlign: "right",
        }}
      >
        {score}/100
      </span>
    </div>
  );
}

function TokenReductionBar({ reduction }: { reduction: string }) {
  const pct = parseInt(reduction.replace("%", ""), 10) || 0;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
      <div
        style={{
          flex: 1,
          height: "2px",
          background: "#D8D4C8",
          position: "relative",
        }}
      >
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            height: "100%",
            width: `${Math.min(Math.abs(pct), 100)}%`,
            background: "#A8894A",
            transition: "width 600ms ease-out",
          }}
        />
      </div>
      <span
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: "11px",
          color: "#A8894A",
          minWidth: "36px",
          textAlign: "right",
        }}
      >
        {reduction}
      </span>
    </div>
  );
}

// ── Wearable badge ────────────────────────────────────────────────────────────

const TECHNIQUE_COLORS: Record<string, string> = {
  "THE WRONG BODY (Kawakubo)": "#6a4a8a",
  "A-POC (Miyake)": "#4a6a8a",
  "REDUCTION (Helmut Lang)": "#2d2d2d",
  "SIGNAL GOVERNANCE (Chalayan)": "#6a8a4a",
  "BIAS CUT (Vionnet)": "#8a4a4a",
};

// ── Cursor blink ─────────────────────────────────────────────────────────────

function StreamCursor() {
  return (
    <span
      style={{
        display: "inline-block",
        width: "2px",
        height: "1em",
        background: "#8C8880",
        verticalAlign: "text-bottom",
        marginLeft: "2px",
        animation: "blink 1s step-end infinite",
      }}
    />
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function FittingRoom({
  tokenId,
  wearableName,
  technique,
  agentAddress,
  onEquip,
}: FittingRoomProps) {
  const [query, setQuery] = useState("");
  const [beforeText, setBeforeText] = useState("");
  const [afterText, setAfterText] = useState("");
  const [beforeDone, setBeforeDone] = useState(false);
  const [afterDone, setAfterDone] = useState(false);
  const [deltaData, setDeltaData] = useState<DeltaData | null>(null);
  const [metaData, setMetaData] = useState<MetaData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showModule, setShowModule] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const techniqueColor = technique ? (TECHNIQUE_COLORS[technique] ?? "#8C8880") : "#8C8880";
  const bothStreamsComplete = beforeDone && afterDone;
  const analyzing = bothStreamsComplete && !deltaData && loading;
  const hasResult = !loading && (beforeText || afterText);
  const diff = hasResult && deltaData ? computeDiff(beforeText, afterText) : null;

  const statusLabel = loading
    ? analyzing
      ? "ANALYZING DELTA —"
      : "STREAMING —"
    : deltaData
    ? "TRIAL COMPLETE"
    : "READY";

  async function handleTry() {
    const q = query.trim();
    if (!q) {
      inputRef.current?.focus();
      return;
    }

    setLoading(true);
    setError(null);
    setBeforeText("");
    setAfterText("");
    setBeforeDone(false);
    setAfterDone(false);
    setDeltaData(null);
    setMetaData(null);

    try {
      const res = await fetch(`/api/wearables/${tokenId}/try/stream`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          testQuery: q,
          agentAddress: agentAddress || undefined,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Unknown error" }));
        throw new Error(err.error ?? `HTTP ${res.status}`);
      }

      if (!res.body) throw new Error("No response body");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const parts = buffer.split("\n\n");
        buffer = parts.pop() ?? "";

        for (const part of parts) {
          if (!part.startsWith("data: ")) continue;
          try {
            const event = JSON.parse(part.slice(6));
            if (event.type === "meta") setMetaData(event as MetaData);
            if (event.type === "before_chunk") setBeforeText(t => t + event.text);
            if (event.type === "after_chunk") setAfterText(t => t + event.text);
            if (event.type === "before_done") setBeforeDone(true);
            if (event.type === "after_done") setAfterDone(true);
            if (event.type === "delta") setDeltaData(event as DeltaData);
            if (event.type === "done") setLoading(false);
            if (event.type === "error") throw new Error(event.error);
          } catch {
            /* ignore malformed events */
          }
        }
      }
    } catch (err: any) {
      setError(err.message || "Trial failed");
    } finally {
      setLoading(false);
    }
  }

  const systemPromptModule = metaData?.systemPromptModule ?? "";
  const displayWearableName = metaData?.wearable ?? wearableName ?? `WEARABLE ${tokenId}`;

  return (
    <div
      style={{
        fontFamily: "var(--font-sans)",
        color: "#1C1B19",
        background: "#F6F4EF",
        border: "1px solid #D8D4C8",
        maxWidth: "900px",
      }}
    >
      <style>{`
        @keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0; } }
      `}</style>

      {/* ── Header ── */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          padding: "24px 28px 20px",
          borderBottom: "1px solid #D8D4C8",
        }}
      >
        <div>
          <div
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "10px",
              letterSpacing: "0.18em",
              color: "#8C8880",
              textTransform: "uppercase",
              marginBottom: "6px",
            }}
          >
            FITTING ROOM / TOKEN {tokenId.toString().padStart(2, "0")}
          </div>
          <h2
            style={{
              fontSize: "20px",
              fontWeight: 400,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              margin: 0,
              fontFamily: "var(--font-display)",
            }}
          >
            {displayWearableName}
          </h2>
          {technique && (
            <div
              style={{
                marginTop: "6px",
                display: "inline-block",
                padding: "2px 8px",
                background: techniqueColor,
                color: "#F6F4EF",
                fontFamily: "var(--font-mono)",
                fontSize: "10px",
                letterSpacing: "0.1em",
                textTransform: "uppercase",
              }}
            >
              {technique}
            </div>
          )}
        </div>

        {/* Status pill */}
        <div
          style={{
            padding: "4px 10px",
            border: "1px solid #D8D4C8",
            fontFamily: "var(--font-mono)",
            fontSize: "10px",
            letterSpacing: "0.12em",
            color: "#8C8880",
            textTransform: "uppercase",
            whiteSpace: "nowrap",
          }}
        >
          {statusLabel}
        </div>
      </div>

      {/* ── Trial input ── */}
      <div style={{ padding: "20px 28px", borderBottom: "1px solid #D8D4C8" }}>
        <div
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "10px",
            letterSpacing: "0.14em",
            color: "#8C8880",
            textTransform: "uppercase",
            marginBottom: "8px",
          }}
        >
          TEST INPUT — Enter a prompt to run through this wearable
        </div>
        <div style={{ display: "flex", gap: "8px", alignItems: "flex-end" }}>
          <textarea
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleTry();
              }
            }}
            placeholder="Explain the concept of signal-to-noise ratio..."
            rows={2}
            style={{
              flex: 1,
              resize: "none",
              padding: "10px 12px",
              background: "#EFEDE7",
              border: "1px solid #D8D4C8",
              outline: "none",
              fontFamily: "var(--font-sans)",
              fontSize: "14px",
              color: "#1C1B19",
              lineHeight: 1.5,
              borderRadius: 0,
            }}
          />
          <Button
            onClick={handleTry}
            disabled={loading || !query.trim()}
            style={{
              background: loading ? "#EFEDE7" : "#0A0908",
              color: "#F6F4EF",
              border: "1px solid #0A0908",
              borderRadius: 0,
              fontFamily: "var(--font-mono)",
              fontSize: "11px",
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              padding: "10px 20px",
              height: "auto",
              cursor: loading ? "wait" : "pointer",
              transition: "background 200ms ease",
              minWidth: "100px",
            }}
          >
            {loading ? "RUNNING" : "TRY ON"}
          </Button>
        </div>
        {error && (
          <div
            style={{
              marginTop: "8px",
              fontFamily: "var(--font-mono)",
              fontSize: "11px",
              color: "#c0392b",
              letterSpacing: "0.05em",
            }}
          >
            ERROR: {error}
          </div>
        )}
      </div>

      {/* ── Results: before/after ── */}
      {(beforeText || afterText) && (
        <>
          {/* Column headers */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              borderBottom: "1px solid #D8D4C8",
            }}
          >
            <div
              style={{
                padding: "10px 28px",
                borderRight: "1px solid #D8D4C8",
                fontFamily: "var(--font-mono)",
                fontSize: "10px",
                letterSpacing: "0.14em",
                color: "#8C8880",
                textTransform: "uppercase",
              }}
            >
              BASE OUTPUT — unequipped
            </div>
            <div
              style={{
                padding: "10px 28px",
                fontFamily: "var(--font-mono)",
                fontSize: "10px",
                letterSpacing: "0.14em",
                color: "#A8894A",
                textTransform: "uppercase",
              }}
            >
              MODIFIED OUTPUT — {displayWearableName}
            </div>
          </div>

          {/* Side-by-side text */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              borderBottom: "1px solid #D8D4C8",
              minHeight: "160px",
            }}
          >
            {/* Before */}
            <div
              style={{
                padding: "20px 28px",
                borderRight: "1px solid #D8D4C8",
                fontSize: "13px",
                lineHeight: 1.75,
                color: "#1C1B19",
                background: "#F6F4EF",
              }}
            >
              {diff ? (
                <DiffText segments={diff.before} />
              ) : (
                <span>
                  {beforeText}
                  {loading && !beforeDone && <StreamCursor />}
                </span>
              )}
            </div>

            {/* After */}
            <div
              style={{
                padding: "20px 28px",
                fontSize: "13px",
                lineHeight: 1.75,
                color: "#1C1B19",
                background: "#EFEDE7",
              }}
            >
              {diff ? (
                <DiffText segments={diff.after} />
              ) : (
                <span>
                  {afterText}
                  {loading && !afterDone && <StreamCursor />}
                </span>
              )}
            </div>
          </div>

          {/* Delta summary — shown only after LLM analysis completes */}
          {deltaData ? (
            <>
              <div
                style={{
                  padding: "16px 28px",
                  borderBottom: "1px solid #D8D4C8",
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr 1fr 1fr",
                  gap: "24px",
                }}
              >
                {/* Delta score */}
                <div>
                  <div
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: "10px",
                      letterSpacing: "0.12em",
                      color: "#8C8880",
                      textTransform: "uppercase",
                      marginBottom: "6px",
                    }}
                  >
                    BEHAVIORAL DELTA
                  </div>
                  <DeltaScoreBar score={deltaData.delta_score} />
                </div>

                {/* Token reduction */}
                <div>
                  <div
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: "10px",
                      letterSpacing: "0.12em",
                      color: "#8C8880",
                      textTransform: "uppercase",
                      marginBottom: "6px",
                    }}
                  >
                    TOKEN REDUCTION
                  </div>
                  <TokenReductionBar reduction={deltaData.avg_token_reduction} />
                </div>

                {/* Tone shift */}
                <div>
                  <div
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: "10px",
                      letterSpacing: "0.12em",
                      color: "#8C8880",
                      textTransform: "uppercase",
                      marginBottom: "6px",
                    }}
                  >
                    TONE
                  </div>
                  <div
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: "11px",
                      color: "#1C1B19",
                      letterSpacing: "0.04em",
                      lineHeight: 1.4,
                    }}
                  >
                    {deltaData.tone_shift}
                  </div>
                </div>

                {/* Vocabulary */}
                <div>
                  <div
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: "10px",
                      letterSpacing: "0.12em",
                      color: "#8C8880",
                      textTransform: "uppercase",
                      marginBottom: "6px",
                    }}
                  >
                    VOCABULARY
                  </div>
                  <div
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: "11px",
                      color: "#1C1B19",
                      letterSpacing: "0.04em",
                      lineHeight: 1.4,
                    }}
                  >
                    {deltaData.vocabulary_change}
                  </div>
                </div>
              </div>

              {/* Constraints applied */}
              {deltaData.constraints_applied.length > 0 && (
                <div
                  style={{
                    padding: "12px 28px",
                    borderBottom: "1px solid #D8D4C8",
                    display: "flex",
                    alignItems: "flex-start",
                    gap: "12px",
                    flexWrap: "wrap",
                  }}
                >
                  <div
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: "10px",
                      letterSpacing: "0.12em",
                      color: "#8C8880",
                      textTransform: "uppercase",
                      whiteSpace: "nowrap",
                      paddingTop: "2px",
                    }}
                  >
                    CONSTRAINTS:
                  </div>
                  {deltaData.constraints_applied.map((c, i) => (
                    <div
                      key={i}
                      style={{
                        padding: "2px 8px",
                        background: "#0A0908",
                        color: "#8C8880",
                        fontFamily: "var(--font-mono)",
                        fontSize: "10px",
                        letterSpacing: "0.08em",
                        textTransform: "uppercase",
                      }}
                    >
                      {c}
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : analyzing ? (
            <div
              style={{
                padding: "12px 28px",
                borderBottom: "1px solid #D8D4C8",
                fontFamily: "var(--font-mono)",
                fontSize: "10px",
                letterSpacing: "0.14em",
                color: "#8C8880",
                textTransform: "uppercase",
              }}
            >
              MEASURING BEHAVIORAL DELTA —
            </div>
          ) : null}

          {/* System prompt module (collapsed by default) */}
          {systemPromptModule && (
            <div style={{ padding: "12px 28px", borderBottom: "1px solid #D8D4C8" }}>
              <button
                onClick={() => setShowModule(v => !v)}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  fontFamily: "var(--font-mono)",
                  fontSize: "10px",
                  letterSpacing: "0.14em",
                  color: "#8C8880",
                  textTransform: "uppercase",
                  padding: 0,
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                <span style={{ opacity: 0.5 }}>{showModule ? "▾" : "▸"}</span>
                SYSTEM PROMPT MODULE — {showModule ? "HIDE" : "VIEW"} BEHAVIORAL INSTRUCTION
              </button>
              {showModule && (
                <pre
                  style={{
                    marginTop: "10px",
                    padding: "12px",
                    background: "#0A0908",
                    color: "#8C8880",
                    fontFamily: "var(--font-mono)",
                    fontSize: "11px",
                    lineHeight: 1.6,
                    overflowX: "auto",
                    whiteSpace: "pre-wrap",
                    wordBreak: "break-word",
                    maxHeight: "200px",
                    overflowY: "auto",
                    border: "none",
                  }}
                >
                  <span style={{ color: "#A8894A" }}>{displayWearableName}</span>
                  {"\n"}
                  {systemPromptModule}
                </pre>
              )}
            </div>
          )}

          {/* CTA */}
          {onEquip && deltaData && (
            <div
              style={{
                padding: "16px 28px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <div
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "11px",
                  color: "#8C8880",
                  letterSpacing: "0.05em",
                }}
              >
                {deltaData.methodology}
              </div>
              <button
                onClick={() => onEquip(tokenId)}
                style={{
                  padding: "10px 24px",
                  background: "#A8894A",
                  color: "#F6F4EF",
                  border: "none",
                  fontFamily: "var(--font-mono)",
                  fontSize: "11px",
                  letterSpacing: "0.14em",
                  textTransform: "uppercase",
                  cursor: "pointer",
                  transition: "background 200ms ease",
                }}
                onMouseEnter={e => (e.currentTarget.style.background = "#0A0908")}
                onMouseLeave={e => (e.currentTarget.style.background = "#A8894A")}
              >
                EQUIP WEARABLE
              </button>
            </div>
          )}
        </>
      )}

      {/* ── Empty state ── */}
      {!beforeText && !afterText && !loading && (
        <div
          style={{
            padding: "48px 28px",
            textAlign: "center",
            color: "#8C8880",
            fontFamily: "var(--font-sans)",
            fontSize: "13px",
            letterSpacing: "0.04em",
            lineHeight: 1.8,
            fontWeight: 300,
          }}
        >
          <div
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "32px",
              color: "#D8D4C8",
              marginBottom: "12px",
              letterSpacing: "0.05em",
            }}
          >
            ∅
          </div>
          Enter a prompt above to simulate this wearable&rsquo;s behavioral effect.
          <br />
          Base output and modified output will stream side-by-side in real time.
        </div>
      )}

      {/* ── Loading state (before first chunks arrive) ── */}
      {loading && !beforeText && !afterText && (
        <div
          style={{
            padding: "48px 28px",
            textAlign: "center",
            color: "#8C8880",
          }}
        >
          <div
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "11px",
              letterSpacing: "0.18em",
              textTransform: "uppercase",
            }}
          >
            INITIALIZING PARALLEL INFERENCE —
          </div>
        </div>
      )}
    </div>
  );
}
