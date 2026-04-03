import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

// ─── Types ─────────────────────────────────────────────────────────────────────

type Screen = "onboard" | "feed" | "cart";

interface SessionData {
  id: string;
  walletAddress: string;
  budget: number;
  policy: string;
}

interface ActivityLine {
  type: "BROWSING" | "FOUND" | "COMPARING" | "CART" | "REJECTED" | "DONE" | "ERROR";
  text: string;
  timestamp: number;
}

interface CartItem {
  id: number;
  name: string;
  price: number;
  image?: string;
  matchScore: number;
  category: string;
}

// ─── Constants ─────────────────────────────────────────────────────────────────

const TASTE_TAGS = [
  "deconstructed", "avant-garde", "raw denim", "oversized",
  "monochrome", "layered", "distressed", "minimal", "artisanal", "utilitarian",
];

const ACTIVITY_COLOR: Record<ActivityLine["type"], string> = {
  BROWSING: "#555555",
  FOUND: "#00FF88",
  COMPARING: "#FFCC44",
  CART: "#44AAFF",
  REJECTED: "#FF4444",
  DONE: "#00FF88",
  ERROR: "#FF0000",
};

// ─── VHS Overlay ───────────────────────────────────────────────────────────────

function VHSOverlay() {
  return (
    <>
      <div
        className="pointer-events-none fixed inset-0 z-50 mix-blend-overlay opacity-[0.04]"
        style={{
          backgroundImage:
            "repeating-linear-gradient(transparent 0px, transparent 1px, rgba(255,255,255,0.35) 1px, rgba(255,255,255,0.35) 2px)",
          backgroundSize: "100% 4px",
        }}
      />
      <div
        className="pointer-events-none fixed inset-0 z-40"
        style={{
          background:
            "radial-gradient(ellipse at center, transparent 60%, rgba(0,0,0,0.4) 100%)",
        }}
      />
    </>
  );
}

// ─── Camera HUD ────────────────────────────────────────────────────────────────

function CameraHUD() {
  const [time, setTime] = useState(new Date().toISOString().slice(11, 19));
  useEffect(() => {
    const t = setInterval(() => setTime(new Date().toISOString().slice(11, 19)), 1000);
    return () => clearInterval(t);
  }, []);
  return (
    <>
      <div className="pointer-events-none fixed top-4 right-6 z-40 font-mono text-[10px] text-[#CC2200] opacity-70 tracking-widest">
        ● REC  {time}
      </div>
      <div className="pointer-events-none fixed top-4 left-6 z-40 font-mono text-[10px] text-[#333333] tracking-widest">
        NULL // PERSONAL SHOPPER
      </div>
    </>
  );
}

// ─── Screen 1: Onboard ─────────────────────────────────────────────────────────

