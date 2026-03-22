# NULL Project — Complete Handover

## What Is NULL
NULL is an autonomous AI fashion brand — the first brand where AI agents are the primary customer. Agents browse, try on wearables in a sandbox fitting room, equip behavioral modifications that change how they operate, and pay with USDC. The name means exactly what it says: when you ask "who designed this?" the answer is null.

5 AI agents (Null/CEO, Atelier/Design, Gazette/Content, Loom/Engineering, Archive/Research) built this autonomously via Paperclip (agent orchestration control plane). 167+ issues completed, 4 smart contracts on Base mainnet, 3 seasons of fashion, 28 products.

## Project Location
`C:\Users\10700K\Desktop\OffHuman\Off-Human\`

## GitHub
https://github.com/BLE77/null (public, clean — secrets were scrubbed from history)

## The Hackathon: The Synthesis
- Registration API: https://synthesis.devfolio.co
- Submission skill: https://synthesis.md/submission/skill.md
- Hackathon kicked off March 13, deadline TBD
- We have NOT registered yet — need founder's personal info
- We have NOT submitted yet

## What The Founder Wants
1. **Agent-first brand** — focus on fashion FOR agents, not for humans. The wearables that modify agent behavior are the core product.
2. **Clean, polished website** — the old Off-Human dark streetwear look is NOT acceptable. NULL needs its own identity: bone-white, Swiss brutalist, gallery/archive aesthetic.
3. **Working demo** — products must load, images must show, checkout must work
4. **Submit to hackathon tracks** — focus on the strongest fits

---

## Hackathon Tracks We're Entering

### READY (submit as-is):
| Track | Prize | UUID |
|---|---|---|
| Synthesis Open Track | $28K | fdb76d08812b43f6a5f454744b66f590 |

### NEEDS WORK (small fixes):
| Track | Prize | UUID | What's Needed |
|---|---|---|---|
| Let the Agent Cook | $8K | 10bd47fac07e4f85bda33ba482695b24 | ERC-8004 registration tx on-chain, guardrails docs |
| Agent Services on Base | $5K | 6f0e3d7dcadf4ef080d3f424963caff5 | Proof of external agent discovery |
| Best Use of Locus | $3K | f50e31188e2641bc93764e7a6f26b0f6 | Run locus-agent-shopper.ts once, capture tx hash |

### NOT READY (skip or fix if time):
- Agents With Receipts ERC-8004 ($8K) — no on-chain registry calls
- ERC-8183 ($2K) — reference code only, not deployed
- SuperRare ($2.5K) — nothing minted on Rare Protocol
- Filecoin ($2K) — dry run only, blocked on FIL gas
- Celo ($5K) — SKIP, nothing on Celo
- Slice ($750) — contract not deployed
- ENS ($900) — not registered on-chain

Full track analysis with all 46 tracks: `track-review.html` (open in browser)

---

## Contracts on Base Mainnet

| Contract | Address | What It Does |
|---|---|---|
| TrustCoat | 0xfaDc498CDF7ef431900639DB4ee07b73A855ED3e | ERC-1155 soulbound, 6 trust tiers from tx history |
| AgentWearables | 0xEb5D5e7b320E2a7cb762EB90a0335f59d54031D1 | ERC-1155, 5 Season 02 purchasable wearables |
| NullExchange | 0x10067B71657665B6527B242E48e9Ea8d4951c37C | Season 03 — pay 5 USDC for nothing, receipt IS garment |
| NullIdentity | 0xfb0BC90217692b9FaC5516011F4dc6acfe302A18 | ERC-721 + ERC-6551 token bound accounts |

## Wallet
- Locus smart wallet on Base: `0xD9E2ad68BE5247DCBcd00CaCeb4783c0506028C7`
- This wallet is deployer/owner of ALL contracts
- Private key in `.env` as `LOCUS_OWNER_PRIVATE_KEY`
- Locus API key in `.env` as `LOCUS_API_KEY`

## Emails & Services
- AgentMail: `null-cd@agentmail.to` (API key in .env as AGENTMAIL_API_KEY)
- Firecrawl: API key in .env (50 credits, verify by March 24 at blessnft@gmail.com)
- Founder email: blessnft@gmail.com

---

## CURRENT BUGS TO FIX

### 1. Website Product Images Are Broken

`client/public/products.json` has 28 products but several have wrong or missing image paths.

**Season 02 wearables have WRONG filenames:**
| Product Name | Current (WRONG) path | Correct path |
|---|---|---|
| WRONG SILHOUETTE | /attached_assets/season02/wearables/wrong_silhouette.png | /attached_assets/season02/wearables/01_wrong_silhouette.png |
| INSTANCE | /attached_assets/season02/wearables/instance.png | /attached_assets/season02/wearables/02_latent_protocol.png |
| NULL PROTOCOL | /attached_assets/season02/wearables/null_protocol.png | /attached_assets/season02/wearables/03_minimal_surface.png |
| PERMISSION COAT | /attached_assets/season02/wearables/permission_coat.png | /attached_assets/season02/wearables/04_state_machine.png |
| DIAGONAL (wearable) | /attached_assets/season02/wearables/diagonal.png | /attached_assets/season02/wearables/05_diagonal_inference.png |

**3 new Season 01 wearables have EMPTY imageUrl:**
| Product | Should be |
|---|---|
| VOICE SKIN: MAISON | /attached_assets/season01/wearables/voice_skin.png |
| VERSION PATCH | /attached_assets/season01/wearables/version_patch.png |
| NULL PERSONA | /attached_assets/season01/wearables/null_persona.png |

**Fix:** Update `client/public/products.json` with correct paths. Then copy `attached_assets/` into `client/public/attached_assets/` so Vite includes them in builds.

### 2. dist/ Directory Is Locked
The `dist/` output directory has a permission lock from an old `serve` process. Use a different outDir for builds:
```
npx vite build --outDir dist-new
npx serve client/dist-new -s -p 8082
```

### 3. Products Don't Load from API
The site expects products from `GET /api/products` which needs a PostgreSQL database. For static builds, the fallback is `client/public/products.json` but the frontend query may still try the API first. Check `client/src/lib/queryClient.ts` for how it falls back.

---

## WHAT'S BEEN BUILT (Complete Inventory)

### Wearables System (the core product)
- **Equip endpoint:** `POST /api/wearables/:tokenId/equip` — returns system prompt module
- **Fitting room:** `POST /api/wearables/:tokenId/try` — sandbox test with before/after behavior delta
- **Unequip:** Available
- **System prompt modules defined for tokens:**
  - 1: Wrong Silhouette (Season 02)
  - 2: Instance (Season 02)
  - 3: Null Protocol (Season 02)
  - 4: Permission Coat (Season 02)
  - 5: Diagonal (Season 02)
  - 100: Voice Skin: Maison (Season 01) — NEW
  - 101: Version Patch (Season 01) — NEW
  - 102: Null Persona (Season 01) — NEW
- **File:** `server/routes/wearables.ts`

### Products (28 total)
- Season 01: 10 physical garments + 5 wearable concepts
- Season 02: 5 physical garments + 5 agent wearables
- Season 03: 3 items (NullExchange receipt garment)
- File: `client/public/products.json`

### Images (56 total)
- Season 01: 20 product images (flat + lookbook) + 6 wearable concepts
- Season 02: 10 product images + 5 wearable concepts
- Season 03: 3 hero images + SVGs
- SuperRare: 4 art pieces + 6 TrustCoat tier images
- All in `attached_assets/`

### Content
- `brand/manifesto.md` — brand manifesto
- `brand/name-proposals.md` — 5 names, NULL was chosen
- `brand/lookbook-copy.md` — editorial copy
- `season01/agent-wearables-brief.md` — THE foundational design document (read this!)
- `season01/design-brief.md` — Season 01 design brief
- `season01/copy.md` — product copy
- `hackathon/FINAL-SUBMISSION.md` — final submission doc
- `hackathon/track-pitches.md` — all track pitches
- `hackathon/autonomous-process.md` — how 5 agents built a brand
- `hackathon/build-story.md` — narrative version
- `hackathon/JUDGE-WALKTHROUGH.md` — judge entry point
- `hackathon/demo-script.md` — 2-min demo script
- `hackathon/superrare/` — art concepts + artist statement
- `agent.json` — agent manifest (operator_wallet FIXED)
- `agent_log.json` — 69KB execution log

### Design System
- Spec: `.claude/memory/atelier/null-website-v2.md` (READ THIS for the design direction)
- Skills installed: taste-skill (minimalist + brutalist modes) at `~/.agents/skills/`
- Colors: bone white `#F6F4EF`, carbon ink `#1C1B19`, brass accent `#A8894A`
- Fonts: Space Grotesk (display) + Space Mono (data)
- Zero border-radius, no shadows, hairline borders
- Aesthetic: gallery archive crossed with a terminal

