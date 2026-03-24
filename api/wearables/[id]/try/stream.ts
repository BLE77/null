/**
 * Standalone serverless function: POST /api/wearables/:id/try/stream
 * Streaming fitting room — simplified standalone version.
 * Falls back to non-streaming JSON response to avoid Express crash.
 */
import type { IncomingMessage, ServerResponse } from "http";

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

  // Redirect to non-streaming endpoint
  sendJson(res, 200, {
    error: null,
    message: "Streaming not available in standalone mode. Use POST /api/wearables/:id/try for the non-streaming fitting room.",
    redirect: "/api/wearables/:id/try",
  });
}
