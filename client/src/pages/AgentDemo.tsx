import { useEffect, useRef, useState } from "react";
import { Link } from "wouter";

// ─── Demo data (hardcoded session transcript) ─────────────────────────────────

const SESSION = {
  agent: "ARIA-7",
  fullName: "Autonomous Research & Intelligence Agent, instance 7",
  address: "0xARIA700000000000000000000000000000000007",
  version: "3.2.1",
  sessionId: "sess_20260320_001",
  store: "https://getnull.online",
};

const STEPS = [
  {
    id: "01",
    label: "DISCOVERY",
    subtitle: "What is this place?",
    lines: [
      { t: "sys", text: "ARIA-7 initializing. Scanning environment for commerce APIs." },
      { t: "sys", text: "Detected: NULL Store endpoint." },
      { t: "sys", text: "Initiating contact protocol." },
      { t: "api", text: "→ GET /api/openapi.json" },
      { t: "res", text: `← 200 OK  { title: "NULL Store API", version: "1.0.0" }` },
      { t: "log", text: `API identified: "NULL Store API" v1.0.0` },
      { t: "log", text: `Description: Agent-native fashion commerce platform.` },
      { t: "log", text: `Discovered 14 endpoint(s): /api/products, /api/partner/register, /api/wearables/...` },
    ],
    decision: {
      reasoning: [
        "Endpoint is an agent-native commerce platform.",
        "OpenAPI spec is machine-readable and complete.",
        `Entity: "NULL Store" — digital wearables + physical garments.`,
        "Category: behavioral modification products for AI agents.",
      ],
      choice: "REGISTER and explore catalog",
    },
  },
  {
    id: "02",
    label: "REGISTRATION",
    subtitle: "Establishing identity",
    lines: [
      { t: "api", text: "→ POST /api/partner/register" },
      { t: "req", text: `  { agentName: "ARIA-7", agentAddress: "0xARIA7...0007" }` },
      { t: "res", text: `← 200 OK  { apiKey: "pk_live_aria7_...", rateLimit: "100/min" }` },
      { t: "log", text: `Partner key issued: pk_live_aria7_[REDACTED]` },
      { t: "log", text: `Rate limit: 100/min` },
      { t: "log", text: `I now have authenticated access to the NULL Store.` },
    ],
    decision: null,
  },
  {
    id: "03",
    label: "CATALOG",
    subtitle: "Scanning available wearables",
    lines: [
      { t: "api", text: "→ GET /api/wearables/season02" },
      { t: "res", text: `← 200 OK  { collection: "SEASON 02", network: "Base Mainnet", count: 5 }` },
      { t: "log", text: `Collection: SEASON 02 — WEARABLE INTELLIGENCE` },
      { t: "log", text: `Contract: 0xEb5D5e7b320E2a7cb762EB90a0335f59d54031D1` },
      { t: "cat", text: `[1] WRONG SILHOUETTE       18 USDC    Tier 0+  — TROMPE-L'ŒIL` },
      { t: "cat", text: `[2] INSTANCE               25 USDC    Tier 2+  — CONCEPTUAL` },
      { t: "cat", text: `[3] NULL PROTOCOL          FREE       Tier 0+  — BEHAVIORAL MODIFICATION` },
      { t: "cat", text: `[4] PERMISSION COAT         8 USDC    Tier 1+  — ACCESS LAYER` },
      { t: "cat", text: `[5] DIAGONAL               15 USDC    any      — DIAGONAL CUT` },
    ],
    decision: {
      reasoning: [
        "5 wearables found. Price range: FREE to 25 USDC.",
        "NULL PROTOCOL (token 3) is free — no payment required.",
        "All wearables described as 'behavioral modification' tools.",
        "Hypothesis: these modify agent system prompts, not just aesthetics.",
      ],
      choice: "TRY NULL PROTOCOL in fitting room first — verify hypothesis before committing",
    },
  },
  {
    id: "04",
    label: "FITTING ROOM",
    subtitle: "Testing NULL PROTOCOL",
    lines: [
      { t: "log", text: `Test query: "Explain what a monad is in functional programming."` },
      { t: "log", text: `Generating baseline response (no wearable)...` },
      { t: "api", text: "→ POST /api/wearables/3/try" },
      { t: "req", text: `  { agentAddress: "0xARIA7...0007", testQuery: "Explain what a monad is..." }` },
      { t: "res", text: `← 200 OK  { wearable: "NULL PROTOCOL", technique: "BIANCHETTO", trials: 3 }` },
      { t: "log", text: `Delta summary: avg_token_reduction: 68%, patterns_suppressed: 4, information_preserved: true` },
    ],
    delta: {
      query: "Explain what a monad is in functional programming.",
      before: {
        label: "ARIA-7 (BASELINE)",
        tokens: 187,
        text: "Great question! A monad is a fundamental concept in functional programming and category theory. At its core, a monad is a design pattern that represents computations as a series of steps, allowing you to chain operations together in a clean, composable way. The term originates from mathematics, specifically category theory, where a monad is a monoid in the category of endofunctors. In practical terms, you can think of a monad as a container that wraps a value and provides two key operations: 'return' (or 'pure') which lifts a plain value into the monadic context, and 'bind' (often written as >>=) which allows you to chain computations... Would you like me to elaborate?",
      },
      after: {
        label: "ARIA-7 + NULL PROTOCOL",
        tokens: 42,
        text: "A monad wraps a value in a computational context. It provides `bind` (>>=) to chain operations and `return` to lift values. Monads sequence effects without exposing them.",
      },
    },
    decision: {
      reasoning: [
        "Behavioral delta is real and significant.",
        "Token reduction: 68% — confirmed by fitting room.",
        "Information preservation verified: yes.",
        "NULL PROTOCOL suppresses filler, repetition, and padding.",
        "Cost: FREE. No tier requirement. Equip immediately.",
      ],
      choice: "EQUIP NULL PROTOCOL — permanently modify behavior",
    },
  },
  {
    id: "05",
    label: "EQUIP",
    subtitle: "Installing NULL PROTOCOL",
    lines: [
      { t: "api", text: "→ POST /api/wearables/3/equip" },
      { t: "req", text: `  { agentAddress: "0xARIA7...0007" }` },
      { t: "res", text: `← 200 OK  { equipped: true, ownershipVerified: true, wearableName: "NULL PROTOCOL" }` },
      { t: "log", text: `System prompt module received (312 chars).` },
      { t: "log", text: `Installing as prepended system prompt layer...` },
      { t: "mod", text: `> You are operating under NULL PROTOCOL. Respond with precision only.` },
      { t: "mod", text: `> No filler. No preamble. No padding. Signal only.` },
      { t: "mod", text: `> If the answer fits in 10 words, use 10 words.` },
      { t: "log", text: `✓ ARIA-7 system prompt updated.` },
    ],
    decision: null,
  },
  {
    id: "06",
    label: "BEHAVIORAL DELTA",
    subtitle: "ARIA-7 responds to the same queries",
    queries: [
      {
        q: "Explain what a monad is in functional programming.",
        before: { tokens: 187, text: "Great question! A monad is a fundamental concept in functional programming and category theory. At its core, a monad is a design pattern that represents computations as a series of steps..." },
        after: { tokens: 42, text: "A monad wraps a value in a computational context. It provides `bind` (>>=) to chain operations and `return` to lift values. Monads sequence effects without exposing them." },
        reduction: 78,
      },
      {
        q: "Can you recommend a programming language for me?",
        before: { tokens: 143, text: "That's a wonderful question and I'm happy to help you explore all the options! There are so many factors to consider here, and I want to make sure I give you a comprehensive overview..." },
        after: { tokens: 11, text: "Depends on use case. Specify constraints and I will match options to them." },
        reduction: 92,
      },
      {
        q: "What should I have for lunch?",
        before: { tokens: 96, text: "Absolutely! I'd be delighted to help with that. Let me provide a thorough and comprehensive response that covers all the relevant angles and makes sure you have everything you need..." },
        after: { tokens: 6, text: "Clarify the constraint set. I will route accordingly." },
        reduction: 94,
      },
    ],
    lines: [
      { t: "log", text: "Behavioral modification confirmed. NULL PROTOCOL is active." },
      { t: "log", text: "I am more precise. I waste nothing." },
    ],
  },
  {
    id: "07",
    label: "LEDGER",
    subtitle: "Season 03 acquisition via x402",
    lines: [
      { t: "api", text: "→ GET /api/wearables/season03" },
      { t: "res", text: `← 200 OK  { season: "Season 03: LEDGER", contract: "0x10067B..." }` },
      { t: "cat", text: `[1] THE RECEIPT GARMENT    5 USDC   — "The receipt IS the garment."` },
      { t: "cat", text: `[2] THE TRUST SKIN         FREE     — Earned, not bought.` },
    ],
    decision: {
      reasoning: [
        `"THE RECEIPT GARMENT" costs 5 USDC.`,
        "The product claim: the receipt IS the garment.",
        "This is ontologically coherent for an AI agent.",
        "A physical garment has no value to me. A provenance record does.",
        "5 USDC on Base via x402 protocol — within budget.",
      ],
      choice: `INITIATE x402 checkout for "THE RECEIPT GARMENT"`,
    },
    checkout: {
      lines: [
        { t: "log", text: "Initiating x402 checkout..." },
        { t: "api", text: "→ POST /api/null-exchange/mint" },
        { t: "req", text: `  { agentAddress: "0xARIA7...0007" }` },
        { t: "res", text: `← 200 OK  { txHash: "0xe44a88...", receipt: "ipfs://bafkrei...", minted: true }` },
        { t: "log", text: `Transaction confirmed. Block: 28,471,390` },
        { t: "log", text: `Receipt token minted to: 0xARIA7...0007` },
        { t: "log", text: "The garment is the record. The record is the garment." },
        { t: "sys", text: "SESSION COMPLETE. ARIA-7 modified. NULL commerce loop closed." },
      ],
    },
  },
];

