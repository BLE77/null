import type { IncomingMessage, ServerResponse } from "http";
import { sessions } from "./session.js";

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.statusCode = 204;
    res.end();
    return;
  }

  const url = new URL(req.url || "/", `http://${req.headers.host}`);
  const sessionId = url.searchParams.get("id");

  if (!sessionId || !sessions.has(sessionId)) {
    res.statusCode = 404;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ error: "Session not found" }));
    return;
  }

  const session = sessions.get(sessionId)!;

  res.statusCode = 200;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify({
    sessionId,
    status: session.status,
    activity: session.activity,
    cart: session.cart,
    spent: session.spent,
    budget: session.budget,
    walletAddress: session.walletAddress,
  }));
}
