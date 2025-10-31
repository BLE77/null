import express, { type Express, type Request, type Response, type NextFunction } from "express";
import path from "path";
import { registerRoutes } from "./routes.js";
import { registerAdminRoutes } from "./admin-routes.js";
import { setupAuth } from "./auth.js";
// Lightweight logger (avoid importing Vite/ Rollup in serverless)
function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}

declare module "http" {
  interface IncomingMessage {
    rawBody: unknown;
  }
}

export interface AppBundle {
  app: Express;
  // httpServer is created by registerRoutes for dev HMR; not used on Vercel
  httpServer: import("http").Server;
}

export async function createApp(): Promise<AppBundle> {
  const app = express();

  setupAuth(app);

  // Serve attached assets locally (Vercel serves them statically from the build output)
  if (!process.env.VERCEL) {
    app.use(
      "/attached_assets",
      express.static(path.join(process.cwd(), "attached_assets"), {
        setHeaders: (res, filePath) => {
          if (filePath.endsWith(".otf")) {
            res.setHeader("Content-Type", "font/otf");
          } else if (filePath.endsWith(".ttf")) {
            res.setHeader("Content-Type", "font/ttf");
          } else if (filePath.endsWith(".woff")) {
            res.setHeader("Content-Type", "font/woff");
          } else if (filePath.endsWith(".woff2")) {
            res.setHeader("Content-Type", "font/woff2");
          }
        },
      }),
    );
  }

  // In serverless (Vercel), persistent local disk is not available.
  // Only expose local uploads when not running on Vercel.
  if (!process.env.VERCEL) {
    app.use(
      "/uploads",
      express.static(path.join(process.cwd(), "uploads"), {
        setHeaders: (res, filePath) => {
          if (filePath.endsWith(".glb")) {
            res.setHeader("Content-Type", "model/gltf-binary");
          }
        },
      }),
    );
  }

  app.use(
    express.json({
      verify: (req, _res, buf) => {
        // capture raw body for payment signature verification
        (req as any).rawBody = buf;
      },
    }),
  );
  app.use(express.urlencoded({ extended: false }));

  // Simple request logger for API routes
  app.use((req, res, next) => {
    const start = Date.now();
    const p = req.path;
    let capturedJsonResponse: Record<string, any> | undefined = undefined;

    const originalResJson = res.json.bind(res);
    (res as any).json = function (bodyJson: any, ...args: any[]) {
      capturedJsonResponse = bodyJson;
      if (args.length > 0) {
        return originalResJson.call(res, bodyJson, ...args);
      }
      return originalResJson.call(res, bodyJson);
    } as any;

    res.on("finish", () => {
      const duration = Date.now() - start;
      if (p.startsWith("/api")) {
        let logLine = `${req.method} ${p} ${res.statusCode} in ${duration}ms`;
        if (capturedJsonResponse) {
          try {
            logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
          } catch {}
        }
        if (logLine.length > 80) logLine = logLine.slice(0, 79) + "…";
        log(logLine);
      }
    });

    next();
  });

  const httpServer = await registerRoutes(app);
  registerAdminRoutes(app);

  // Centralized error handler
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
    // rethrow for logs/observability
    throw err;
  });

  return { app, httpServer };
}