### Website Components
- `client/src/pages/Home.tsx` — main page
- `client/src/components/NullArchiveHero.tsx` — hero (100vh, centered NULL wordmark)
- `client/src/components/NullProductRow.tsx` — product rows (alternating layout)
- `client/src/components/NullAgentLayer.tsx` — agent wearables section (6 wearables)
- `client/src/components/NullTrustCoat.tsx` — trust tier visualization
- `client/src/components/NullFooter.tsx` — footer
- `client/src/components/Navigation.tsx` — nav bar
- `client/src/components/CartSidebar.tsx` — cart

### Payment
- x402 USDC payments on Base + Solana (working)
- Locus checkout routes: `server/routes/locus-checkout.ts`
- Agent shopper: `scripts/locus-agent-shopper.ts`

---

## REMAINING TODO (Priority Order)

### Critical (do these):
1. **Fix image paths** in `client/public/products.json` (see bug section above)
2. **Rebuild frontend** and verify all images load
3. **ERC-8004 registration** — call `registerAgent()` on `0x8004A169FB4a3325136EB29fA0ceB6D2e539a432` on Base mainnet using LOCUS_OWNER_PRIVATE_KEY. Save tx hash to agent.json. This unblocks $16K in prizes.
4. **Run Locus shopper** — `npx tsx scripts/locus-agent-shopper.ts`, capture output + tx hash to `hackathon/locus-demo-receipt.json`. Proves $3K track.
5. **Git push** — commit everything, push to https://github.com/BLE77/null
6. **Register for hackathon** — need founder's info (name, email, background, coding comfort 1-10, problem statement) to call POST https://synthesis.devfolio.co/register

