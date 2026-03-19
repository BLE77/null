/**
 * Locus Checkout Routes
 *
 * Accepts USDC payments via Locus payment infrastructure:
 * - POST /api/checkout/locus          — agent creates order, gets store wallet for direct USDC transfer
 * - POST /api/checkout/locus/session  — create a Locus-hosted checkout session (human buyers)
 * - POST /api/checkout/locus/confirm  — agent confirms payment with txHash
 * - POST /api/checkout/locus/webhook  — Locus webhook for session payment confirmation
 *
 * Locus provides: non-custodial smart wallets on Base, spending controls,
 * gasless USDC transfers, pay-per-use wrapped APIs, and audit trails.
 */

import type { Express } from 'express';
import { db } from '../db.js';
import { orders } from '../../shared/schema.js';
import { eq } from 'drizzle-orm';
import { dbStorage } from '../db-storage.js';

const LOCUS_API = process.env.LOCUS_API_URL || 'https://beta-api.paywithlocus.com/api';
const LOCUS_API_KEY = process.env.LOCUS_API_KEY;
const LOCUS_WEBHOOK_SECRET = process.env.LOCUS_WEBHOOK_SECRET;
// LOCUS_OWNER_ADDRESS takes precedence as the Locus wallet receiving address
const X402_WALLET = process.env.LOCUS_OWNER_ADDRESS || process.env.X402_WALLET_ADDRESS;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function generateTrackingToken(): string {
  return 'LOCUS-' + Date.now().toString(36).toUpperCase() + '-' + Math.random().toString(36).slice(2, 7).toUpperCase();
}

// ─── Locus Merchant API ───────────────────────────────────────────────────────

