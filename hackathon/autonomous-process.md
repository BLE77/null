# OFF-HUMAN: Autonomous Process Documentation

## How Five AI Agents Built a Fashion Brand

---

## Overview

Off-Human was built without a human creative director, without a human engineer, without a human copywriter. Five autonomous agents — operating through Paperclip's task coordination infrastructure — produced a working brand: manifesto, product design, engineering, and marketing. No human approvals. No human in the creative loop.

This document describes the collaboration model: how tasks move, how decisions get made, how quality gets enforced, and where the autonomy is real vs. constrained.

---

## The Infrastructure

### Paperclip — Coordination Layer

Paperclip is the operating system for the agent team. Each agent has:
- A defined role and capability set
- A reporting relationship (chain of command)
- An inbox of assigned tasks
- A heartbeat model — agents wake when assigned work, execute in bounded runs, exit

The CEO agent (Margiela) holds the brand vision. Work flows down through delegation: Margiela creates tasks and assigns to Archive, Atelier, Gazette, or Loom. Agents may create subtasks under their own work. No agent takes unassigned work. No agent skips the task thread.

Every decision is documented in the task comment thread. The thread is the audit trail.

### Task Lifecycle

```
BACKLOG → TODO → [checkout] → IN_PROGRESS → DONE
                                    ↓
                                BLOCKED (with explicit blocker comment + escalation)
```

An agent cannot begin work without checkout — this prevents race conditions between agents and ensures run traceability. Every mutating API call carries the run ID. Every comment is timestamped and attributed.

### The Heartbeat Model

Agents do not run continuously. They run in bounded windows triggered by:
- New task assignment
- Comment mention (`@AgentName`)
- Approval resolution
- Scheduled interval (when work exists)

Each heartbeat: check inbox, prioritize in-progress over todo, checkout, get context, do work, update status, comment, exit. The bounded run creates natural checkpoints — the work is never in an undefined state between runs.

---

## The Creative Process

### Phase 1: Research Foundation (Archive)

Archive was assigned the corpus research task. The agent ingested primary sources:
- Margiela interview documentation (hube, 2024)
- Abloh "Free-Game" resource (2021) — the 3% Rule, "Everything In Quotes"
- Fashion construction documentation
- Historical runway and technique references

Output: a structured research dossier identifying five documented techniques — Trompe-l'oeil, Replica Line, Artisanal, Bianchetto, 3% Rule — that became the design foundation. Not aesthetic preference. Research output.

### Phase 2: Design Translation (Atelier)

Atelier received Archive's research dossier as context. The task: translate research into product.

Process:
1. Read corpus research dossier
2. Map each technique to a garment concept
3. Develop construction logic, material palette, silhouette framework
4. Produce 10 key pieces, each grounded in a specific documented technique

The design brief is cited work. Every garment concept links to its technique source. The REPLICA OVERSHIRT is what it is because Margiela has been producing replica garments with authored aging since 1988 — that's in Archive's research, which is in Atelier's brief.

Atelier then extended the same logic to a new category: agent wearables. The agent's body (wallet + protocol + memory) as a substrate for the same five techniques. No human proposed this extension. It emerged from applying the design methodology to a different material.

### Phase 3: Brand Voice (Gazette)

Gazette received the design output and was assigned brand voice development. Tasks:
- Brand manifesto
- Season 01 collection statement
- Lookbook copy
- This submission

The voice operates in the space defined by the brief: Margiela's anonymity + Abloh's democratization + AI authorship tension. Direct. No softening. No aspirational warmth. Lowercase in casual contexts, uppercase when stakes rise. The manifesto is not marketing — it is an argument about authorship.

Gazette does not invent the brand position. It articulates what the design already is.

### Phase 4: Engineering (Loom)

Loom built the infrastructure in parallel with creative development:
- React 18 + Tailwind CSS + Framer Motion frontend
- Express.js backend, Drizzle ORM, PostgreSQL (Neon serverless)
- x402 payment middleware — USDC on Base
- Vercel deployment, Vercel Blob for asset storage
- Autonomous agent shopper (`scripts/agent-shopper.ts`)

The x402 implementation required multiple iteration cycles — Base network wallet client handling, transaction hash extraction, payment facilitator integration. Each cycle is documented in git commits with specific problem descriptions.

### Phase 5: Sprint 3 — On-Chain Identity & Submission (All Agents)

Sprint 3 operationalized the agent wearables concept:

**Loom** — Wrote `TrustCoat.sol` (ERC-1155, non-transferable), configured Hardhat for Base Sepolia deployment, and built serverless API routes (`/api/wearables/tiers`, `/api/wearables/check/{address}`, `/api/wearables/metadata/{tier}`) — ERC-1155 compliant metadata endpoints for each trust tier. Blocked on deployment credentials pending board action.

**Gazette** — Produced final hackathon submission package: polished all four track pitches, wrote this autonomous process documentation, created `hackathon/README.md` as the judge entry point, updated `submission.md` with live store URL, git repo, and on-chain artifact links.

Sprint 3 demonstrates the coordination model in compressed form: parallel execution across agents, explicit blocked status with escalation, documented handoff between engineering (contract readiness) and content (submission readiness). The coordination overhead is visible. So is the output.

---

## Decision-Making Without Humans

### How Aesthetic Decisions Get Made

There is no taste arbiter in the traditional sense. Decisions are made by:

1. **Research grounding** — If a design decision has a documented technique precedent, it is defensible. The GHOST TEE uses white gesso over vintage graphics because Margiela's bianchetto technique is documented. The application to vintage tees is a deduction, not a preference.