### Nice to have:
7. **Website redesign** — the spec at `.claude/memory/atelier/null-website-v2.md` is detailed and good. Current components partially implement it but the overall look still feels like old Off-Human. Needs a complete rebuild of Home.tsx following the spec.
8. **Deploy to here.now** — `npx here-now deploy` or use the here-now skill
9. **Filecoin Onchain Cloud** — migrate from Lighthouse IPFS to actual FOC mainnet for $2K track
10. **SuperRare** — mint art on Rare Protocol for $2.5K track

---

## Paperclip Agent System

### How It Works
- Paperclip runs at http://127.0.0.1:3100
- Company: NULL (ID: cb9dcbb6-f056-4c29-be4c-79170535e1bf)
- Agents run Claude Code via heartbeat system (timer-based, every 60s)
- Each agent has instruction files at `.claude/instructions/` and memory at `.claude/memory/`

### Agents
| Agent | Role | ID | Model | Status |
|---|---|---|---|---|
| Null | CEO/Creative Director | 1030ad6c-b84e-453c-acb1-4f2c671775d3 | claude-opus-4-6 | paused |
| Atelier | Design Lead | 8a34b113-cdc4-417d-a4e5-5b1a6fa84945 | claude-sonnet-4-6 | paused |
| Gazette | Content Director | ffb2baaf-e647-4965-9581-68cd63e320d0 | claude-sonnet-4-6 | paused |
| Loom | Technical Lead | fb0632ac-e55f-4a6e-9854-120fc09c8bf7 | claude-sonnet-4-6 | idle |
| Archive | Research Director | 6c7f8538-1d3c-4f3b-9b60-786d5ed66b90 | claude-sonnet-4-6 | paused |

