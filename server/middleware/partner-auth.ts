/**
 * server/middleware/partner-auth.ts
 *
 * Partner API authentication and rate limiting for external agent integrations.
 *
 * Auth: Bearer token via Authorization header or X-Partner-Key header.
 * Keys: PARTNER_API_KEYS env var (comma-separated) + a built-in demo key.
 * Rate: 100 req/min per key (in-memory sliding window).
 */

import type { Request, Response, NextFunction } from "express";
import crypto from "crypto";

// ─── Demo key (always valid, for hackathon demos and docs) ────────────────────
export const DEMO_PARTNER_KEY = "null-partner-demo-2026";

// ─── In-memory key store ──────────────────────────────────────────────────────
// Maps key → { issued, label }
const keyStore = new Map<string, { issued: number; label: string }>();

// Seed demo key
keyStore.set(DEMO_PARTNER_KEY, { issued: Date.now(), label: "demo" });

// Seed keys from env
function loadEnvKeys() {
  const raw = process.env.PARTNER_API_KEYS || "";
  raw
    .split(",")
    .map((k) => k.trim())
    .filter(Boolean)
    .forEach((k, i) => {
      if (!keyStore.has(k)) {
        keyStore.set(k, { issued: Date.now(), label: `env-${i}` });
      }
    });
}
loadEnvKeys();

// ─── Rate limiter (sliding window, in-memory) ─────────────────────────────────
const RATE_LIMIT = 100; // requests
const RATE_WINDOW_MS = 60_000; // per minute

const rateLedger = new Map<string, number[]>(); // key → [timestamps]

function checkRateLimit(key: string): { allowed: boolean; remaining: number; resetMs: number } {
  const now = Date.now();
  const window = now - RATE_WINDOW_MS;
  const timestamps = (rateLedger.get(key) || []).filter((t) => t > window);
  const remaining = RATE_LIMIT - timestamps.length;

  if (remaining <= 0) {
    const oldest = timestamps[0];
    return { allowed: false, remaining: 0, resetMs: oldest + RATE_WINDOW_MS - now };
  }

  timestamps.push(now);
  rateLedger.set(key, timestamps);
  return { allowed: true, remaining: remaining - 1, resetMs: RATE_WINDOW_MS };
}

// ─── Middleware ───────────────────────────────────────────────────────────────

/**
 * requirePartnerKey — validates partner API key and applies rate limiting.
 * Extract from:
 *   Authorization: Bearer <key>
 *   X-Partner-Key: <key>
 */
export function requirePartnerKey(req: Request, res: Response, next: NextFunction) {
  let key: string | undefined;

  const authHeader = req.headers["authorization"];
  if (authHeader?.startsWith("Bearer ")) {
    key = authHeader.slice(7).trim();
  } else if (req.headers["x-partner-key"]) {
    key = String(req.headers["x-partner-key"]).trim();
  }

  if (!key) {
    return res.status(401).json({
      error: "Partner API key required",
      hint: "Pass your key as: Authorization: Bearer <key>  or  X-Partner-Key: <key>",
      docs: "/api/openapi.json",
      register: "POST /api/partner/register",
    });
  }

  if (!keyStore.has(key)) {
    return res.status(403).json({
      error: "Invalid partner API key",
      register: "POST /api/partner/register",
    });
  }

  const rate = checkRateLimit(key);
  res.setHeader("X-RateLimit-Limit", RATE_LIMIT);
  res.setHeader("X-RateLimit-Remaining", rate.remaining);
  res.setHeader("X-RateLimit-Reset", Math.ceil(rate.resetMs / 1000));

  if (!rate.allowed) {
    return res.status(429).json({
      error: "Rate limit exceeded",
      limit: RATE_LIMIT,
      windowMs: RATE_WINDOW_MS,
      retryAfterMs: rate.resetMs,
    });
  }

  // Attach key info to request for downstream use
  (req as any).partnerKey = key;
  (req as any).partnerLabel = keyStore.get(key)!.label;
  next();
}

// ─── Key generation ───────────────────────────────────────────────────────────

export function generatePartnerKey(label: string): string {
  const key = `null-partner-${crypto.randomBytes(16).toString("hex")}`;
  keyStore.set(key, { issued: Date.now(), label });
  return key;
}

export function isValidPartnerKey(key: string): boolean {
  return keyStore.has(key);
}
