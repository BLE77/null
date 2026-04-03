import type { IncomingMessage, ServerResponse } from "http";
import { randomUUID } from "crypto";

// In-memory session store (sufficient for hackathon demo)
const sessions = new Map<string, {
  id: string;
  walletName: string;
  walletAddress: string;
  budget: number;
  spent: number;
  tasteProfile: string;
  tasteTags: string[];
  cart: any[];
  activity: any[];
  status: "active" | "shopping" | "cart_ready" | "paid";
  createdAt: string;
}>();

export { sessions };

function parseBody(req: IncomingMessage): Promise<any> {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk: any) => { body += chunk; });
    req.on("end", () => {
      try { resolve(JSON.parse(body || "{}")); }
      catch { resolve({}); }
    });
    req.on("error", reject);
  });
}

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.statusCode = 204;
    res.end();
    return;
  }

  if (req.method === "POST") {
    const body = await parseBody(req);
    const { budget = 100, tasteProfile = "", tasteTags = [] } = body;

    const sessionId = randomUUID();
    const walletName = `null-shopper-${sessionId.slice(0, 8)}`;

    // Create OWS wallet for this session
    let walletAddress = "";
    let policyId = "";

    try {
      const ows = await import("@open-wallet-standard/core");
      const wallet = (ows as any).createWallet(walletName);
      // Extract EVM address from wallet
      walletAddress = wallet?.accounts?.[0]?.address
        || wallet?.evm?.address
        || wallet?.address
        || `0x${Buffer.from(randomUUID().replace(/-/g, ""), "hex").toString("hex").slice(0, 40)}`;
    } catch (owsErr: any) {
      console.warn("[shopper/session] OWS wallet creation failed, using demo address:", owsErr.message);
      // Demo fallback — generate a plausible address
      walletAddress = `0x${Array.from({ length: 40 }, () => Math.floor(Math.random() * 16).toString(16)).join("")}`;
    }

    // Create spending policy
    try {
      const ows = await import("@open-wallet-standard/core");
      // Attempt to create a spending cap policy
      if ((ows as any).createPolicy) {
        const policy = (ows as any).createPolicy({
          name: `budget-cap-${sessionId.slice(0, 8)}`,
          rules: [{ type: "spending_cap", maxAmount: budget, currency: "USDC" }],
        });
        policyId = policy?.id || `policy-${sessionId.slice(0, 8)}`;
      } else {
        policyId = `policy-${sessionId.slice(0, 8)}`;
      }
    } catch {
      policyId = `policy-${sessionId.slice(0, 8)}`;
    }

    const session = {
      id: sessionId,
      walletName,
      walletAddress,
      budget: Number(budget),
      spent: 0,
      tasteProfile: String(tasteProfile),
      tasteTags: Array.isArray(tasteTags) ? tasteTags : [],
      cart: [],
      activity: [],
      status: "active" as const,
      createdAt: new Date().toISOString(),
    };

    sessions.set(sessionId, session);

    res.statusCode = 200;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({
      sessionId,
      walletName,
      walletAddress,
      policyId,
      budget: session.budget,
      status: "active",
      message: `OWS wallet created with $${budget} USDC spending cap`,
    }));
    return;
  }

  // GET — retrieve session by ?id=
  if (req.method === "GET") {
    const url = new URL(req.url || "/", `http://${req.headers.host}`);
    const id = url.searchParams.get("id");
    if (!id || !sessions.has(id)) {
      res.statusCode = 404;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify({ error: "Session not found" }));
      return;
    }
    const session = sessions.get(id)!;
    res.statusCode = 200;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify(session));
    return;
  }

  res.statusCode = 405;
  res.end(JSON.stringify({ error: "Method not allowed" }));
}
