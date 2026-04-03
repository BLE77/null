import type { IncomingMessage, ServerResponse } from "http";
import { sessions } from "./session.js";

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
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.statusCode = 204;
    res.end();
    return;
  }

  if (req.method !== "POST") {
    res.statusCode = 405;
    res.end(JSON.stringify({ error: "Method not allowed" }));
    return;
  }

  const body = await parseBody(req);
  const { sessionId } = body;

  if (!sessionId || !sessions.has(sessionId)) {
    res.statusCode = 404;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ error: "Session not found" }));
    return;
  }

  const session = sessions.get(sessionId)!;

  if (session.cart.length === 0) {
    res.statusCode = 400;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ error: "Cart is empty" }));
    return;
  }

  // Policy enforcement — check budget
  const total = session.cart.reduce((sum: number, item: any) => sum + item.price, 0);
  if (total > session.budget) {
    res.statusCode = 403;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({
      error: "OWS Policy Violation",
      message: `Cart total ($${total.toFixed(2)}) exceeds spending cap ($${session.budget})`,
      policyEnforced: true,
    }));
    return;
  }

  // Sign and send payment via OWS
  let txHash = "";
  let signedViaOWS = false;

  try {
    const ows = await import("@open-wallet-standard/core");
    // Attempt to sign the payment transaction
    if ((ows as any).signMessage) {
      const paymentMessage = JSON.stringify({
        type: "x402_payment",
        from: session.walletAddress,
        to: "0x000000000000000000000000000000000000NULL",
        amount: total,
        currency: "USDC",
        network: "base",
        items: session.cart.map((i: any) => i.id),
        timestamp: new Date().toISOString(),
      });

      const sig = (ows as any).signMessage(session.walletName, "evm", paymentMessage);
      txHash = `0x${sig?.signature?.slice(0, 64) || Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join("")}`;
      signedViaOWS = true;
    }
  } catch (owsErr: any) {
    console.warn("[shopper/checkout] OWS signing failed, generating demo tx:", owsErr.message);
  }

  // Fallback demo tx hash
  if (!txHash) {
    txHash = `0x${Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join("")}`;
  }

  session.status = "paid";
  session.spent = total;

  res.statusCode = 200;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify({
    success: true,
    txHash,
    signedViaOWS,
    network: "base",
    currency: "USDC",
    total,
    budget: session.budget,
    remaining: session.budget - total,
    items: session.cart.length,
    walletAddress: session.walletAddress,
    merchant: "0x000000000000000000000000000000000000NULL",
    policyStatus: "within_cap",
    timestamp: new Date().toISOString(),
  }));
}
