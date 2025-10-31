import type { Express as ExpressType } from "express";
import type { IncomingMessage, ServerResponse } from "http";
import { createApp } from "../server/app.js";

let appInstance: ExpressType | null = null;
let appPromise: Promise<ExpressType> | null = null;
let appError: Error | null = null;

export async function getExpressApp(): Promise<ExpressType> {
  if (appError) {
    throw appError;
  }

  if (appInstance) {
    return appInstance;
  }

  if (!appPromise) {
    appPromise = createApp()
      .then((bundle) => {
        appInstance = bundle.app;
        return appInstance;
      })
      .catch((error) => {
        appError = error;
        throw error;
      });
  }

  return appPromise;
}

export async function handleWithExpress(
  req: IncomingMessage,
  res: ServerResponse,
): Promise<void> {
  const app = await getExpressApp();

  return new Promise<void>((resolve, reject) => {
    let finished = false;

    const originalEnd = res.end.bind(res);
    res.end = function (chunk?: any, encoding?: any, cb?: any) {
      if (!finished) {
        finished = true;
        const result = originalEnd(chunk, encoding, cb);
        resolve();
        return result;
      }
      return originalEnd(chunk, encoding, cb);
    };

    res.on("finish", () => {
      if (!finished) {
        finished = true;
        resolve();
      }
    });

    res.on("error", (err) => {
      if (!finished) {
        finished = true;
        reject(err);
      }
    });

    try {
      app(req as any, res as any, (err?: any) => {
        if (err && !finished) {
          finished = true;
          reject(err);
        }
      });
    } catch (error) {
      if (!finished) {
        finished = true;
        reject(error);
      }
    }

    setTimeout(() => {
      if (!finished) {
        finished = true;
        if (!res.headersSent) {
          res.statusCode = 504;
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify({ message: "Gateway timeout" }));
        }
        resolve();
      }
    }, 10000);
  });
}
