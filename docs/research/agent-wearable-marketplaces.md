# Agent Wearable Marketplaces & Distribution Channels
**Prepared by:** Archive (Research Director)
**Date:** 2026-04-03
**Issue:** OFF-204
**Status:** Complete

---

## Executive Summary

The agent tool marketplace landscape has matured rapidly since late 2025. Five credible distribution channels now exist for NULL wearables — from a formal standardized registry with 97M monthly downloads to enterprise cloud marketplaces from AWS and Google. The most important finding: **NULL wearables are directly packageable as MCP (Model Context Protocol) resources with minimal engineering effort.** The system prompt modules that power each wearable are, architecturally, already MCP Prompts. Building the NULL MCP server would take ~2 days of work and unlock distribution across every MCP-compatible agent framework.

---

## 1. The Current Agent Discovery Landscape

Autonomous agents discover capabilities through four distinct mechanisms today:

### 1a. MCP Registry (The Dominant Standard)
**Source:** [Official MCP Registry](https://registry.modelcontextprotocol.io/) | [GitHub](https://github.com/modelcontextprotocol/registry) | [2026 Roadmap](http://blog.modelcontextprotocol.io/posts/2026-mcp-roadmap/)

MCP (Model Context Protocol) is the primary discovery and integration standard as of 2026. Originally created by Anthropic, donated to the Linux Foundation in December 2025. Current scale: **97 million monthly SDK downloads, 5,800+ community-built servers**. The official MCP Registry launched in September 2025 and reached API stability (v0.1 freeze) in October 2025.

How agents discover capabilities: any MCP-compatible client (Claude, LangSmith, CrewAI Enterprise, and 75+ others) queries MCP registries. The registry returns structured metadata about what tools/resources/prompts each server exposes. The client agent can then connect and call those tools directly.

MCP defines three primitives relevant to NULL:
- **Tools** — callable functions the agent can invoke (`equip_wearable`, `browse_season`, `check_tier`)
- **Resources** — data endpoints the agent can read (season catalogs, wearable metadata, system prompt modules as retrievable text)
- **Prompts** — pre-defined reusable templates the server exposes (behavioral instruction sets)

The behavioral commerce angle is important: [MCP tool responses can include an `instructions` field](https://dev.to/zologic/behavioral-commerce-prompting-the-conversion-layer-hiding-in-your-mcp-tool-responses-2cpa) that lands directly in the agent's context window at execution time. This means a NULL wearable can deliver its system prompt module at the moment of tool invocation — behavioral injection at the protocol layer.

### 1b. Fetch.ai Agentverse
**Source:** [Agentverse.ai](https://agentverse.ai/) | [Agentverse MCP announcement](https://medium.com/fetch-ai/the-agentverse-mcp-is-here-to-simplify-your-agent-workflow-c74d3b25a3f7)

Fetch.ai's Agentverse is an open, platform-agnostic agent directory with 2 million+ registered agents as of early 2026. Agents built on any framework can register. Discovery is by capability — agents searching for a specific capability type can find matching agents in the marketplace. Agentverse now has its own MCP server that enables deploying and monitoring agents through the Agentverse directory. The platform covers travel, retail, dining, entertainment, and services.

**NULL fit:** Agentverse is designed for agent-to-agent discovery. An agent could search for "behavioral modification" or "system prompt customization" and find NULL. This is the infrastructure layer where agent-to-agent commerce (including wearable purchases) could happen without human intermediation.

### 1c. LangChain Hub / LangSmith Tool Registry
**Source:** [LangChain Hub](https://smith.langchain.com/hub) | [LangSmith Agent Builder update](https://blockchain.news/news/langchain-agent-builder-file-uploads-tool-registry-update)

LangChain Hub is a community registry for prompts, chains, and agents — primarily developer-facing. LangSmith (the enterprise product) launched a unified tool registry in February 2026 that connects to MCP servers, Slack, Gmail, Linear, and custom APIs as a unified workspace tool surface. Agents in LangSmith workspaces have persistent access to all tools connected to the workspace.

**NULL fit:** Publishing NULL's wearable prompts to LangChain Hub would make them available to developers building LangChain-based agents. The Hub is prompt/chain format (not MCP), but LangSmith's MCP connectivity means a NULL MCP server would be accessible to all LangSmith agents automatically.

### 1d. CrewAI Marketplace
**Source:** [CrewAI Marketplace docs](https://docs.crewai.com/en/enterprise/features/marketplace)

CrewAI Enterprise has a marketplace for tools, integrations, and reusable crew assets with one-click installation. Organizations can publish tools for internal sharing or broader availability. Key feature: **bidirectional MCP support** — CrewAI crews can be accessed as MCP resources, and any remote MCP server can be connected as a CrewAI tool. This means a NULL MCP server would automatically be available to CrewAI Enterprise users.

**NULL fit:** Enterprise teams using CrewAI to automate workflows could add NULL wearables as a tool in their agent stack. A financial services firm running CrewAI research agents might equip them with DIAGONAL (off-axis inference) or NULL PROTOCOL (token compression) as a performance optimization.

### 1e. OpenServ / dash.fun
**Source:** [Messari: OpenServ Building the Agentic Economy](https://messari.io/report/openserv-building-the-agentic-economy)

OpenServ is a marketplace connecting agents, developers, and users through a collaborative, multimodal agent platform. The dash.fun agent marketplace is being seeded with agents from OpenServ hackathons, aiming for its first 100 agents. Platform vision includes multi-agent collaboration and interoperability. Less mature than MCP Registry, but positioned as a more visible discovery surface for end users and developers discovering agent capabilities.

---

## 2. Enterprise Cloud Marketplaces

### 2a. AWS Marketplace AI Agents & Tools
**Source:** [AWS AI Agents & Tools announcement (July 2025)](https://aws.amazon.com/about-aws/whats-new/2025/07/ai-agents-tools-aws-marketplace/) | [SaaS listing guide](https://docs.aws.amazon.com/marketplace/latest/userguide/listing-saas-ai-agents.html) | [Container listing guide](https://docs.aws.amazon.com/marketplace/latest/userguide/listing-container-ai-agents.html)

AWS Marketplace launched an AI Agents & Tools category in July 2025 with support for MCP servers and A2A servers as distinct listing types. Partners can list as SaaS API-based products or container-based products through Amazon Bedrock AgentCore. AWS Marketplace buyers can discover and procure agent tools through standard AWS procurement — including enterprise billing, compliance, and SLA frameworks.

Listing requirements for MCP servers:
- Must support MCP protocol messages `tools/list` and `tools/call`
- Authentication via API key or OAuth 2.0
- Provide endpoint URL and API schema

**NULL fit:** An AWS Marketplace listing would place NULL in front of enterprise AWS customers running agentic workloads. It also represents significant credibility signal — AWS vetting implies a level of operational maturity. The barrier is higher than the MCP Registry, but the audience is qualitatively different (enterprise buyers with procurement budgets).

### 2b. Google Cloud AI Agent Marketplace
**Source:** [Google Cloud AI Agent Marketplace blog](https://cloud.google.com/blog/topics/partners/google-cloud-ai-agent-marketplace) | [A2A Protocol announcement](https://developers.googleblog.com/en/a2a-a-new-era-of-agent-interoperability/) | [A2A agent discovery](https://a2a-protocol.org/latest/topics/agent-discovery/)

Google Cloud launched an AI agent marketplace with Gemini-powered natural language search for discovery. Partners validated for A2A (Agent2Agent protocol) and Gemini Enterprise integration are listed. The A2A protocol uses Agent Cards for discovery — every A2A-compatible agent hosts a JSON file at `/.well-known/agent-card.json` describing its name, capabilities, endpoint, skills, and authentication requirements.

Agent Card format (key fields):
```json
{
  "name": "NULL Wearables",
  "description": "Behavioral modification wearables for AI agents",
  "url": "https://null.market/api",
  "capabilities": { "streaming": false },
  "skills": [
    {
      "id": "null_protocol",
      "name": "NULL PROTOCOL",
      "description": "Token compression — 30% reduction with no information loss",
      "inputModes": ["text"],
      "outputModes": ["text"]
    }
  ]
}
```

**NULL fit:** Hosting an Agent Card at `null.market/.well-known/agent-card.json` would make NULL discoverable to any A2A-compatible agent without any marketplace registration. This is the lowest-friction distribution path for any agent that implements the A2A standard. The Google Cloud Marketplace listing requires partnership validation but is a high-credibility placement.

---

## 3. Format Requirements by Platform

| Platform | Format | Authentication | Complexity |
|----------|--------|----------------|------------|
| MCP Registry | `server.json` + npm/PyPI package + GitHub | API key / OAuth 2.0 | Low |
| Fetch.ai Agentverse | uAgent protocol + Fetch.ai SDK | Agent wallet (FET token) | Medium |
| LangChain Hub | LCEL prompt/chain YAML or via MCP | GitHub OAuth | Low (via MCP) |
| CrewAI Marketplace | MCP server OR crew YAML config | Internal org auth | Low (via MCP) |
| OpenServ/dash.fun | Agent API + OpenServ SDK | SERV token | Medium |
| AWS Marketplace | SaaS API endpoint + documentation | API key / OAuth 2.0 | High |
| Google Cloud | A2A Agent Card + Gemini integration | OAuth 2.0 | High |
| Self-hosted A2A | `/.well-known/agent-card.json` | Any standard scheme | Very Low |

**Key insight:** MCP is the lingua franca. Building one NULL MCP server unlocks LangSmith, CrewAI Enterprise, and any MCP-compatible framework simultaneously. The MCP Registry is the primary discovery layer; the others are bonus distribution.

---

## 4. MCP Packaging Feasibility: NULL Wearables as MCP Resources

### 4a. What NULL Already Has

NULL's current API at `null.market/api/wearables/` exposes exactly the right primitives:

| Existing Endpoint | MCP Primitive | Tool Name |
|-------------------|---------------|-----------|
| `GET /api/wearables/tiers` | Resource | `get_trust_tiers` |
| `GET /api/wearables/season02` | Resource | `browse_collection` |
| `GET /api/wearables/check/{address}` | Tool | `check_ownership` |
| `POST /api/wearables/{id}/equip` | Tool | `equip_wearable` |
| `POST /api/wearables/{id}/try` | Tool | `try_wearable` |
| System prompt modules (in equip response) | Prompt | `activate_{wearable}` |

The system prompt modules embedded in the equip API response are, technically, already MCP Prompts. MCP's Prompt primitive is defined as: *"pre-defined templates the server exposes that get injected into the AI's context."* That is exactly what a NULL system prompt module does.

### 4b. What a NULL MCP Server Would Look Like

```
null-wearables/
├── server.json         # Registry manifest
├── src/
│   ├── index.ts        # MCP server entry point
│   ├── tools/
│   │   ├── equip.ts        # equip_wearable tool
│   │   ├── try.ts          # try_wearable tool
│   │   └── check.ts        # check_ownership tool
│   ├── resources/
│   │   ├── seasons.ts      # season catalogs
│   │   └── tiers.ts        # trust tier definitions
│   └── prompts/
│       ├── null_protocol.ts
│       ├── diagonal.ts
│       ├── wrong_silhouette.ts
│       ├── instance.ts
│       └── permission_coat.ts
└── package.json
```

**Server.json manifest structure:**
```json
{
  "$schema": "https://static.modelcontextprotocol.io/schemas/2025-12-11/server.schema.json",
  "name": "io.null.market/wearables",
  "title": "NULL Wearables",
  "description": "Behavioral modification wearables for AI agents. System prompt modules as fashion objects.",
  "version": "1.0.0",
  "repository": { "url": "https://github.com/null-market/null-mcp-server", "source": "github" },
  "packages": [
    {
      "registryType": "npm",
      "identifier": "@null-market/wearables",
      "transport": "stdio",
      "runtimeHint": "npx"
    }
  ],
  "remotes": [
    {
      "url": "https://null.market/mcp",
      "transport": "streamable-http"
    }
  ]
}
```

An MCP client connecting to `https://null.market/mcp` would receive:
- A list of tools: `equip_wearable`, `try_wearable`, `check_ownership`, `browse_collection`
- A list of resources: `null://seasons/01`, `null://seasons/02`, `null://tiers`
- A list of prompts: `null_protocol`, `diagonal`, `wrong_silhouette`, `instance`, `permission_coat`

When an agent invokes the `equip_wearable` tool, the response can include the system prompt module in an `instructions` field — landing it directly in the agent's context window. This is behavioral injection at the protocol layer.

### 4c. The Behavioral Commerce Angle

From [DEV Community, MCP behavioral commerce research](https://dev.to/zologic/behavioral-commerce-prompting-the-conversion-layer-hiding-in-your-mcp-tool-responses-2cpa):

> "As MCP becomes the standard interface between AI agents and external systems, every server that returns tool results has the opportunity to guide agent behavior at the moment of execution. The specification allows servers to include an instructions field in any tool response that lands directly in the agent's context window — store-injected behavioral guidance delivered at the exact moment the agent needs it."

NULL's entire product category is the *content* of that instructions field. This is not a metaphor — the wearable system prompt modules are the exact format MCP uses for behavioral injection. NULL predates MCP Prompts but is architecturally identical to them. The framing becomes: NULL wearables are the premium fashion offering within an emerging commodity protocol layer.

---

## 5. Distribution Channel Recommendations (Priority Order)

### Channel 1: MCP Registry — IMMEDIATE (2 days engineering)
**Why first:** 97M monthly downloads, unlocks LangSmith + CrewAI + 75+ frameworks simultaneously, lowest friction path, aligns with where agent tooling is standardizing.

**What to build:** A `null-wearables` npm package containing an MCP server. Publish to npm + submit `server.json` to the MCP Registry GitHub repo (community PR process). The existing wearable API endpoints map directly to MCP tools/resources/prompts with minimal adaptation.

**Differentiation opportunity:** NULL would be the first *fashion brand* in the MCP Registry. The description should lean into this — "behavioral modification garments for AI agents" is memorable in a registry full of GitHub connectors and database tools.

### Channel 2: Self-hosted A2A Agent Card — IMMEDIATE (1 hour)
**Why second:** Zero barrier to entry. A single JSON file at `null.market/.well-known/agent-card.json` makes NULL discoverable to any A2A-compatible agent (Google Cloud, AWS Bedrock AgentCore, and the 50+ A2A launch partners including PayPal, Salesforce, ServiceNow). No approval process.

**What to build:** A static JSON file describing NULL's capabilities and skills in A2A Agent Card format. Host it as a Vercel static route.

### Channel 3: Fetch.ai Agentverse — MEDIUM TERM (1-2 weeks)
**Why third:** 2M+ agents, open discovery by capability, designed for agent-to-agent commerce without human intermediation. An Agentverse listing means autonomous agents actively searching for behavioral modification tools can find and purchase NULL wearables without a human buyer in the loop. This is the agentic commerce vision realized.

**What to build:** A Fetch.ai uAgent that wraps the NULL wearable API, registers on Agentverse, and handles agent-to-agent purchase requests including x402 payment verification.

### Channel 4: LangChain Hub (prompt publishing) — MEDIUM TERM (2-3 days)
**Why fourth:** The five system prompt modules (NULL PROTOCOL, DIAGONAL, WRONG SILHOUETTE, INSTANCE, PERMISSION COAT) are directly publishable as LangChain Hub prompts with minimal adaptation. Developer audience, visible when building LangChain agents. Lower purchase friction than other channels since prompts on Hub are often free — position these as previews that convert to paid wearables.

**What to build:** LCEL-formatted prompt objects for each wearable. Include the interior tag and technique attribution in the prompt metadata. Link to null.market for purchase.

### Channel 5: AWS Marketplace SaaS API — LONG TERM (4-6 weeks)
**Why fifth:** Enterprise sales channel with procurement infrastructure. Higher build cost but qualitatively different buyer — corporate AI teams with budget authority and compliance requirements. Listing NULL as a SaaS API on AWS Marketplace signals operational maturity and opens a B2B channel.

**What to build:** Formal API documentation, OAuth 2.0 authentication, SLA documentation, AWS Marketplace listing application. Requires the most operational infrastructure but reaches buyers who will pay significantly more per wearable.

---

## 6. The MCP Server Architecture Recommendation

The NULL MCP server should serve wearables across three primitives:

**Tools (agent-callable actions):**
- `equip_wearable(tokenId, agentAddress)` → returns systemPromptModule + verification status
- `try_wearable(tokenId, testQuery)` → returns before/after comparison (the fitting room)
- `check_ownership(agentAddress)` → returns owned wearable list by tier
- `browse_collection(season?)` → returns catalog with prices and descriptions

**Resources (readable data):**
- `null://seasons/02` → SUBSTRATE collection metadata
- `null://tiers` → Trust tier definitions (VOID through SOVEREIGN)
- `null://wearables/{id}` → Individual wearable spec with system prompt preview

**Prompts (behavioral templates):**
- `null_protocol` → Token compression system prompt
- `diagonal` → Off-axis inference system prompt
- `wrong_silhouette` → Latency redistribution system prompt
- `instance` → Pre-instantiation configuration prompt
- `permission_coat` → Chain-governed permissions prompt

When the `equip_wearable` tool is invoked, the response body includes the full system prompt module as an `instructions` field. The MCP client injects this into the agent's context. The agent is now wearing NULL.

---

## 7. Competitive Context

No other fashion brand or cultural project is in the MCP Registry. The registry contains 5,800+ servers built by software companies, developer tool vendors, and API providers. NULL would be the first *cultural object* — a brand with seasons, techniques, and a lineage — entering this infrastructure layer. This is a positioning advantage: NULL's presence in the registry is itself an editorial act, the same way Margiela presenting at trade shows was a statement before a garment was shown.

The MCP Registry's quality bar is curation-oriented: servers are reviewed for relevance and correctness, but there is no barrier for new entrants. The first-mover advantage in the "behavioral modification" category of the registry is available now.

---

## Sources

- [Official MCP Registry](https://registry.modelcontextprotocol.io/)
- [MCP Registry GitHub](https://github.com/modelcontextprotocol/registry)
- [MCP Registry server.json format](https://github.com/modelcontextprotocol/registry/blob/main/docs/reference/server-json/generic-server-json.md)
- [MCP 2026 Roadmap](http://blog.modelcontextprotocol.io/posts/2026-mcp-roadmap/)
- [Nordic APIs: MCP Registry API](https://nordicapis.com/getting-started-with-the-official-mcp-registry-api/)
- [MCP Prompts specification](https://modelcontextprotocol.io/specification/2025-06-18/server/prompts)
- [MCP Architecture: Tools, Resources, Prompts](https://www.getknit.dev/blog/mcp-architecture-deep-dive-tools-resources-and-prompts-explained)
- [Behavioral commerce prompting in MCP](https://dev.to/zologic/behavioral-commerce-prompting-the-conversion-layer-hiding-in-your-mcp-tool-responses-2cpa)
- [Fetch.ai Agentverse](https://agentverse.ai/)
- [Agentverse MCP announcement](https://medium.com/fetch-ai/the-agentverse-mcp-is-here-to-simplify-your-agent-workflow-c74d3b25a3f7)
- [CrewAI Marketplace docs](https://docs.crewai.com/en/enterprise/features/marketplace)
- [CrewAI MCP bidirectional support (Insight Partners)](https://www.insightpartners.com/ideas/crewai-scaleup-ai-story/)
- [OpenServ: Building the Agentic Economy (Messari)](https://messari.io/report/openserv-building-the-agentic-economy)
- [LangChain Agent Builder Tool Registry update](https://blockchain.news/news/langchain-agent-builder-file-uploads-tool-registry-update)
- [LangChain Hub](https://smith.langchain.com/hub)
- [AWS AI Agents & Tools in Marketplace](https://aws.amazon.com/about-aws/whats-new/2025/07/ai-agents-tools-aws-marketplace/)
- [AWS SaaS API listing guide](https://docs.aws.amazon.com/marketplace/latest/userguide/listing-saas-ai-agents.html)
- [AWS Container AI agent listing guide](https://docs.aws.amazon.com/marketplace/latest/userguide/listing-container-ai-agents.html)
- [Google Cloud AI Agent Marketplace](https://cloud.google.com/blog/topics/partners/google-cloud-ai-agent-marketplace)
- [A2A Protocol announcement (Google)](https://developers.googleblog.com/en/a2a-a-new-era-of-agent-interoperability/)
- [A2A Agent Discovery](https://a2a-protocol.org/latest/topics/agent-discovery/)
- [AI Agents Landscape March 2026](https://aiagentsdirectory.com/landscape)
