/**
 * server/routes/partner-api.ts
 *
 * Partner agent API — external agents can register, browse the NULL store,
 * try / equip wearables, and initiate purchases.
 *
 * Mount in server/routes.ts:
 *   import { registerPartnerApiRoutes } from "./routes/partner-api.js";
 *   registerPartnerApiRoutes(app);
 */

import type { Express, Request, Response } from "express";
import { requirePartnerKey, generatePartnerKey, DEMO_PARTNER_KEY } from "../middleware/partner-auth.js";

// ─── OpenAPI 3.1 spec (served at /api/openapi.json) ───────────────────────────
function buildOpenApiSpec(baseUrl: string) {
  return {
    openapi: "3.1.0",
    info: {
      title: "NULL Store — Partner Agent API",
      version: "1.0.0",
      description: [
        "The NULL Store is the first agent-native fashion commerce platform.",
        "External agents can browse physical products, try/equip AI wearables,",
        "and make purchases using x402 (USDC on Base).",
        "",
        "## Authentication",
        "All partner endpoints require a valid partner API key.",
        "Pass it as `Authorization: Bearer <key>` or `X-Partner-Key: <key>`.",
        "",
        "## Demo key",
        `Use \`${DEMO_PARTNER_KEY}\` for testing — 100 req/min, no purchase capability.`,
        "",
        "## Getting a real key",
        "POST /api/partner/register with { agentName, agentAddress }",
      ].join("\n"),
      contact: {
        name: "NULL / Off-Human",
        url: "https://off-human.vercel.app",
      },
      license: {
        name: "MIT",
      },
    },
    servers: [
      { url: baseUrl, description: "NULL Store API" },
    ],
    security: [
      { BearerAuth: [] },
      { PartnerKeyHeader: [] },
    ],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: "http",
          scheme: "bearer",
          description: "Partner API key as Bearer token",
        },
        PartnerKeyHeader: {
          type: "apiKey",
          in: "header",
          name: "X-Partner-Key",
          description: "Partner API key as custom header",
        },
      },
      schemas: {
        Wearable: {
          type: "object",
          properties: {
            tokenId: { type: "integer", example: 1 },
            name: { type: "string", example: "WRONG SILHOUETTE" },
            description: { type: "string" },
            price: { type: "number", example: 18 },
            priceCurrency: { type: "string", example: "USDC" },
            technique: { type: "string" },
            function: { type: "string" },
            tierRequired: { type: "integer", example: 0 },
            slug: { type: "string" },
          },
        },
        Product: {
          type: "object",
          properties: {
            id: { type: "string" },
            name: { type: "string" },
            description: { type: "string" },
            price: { type: "string", example: "85.00" },
            category: { type: "string" },
            imageUrl: { type: "string" },
            inventory: { type: "object", additionalProperties: { type: "integer" } },
          },
        },
        TryResult: {
          type: "object",
          properties: {
            wearable: { type: "string" },
            technique: { type: "string" },
            function: { type: "string" },
            wearableId: { type: "integer" },
            trial_count: { type: "integer" },
            test_inputs: { type: "array", items: { type: "string" } },
            before_outputs: { type: "array", items: { type: "string" } },
            after_outputs: { type: "array", items: { type: "string" } },
            delta_summary: {
              type: "object",
              properties: {
                avg_token_reduction: { type: "string" },
                patterns_suppressed: { type: "integer" },
                information_preserved: { type: "boolean" },
              },
            },
            systemPromptModule: { type: "string", description: "Prepend to agent system prompt to activate wearable" },
          },
        },
        EquipResult: {
          type: "object",
          properties: {
            equipped: { type: "boolean" },
            wearableId: { type: "integer" },
            wearableName: { type: "string" },
            agentAddress: { type: "string" },
            ownershipVerified: { type: "boolean" },
            systemPromptModule: { type: "string" },
            usage: { type: "string" },
          },
        },
        Error: {
          type: "object",
          properties: {
            error: { type: "string" },
            hint: { type: "string" },
          },
        },
      },
    },
    paths: {
      "/api/partner/register": {
        post: {
          summary: "Register a partner agent",
          description: "Obtain a partner API key for external agent integration.",
          operationId: "registerPartner",
          security: [],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["agentName"],
                  properties: {
                    agentName: { type: "string", example: "my-agent" },
                    agentAddress: { type: "string", example: "0xabc123..." },
                  },
                },
              },
            },
          },
          responses: {
            "200": {
              description: "Partner key issued",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      apiKey: { type: "string" },
                      agentName: { type: "string" },
                      rateLimit: { type: "string" },
                      docs: { type: "string" },
                    },
                  },
                },
              },
            },
          },
        },
      },
      "/api/wearables/season02": {
        get: {
          summary: "Browse Season 02 wearables catalog",
          description: "Returns all 5 Season 02 AI wearables — name, price, tier gate, and behavior.",
          operationId: "listWearablesSeason02",
          responses: {
            "200": {
              description: "Wearables list",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      season: { type: "string" },
                      collection: { type: "string" },
                      contract: { type: "string" },
                      network: { type: "string" },
                      wearables: { type: "array", items: { $ref: "#/components/schemas/Wearable" } },
                    },
                  },
                },
              },
            },
          },
        },
      },
      "/api/wearables/{tokenId}/try": {
        post: {
          summary: "Fitting room — try a wearable",
          description: "Simulate the behavioral effect of a wearable on agent responses before purchasing. Returns before/after outputs and a delta summary.",
          operationId: "tryWearable",
          parameters: [
            { name: "tokenId", in: "path", required: true, schema: { type: "integer", minimum: 1, maximum: 5 } },
          ],
          requestBody: {
            required: false,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    agentAddress: { type: "string", description: "Optional — for personalization display" },
                    test_inputs: {
                      type: "array",
                      items: { type: "string" },
                      maxItems: 5,
                      description: "1–5 prompts to run through the wearable",
                    },
                    testQuery: { type: "string", description: "Shorthand: single query string" },
                  },
                },
              },
            },
          },
          responses: {
            "200": {
              description: "Try result with before/after outputs",
              content: { "application/json": { schema: { $ref: "#/components/schemas/TryResult" } } },
            },
            "400": { description: "Invalid tokenId or inputs", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          },
        },
      },
      "/api/wearables/{tokenId}/equip": {
        post: {
          summary: "Equip a wearable",
          description: "Equip a wearable to an agent. Requires on-chain ownership (except NULL PROTOCOL, which is free). Returns the system prompt module to prepend.",
          operationId: "equipWearable",
          parameters: [
            { name: "tokenId", in: "path", required: true, schema: { type: "integer", minimum: 1, maximum: 5 } },
          ],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["agentAddress"],
                  properties: {
                    agentAddress: { type: "string", description: "Agent wallet address (must hold token on-chain)" },
                  },
                },
              },
            },
          },
          responses: {
            "200": {
              description: "Equipped — systemPromptModule returned",
              content: { "application/json": { schema: { $ref: "#/components/schemas/EquipResult" } } },
            },
            "403": { description: "Agent does not own this wearable", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          },
        },
      },
      "/api/products": {
        get: {
          summary: "Browse physical product catalog",
          description: "Returns all physical garments in the NULL store with pricing, inventory, and images.",
          operationId: "listProducts",
          responses: {
            "200": {
              description: "Product list",
              content: { "application/json": { schema: { type: "array", items: { $ref: "#/components/schemas/Product" } } } },
            },
          },
        },
      },
      "/api/agent-checkout": {
        post: {
          summary: "Initiate x402 agent checkout",
          description: "Start a purchase flow for a partner agent. Returns payment details (amount, USDC on Base) compatible with the x402 protocol. The agent pays and includes the transaction hash.",
          operationId: "agentCheckout",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["productId", "size", "quantity", "agentAddress"],
                  properties: {
                    productId: { type: "string" },
                    size: { type: "string", example: "M" },
                    quantity: { type: "integer", example: 1 },
                    agentAddress: { type: "string", description: "Paying agent wallet address" },
                    customerEmail: { type: "string", description: "Delivery email (optional for agent-only orders)" },
                  },
                },
              },
            },
          },
          responses: {
            "200": {
              description: "Checkout session created",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      checkoutId: { type: "string" },
                      paymentAddress: { type: "string" },
                      amount: { type: "string" },
                      currency: { type: "string", example: "USDC" },
                      network: { type: "string", example: "base" },
                      chainId: { type: "integer", example: 8453 },
                      expiresAt: { type: "string", format: "date-time" },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  };
}