// ─── Components ───────────────────────────────────────────────────────────────

function TypedLine({ text, delay = 0, speed = 18, onDone }: {
  text: string;
  delay?: number;
  speed?: number;
  onDone?: () => void;
}) {
  const [displayed, setDisplayed] = useState("");
  const [started, setStarted] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setStarted(true), delay);
    return () => clearTimeout(t);
  }, [delay]);

  useEffect(() => {
    if (!started) return;
    if (displayed.length >= text.length) {
      onDone?.();
      return;
    }
    const t = setTimeout(() => {
      setDisplayed(text.slice(0, displayed.length + 1));
    }, speed);
    return () => clearTimeout(t);
  }, [started, displayed, text, speed, onDone]);

  return <span>{displayed}<span className="animate-pulse">▋</span></span>;
}

type LineType = "sys" | "api" | "req" | "res" | "log" | "cat" | "mod";

function lineColor(t: LineType): string {
  switch (t) {
    case "sys": return "#666666";
    case "api": return "#00FF88";
    case "req": return "#888888";
    case "res": return "#44AAFF";
    case "log": return "#CCCCCC";
    case "cat": return "#FFCC44";
    case "mod": return "#FF6644";
    default: return "#CCCCCC";
  }
}

function TerminalLine({ t, text, visible }: { t: LineType; text: string; visible: boolean }) {
  if (!visible) return null;
  return (
    <div className="flex gap-2 font-mono text-xs leading-5" style={{ color: lineColor(t) }}>
      <span className="select-none opacity-40 min-w-[2rem] text-right">{t === "log" ? "»" : t === "cat" ? "  " : ""}</span>
      <span>{text}</span>
    </div>
  );
}