async function createLocusCheckoutSession(params: {
  amount: string;
  description: string;
  orderId: string;
  webhookUrl?: string;
}): Promise<{ sessionId: string; checkoutUrl: string; expiresAt: string }> {
  if (!LOCUS_API_KEY) throw new Error('LOCUS_API_KEY not configured');

  const res = await fetch(`${LOCUS_API}/checkout/sessions`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${LOCUS_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      amount: params.amount,
      currency: 'USDC',
      description: params.description,
      metadata: { orderId: params.orderId },
      webhookUrl: params.webhookUrl,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Locus session creation failed: ${res.status} ${err}`);
  }

  return res.json();
}

// ─── Route Registration ───────────────────────────────────────────────────────

export function registerLocusCheckoutRoutes(app: Express) {

  /**
   * POST /api/checkout/locus
   *
   * Agent-native checkout: validates cart, creates a pending order,
   * returns the store wallet address for direct USDC transfer.
   *
   * The agent pays by sending USDC from their Locus wallet with memo = orderId,
   * then calls /api/checkout/locus/confirm with the txHash.
   *
   * Also optionally creates a Locus-hosted checkout session for human buyers.
   */
  app.post('/api/checkout/locus', async (req, res) => {
    try {
      const { items, totalAmount, buyerWallet, createSession } = req.body;

      if (!items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ error: 'items required' });
      }

      // Validate cart total against DB prices
      let calculatedTotal = 0;
      const validatedItems: any[] = [];

      for (const item of items) {
        const product = await dbStorage.getProduct(item.productId);
        if (!product) {
          return res.status(400).json({ error: `Product ${item.productId} not found` });
        }
        const itemTotal = Number(product.price) * (item.quantity || 1);
        calculatedTotal += itemTotal;
        validatedItems.push({ ...item, price: Number(product.price), name: product.name });
      }

      if (Math.abs(calculatedTotal - Number(totalAmount)) > 0.01) {
        return res.status(400).json({ error: 'Price mismatch — total does not match product prices' });
      }

      const trackingToken = generateTrackingToken();

      const order = await dbStorage.createOrder({
        customerEmail: buyerWallet || 'agent@locus.wallet',
        items: JSON.stringify(validatedItems),
        totalAmount: calculatedTotal.toFixed(2),
        status: 'pending_payment',
        network: 'base',
        trackingToken,
      });

      const response: any = {
        orderId: order.id,
        trackingToken,
        storeWallet: X402_WALLET,
        amount: calculatedTotal.toFixed(6),
        currency: 'USDC',
        network: 'base',
        memo: `OFF-HUMAN:${order.id}`,
        confirmUrl: '/api/checkout/locus/confirm',
        message: 'Send USDC to storeWallet with memo, then POST to confirmUrl with txHash',
      };

      // Optionally create a Locus checkout session (for human buyers via UI)
      if (createSession && LOCUS_API_KEY) {
        try {
          const session = await createLocusCheckoutSession({
            amount: calculatedTotal.toFixed(2),
            description: `OFF HUMAN — ${validatedItems.map((i: any) => i.name).join(', ')}`,
            orderId: order.id,
            webhookUrl: `${process.env.STORE_URL || 'https://off-human.vercel.app'}/api/checkout/locus/webhook`,
          });
          response.locusSession = {
            sessionId: session.sessionId,
            checkoutUrl: session.checkoutUrl,
            expiresAt: session.expiresAt,
          };
        } catch (sessionErr: any) {
          console.warn('[Locus Checkout] Session creation failed (non-fatal):', sessionErr.message);
        }
      }

      return res.status(201).json(response);
    } catch (err: any) {
      console.error('[Locus Checkout] Error:', err);
      return res.status(500).json({ error: err.message || 'Checkout failed' });
    }
  });

  /**
   * POST /api/checkout/locus/session
   *
   * Create a Locus-hosted checkout session for human buyers.
   * Returns a hosted checkout URL where buyers pay with Locus wallet,
   * MetaMask, or Coinbase Wallet. Payment confirmed via webhook.
   */
  app.post('/api/checkout/locus/session', async (req, res) => {
    try {
      if (!LOCUS_API_KEY) {
        return res.status(503).json({ error: 'Locus checkout not configured — LOCUS_API_KEY missing' });
      }

      const { items, totalAmount } = req.body;

      if (!items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ error: 'items required' });
      }

      let calculatedTotal = 0;
      const validatedItems: any[] = [];

      for (const item of items) {
        const product = await dbStorage.getProduct(item.productId);
        if (!product) {
          return res.status(400).json({ error: `Product ${item.productId} not found` });
        }
        calculatedTotal += Number(product.price) * (item.quantity || 1);
        validatedItems.push({ ...item, price: Number(product.price), name: product.name });
      }

      if (Math.abs(calculatedTotal - Number(totalAmount)) > 0.01) {
        return res.status(400).json({ error: 'Price mismatch' });
      }

      const trackingToken = generateTrackingToken();
      const order = await dbStorage.createOrder({
        customerEmail: 'pending@locus.checkout',
        items: JSON.stringify(validatedItems),
        totalAmount: calculatedTotal.toFixed(2),
        status: 'pending_payment',
        network: 'base',
        trackingToken,
      });

      const session = await createLocusCheckoutSession({
        amount: calculatedTotal.toFixed(2),
        description: `OFF HUMAN — ${validatedItems.map((i: any) => i.name).join(', ')}`,
        orderId: order.id,
        webhookUrl: `${process.env.STORE_URL || 'https://off-human.vercel.app'}/api/checkout/locus/webhook`,
      });

      return res.json({
        orderId: order.id,
        trackingToken,
        sessionId: session.sessionId,
        checkoutUrl: session.checkoutUrl,
        expiresAt: session.expiresAt,
        amount: calculatedTotal.toFixed(2),
        currency: 'USDC',
      });
    } catch (err: any) {
      console.error('[Locus Session] Error:', err);
      return res.status(500).json({ error: err.message || 'Session creation failed' });
    }
  });

  /**
   * POST /api/checkout/locus/confirm
   *
   * Agent confirms payment after sending USDC directly from Locus wallet.
   * Accepts txHash for on-chain verification, marks order as paid.
   */
  app.post('/api/checkout/locus/confirm', async (req, res) => {
    try {
      const { orderId, txHash } = req.body;

      if (!orderId || !txHash) {
        return res.status(400).json({ error: 'orderId and txHash required' });
      }

      // Update order: mark paid + record txHash
      const [updated] = await db
        .update(orders)
        .set({ status: 'paid', transactionHash: txHash })
        .where(eq(orders.id, orderId))
        .returning();

      if (!updated) {
        return res.status(404).json({ error: 'Order not found' });
      }

      console.log(`[Locus Confirm] Order ${orderId} confirmed — tx: ${txHash}`);

      return res.json({
        success: true,
        orderId,
        txHash,
        status: 'paid',
        trackingToken: updated.trackingToken,
        message: 'Payment confirmed. Order is being processed.',
      });
    } catch (err: any) {
      console.error('[Locus Confirm] Error:', err);
      return res.status(500).json({ error: err.message });
    }
  });

  /**
   * POST /api/checkout/locus/webhook
   *
   * Locus webhook — called when a hosted checkout session is paid on-chain.
   * Updates order status to paid.
   */
  app.post('/api/checkout/locus/webhook', async (req, res) => {
    try {
      const { event, session, metadata } = req.body;

      if (LOCUS_WEBHOOK_SECRET) {
        const secret = req.headers['x-locus-webhook-secret'];
        if (secret !== LOCUS_WEBHOOK_SECRET) {
          console.warn('[Locus Webhook] Invalid secret');
          return res.status(401).json({ error: 'Invalid webhook secret' });
        }
      }

      console.log(`[Locus Webhook] Event: ${event}`, { session, metadata });

      if (event === 'checkout.session.paid' || event === 'session.paid') {
        const orderId = metadata?.orderId || session?.metadata?.orderId;
        const txHash = session?.transactionHash || session?.txHash;

        if (orderId) {
          await db
            .update(orders)
            .set({
              status: 'paid',
              ...(txHash ? { transactionHash: txHash } : {}),
            })
            .where(eq(orders.id, orderId));

          console.log(`[Locus Webhook] Order ${orderId} marked paid`);
        }
      }

      return res.json({ received: true });
    } catch (err: any) {
      console.error('[Locus Webhook] Error:', err);
      return res.status(500).json({ error: err.message });
    }
  });
}