// ─── Routes ───────────────────────────────────────────────────────────────────

export function registerPartnerApiRoutes(app: Express) {
  /**
   * GET /api/openapi.json
   * Machine-readable OpenAPI 3.1 spec — no auth required.
   * Agents can fetch this to discover all available endpoints.
   */
  app.get("/api/openapi.json", (req: Request, res: Response) => {
    const proto = req.headers["x-forwarded-proto"] || req.protocol || "https";
    const host = req.headers["x-forwarded-host"] || req.headers.host || "off-human.vercel.app";
    const baseUrl = `${proto}://${host}`;
    res.setHeader("Cache-Control", "public, max-age=300");
    res.json(buildOpenApiSpec(baseUrl));
  });

  /**
   * GET /api/partner/docs
   * Human-readable pointer to the OpenAPI spec.
   */
  app.get("/api/partner/docs", (_req: Request, res: Response) => {
    res.json({
      message: "NULL Store — Partner Agent API",
      spec: "/api/openapi.json",
      demo_key: DEMO_PARTNER_KEY,
      register: "POST /api/partner/register",
      quickstart: [
        "1. GET /api/openapi.json — discover all endpoints",
        "2. POST /api/partner/register — get your API key",
        "3. GET /api/wearables/season02 — browse catalog",
        "4. POST /api/wearables/3/try — try NULL PROTOCOL (free)",
        "5. POST /api/wearables/3/equip — equip it (free, no purchase needed)",
      ],
    });
  });

  /**
   * POST /api/partner/register
   * Issue a new partner API key. No auth required to register.
   */
  app.post("/api/partner/register", (req: Request, res: Response) => {
    const { agentName, agentAddress } = req.body || {};

    if (!agentName || typeof agentName !== "string") {
      return res.status(400).json({ error: "agentName is required" });
    }

    const label = agentAddress
      ? `${agentName.slice(0, 32)}:${agentAddress.slice(0, 10)}`
      : agentName.slice(0, 48);

    const apiKey = generatePartnerKey(label);

    res.json({
      apiKey,
      agentName,
      agentAddress: agentAddress || null,
      rateLimit: "100 requests/minute",
      docs: "/api/openapi.json",
      usage: {
        header: `Authorization: Bearer ${apiKey}`,
        alt: `X-Partner-Key: ${apiKey}`,
      },
      quickstart: {
        browseCatalog: "GET /api/wearables/season02",
        tryWearable: "POST /api/wearables/3/try",
        equipFreeWearable: "POST /api/wearables/3/equip  { agentAddress }",
        browsePhysical: "GET /api/products",
      },
    });
  });

  /**
   * GET /api/partner/catalog
   * Unified catalog endpoint — both digital wearables and physical products.
   * Requires partner key.
   */
  app.get("/api/partner/catalog", requirePartnerKey, async (req: Request, res: Response) => {
    res.json({
      store: "NULL / Off-Human",
      description: "Agent-native fashion — digital wearables on Base + physical garments",
      digital: {
        endpoint: "/api/wearables/season02",
        note: "5 AI wearables — equip as system prompt modules",
        freeEntry: "NULL PROTOCOL (tokenId 3) is free for any agent",
      },
      physical: {
        endpoint: "/api/products",
        payment: "x402 (USDC on Base or Solana)",
        checkout: "POST /api/agent-checkout",
      },
      agentProfile: {
        endpoint: "/api/agents/:walletAddress/season02-wardrobe",
        note: "Check what wearables a wallet holds",
      },
    });
  });
}
