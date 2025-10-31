// Vercel will compile this TypeScript file automatically
import type { IncomingMessage, ServerResponse } from "http";
// Note: For ES modules, we use .js extension even when importing from .ts files
// Vercel's TypeScript compiler will resolve this correctly
import { createApp } from "../server/app.js";

let appPromise: ReturnType<typeof createApp> | null = null;

async function getApp() {
  if (!appPromise) {
    const bundle = await createApp();
    appPromise = bundle.app;
  }
  return appPromise;
}

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  const app = await getApp();
  // @ts-ignore Express handler signature
  return app(req, res);
}