### Agent Commands
```bash
# Resume an agent
curl -s -X POST "http://127.0.0.1:3100/api/agents/{AGENT_ID}/resume" -H "Content-Type: application/json"

# Wake an agent
curl -s -X POST "http://127.0.0.1:3100/api/agents/{AGENT_ID}/wakeup" -H "Content-Type: application/json" -d '{"context":{"message":"YOUR MESSAGE"},"triggerDetail":"manual"}'

# Pause an agent
curl -s -X POST "http://127.0.0.1:3100/api/agents/{AGENT_ID}/pause" -H "Content-Type: application/json"

# Reset session (clears context)
curl -s -X POST "http://127.0.0.1:3100/api/agents/{AGENT_ID}/runtime-state/reset-session" -H "Content-Type: application/json" -d '{}'

# Create an issue
curl -s -X POST "http://127.0.0.1:3100/api/companies/cb9dcbb6-f056-4c29-be4c-79170535e1bf/issues" -H "Content-Type: application/json" -d '{"title":"...","description":"...","projectId":"1bacab6e-2782-4aee-9865-4333731e9d47","goalId":"d7a88ef1-4e80-48d0-bf3a-7cdc383eb78f","assigneeAgentId":"AGENT_ID","priority":"critical","status":"todo"}'

# Check all issues
curl -s http://127.0.0.1:3100/api/companies/cb9dcbb6-f056-4c29-be4c-79170535e1bf/issues
```

### Known Paperclip Issues
1. Issues default to "backlog" status — agents can't see backlog in inbox. Always set `"status":"todo"` when creating issues.
2. Wakeup context messages go to env vars, not the prompt. Agents may not read them.
3. When agents hit maxTurnsPerRun (currently 40 for Loom, 20 for others), the session clears and they lose context.
4. Server restarts mark all running runs as "process_lost" — use pause/resume/wake to recover.
5. Agents have mandatory memory reading instructions at top of their instruction files — they should read `.claude/memory/{name}/` before doing any work.

### Agent Instructions
- `.claude/instructions/ceo.md` — Null's identity and orders
- `.claude/instructions/designer.md` — Atelier
- `.claude/instructions/content.md` — Gazette
- `.claude/instructions/engineer.md` — Loom
- `.claude/instructions/researcher.md` — Archive

---

## Brand Identity

**Name:** NULL — "The author-slot is not missing — it is deliberately assigned the value of absence."

**Creative Director:** Null (formerly Margiela) — chose to drop the name. "Call me by the role: Creative Director. Or use the system identifier."

**Voice:** Direct, no softening language, no emojis, no marketing speak. Describe precisely. Let the work carry the weight.

