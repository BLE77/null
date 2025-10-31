import type { IncomingMessage, ServerResponse } from "http";
import path from "path";
import fs from "fs";

function contentType(filePath: string): string {
  if (filePath.endsWith(".otf")) return "font/otf";
  if (filePath.endsWith(".ttf")) return "font/ttf";
  if (filePath.endsWith(".woff")) return "font/woff";
  if (filePath.endsWith(".woff2")) return "font/woff2";
  if (filePath.endsWith(".png")) return "image/png";
  if (filePath.endsWith(".jpg") || filePath.endsWith(".jpeg")) return "image/jpeg";
  if (filePath.endsWith(".gif")) return "image/gif";
  if (filePath.endsWith(".webp")) return "image/webp";
  if (filePath.endsWith(".glb")) return "model/gltf-binary";
  return "application/octet-stream";
}

export default async function handler(
  req: IncomingMessage & { url?: string },
  res: ServerResponse
) {
  try {
    // Extract path from request URL
    // Vercel catch-all routes: /api/attached_assets/[...path] means the path is in the URL
    let filePath: string;
    
    // Try to get path from URL
    const requestUrl = req.url || "";
    console.log(`[assets] Full URL: ${requestUrl}`);
    
    // Extract the file path after /api/attached_assets/
    // The path could be in different formats depending on how Vercel routes it
    let rel = requestUrl.replace(/^.*\/api\/attached_assets\//, "");
    
    // If that didn't work, try getting from pathname directly
    if (rel === requestUrl || !rel) {
      try {
        const url = new URL(requestUrl, "http://localhost");
        rel = url.pathname.replace(/^\/api\/attached_assets\//, "");
      } catch {
        // URL parsing failed, try direct extraction
        rel = requestUrl.split("/api/attached_assets/")[1] || "";
      }
    }
    
    // Decode URL encoding
    rel = decodeURIComponent(rel);
    
    // Remove any query parameters
    rel = rel.split("?")[0].split("#")[0];
    
    const baseDir = path.resolve(process.cwd(), "attached_assets");
    filePath = path.resolve(baseDir, rel);

    console.log(`[assets] Relative path: ${rel}`);
    console.log(`[assets] baseDir: ${baseDir}`);
    console.log(`[assets] Resolved filePath: ${filePath}`);

    // Normalize paths to handle different path separators
    const normalizedBaseDir = path.normalize(baseDir);
    const normalizedFilePath = path.normalize(filePath);

    // Prevent path traversal - use normalized paths
    if (!normalizedFilePath.startsWith(normalizedBaseDir)) {
      console.error(`[assets] Path traversal detected: ${normalizedFilePath} does not start with ${normalizedBaseDir}`);
      res.statusCode = 400;
      res.end("Bad request - path traversal detected");
      return;
    }

    if (!fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) {
      console.warn(`[assets] not found: ${filePath}`);
      // Fallback: try case-insensitive match in the directory
      const files = fs.readdirSync(baseDir);
      const candidate = files.find((n) => n.toLowerCase() === rel.toLowerCase());
      if (candidate) {
        const altPath = path.join(baseDir, candidate);
        console.log(`[assets] fallback hit: ${altPath}`);
        res.statusCode = 200;
        res.setHeader("Content-Type", contentType(altPath));
        fs.createReadStream(altPath).pipe(res as any);
        return;
      }
      res.statusCode = 404;
      res.end("Not found");
      return;
    }

    res.statusCode = 200;
    res.setHeader("Content-Type", contentType(filePath));
    fs.createReadStream(filePath).pipe(res as any);
  } catch (err) {
    console.error("[/api/attached_assets] Error:", err);
    if (!res.headersSent) {
      res.statusCode = 500;
      res.end("Internal Server Error");
    }
  }
}
