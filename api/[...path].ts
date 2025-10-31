// Vercel will compile this TypeScript file automatically
import type { IncomingMessage, ServerResponse } from "http";
// Vercel compiles TypeScript, so we can import from .ts files
import { createApp } from "../server/app";

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