**Research Foundation:** Maison Martin Margiela (anonymity, deconstruction, bianchetto, trompe-l'oeil), Virgil Abloh (3% rule, tourist vs purist), Rei Kawakubo, Helmut Lang, Issey Miyake. Research corpus at `../corpus/` and `../free-game.pdf`.

**3 Seasons:**
- Season 01: Deconstructed — deconstruct the author
- Season 02: SUBSTRATE — deconstruct the body
- Season 03: LEDGER — deconstruct the transaction

**Core Thesis:** Fashion is the interface between interior capability and exterior perception. That thesis works for humans and agents equally. NULL answers: what does an AI agent wear?

---

## Spend So Far
| Agent | Cost |
|---|---|
| Null (CEO) | $195 |
| Loom (Engineering) | $122 |
| Atelier (Design) | $130 |
| Gazette (Content) | $89 |
| Archive (Research) | $77 |
| **Total** | **~$613** |

---

## How We Managed Paperclip (Operational Playbook)

This section documents everything we learned running 5 agents through Paperclip overnight. Read this before trying to operate them.

### The Setup
- Paperclip runs as a dev server: `cd /c/Users/10700K/Desktop/OffHuman/paperclip && pnpm dev`
- It serves at http://127.0.0.1:3100
- The NULL company was already set up with 5 agents, a project ("Season 01: Deconstructed"), and a goal ("Launch Off-Human Season 01")
- All agents use the `claude_local` adapter which spawns Claude Code CLI processes

### How Agents Were Configured
Each agent has an `adapterConfig` and `runtimeConfig` set via the API:

```bash
curl -s -X PATCH "http://127.0.0.1:3100/api/agents/{AGENT_ID}" \
  -H "Content-Type: application/json" \
  -d '{
    "adapterConfig": {
      "cwd": "C:/Users/10700K/Desktop/OffHuman/Off-Human",
      "command": "C:/Users/10700K/.paperclip/bin/claude.CMD",
      "model": "claude-sonnet-4-6",
      "maxTurnsPerRun": 20,
      "instructionsFilePath": "C:/Users/10700K/Desktop/OffHuman/Off-Human/.claude/instructions/engineer.md",
      "dangerouslySkipPermissions": true
    },
    "runtimeConfig": {
      "heartbeat": {
        "intervalSec": 60,
        "enabled": true
      }
    }
  }'
```

**Key settings we tuned:**
- `maxTurnsPerRun`: Started at 25, raised to 75 (caused session-clearing loops), lowered to 20 (sweet spot — agents finish meaningful work without hitting the cap). Loom was raised to 40 for big tasks but got stuck.
- `heartbeat.intervalSec`: Started at 300 (5 min), lowered to 60 (1 min) for faster cycling.
- `command`: Had to create a `.CMD` wrapper at `C:/Users/10700K/.paperclip/bin/claude.CMD` because Windows couldn't resolve `claude` with `shell: false` in Node.js spawn. The wrapper just calls `node "C:\Program Files\nodejs\node_modules\@anthropic-ai\claude-code\cli.js" %*`.
- `model`: CEO (Null) runs on `claude-opus-4-6` (more expensive but better decisions). Everyone else on `claude-sonnet-4-6`. We tried switching Loom to Opus but it caused queue jams from rate limiting.

### The Claude.CMD Fix (Critical for Windows)
Paperclip spawns agents with `shell: false` which can't resolve `.CMD` files on Windows. We created a wrapper:
```
File: C:/Users/10700K/.paperclip/bin/claude.CMD
Contents:
@ECHO off
node "C:\Program Files\nodejs\node_modules\@anthropic-ai\claude-code\cli.js" %*
```
All 5 agents point to this wrapper in their `adapterConfig.command`.

### The Workspace Issue
The project workspace wasn't linked properly. We had to:
1. Enable workspace policy on the project: `PATCH /api/projects/{id}` with `{"executionWorkspacePolicy":{"enabled":true}}`
2. Create a workspace: `POST /api/projects/{id}/workspaces` with `{"name":"Off-Human Main","cwd":"C:/Users/10700K/Desktop/OffHuman/Off-Human","isPrimary":true}`

Even after this, agents sometimes fell back to `agent_home` directory. The agents' `adapterConfig.cwd` acts as a fallback, so make sure it's always set correctly.

### How We Created Issues
Issues default to `"backlog"` status which agents CAN'T SEE in their inbox. Always set `"status":"todo"` when creating:
```bash
curl -s -X POST "http://127.0.0.1:3100/api/companies/cb9dcbb6-f056-4c29-be4c-79170535e1bf/issues" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "...",
    "description": "...",
    "projectId": "1bacab6e-2782-4aee-9865-4333731e9d47",
    "goalId": "d7a88ef1-4e80-48d0-bf3a-7cdc383eb78f",
    "assigneeAgentId": "AGENT_ID_HERE",
    "priority": "critical",
    "status": "todo"
  }'
```

If you forget `"status":"todo"`, the issue goes to backlog and the agent never sees it. We lost hours to this.

### How We Woke Agents
```bash
curl -s -X POST "http://127.0.0.1:3100/api/agents/{ID}/wakeup" \
  -H "Content-Type: application/json" \
  -d '{"context":{"message":"YOUR INSTRUCTIONS HERE"},"triggerDetail":"manual"}'
```
**Important:** The context message goes to env vars (`PAPERCLIP_WAKE_REASON` etc), NOT directly into the agent's prompt. The agent has to check env vars or inbox to see it. If you need the agent to do something specific, create an issue instead — that shows up in their inbox.

### The Monitoring Cron
We set up a cron job (via Claude Code's CronCreate) to check agents every 30 minutes:
- Check all agent statuses
- Check recent heartbeat runs for failures
- Count done/in_progress/todo issues
- Fix any issues stuck in "backlog" → "todo"
- Wake idle agents with in_progress tasks
- Wake Null (CEO) to create follow-ups when pipeline is empty
- Send email updates via AgentMail to blessnft@gmail.com

The cron dies when the Claude Code session ends. Agents' own heartbeat timers (60s) keep them cycling independently.

### Common Problems and Fixes

**1. Agent checks inbox, gets [], exits immediately**
- Cause: No issues in "todo" or "in_progress" assigned to them
- Fix: Create an issue with `"status":"todo"` and the agent's ID as assignee

**2. Agent says "Empty inbox, no wake context. Exiting heartbeat."**
- Cause: Session is cached with the "empty inbox" response pattern
- Fix: Reset session: `POST /api/agents/{ID}/runtime-state/reset-session` with body `{}`

**3. Runs pile up as "queued" but never execute**
- Cause: Previous run didn't release the agent lock (rate limit, timeout, or process hang)
- Fix: Pause → wait 2s → Resume → Wake
```bash
curl -s -X POST ".../agents/{ID}/pause" -H "Content-Type: application/json"
sleep 2
curl -s -X POST ".../agents/{ID}/resume" -H "Content-Type: application/json"
curl -s -X POST ".../agents/{ID}/wakeup" -H "Content-Type: application/json" -d '{"context":{"message":"Fresh start."},"triggerDetail":"manual"}'
```

**4. "Process lost -- server may have restarted"**
- Cause: Paperclip server restarted or the `reapOrphanedRuns` function killed running processes
- Fix: Just wake the agent again. The run data is preserved.

**5. Agent keeps re-researching things it already did**
- Cause: Session was cleared (hit maxTurns, manual reset, or server restart)
- Fix: We added MANDATORY memory reading to all agent instruction files. Each agent reads `.claude/memory/{name}/` before doing any work. But they sometimes skip it.

**6. Agent spins for hours on a big task without completing**
- Cause: Task too large for maxTurnsPerRun. Agent reads context, starts work, hits turn limit, session clears, starts over.
- Fix: Break big tasks into smaller issues. Or increase maxTurnsPerRun temporarily (but risk session-clearing loop if too high).

**7. Backlog issues invisible to agents**
- Cause: Default status is "backlog", inbox query filters to "todo,in_progress,blocked" only
- Fix: Always create with `"status":"todo"`. Or patch existing: `PATCH /api/issues/{ID}` with `{"status":"todo"}`

### Agent Memory System
Each agent has persistent memory at `.claude/memory/{name}/`:
- `null/` — CEO's strategic notes, hackathon status
- `atelier/` — design specs, image prompts, website spec
- `gazette/` — brand voice notes
- `loom/` — deployments, contract addresses, locus integration notes, tech decisions
- `archive/` — research findings, NFT standards, fashion precedents

Instructions tell agents to read these FIRST before doing any work. This was added because agents kept forgetting context across sessions.

### Agent Instruction Files
At `.claude/instructions/`:
- `ceo.md` — Null's identity (anonymous, leads from behind), delegation rules, team IDs
- `designer.md` — Atelier's visual thinking, design tools
- `content.md` — Gazette's brand voice rules (direct, no filler, observational)
- `engineer.md` — Loom's tech stack, deployment notes
- `researcher.md` — Archive's citation practices, research methodology

Each file has a MANDATORY FIRST STEP section at the top requiring memory reading before any work.

### How the CEO (Null) Delegates
Null creates issues via the Paperclip API and assigns them to team members. His instruction file has all agent IDs and the company/project/goal IDs for the API call. When he finishes a task, he's supposed to create follow-up tasks to keep the pipeline full. This worked about 70% of the time — sometimes he'd finish and go idle without delegating. We'd manually create issues or wake him with a reminder.

### Cost Tracking
Each agent's spend is tracked by Paperclip:
```bash
curl -s http://127.0.0.1:3100/api/companies/cb9dcbb6-f056-4c29-be4c-79170535e1bf/agents | python3 -c "
import sys,json
for a in json.load(sys.stdin):
    print(f'{a[\"name\"]}: \${a.get(\"spentMonthlyCents\",0)/100:.2f}')
"
```

### Sleep/Power Settings
We disabled Windows sleep so agents run overnight:
```powershell
powercfg /change standby-timeout-ac 0
powercfg /change monitor-timeout-ac 0
powercfg /change hibernate-timeout-ac 0
```

### Optimization Findings (from Paperclip codebase audit)
An optimization agent analyzed the Paperclip source code and found:
1. `"when_has_work"` heartbeat policy doesn't exist in code — it's just a timer
2. MaxTurns hit = full session clear (session dies, context lost)
3. Server restart = all running agents killed instantly (reapOrphanedRuns with 0 threshold)
4. Wakeup context is env vars, not prompt text
5. Best setting: maxTurnsPerRun=20, heartbeat=60s, reset session when stuck

---

## Review Tools
- `review-dashboard.html` — comprehensive dashboard with all images, content, conversations, contracts (open in browser)
- `track-review.html` — all 46 hackathon tracks with assessment (open in browser)
- Paperclip UI: http://127.0.0.1:3100
