import type { IncomingMessage, ServerResponse } from "http";
import { createApp } from "../server/app";

let appPromise: ReturnType<typeof createApp> | null = null;

async function getApp() {
  if (!appPromise) appPromise = createApp();
  return appPromise;
}

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  const { app } = await getApp();
  // @ts-ignore Express handler signature
  return app(req, res);
}