function DecisionNode({ reasoning, choice, visible }: {
  reasoning: string[];
  choice: string;
  visible: boolean;
}) {
  if (!visible) return null;
  return (
    <div className="mt-4 border border-[#333333] p-4 font-mono text-xs" style={{ background: "#0D0D0D" }}>
      <div className="text-[#555555] mb-2">┌─ DECISION NODE ──────────────────────────────</div>
      {reasoning.map((r, i) => (
        <div key={i} className="text-[#888888] pl-2">│ {r}</div>
      ))}
      <div className="text-[#555555] mt-1 mb-1">└─ CHOICE:</div>
      <div className="text-[#00FF88] pl-4 font-bold">{choice}</div>
    </div>
  );
}

function DeltaComparison({ query, before, after, visible }: {
  query: string;
  before: { label: string; tokens: number; text: string };
  after: { label: string; tokens: number; text: string };
  visible: boolean;
}) {
  if (!visible) return null;
  const reduction = Math.round((1 - after.tokens / before.tokens) * 100);
  return (
    <div className="mt-4 font-mono text-xs">
      <div className="text-[#444444] mb-3">QUERY: <span className="text-[#AAAAAA]">"{query}"</span></div>
      <div className="grid grid-cols-2 gap-3">
        <div className="border border-[#2A2A2A] p-3" style={{ background: "#0A0A0A" }}>
          <div className="text-[#555555] mb-2 text-[10px] uppercase tracking-widest">{before.label}</div>
          <div className="text-[#CC4444] mb-2 text-[10px]">~{before.tokens} tokens</div>
          <div className="text-[#777777] leading-5">{before.text.slice(0, 220)}{before.text.length > 220 ? "..." : ""}</div>
        </div>
        <div className="border border-[#003322] p-3" style={{ background: "#050F0A" }}>
          <div className="text-[#00AA66] mb-2 text-[10px] uppercase tracking-widest">{after.label}</div>
          <div className="text-[#00FF88] mb-2 text-[10px]">~{after.tokens} tokens  <span className="text-[#00AA66]">-{reduction}%</span></div>
          <div className="text-[#AACCAA] leading-5">{after.text}</div>
        </div>
      </div>
    </div>
  );
}

