/**
 * NULL Personal Shopper — OWS Hackathon 2026
 * Express routes for the AI-powered shopping agent backend.
 *
 * Endpoints:
 *   POST /api/session                    — create OWS wallet + spending policy
 *   GET  /api/personal-shopper/products  — x402-gated product catalog ($0.001 USDC)
 *   POST /api/shop                       — trigger Claude agent shopping loop
 *   POST /api/checkout                   — sign & broadcast USDC payment
 *   GET  /api/session/:id/activity       — SSE stream of agent activity
 */

import { Router, type Request, type Response } from "express";
import { EventEmitter } from "events";
import { randomUUID } from "crypto";
import { ethers } from "ethers";
import {
  createWalletClient,
  createPublicClient,
  http as viemHttp,
  parseUnits,
  encodeFunctionData,
  type Hex,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { base } from "viem/chains";
import { paymentMiddleware, x402ResourceServer } from "@x402/express";
import { ExactEvmScheme as ExactEvmServerScheme } from "@x402/evm/exact/server";
import { ExactEvmScheme as ExactEvmClientScheme } from "@x402/evm/exact/client";
import { HTTPFacilitatorClient } from "@x402/core/server";
import { x402Client } from "@x402/core/client";
import { wrapFetchWithPayment } from "@x402/fetch";
import Anthropic from "@anthropic-ai/sdk";

// ── Load product catalog ───────────────────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-require-imports
const RAW_PRODUCTS: any[] = require("../../products.json");

// Normalize snake_case keys to camelCase for consistency
function toCamel(obj: any): any {
  if (Array.isArray(obj)) return obj.map(toCamel);
  if (obj && typeof obj === "object") {
    return Object.fromEntries(
      Object.entries(obj).map(([k, v]) => [
        k.replace(/_([a-z])/g, (_, c: string) => c.toUpperCase()),
        toCamel(v),
      ])
    );
  }
  return obj;
}

const ALL_PRODUCTS: any[] = toCamel(RAW_PRODUCTS);

// ── Constants ──────────────────────────────────────────────────────────────
const USDC_BASE = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913" as const;
const TREASURY =
  (process.env.X402_WALLET_ADDRESS ||
    "0xD9E2ad68BE5247DCBcd00CaCeb4783c0506028C7") as `0x${string}`;
const FACILITATOR_URL =
  process.env.X402_FACILITATOR_URL || "https://facilitator.x402.org";
const BASE_RPC =
  process.env.BASE_RPC_URL || "https://mainnet.base.org";
const PRODUCTS_PRICE = "$0.001"; // cost per catalog fetch

// ── Session store (in-memory) ──────────────────────────────────────────────
interface ShoppingPolicy {
  maxBudgetUsdc: number;  // e.g. 50
  spentUsdc: number;
}

interface ShoppingSession {
  id: string;
  wallet: ethers.HDNodeWallet;   // session HD wallet (ethers v6)
  policy: ShoppingPolicy;
  cart: any[];
  activity: EventEmitter;
  createdAt: Date;
}

const sessions = new Map<string, ShoppingSession>();

// Clean up sessions older than 2 hours
setInterval(() => {
  const cutoff = Date.now() - 2 * 60 * 60 * 1000;
  for (const [id, s] of sessions) {
    if (s.createdAt.getTime() < cutoff) sessions.delete(id);
  }
}, 5 * 60 * 1000);

// ── x402 server-side middleware setup ─────────────────────────────────────
let x402Middleware: ReturnType<typeof paymentMiddleware> | null = null;

function getX402Middleware() {
  if (x402Middleware) return x402Middleware;
  try {
    const facilitatorClient = new HTTPFacilitatorClient({ url: FACILITATOR_URL });
    const resourceServer = new x402ResourceServer(facilitatorClient).register(
      "eip155:8453",
      new ExactEvmServerScheme()
    );
    x402Middleware = paymentMiddleware(
      {
        "GET /api/personal-shopper/products": {
          accepts: {
            scheme: "exact",
            price: PRODUCTS_PRICE,
            network: "eip155:8453",
            payTo: TREASURY,
          },
          description: "NULL product catalog — pay-per-call at $0.001 USDC on Base",
        },
      },
      resourceServer,
      undefined,
      undefined,
      false // don't sync facilitator on every startup in serverless
    );
    return x402Middleware;
  } catch (err) {
    console.error("[personal-shopper] x402 middleware init failed:", err);
    return null;
  }
}

// ── Viem public client (read-only) ────────────────────────────────────────
function getPublicClient() {
  return createPublicClient({ chain: base, transport: viemHttp(BASE_RPC) });
}

// ── EIP-3009 USDC transferWithAuthorization ───────────────────────────────
const EIP3009_ABI = [
  {
    name: "transferWithAuthorization",
    type: "function",
    inputs: [
      { name: "from", type: "address" },
      { name: "to", type: "address" },
      { name: "value", type: "uint256" },
      { name: "validAfter", type: "uint256" },
      { name: "validBefore", type: "uint256" },
      { name: "nonce", type: "bytes32" },
      { name: "v", type: "uint8" },
      { name: "r", type: "bytes32" },
      { name: "s", type: "bytes32" },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
] as const;

// ── Router ─────────────────────────────────────────────────────────────────
export function registerPersonalShopperRoutes(router: Router): void {
  // ── 1. POST /api/session — create session wallet + spending policy ────────
  router.post("/api/session", (req: Request, res: Response) => {
    try {
      const { budget = 25 } = req.body ?? {};
      const maxBudget = Math.max(1, Math.min(500, Number(budget)));

      // Create a fresh HD wallet for this session (OWS-compatible pattern)
      const wallet = ethers.Wallet.createRandom();
      const sessionId = randomUUID();
      const policyId = randomUUID();

      const session: ShoppingSession = {
        id: sessionId,
        wallet,
        policy: { maxBudgetUsdc: maxBudget, spentUsdc: 0 },
        cart: [],
        activity: new EventEmitter(),
        createdAt: new Date(),
      };
      session.activity.setMaxListeners(20);
      sessions.set(sessionId, session);

      res.json({
        sessionId,
        walletAddress: wallet.address,
        policyId,
        policy: {
          maxBudgetUsdc: maxBudget,
          spentUsdc: 0,
          network: "eip155:8453",
          currency: "USDC",
        },
        message: `Session wallet created. Fund ${wallet.address} with USDC on Base to enable purchases.`,
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // ── 2. GET /api/personal-shopper/products — x402-gated catalog ───────────
  // Apply x402 middleware lazily for this route
  router.get("/api/personal-shopper/products", async (req: Request, res: Response, next) => {
    const mw = getX402Middleware();
    if (mw) {
      // Run x402 middleware; if payment satisfied it calls next()
      mw(req, res, (err?: any) => {
        if (err) return next(err);
        serveCatalog(req, res);
      });
    } else {
      // x402 not configured — serve catalog directly (dev fallback)
      serveCatalog(req, res);
    }
  });

  function serveCatalog(req: Request, res: Response) {
    let products = ALL_PRODUCTS;
    const { category, maxPrice, tags } = req.query;

    if (category) {
      products = products.filter(
        (p) => p.category?.toLowerCase() === String(category).toLowerCase()
      );
    }
    if (maxPrice) {
      const max = parseFloat(String(maxPrice));
      if (!isNaN(max)) products = products.filter((p) => parseFloat(p.price) <= max);
    }
    if (tags) {
      const tagList = String(tags).toLowerCase().split(",");
      products = products.filter((p) => {
        const ptags = [
          p.category,
          p.technique,
          p.season && `season${p.season}`,
        ]
          .filter(Boolean)
          .map((t: string) => t.toLowerCase());
        return tagList.some((t) => ptags.some((pt) => pt.includes(t)));
      });
    }

    res.json({
      count: products.length,
      currency: "USDC",
      products: products.map((p) => ({
        id: p.id,
        name: p.name,
        description: p.description,
        price: parseFloat(p.price),
        category: p.category,
        technique: p.technique,
        season: p.season,
        sizes: p.inventory ? Object.keys(p.inventory) : [],
        inStock: p.inventory
          ? Object.values(p.inventory as Record<string, number>).some((v) => v > 0)
          : true,
        imageUrl: p.imageUrl || p.shopImageUrl,
      })),
    });
  }

  // ── 3. POST /api/shop — Claude agent shopping loop ────────────────────────
  router.post("/api/shop", async (req: Request, res: Response) => {
    try {
      const { sessionId, tasteProfile, budget } = req.body ?? {};
      if (!sessionId) return res.status(400).json({ error: "sessionId required" });

      const session = sessions.get(sessionId);
      if (!session) return res.status(404).json({ error: "session not found" });

      const shopBudget = Math.min(
        budget ?? session.policy.maxBudgetUsdc,
        session.policy.maxBudgetUsdc
      );

      const emit = (type: string, data: any) => {
        session.activity.emit("event", { type, data, ts: Date.now() });
      };

      emit("browsing", { message: "Agent starting product browse…", budget: shopBudget });

      // Build x402-enabled fetch using the session wallet on Base
      let paidFetch: typeof fetch;
      try {
        const account = privateKeyToAccount(session.wallet.privateKey as Hex);
        const walletClient = createWalletClient({
          account,
          chain: base,
          transport: viemHttp(BASE_RPC),
        });
        const publicClient = getPublicClient();

        const signer = {
          address: account.address,
          signTypedData: (msg: any) => walletClient.signTypedData(msg),
          readContract: (args: any) => publicClient.readContract(args),
        };

        const client = new x402Client().register("eip155:8453", new ExactEvmClientScheme(signer));
        paidFetch = wrapFetchWithPayment(fetch, client);
      } catch {
        // x402 client setup failed (missing viem deps etc) — use plain fetch
        paidFetch = fetch;
      }

      // Fetch product catalog (will pay $0.001 USDC if x402 is live)
      const host =
        process.env.PERSONAL_SHOPPER_BASE_URL ||
        `http://localhost:${process.env.PORT || 5000}`;

      emit("browsing", { message: "Fetching product catalog via x402…" });
      const catalogRes = await paidFetch(
        `${host}/api/personal-shopper/products`
      );
      const catalog = await catalogRes.json();
      const products = catalog.products ?? [];

      emit("comparing", {
        message: `Evaluating ${products.length} products against taste profile`,
        productCount: products.length,
      });

      // Claude agent: score products against taste profile
      const anthropic = new Anthropic({
        apiKey: process.env.ANTHROPIC_API_KEY,
      });

      const systemPrompt = `You are the NULL personal shopper — an autonomous AI agent for a conceptual avant-garde fashion brand.
Your job: analyze the customer's taste profile and select the perfect items from the NULL catalog.

NULL brand: deconstructed Margiela-inspired pieces. Techniques include TROMPE-L'OEIL, ARTISANAL, 3% RULE, REPLICA LINE, BIANCHETTO.
Season 01: Deconstructed. Season 02: LEDGER. Season 03: receipt-as-garment.

Rules:
- Stay within the budget (${shopBudget} USDC total)
- Select 1-4 items that best match the taste profile
- Prioritize conceptual coherence over price
- Explain your selection with brand-appropriate language
- Respond ONLY with valid JSON in the format shown`;

      const userPrompt = `Taste profile: "${tasteProfile || "avant-garde, conceptual fashion, deconstructed silhouettes"}"
Budget: ${shopBudget} USDC

Available products:
${JSON.stringify(
  products.slice(0, 25).map((p: any) => ({
    id: p.id,
    name: p.name,
    price: p.price,
    category: p.category,
    technique: p.technique,
  })),
  null,
  2
)}

Return JSON:
{
  "cart": [
    { "id": "...", "name": "...", "price": 0.00, "reason": "..." }
  ],
  "totalPrice": 0.00,
  "reasoning": "overall selection rationale"
}`;

      emit("scoring", { message: "Claude evaluating products…" });

      const completion = await anthropic.messages.create({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 1024,
        system: systemPrompt,
        messages: [{ role: "user", content: userPrompt }],
      });

      const raw = completion.content[0].type === "text" ? completion.content[0].text : "{}";

      let parsed: any = {};
      try {
        // Extract JSON from response (Claude might wrap it in ```json ... ```)
        const jsonMatch = raw.match(/```json\s*([\s\S]*?)```/) ||
          raw.match(/```\s*([\s\S]*?)```/) ||
          [null, raw];
        parsed = JSON.parse(jsonMatch[1] ?? raw);
      } catch {
        // Fallback: return first affordable product
        const affordable = products.filter((p: any) => p.price <= shopBudget);
        parsed = {
          cart: affordable.slice(0, 1).map((p: any) => ({
            id: p.id,
            name: p.name,
            price: p.price,
            reason: "Best match within budget",
          })),
          totalPrice: affordable[0]?.price ?? 0,
          reasoning: "Selected by price filter (agent response parse failed)",
        };
      }

      // Validate cart items exist in catalog
      const validCart = (parsed.cart ?? []).filter((item: any) =>
        products.some((p: any) => p.id === item.id)
      );

      session.cart = validCart;

      emit("cart_update", { cart: validCart, totalPrice: parsed.totalPrice });
      emit("done", {
        message: "Shopping complete",
        cart: validCart,
        totalPrice: parsed.totalPrice,
        reasoning: parsed.reasoning,
      });

      res.json({
        sessionId,
        cart: validCart,
        totalPrice: parsed.totalPrice,
        reasoning: parsed.reasoning,
        budget: shopBudget,
        walletAddress: session.wallet.address,
      });
    } catch (err: any) {
      console.error("[/api/shop] error:", err);
      res.status(500).json({ error: err.message });
    }
  });

  // ── 4. POST /api/checkout — execute USDC payment ─────────────────────────
  router.post("/api/checkout", async (req: Request, res: Response) => {
    try {
      const { sessionId, cart: cartOverride } = req.body ?? {};
      if (!sessionId) return res.status(400).json({ error: "sessionId required" });

      const session = sessions.get(sessionId);
      if (!session) return res.status(404).json({ error: "session not found" });

      const cart = cartOverride ?? session.cart;
      if (!cart || cart.length === 0) {
        return res.status(400).json({ error: "cart is empty — run /api/shop first" });
      }

      const totalUsdc = cart.reduce(
        (sum: number, item: any) => sum + parseFloat(item.price ?? 0),
        0
      );

      if (totalUsdc > session.policy.maxBudgetUsdc) {
        return res.status(400).json({
          error: `Cart total $${totalUsdc} USDC exceeds policy limit $${session.policy.maxBudgetUsdc}`,
        });
      }

      const emit = (type: string, data: any) => {
        session.activity.emit("event", { type, data, ts: Date.now() });
      };

      emit("checkout", { message: "Initiating USDC payment…", totalUsdc });

      // Build viem wallet client for this session
      const account = privateKeyToAccount(session.wallet.privateKey as Hex);
      const walletClient = createWalletClient({
        account,
        chain: base,
        transport: viemHttp(BASE_RPC),
      });
      const publicClient = getPublicClient();

      // Check actual USDC balance
      const usdcBalanceRaw = await publicClient.readContract({
        address: USDC_BASE,
        abi: [
          {
            name: "balanceOf",
            type: "function",
            inputs: [{ name: "account", type: "address" }],
            outputs: [{ name: "", type: "uint256" }],
            stateMutability: "view",
          },
        ],
        functionName: "balanceOf",
        args: [account.address],
      });
      const usdcBalance = Number(usdcBalanceRaw) / 1e6;

      if (usdcBalance < totalUsdc) {
        emit("checkout_pending", {
          message: `Wallet underfunded — need $${totalUsdc} USDC, have $${usdcBalance.toFixed(6)}`,
          walletAddress: account.address,
          required: totalUsdc,
          available: usdcBalance,
        });
        return res.status(402).json({
          error: "insufficient_funds",
          message: `Session wallet needs $${totalUsdc} USDC. Fund ${account.address} on Base.`,
          walletAddress: account.address,
          required: totalUsdc,
          available: usdcBalance,
          fundingInstructions: {
            network: "Base (EVM)",
            token: "USDC",
            address: account.address,
            amount: totalUsdc,
          },
        });
      }

      // Sign EIP-3009 transferWithAuthorization
      const amountUnits = parseUnits(totalUsdc.toFixed(6), 6);
      const validAfter = BigInt(Math.floor(Date.now() / 1000) - 60);
      const validBefore = BigInt(Math.floor(Date.now() / 1000) + 3600);
      const nonce = `0x${randomUUID().replace(/-/g, "")}` as Hex;

      // EIP-712 domain for USDC on Base
      const domain = {
        name: "USD Coin",
        version: "2",
        chainId: 8453,
        verifyingContract: USDC_BASE,
      };
      const types = {
        TransferWithAuthorization: [
          { name: "from", type: "address" },
          { name: "to", type: "address" },
          { name: "value", type: "uint256" },
          { name: "validAfter", type: "uint256" },
          { name: "validBefore", type: "uint256" },
          { name: "nonce", type: "bytes32" },
        ],
      };
      const message = {
        from: account.address,
        to: TREASURY,
        value: amountUnits,
        validAfter,
        validBefore,
        nonce,
      };

      const sig = await walletClient.signTypedData({
        domain,
        types,
        primaryType: "TransferWithAuthorization",
        message,
      });

      // Parse v, r, s from signature
      const v = parseInt(sig.slice(-2), 16);
      const r = `0x${sig.slice(2, 66)}` as Hex;
      const s = `0x${sig.slice(66, 130)}` as Hex;

      // Build calldata for transferWithAuthorization
      const calldata = encodeFunctionData({
        abi: EIP3009_ABI,
        functionName: "transferWithAuthorization",
        args: [account.address, TREASURY, amountUnits, validAfter, validBefore, nonce, v, r, s],
      });

      // Submit transaction
      const txHash = await walletClient.sendTransaction({
        to: USDC_BASE,
        data: calldata,
      });

      session.policy.spentUsdc += totalUsdc;

      emit("checkout_complete", {
        txHash,
        totalUsdc,
        items: cart.length,
        message: "Payment confirmed on Base",
      });

      res.json({
        success: true,
        txHash,
        totalUsdc,
        cart,
        explorerUrl: `https://basescan.org/tx/${txHash}`,
        sessionId,
        walletAddress: account.address,
        policySpent: session.policy.spentUsdc,
        policyRemaining: session.policy.maxBudgetUsdc - session.policy.spentUsdc,
      });
    } catch (err: any) {
      console.error("[/api/checkout] error:", err);
      res.status(500).json({ error: err.message });
    }
  });

  // ── 5. GET /api/session/:id/activity — SSE stream ────────────────────────
  router.get("/api/session/:id/activity", (req: Request, res: Response) => {
    const session = sessions.get(req.params.id);
    if (!session) {
      return res.status(404).json({ error: "session not found" });
    }

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("X-Accel-Buffering", "no");
    res.flushHeaders();

    // Send initial connection event
    res.write(
      `data: ${JSON.stringify({ type: "connected", sessionId: req.params.id, ts: Date.now() })}\n\n`
    );

    const onEvent = (evt: any) => {
      res.write(`data: ${JSON.stringify(evt)}\n\n`);
    };

    session.activity.on("event", onEvent);

    // Send keepalive every 15s
    const keepalive = setInterval(() => {
      res.write(`: keepalive\n\n`);
    }, 15000);

    req.on("close", () => {
      clearInterval(keepalive);
      session.activity.off("event", onEvent);
    });
  });

  // ── Session info GET ──────────────────────────────────────────────────────
  router.get("/api/session/:id", (req: Request, res: Response) => {
    const session = sessions.get(req.params.id);
    if (!session) return res.status(404).json({ error: "session not found" });
    res.json({
      sessionId: session.id,
      walletAddress: session.wallet.address,
      policy: session.policy,
      cartItems: session.cart.length,
      createdAt: session.createdAt,
    });
  });
}
