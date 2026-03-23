import type { IncomingMessage, ServerResponse } from "http";
import { readFileSync } from "fs";
import { join } from "path";

export default function handler(_req: IncomingMessage, res: ServerResponse) {
  try {
    const skillPath = join(process.cwd(), "skill.md");
    const content = readFileSync(skillPath, "utf-8");
    res.writeHead(200, {
      "Content-Type": "text/markdown; charset=utf-8",
      "Access-Control-Allow-Origin": "*",
    });
    res.end(content);
  } catch {
    res.writeHead(200, { "Content-Type": "text/markdown" });
    res.end("# NULL — skill.md\n\nVisit https://github.com/BLE77/null/blob/main/skill.md for the full skill file.");
  }
}
