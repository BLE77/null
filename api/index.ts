import type { IncomingMessage, ServerResponse } from "http";
import { createApp } from "../server/app";

let appPromise: ReturnType<typeof createApp> | null = null;

async function getApp() {
  if (!appPromise) appPromise = createApp();
  return appPromise;
}

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  const { app } = await getApp();
  // Express apps are request handlers: (req, res) => void
  // @ts-ignore - express type is compatible with Node handler
  return app(req, res);
}