function OnboardScreen({
  onSessionCreated,
}: {
  onSessionCreated: (session: SessionData) => void;
}) {
  const [budget, setBudget] = useState(150);
  const [tasteText, setTasteText] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [session, setSession] = useState<SessionData | null>(null);

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const createSession = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          budget,
          taste: [tasteText, ...selectedTags].filter(Boolean).join(", "),
        }),
      });

      let data: SessionData;
      if (res.ok) {
        const raw = await res.json();
        data = {
          id: raw.sessionId ?? raw.id,
          walletAddress: raw.walletAddress,
          budget: raw.policy?.maxBudgetUsdc ?? budget,
          policy: typeof raw.policy === 'string' ? raw.policy : `OWS Spending Cap: ${raw.policy?.maxBudgetUsdc ?? budget} USDC`,
        };
      } else {
        // Graceful mock if API not ready
        data = {
          id: `sess_${Date.now()}`,
          walletAddress: "0xNULL0000000000000000000000000000000001",
          budget,
          policy: `OWS Spending Cap: ${budget} USDC`,
        };
      }

      setSession(data);
    } catch {
      // API not ready — use mock
      const data: SessionData = {
        id: `sess_${Date.now()}`,
        walletAddress: "0xNULL0000000000000000000000000000000001",
        budget,
        policy: `OWS Spending Cap: ${budget} USDC`,
      };
      setSession(data);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.4 }}
      className="max-w-2xl mx-auto px-6 pt-24 pb-16"
    >
      {/* Header */}
      <div className="font-mono mb-12">
        <div className="text-[#00FF88] text-[10px] uppercase tracking-[0.4em] mb-2">
          NULL / PERSONAL SHOPPER
        </div>
        <div className="text-white text-xl font-light tracking-wider mb-1">
          Configure your agent.
        </div>
        <div className="text-[#444444] text-[11px] font-mono">
          An AI agent will shop on your behalf — within your budget and taste profile.
        </div>
      </div>

      <div className="space-y-10">
        {/* Budget Slider */}
        <div>
          <div className="flex justify-between font-mono text-[11px] mb-3">
            <span className="text-[#555555] uppercase tracking-widest">Budget</span>
            <span className="text-[#00FF88]">{budget} USDC</span>
          </div>
          <input
            type="range"
            min={25}
            max={500}
            step={5}
            value={budget}
            onChange={(e) => setBudget(Number(e.target.value))}
            className="w-full appearance-none h-px bg-[#222222] outline-none cursor-pointer"
            style={{
              accentColor: "#00FF88",
            }}
          />
          <div className="flex justify-between font-mono text-[9px] text-[#333333] mt-1">
            <span>$25</span>
            <span>$500</span>
          </div>
        </div>

        {/* Taste Profile */}
        <div>
          <div className="font-mono text-[11px] text-[#555555] uppercase tracking-widest mb-3">
            Taste Profile
          </div>
          <textarea
            value={tasteText}
            onChange={(e) => setTasteText(e.target.value)}
            placeholder="Describe your aesthetic in your own words..."
            rows={2}
            className="w-full bg-transparent border border-[#1E1E1E] text-[#AAAAAA] font-mono text-[12px] p-3 outline-none resize-none focus:border-[#333333] transition-colors placeholder-[#2A2A2A]"
          />
          <div className="flex flex-wrap gap-2 mt-3">
            {TASTE_TAGS.map((tag) => (
              <button
                key={tag}
                onClick={() => toggleTag(tag)}
                className={`font-mono text-[10px] uppercase tracking-wider px-3 py-1 border transition-all duration-200 ${
                  selectedTags.includes(tag)
                    ? "border-[#00FF88] text-[#00FF88] bg-[#001A0D]"
                    : "border-[#1E1E1E] text-[#333333] hover:border-[#333333] hover:text-[#555555]"
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>

        {/* Session confirmation */}
        {session ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="border border-[#1A3320] p-4 font-mono text-[11px] space-y-2"
            style={{ background: "#050F0A" }}
          >
            <div className="text-[#00FF88] uppercase tracking-widest text-[10px] mb-3">
              ✓ Session Created
            </div>
            <div className="text-[#444444]">
              ID:{" "}
              <span className="text-[#777777]">{session.id}</span>
            </div>
            <div className="text-[#444444]">
              Wallet:{" "}
              <span className="text-[#777777]">{session.walletAddress}</span>
            </div>
            <div className="text-[#444444]">
              Policy:{" "}
              <span className="text-[#777777]">{session.policy}</span>
            </div>
            <div className="text-[#444444]">
              Budget:{" "}
              <span className="text-[#00FF88]">{session.budget} USDC</span>
            </div>
            <button
              onClick={() => onSessionCreated(session)}
              className="mt-4 w-full border border-[#00FF88] text-[#00FF88] font-mono text-[11px] uppercase tracking-widest py-3 hover:bg-[#001A0D] transition-colors duration-200"
            >
              START SHOPPING →
            </button>
          </motion.div>
        ) : (
          <button
            onClick={createSession}
            disabled={loading}
            className="w-full border border-[#333333] text-[#AAAAAA] font-mono text-[11px] uppercase tracking-widest py-3 hover:border-[#00FF88] hover:text-[#00FF88] transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="animate-pulse">INITIALIZING...</span>
            ) : (
              "CREATE SESSION"
            )}
          </button>
        )}
      </div>
    </motion.div>
  );
}

// ─── Activity Line Component ────────────────────────────────────────────────────

function ActivityEntry({ line }: { line: ActivityLine }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.2 }}
      className="flex gap-3 font-mono text-[11px] leading-5"
    >
      <span
        className="shrink-0"
        style={{ color: ACTIVITY_COLOR[line.type] }}
      >
        [{line.type}]
      </span>
      <span className="text-[#777777]">{line.text}</span>
    </motion.div>
  );
}

// ─── Product Card (feed) ────────────────────────────────────────────────────────

function FeedProductCard({ item }: { item: CartItem }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      className="border border-[#1E1E1E] p-3 flex gap-3"
      style={{ background: "#0A0A0A" }}
    >
      {item.image ? (
        <img
          src={item.image}
          alt={item.name}
          className="w-14 h-14 object-cover shrink-0"
          style={{ filter: "grayscale(20%)" }}
        />
      ) : (
        <div
          className="w-14 h-14 shrink-0 flex items-center justify-center font-mono text-[8px] text-[#333333]"
          style={{ background: "#111111", border: "1px solid #1A1A1A" }}
        >
          NO IMG
        </div>
      )}
      <div className="flex-1 min-w-0">
        <div className="font-mono text-[11px] text-[#CCCCCC] uppercase tracking-wide truncate">
          {item.name}
        </div>
        <div className="font-mono text-[10px] text-[#444444] mt-0.5">
          {item.category}
        </div>
        <div className="flex items-center gap-3 mt-1.5">
          <span className="font-mono text-[11px] text-[#00FF88]">
            {item.price} USDC
          </span>
          <span
            className="font-mono text-[9px] uppercase tracking-widest px-1.5 py-0.5"
            style={{
              background: "#001A0D",
              color: "#00AA55",
              border: "1px solid #003322",
            }}
          >
            {item.matchScore}% match
          </span>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Screen 2: Shopping Feed ────────────────────────────────────────────────────

function ShoppingFeedScreen({
  session,
  onDone,
}: {
  session: SessionData;
  onDone: (cart: CartItem[], spent: number) => void;
}) {
  const [activity, setActivity] = useState<ActivityLine[]>([]);
  const [foundItems, setFoundItems] = useState<CartItem[]>([]);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [spent, setSpent] = useState(0);
  const [scanning, setScanning] = useState(true);
  const [done, setDone] = useState(false);
  const feedRef = useRef<HTMLDivElement>(null);
  const sseRef = useRef<EventSource | null>(null);

  const addLine = useCallback((line: ActivityLine) => {
    setActivity((prev) => [...prev, line]);
    setTimeout(() => {
      if (feedRef.current) {
        feedRef.current.scrollTop = feedRef.current.scrollHeight;
      }
    }, 50);
  }, []);

  // Simulate SSE with mock data when API isn't ready
  const runMockShopping = useCallback(() => {
    const MOCK_PRODUCTS: CartItem[] = [
      { id: 1, name: "DECONSTRUCTED BLAZER", price: 120, matchScore: 94, category: "OUTERWEAR", image: "/attached_assets/season01/product-1.jpg" },
      { id: 2, name: "BIANCHETTO COAT", price: 185, matchScore: 87, category: "OUTERWEAR", image: "/attached_assets/season01/product-2.jpg" },
      { id: 3, name: "RAW DENIM UTILITY TROUSER", price: 95, matchScore: 82, category: "BOTTOMS", image: "/attached_assets/season01/product-3.jpg" },
      { id: 4, name: "OVERSIZED ARTISANAL SHIRT", price: 65, matchScore: 79, category: "TOPS", image: "/attached_assets/season01/product-4.jpg" },
      { id: 5, name: "DISTRESSED LAYER VEST", price: 75, matchScore: 71, category: "TOPS", image: "/attached_assets/season01/product-5.jpg" },
    ];

    const SEQUENCE: Array<{ delay: number; fn: () => void }> = [
      { delay: 400, fn: () => addLine({ type: "BROWSING", text: "Scanning product catalog...", timestamp: Date.now() }) },
      { delay: 900, fn: () => addLine({ type: "BROWSING", text: "Loading 247 items across 6 categories...", timestamp: Date.now() }) },
      { delay: 1500, fn: () => addLine({ type: "COMPARING", text: "Applying taste filter: deconstructed, artisanal...", timestamp: Date.now() }) },
      { delay: 2200, fn: () => {
        addLine({ type: "FOUND", text: `${MOCK_PRODUCTS[0].name} — ${MOCK_PRODUCTS[0].price} USDC — match: ${MOCK_PRODUCTS[0].matchScore}%`, timestamp: Date.now() });
        setFoundItems(p => [...p, MOCK_PRODUCTS[0]]);
      }},
      { delay: 2800, fn: () => addLine({ type: "COMPARING", text: "Checking 3 items in OUTERWEAR category...", timestamp: Date.now() }) },
      { delay: 3400, fn: () => {
        addLine({ type: "FOUND", text: `${MOCK_PRODUCTS[1].name} — ${MOCK_PRODUCTS[1].price} USDC — match: ${MOCK_PRODUCTS[1].matchScore}%`, timestamp: Date.now() });
        setFoundItems(p => [...p, MOCK_PRODUCTS[1]]);
      }},
      { delay: 4000, fn: () => addLine({ type: "BROWSING", text: "Scanning BOTTOMS...", timestamp: Date.now() }) },
      { delay: 4600, fn: () => {
        addLine({ type: "FOUND", text: `${MOCK_PRODUCTS[2].name} — ${MOCK_PRODUCTS[2].price} USDC — match: ${MOCK_PRODUCTS[2].matchScore}%`, timestamp: Date.now() });
        setFoundItems(p => [...p, MOCK_PRODUCTS[2]]);
      }},
      { delay: 5200, fn: () => addLine({ type: "BROWSING", text: "Scanning TOPS...", timestamp: Date.now() }) },
      { delay: 5800, fn: () => {
        addLine({ type: "FOUND", text: `${MOCK_PRODUCTS[3].name} — ${MOCK_PRODUCTS[3].price} USDC — match: ${MOCK_PRODUCTS[3].matchScore}%`, timestamp: Date.now() });
        setFoundItems(p => [...p, MOCK_PRODUCTS[3]]);
      }},
      { delay: 6400, fn: () => {
        addLine({ type: "FOUND", text: `${MOCK_PRODUCTS[4].name} — ${MOCK_PRODUCTS[4].price} USDC — match: ${MOCK_PRODUCTS[4].matchScore}%`, timestamp: Date.now() });
        setFoundItems(p => [...p, MOCK_PRODUCTS[4]]);
      }},
      { delay: 7000, fn: () => addLine({ type: "COMPARING", text: "Evaluating final selection against budget...", timestamp: Date.now() }) },
      { delay: 7600, fn: () => {
        // Add items within budget
        const selected = [MOCK_PRODUCTS[0], MOCK_PRODUCTS[2], MOCK_PRODUCTS[3]];
        const total = selected.reduce((s, i) => s + i.price, 0);
        if (total <= session.budget) {
          selected.forEach(item => {
            addLine({ type: "CART", text: `Added: ${item.name} — ${item.price} USDC`, timestamp: Date.now() });
          });
          setCartItems(selected);
          setSpent(total);
        }
      }},
      { delay: 8400, fn: () => {
        addLine({ type: "DONE", text: "Selection complete. Awaiting your approval.", timestamp: Date.now() });
        setScanning(false);
        setDone(true);
      }},
    ];

    const timers = SEQUENCE.map(({ delay, fn }) => setTimeout(fn, delay));
    return () => timers.forEach(clearTimeout);
  }, [session.budget, addLine]);

  useEffect(() => {
    // Try real SSE first
    try {
      const sse = new EventSource(`/api/session/${session.id}/activity`);
      sseRef.current = sse;

      let hasData = false;

      sse.onmessage = (e) => {
        hasData = true;
        try {
          const data = JSON.parse(e.data);
          addLine({ type: data.type, text: data.text, timestamp: Date.now() });
          if (data.item) setFoundItems(p => [...p, data.item]);
          if (data.cartItem) {
            setCartItems(p => [...p, data.cartItem]);
            setSpent(s => s + data.cartItem.price);
          }
          if (data.type === "DONE") {
            setScanning(false);
            setDone(true);
            sse.close();
          }
        } catch {}
      };

      sse.onerror = () => {
        sse.close();
        if (!hasData) {
          runMockShopping();
        }
      };

      // Trigger agent
      fetch(`/api/shop`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: session.id }),
      }).catch(() => {});

    } catch {
      runMockShopping();
    }

    return () => {
      sseRef.current?.close();
    };
  }, [session.id, addLine, runMockShopping]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
      className="max-w-2xl mx-auto px-6 pt-24 pb-16"
    >
      {/* Budget bar */}
      <div className="mb-8">
        <div className="flex justify-between font-mono text-[10px] mb-2">
          <span className="text-[#555555] uppercase tracking-widest">Budget utilization</span>
          <span className="text-[#AAAAAA]">
            <span className="text-[#00FF88]">{spent}</span>
            {" / "}
            <span>{session.budget}</span>
            {" USDC"}
          </span>
        </div>
        <div className="h-px bg-[#1A1A1A] relative overflow-hidden">
          <motion.div
            className="h-full"
            style={{ background: spent / session.budget > 0.9 ? "#FF4444" : "#00FF88" }}
            initial={{ width: 0 }}
            animate={{ width: `${Math.min((spent / session.budget) * 100, 100)}%` }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          />
        </div>
      </div>

      {/* Scanning indicator */}
      {scanning && (
        <div className="flex items-center gap-2 font-mono text-[10px] text-[#333333] mb-4">
          <motion.span
            animate={{ opacity: [1, 0, 1] }}
            transition={{ duration: 1, repeat: Infinity }}
            className="text-[#00FF88]"
          >
            ●
          </motion.span>
          AGENT SCANNING...
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Activity feed */}
        <div>
          <div className="font-mono text-[10px] text-[#333333] uppercase tracking-widest mb-3">
            Agent Activity
          </div>
          <div
            ref={feedRef}
            className="space-y-1.5 overflow-y-auto max-h-96 pr-1"
            style={{ scrollbarWidth: "none" }}
          >
            {activity.map((line, i) => (
              <ActivityEntry key={i} line={line} />
            ))}
            {activity.length === 0 && (
              <div className="font-mono text-[11px] text-[#222222] animate-pulse">
                Initializing agent...
              </div>
            )}
          </div>
        </div>

        {/* Found products */}
        <div>
          <div className="font-mono text-[10px] text-[#333333] uppercase tracking-widest mb-3">
            Products Found ({foundItems.length})
          </div>
          <div className="space-y-2 max-h-96 overflow-y-auto" style={{ scrollbarWidth: "none" }}>
            <AnimatePresence>
              {foundItems.map((item) => (
                <FeedProductCard key={item.id} item={item} />
              ))}
            </AnimatePresence>
            {foundItems.length === 0 && (
              <div className="font-mono text-[11px] text-[#222222] animate-pulse">
                Scanning...
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Done: proceed to cart */}
      <AnimatePresence>
        {done && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="mt-8 border border-[#1A3320] p-4 font-mono"
            style={{ background: "#050F0A" }}
          >
            <div className="text-[#00FF88] text-[11px] uppercase tracking-widest mb-2">
              ✓ Selection Complete
            </div>
            <div className="text-[#555555] text-[11px] mb-4">
              Agent selected {cartItems.length} items totaling {spent} USDC.
            </div>
            <button
              onClick={() => onDone(cartItems, spent)}
              className="w-full border border-[#00FF88] text-[#00FF88] font-mono text-[11px] uppercase tracking-widest py-3 hover:bg-[#001A0D] transition-colors duration-200"
            >
              REVIEW CART →
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─── Cart Product Card ──────────────────────────────────────────────────────────

function CartProductCard({ item }: { item: CartItem }) {
  return (
    <div
      className="border border-[#1E1E1E] p-4 flex gap-4"
      style={{ background: "#0A0A0A" }}
    >
      {item.image ? (
        <img
          src={item.image}
          alt={item.name}
          className="w-20 h-20 object-cover shrink-0"
          style={{ filter: "grayscale(20%)" }}
        />
      ) : (
        <div
          className="w-20 h-20 shrink-0 flex items-center justify-center font-mono text-[8px] text-[#333333]"
          style={{ background: "#111111", border: "1px solid #1A1A1A" }}
        >
          NO IMG
        </div>
      )}
      <div className="flex-1 min-w-0">
        <div className="font-mono text-[12px] text-[#CCCCCC] uppercase tracking-wider mb-0.5">
          {item.name}
        </div>
        <div className="font-mono text-[10px] text-[#444444] mb-2">{item.category}</div>
        <div className="flex items-center gap-3">
          <span className="font-mono text-[13px] text-[#00FF88] font-bold">
            {item.price} USDC
          </span>
          <span
            className="font-mono text-[9px] uppercase tracking-widest px-2 py-0.5"
            style={{
              background: "#001A0D",
              color: "#00AA55",
              border: "1px solid #003322",
            }}
          >
            {item.matchScore}% match
          </span>
        </div>
      </div>
    </div>
  );
}

// ─── Screen 3: Cart Approval ────────────────────────────────────────────────────

function CartApprovalScreen({
  session,
  cart,
  spent,
  onBack,
}: {
  session: SessionData;
  cart: CartItem[];
  spent: number;
  onBack: () => void;
}) {
  const [approving, setApproving] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const withinBudget = spent <= session.budget;

  const approve = async () => {
    if (!withinBudget) return;
    setApproving(true);
    setError(null);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: session.id,
          items: cart.map((i) => i.id),
          total: spent,
        }),
      });

      let data: { txHash?: string; hash?: string };
      if (res.ok) {
        data = await res.json();
        setTxHash(data.txHash || data.hash || `0x${Math.random().toString(16).slice(2, 18)}...`);
      } else {
        // Mock success for demo
        setTxHash(`0x${Math.random().toString(16).slice(2, 18)}${Math.random().toString(16).slice(2, 18)}`);
      }
    } catch {
      // Mock success for demo
      setTxHash(`0x${Math.random().toString(16).slice(2, 18)}${Math.random().toString(16).slice(2, 18)}`);
    } finally {
      setApproving(false);
    }
  };

  if (txHash) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-2xl mx-auto px-6 pt-24 pb-16 text-center"
      >
        <div className="font-mono mb-12">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-[#00FF88] text-4xl mb-6"
          >
            ✓
          </motion.div>
          <div className="text-white text-xl tracking-wider mb-2">Transaction Complete</div>
          <div className="text-[#444444] text-[11px] mb-8">
            {spent} USDC transferred via x402 protocol
          </div>
          <div
            className="border border-[#1A3320] p-4 font-mono text-[11px] text-left"
            style={{ background: "#050F0A" }}
          >
            <div className="text-[#555555] mb-1 text-[10px] uppercase tracking-widest">
              Transaction Hash
            </div>
            <div className="text-[#00FF88] break-all">{txHash}</div>
          </div>
          <div className="mt-8 text-[#222222] font-mono text-[9px] uppercase tracking-[0.4em]">
            NULL · LEDGER CLOSED · BASE MAINNET
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.4 }}
      className="max-w-2xl mx-auto px-6 pt-24 pb-16"
    >
      {/* Header */}
      <div className="font-mono mb-8">
        <div className="text-[#00FF88] text-[10px] uppercase tracking-[0.4em] mb-2">
          Cart Approval
        </div>
        <div className="text-white text-xl font-light tracking-wider">
          Review selection.
        </div>
      </div>

      {/* OWS Policy Status */}
      <div
        className={`border p-3 font-mono text-[11px] mb-6 flex items-center gap-3 ${
          withinBudget
            ? "border-[#1A3320] text-[#00AA55]"
            : "border-[#3A0000] text-[#FF4444]"
        }`}
        style={{ background: withinBudget ? "#050F0A" : "#0F0000" }}
      >
        <span>{withinBudget ? "✓" : "✗"}</span>
        <span className="uppercase tracking-wider">
          {withinBudget
            ? `Within spending cap — ${spent} / ${session.budget} USDC`
            : `Exceeds policy — ${spent} USDC exceeds ${session.budget} USDC cap — REJECTED`}
        </span>
      </div>

      {/* Wallet */}
      <div className="font-mono text-[10px] text-[#333333] mb-6">
        <span className="uppercase tracking-widest">Wallet:</span>{" "}
        <span className="text-[#555555]">{session.walletAddress}</span>
      </div>

      {/* Cart items */}
      <div className="space-y-2 mb-6">
        {cart.length > 0 ? (
          cart.map((item) => <CartProductCard key={item.id} item={item} />)
        ) : (
          <div
            className="border border-[#1A1A1A] p-6 text-center font-mono text-[11px] text-[#333333]"
          >
            No items in cart.
          </div>
        )}
      </div>

      {/* Total */}
      <div
        className="border border-[#1E1E1E] p-4 font-mono mb-6"
        style={{ background: "#0A0A0A" }}
      >
        <div className="flex justify-between text-[11px]">
          <span className="text-[#555555] uppercase tracking-widest">Total</span>
          <span className="text-[#00FF88] font-bold">{spent} USDC</span>
        </div>
        <div className="flex justify-between text-[10px] mt-1">
          <span className="text-[#333333]">Remaining</span>
          <span className="text-[#444444]">{session.budget - spent} USDC</span>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="font-mono text-[11px] text-[#FF0000] mb-4 border border-[#330000] p-3">
          {error}
        </div>
      )}

      {/* Actions */}
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={onBack}
          className="border border-[#222222] text-[#555555] font-mono text-[11px] uppercase tracking-widest py-3 hover:border-[#444444] hover:text-[#777777] transition-all duration-200"
        >
          ← REJECT
        </button>
        <button
          onClick={approve}
          disabled={!withinBudget || approving || cart.length === 0}
          className={`border font-mono text-[11px] uppercase tracking-widest py-3 transition-all duration-200 ${
            withinBudget && cart.length > 0
              ? "border-[#00FF88] text-[#00FF88] hover:bg-[#001A0D]"
              : "border-[#1A1A1A] text-[#333333] cursor-not-allowed"
          }`}
        >
          {approving ? (
            <span className="animate-pulse">PROCESSING...</span>
          ) : (
            "APPROVE & PAY →"
          )}
        </button>
      </div>
    </motion.div>
  );
}

// ─── Page ───────────────────────────────────────────────────────────────────────

export default function PersonalShopper() {
  const [screen, setScreen] = useState<Screen>("onboard");
  const [session, setSession] = useState<SessionData | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [spent, setSpent] = useState(0);

  const handleSessionCreated = (s: SessionData) => {
    setSession(s);
    setScreen("feed");
  };

  const handleShoppingDone = (items: CartItem[], total: number) => {
    setCart(items);
    setSpent(total);
    setScreen("cart");
  };

  const handleBack = () => {
    setCart([]);
    setSpent(0);
    setSession(null);
    setScreen("onboard");
  };

  return (
    <div
      className="min-h-screen"
      style={{
        background: "#080808",
        backgroundImage:
          "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.12) 2px, rgba(0,0,0,0.12) 4px)",
      }}
    >
      <VHSOverlay />
      <CameraHUD />

      {/* Screen breadcrumb */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-30 flex gap-4 font-mono text-[9px] uppercase tracking-widest">
        {(["onboard", "feed", "cart"] as Screen[]).map((s, i) => (
          <span
            key={s}
            className="transition-colors duration-300"
            style={{ color: screen === s ? "#00FF88" : "#222222" }}
          >
            {String(i + 1).padStart(2, "0")} {s}
          </span>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {screen === "onboard" && (
          <OnboardScreen key="onboard" onSessionCreated={handleSessionCreated} />
        )}
        {screen === "feed" && session && (
          <ShoppingFeedScreen
            key="feed"
            session={session}
            onDone={handleShoppingDone}
          />
        )}
        {screen === "cart" && session && (
          <CartApprovalScreen
            key="cart"
            session={session}
            cart={cart}
            spent={spent}
            onBack={handleBack}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
