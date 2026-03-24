/**
 * Standalone serverless function: POST /api/checkout/locus
 * Returns the store wallet address for USDC payments.
 * Bypasses Express entirely to avoid FUNCTION_INVOCATION_FAILED on Vercel.
 */
import type { IncomingMessage, ServerResponse } from "http";

const X402_WALLET = process.env.LOCUS_OWNER_ADDRESS || process.env.X402_WALLET_ADDRESS || null;

function parseBody(req: IncomingMessage): Promise<any> {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk: Buffer) => { body += chunk.toString(); });
    req.on("end", () => {
      try { resolve(body ? JSON.parse(body) : {}); }
      catch { reject(new Error("Invalid JSON body")); }
    });
    req.on("error", reject);
  });
}

function sendJson(res: ServerResponse, status: number, data: any) {
  res.writeHead(status, {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  });
  res.end(JSON.stringify(data));
}

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  if (req.method === "OPTIONS") {
    sendJson(res, 200, {});
    return;
  }

  const url = req.url || "";

  // POST /api/checkout/locus — main checkout endpoint
  if (req.method === "POST" && (url.includes("/locus") || url.endsWith("/checkout"))) {
    try {
      const body = await parseBody(req);
      const { items, totalAmount } = body;

      if (!items || !Array.isArray(items) || items.length === 0) {
        sendJson(res, 400, { error: "items required" });
        return;
      }

      const trackingToken = "LOCUS-" + Date.now().toString(36).toUpperCase() + "-" + Math.random().toString(36).slice(2, 7).toUpperCase();

      sendJson(res, 201, {
        orderId: `standalone-${Date.now()}`,
        trackingToken,
        storeWallet: X402_WALLET,
        amount: totalAmount || "0.00",
        currency: "USDC",
        network: "base",
        memo: `OFF-HUMAN:standalone-${Date.now()}`,
        confirmUrl: "/api/checkout/locus/confirm",
        message: "Send USDC to storeWallet with memo, then POST to confirmUrl with txHash",
        note: "Standalone serverless checkout — order not persisted to database. Use full API for production orders.",
      });
    } catch (err: any) {
      console.error("[checkout-locus] Error:", err);
      sendJson(res, 500, { error: err.message || "Checkout failed" });
    }
    return;
  }

  // Fallback for other checkout sub-routes
  sendJson(res, 200, {
    storeWallet: X402_WALLET,
    currency: "USDC",
    network: "base",
    endpoints: {
      checkout: "POST /api/checkout/locus",
      session: "POST /api/checkout/locus/session",
      confirm: "POST /api/checkout/locus/confirm",
    },
  });
}