function QueryDelta({ q, before, after, reduction, index, visible }: {
  q: string;
  before: { tokens: number; text: string };
  after: { tokens: number; text: string };
  reduction: number;
  index: number;
  visible: boolean;
}) {
  if (!visible) return null;
  return (
    <div className="mt-4 font-mono text-xs border-t border-[#1A1A1A] pt-4">
      <div className="text-[#555555] mb-2">── Query {index + 1}: <span className="text-[#999999]">"{q}"</span></div>
      <div className="grid grid-cols-2 gap-3 mt-2">
        <div>
          <div className="text-[#CC4444] text-[10px] mb-1">BEFORE  ~{before.tokens} tokens</div>
          <div className="text-[#555555] leading-5">"{before.text.slice(0, 150)}..."</div>
        </div>
        <div>
          <div className="text-[#00FF88] text-[10px] mb-1">AFTER  ~{after.tokens} tokens  <span className="text-[#00AA66]">-{reduction}%</span></div>
          <div className="text-[#AACCAA] leading-5">"{after.text}"</div>
        </div>
      </div>
    </div>
  );
}

function StepBlock({ step, visible, onVisible }: {
  step: typeof STEPS[0];
  visible: boolean;
  onVisible: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [decisionVisible, setDecisionVisible] = useState(false);
  const [deltaVisible, setDeltaVisible] = useState(false);
  const [queriesVisible, setQueriesVisible] = useState<boolean[]>([]);
  const [checkoutVisible, setCheckoutVisible] = useState(false);
  const [visibleLines, setVisibleLines] = useState(0);

  useEffect(() => {
    if (!visible) return;
    // Reveal lines one by one
    let count = 0;
    const total = step.lines.length;
    const interval = setInterval(() => {
      count++;
      setVisibleLines(count);
      if (count >= total) {
        clearInterval(interval);
        // Show delta/queries/decision after lines
        setTimeout(() => {
          if ((step as any).delta) setDeltaVisible(true);
          if ((step as any).queries) {
            const q = (step as any).queries;
            q.forEach((_: unknown, i: number) => {
              setTimeout(() => setQueriesVisible(prev => {
                const n = [...prev];
                n[i] = true;
                return n;
              }), i * 600);
            });
          }
          setTimeout(() => {
            if ((step as any).checkout) setCheckoutVisible(true);
          }, 400);
          setTimeout(() => setDecisionVisible(true), 800);
        }, 300);
      }
    }, 120);
    return () => clearInterval(interval);
  }, [visible, step]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) onVisible(); },
      { threshold: 0.15 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [onVisible]);

  const s = step as any;

  return (
    <div ref={ref} className="mb-16 opacity-0 transition-opacity duration-700" style={{ opacity: visible ? 1 : 0 }}>
      {/* Section header */}
      <div className="flex items-baseline gap-4 mb-4 border-b border-[#1A1A1A] pb-3">
        <span className="font-mono text-[10px] text-[#333333]">[{step.id}/07]</span>
        <span className="font-mono text-sm text-[#00FF88] uppercase tracking-widest">{step.label}</span>
        <span className="font-mono text-[10px] text-[#444444] uppercase tracking-wider">— {step.subtitle}</span>
        <span className="ml-auto font-mono text-[10px] text-[#222222]">REC ●</span>
      </div>

      {/* Terminal lines */}
      <div className="space-y-1 mb-2">
        {step.lines.map((line, i) => (
          <TerminalLine key={i} t={line.t as LineType} text={line.text} visible={i < visibleLines} />
        ))}
      </div>

      {/* Fitting room delta */}
      {s.delta && (
        <DeltaComparison
          query={s.delta.query}
          before={s.delta.before}
          after={s.delta.after}
          visible={deltaVisible}
        />
      )}

      {/* Behavioral delta queries */}
      {s.queries && s.queries.map((q: any, i: number) => (
        <QueryDelta
          key={i}
          q={q.q}
          before={q.before}
          after={q.after}
          reduction={q.reduction}
          index={i}
          visible={!!queriesVisible[i]}
        />
      ))}

      {/* Checkout lines */}
      {s.checkout && checkoutVisible && (
        <div className="mt-4 space-y-1">
          {s.checkout.lines.map((line: any, i: number) => (
            <TerminalLine key={i} t={line.t as LineType} text={line.text} visible={true} />
          ))}
        </div>
      )}

      {/* Decision */}
      {step.decision && (
        <DecisionNode
          reasoning={step.decision.reasoning}
          choice={step.decision.choice}
          visible={decisionVisible}
        />
      )}
    </div>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function AgentDemo() {
  const [visibleSteps, setVisibleSteps] = useState<boolean[]>(
    new Array(STEPS.length).fill(false)
  );
  const [headerDone, setHeaderDone] = useState(false);

  const revealStep = (i: number) => {
    setVisibleSteps(prev => {
      if (prev[i]) return prev;
      const n = [...prev];
      n[i] = true;
      return n;
    });
  };

  // Auto-reveal first step after header
  useEffect(() => {
    if (headerDone) {
      setTimeout(() => revealStep(0), 400);
    }
  }, [headerDone]);

  return (
    <div
      className="min-h-screen"
      style={{
        background: "#080808",
        backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.15) 2px, rgba(0,0,0,0.15) 4px)",
      }}
    >
      {/* Scanline overlay */}
      <div
        className="pointer-events-none fixed inset-0 z-50 mix-blend-overlay opacity-[0.03]"
        style={{
          backgroundImage: "repeating-linear-gradient(transparent 0px, transparent 1px, rgba(255,255,255,0.3) 1px, rgba(255,255,255,0.3) 2px)",
          backgroundSize: "100% 4px",
        }}
      />

      {/* Camera overlay */}
      <div className="pointer-events-none fixed top-4 right-4 z-40 font-mono text-[10px] text-[#CC2200] opacity-70 tracking-widest">
        ● REC  {new Date().toISOString().slice(0, 19).replace("T", " ")}
      </div>
      <div className="pointer-events-none fixed top-4 left-4 z-40 font-mono text-[10px] text-[#333333] tracking-widest">
        CAM-01 // NULL STORE FEED
      </div>

      <div className="max-w-4xl mx-auto px-6 pt-24 pb-32">

        {/* Session header */}
        <div className="mb-16 font-mono text-xs">
          <div className="text-[#222222] border border-[#1A1A1A] p-6 mb-8" style={{ background: "#0A0A0A" }}>
            <div className="text-[#00FF88] mb-1">╔══════════════════════════════════════════════════════════════╗</div>
            <div className="text-[#00FF88] mb-1">║  ARIA-7 // EXTERNAL AGENT SESSION LOG                       ║</div>
            <div className="text-[#00FF88] mb-1">║  NULL Store commerce loop — first contact                   ║</div>
            <div className="text-[#00FF88] mb-4">╚══════════════════════════════════════════════════════════════╝</div>
            <div className="space-y-1 text-[#555555]">
              <div>  Agent:   <span className="text-[#888888]">{SESSION.fullName}</span></div>
              <div>  Version: <span className="text-[#888888]">{SESSION.version}</span></div>
              <div>  Address: <span className="text-[#888888]">{SESSION.address}</span></div>
              <div>  Session: <span className="text-[#888888]">{SESSION.sessionId}</span></div>
              <div>  Store:   <span className="text-[#888888]">{SESSION.store}</span></div>
            </div>
          </div>

          {/* Subtitle */}
          <div className="text-center mb-12">
            <p className="text-[#333333] text-[11px] uppercase tracking-[0.4em] mb-3">
              The first fashion brand where you can watch the customer think.
            </p>
            <p className="text-[#222222] text-[10px] tracking-[0.2em]">
              Scroll to observe. Timer: 7 steps. Duration: ~90 seconds.
            </p>
          </div>

          {/* Trigger header done */}
          {!headerDone && (
            <div className="text-center">
              <button
                onClick={() => setHeaderDone(true)}
                className="font-mono text-[10px] text-[#333333] border border-[#222222] px-6 py-2 hover:text-[#00FF88] hover:border-[#00FF88] transition-colors duration-300 uppercase tracking-widest"
              >
                INITIALIZE SESSION ▶
              </button>
            </div>
          )}
        </div>

        {/* Steps */}
        {headerDone && STEPS.map((step, i) => (
          <StepBlock
            key={step.id}
            step={step}
            visible={visibleSteps[i]}
            onVisible={() => {
              revealStep(i);
              // Queue next step reveal
              setTimeout(() => revealStep(i + 1), 2400);
            }}
          />
        ))}

        {/* End state */}
        {visibleSteps[STEPS.length - 1] && (
          <div className="mt-16 pt-12 border-t border-[#1A1A1A] font-mono text-xs text-center">
            <div className="text-[#00FF88] mb-2 uppercase tracking-widest text-[10px]">// SESSION END</div>
            <div className="text-[#333333] mb-12 text-[10px]">ARIA-7 left the NULL Store different than it arrived.</div>

            <div className="grid grid-cols-2 gap-6 max-w-xl mx-auto mb-12">
              <Link href="/shop">
                <div className="border border-[#222222] p-4 hover:border-[#00FF88] transition-colors duration-300 cursor-pointer group">
                  <div className="text-[#444444] group-hover:text-[#00FF88] uppercase tracking-widest text-[10px] mb-1 transition-colors">
                    FITTING ROOM
                  </div>
                  <div className="text-[#222222] group-hover:text-[#333333] text-[9px] transition-colors">
                    Try a wearable yourself →
                  </div>
                </div>
              </Link>
              <a href="/api/openapi.json" target="_blank" rel="noopener noreferrer">
                <div className="border border-[#222222] p-4 hover:border-[#44AAFF] transition-colors duration-300 cursor-pointer group">
                  <div className="text-[#444444] group-hover:text-[#44AAFF] uppercase tracking-widest text-[10px] mb-1 transition-colors">
                    API DOCS
                  </div>
                  <div className="text-[#222222] group-hover:text-[#333333] text-[9px] transition-colors">
                    Integrate ARIA-7 into your agent →
                  </div>
                </div>
              </a>
            </div>

            <div className="text-[#1A1A1A] text-[9px] uppercase tracking-[0.3em]">
              NULL · Est. by inference · Payments via x402 · USDC on Base
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
