// This file is automatically bundled by the build script
// For Vercel, it will use the bundled version from api/[...path].js
import type { IncomingMessage, ServerResponse } from "http";
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

