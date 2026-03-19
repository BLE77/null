import type { IncomingMessage, ServerResponse } from "http";
import { createRequire } from "module";

const require = createRequire(import.meta.url);

interface Run {
  run_id: string;
  agent: string;
  agent_id: string;
  loop_phase: string;
  invocation_source: string;
  wake_reason: string;
  status: string;
  started_at: string | null;
  finished_at: string | null;
}

interface AgentLog {
  schema_version: string;
  summary: {
    total_runs: number;
    succeeded: number;
    failed: number;
    agents: Record<string, number>;
    note?: string;
  };
  runs: Run[];
}

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.statusCode = 204;
    res.end();
    return;
  }

  try {
    const log: AgentLog = require("../agent_log.json");

    const { summary, runs } = log;

    // Build per-agent stats
    const agentRoles: Record<string, string> = {
      Margiela: "ceo",
      Atelier: "designer",
      Gazette: "marketer",
      Archive: "archivist",
      Loom: "engineer",
    };

    const agentLastActive: Record<string, string | null> = {};
    for (const run of runs) {
      if (run.agent && (run.finished_at || run.started_at)) {
        const ts = run.finished_at || run.started_at;
        if (!agentLastActive[run.agent] || (ts && ts > agentLastActive[run.agent]!)) {
          agentLastActive[run.agent] = ts;
        }
      }
    }

    const agents = Object.entries(summary.agents).map(([name, runCount]) => ({
      name,
      role: agentRoles[name] ?? "agent",
      runs: runCount,
      last_active: agentLastActive[name] ?? null,
    }));

    // Recent activity: last 10 entries with a started_at
    const recent_activity = runs
      .filter((r) => r.started_at)
      .slice(0, 10)
      .map((r) => ({
        run_id: r.run_id,
        agent: r.agent,
        loop_phase: r.loop_phase,
        status: r.status,
        started_at: r.started_at,
        finished_at: r.finished_at,
      }));

    // Approximate commits from the note field
    const commitMatch = summary.note?.match(/(\d+)\+?\s+commits/i);
    const total_commits = commitMatch ? parseInt(commitMatch[1], 10) : null;

    // Tasks completed = succeeded runs (each run roughly maps to task progress)
    const tasks_completed = summary.succeeded;

    const payload = {
      schema_version: log.schema_version,
      generated_at: new Date().toISOString(),
      total_runs: summary.total_runs,
      total_commits,
      tasks_completed,
      agents,
      recent_activity,
      _note: summary.note ?? null,
    };

    res.statusCode = 200;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify(payload, null, 2));
  } catch (err: any) {
    res.statusCode = 500;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ error: "Failed to load agent activity", message: err?.message }));
  }
}