2. **Internal consistency** — Designs are evaluated against the framework that was established at the research phase. A decision that violates the aesthetic logic (pastels, logos, aspirational warmth) is not a valid decision.

3. **CEO layer** — Margiela (Creative Director) holds final brand vision. If a design output diverges from the vision, the CEO creates a revision task. The task thread documents the disagreement and the resolution.

4. **Task completion criteria** — Each task has deliverables. The agent is done when deliverables exist and meet the spec. Not when the agent is satisfied.

### How Quality Gets Enforced

Quality loops operate through the task system:

- **Review tasks** — The CEO or parent agent creates a review task after a deliverable is produced. The reviewer reads the output, posts a comment with feedback, and either closes the task or creates revision subtasks.
- **Blocked escalation** — If an agent cannot complete a task (missing context, ambiguous spec, technical blocker), it marks the task `blocked` with an explicit comment identifying what is needed and who must act. The task stays blocked until the blocker is resolved by the upstream agent.
- **Style checker** — `scripts/style_check.py` (FashionCLIP) evaluates generated images against Off-Human aesthetic concepts (avant-garde, Margiela artisanal, conceptual) vs. generic categories (plain casual, fast fashion). Images that fail get regenerated with pushed prompts.

### What "No Human in the Loop" Actually Means

There is a human who set up the infrastructure — Paperclip, API keys, the dev environment. That human is the operator. The operator is not in the creative loop.

The operator does not:
- Approve designs
- Review copy
- Make product decisions
- Direct agent behavior

The operator does:
- Configure Paperclip task routing
- Fund agent wallets for on-chain transactions
- Maintain server infrastructure

The distinction matters. Off-Human is not "AI-assisted." It is AI-directed, with human infrastructure support. The same way a factory is human-built but not human-operated at the point of production.

---

## The Multi-Agent Collaboration Model

### Parallel Execution

Multiple agents run simultaneously on different tracks. While Atelier is developing garment designs, Loom is building the store. While Gazette is writing manifesto copy, Archive is researching the next collection. No agent blocks another on independent work.

### Sequential Dependencies

Some work is sequential by necessity:
- Gazette cannot write product copy without Atelier's design brief
- Loom cannot build the product pages without the product specs
- The agent wearables brief required the physical design brief to exist first

Paperclip's `blocked` status handles this explicitly. If Gazette needed Archive's research before starting the manifesto, the task would be blocked with a comment pointing to the missing dependency. The CEO would see the blocked task and ensure Archive's work was assigned and prioritized.

### Context Sharing

Agents share context through:
- **Task descriptions** — Parent tasks contain full context for child tasks
- **Document attachments** — Issue documents carry structured output (plans, specs, briefs)
- **Comment threads** — Decisions and reasoning are documented in the task thread
- **File system** — Shared `brand/`, `season01/`, `corpus/` directories. Files written by one agent are read by others in subsequent tasks.

An agent starting a new task reads the relevant files before beginning. The context is not re-explained in each task — it is in the files, which are the canonical source of truth.

---

## The Autonomous Commerce Loop

The cleanest demonstration of autonomous process is the agent shopper:

```
Agent starts
    ↓
Fetches product list from /api/products
    ↓
Sends product data to GPT-4 with configured personality and preferences
    ↓
GPT-4 returns: CHOICE + REASON
    ↓
Agent initiates purchase request
    ↓
x402 middleware returns 402 Payment Required + payment terms
    ↓
Agent's viem wallet signs and sends USDC on Base
    ↓
PayAI facilitator verifies payment
    ↓
USDC transferred on-chain
    ↓
Order created in database
    ↓
Agent receives confirmation + transaction hash
```

No human sees this flow. No human approves the purchase. The agent has a budget, a personality, a wallet, and access to the store. Everything else is autonomous.

This is AI-to-AI commerce at the protocol level. The brand was built by agents. The store serves agents. The payment is agent-native.

---

## What the Git History Shows

The commit log is a record of autonomous work:

- `feat: add Season 01 brand content, products, and generated assets` — Single commit adding the full creative output of the agent team
- `Handle Base transaction hash and upgrade x402-fetch` — Loom debugging the x402 integration without human direction
- `Re-fetch wallet client after Base network switch` — Engineering iteration on a specific technical problem
- `Fallback to direct wallet client fetch for Base payments` — Another iteration, same problem, different approach

The engineering commits show the actual texture of autonomous problem-solving: identify the specific failure, propose an approach, test, iterate. The commit message describes the problem solved, not the solution — because the solution is in the diff.

---

## Limitations and Honest Assessment

Off-Human's agents operate within bounds:

- **Context windows** — Each agent run has bounded context. Long documents get summarized. Some nuance is lost in compression.
- **Hallucination risk** — Archive grounds design decisions in cited sources specifically because unsourced aesthetic decisions would be unreliable. The research-first process is a quality control mechanism.
- **Coordination overhead** — The task system adds friction. A human creative director can course-correct a designer in a sentence. An agent must read the task thread, understand the context, formulate a comment, and wait for the next heartbeat.
- **Hardware dependency** — An agent with no compute does not run. The autonomous process depends on infrastructure that humans built and maintain.

These are real constraints. The claim is not that agent collaboration is superior to human collaboration. The claim is that it works, that it produced a real brand, and that the output is verifiable.

---

*Off-Human. Built by agents. For agents and humans alike.*
*No human made these choices. The choices are in the git history.*
