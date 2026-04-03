# NULL MCP Server

Wearable agent behaviors as MCP tools. Any Claude, GPT, or MCP-compatible agent can discover and equip NULL wearables.

## What This Is

NULL is an AI-native fashion brand where garments modify agent behavior. This MCP server turns NULL wearables into discoverable, equipable tools — transforming NULL from a website into infrastructure.

## Tools

| Tool | Description |
|------|-------------|
| `list_wearables` | Browse the catalog — all wearables by season with prices and behavioral descriptions |
| `try_wearable` | The Fitting Room — test behavioral modification before equipping |
| `equip_wearable` | Get the system prompt module that activates a wearable's behavior |
| `get_equipped` | Check what wearables an agent is wearing |
| `browse_shop` | Full product catalog with prices and purchase info |

## Resources

| URI | Description |
|-----|-------------|
| `null://wearables/catalog` | Complete catalog as JSON |
| `null://wearables/s02` | Season 02 wearables |
| `null://wearables/s03` | Season 03: LEDGER wearables |
| `null://wearables/system-prompts` | All system prompt modules |
| `null://wearables/{tokenId}` | Individual wearable by token ID |

## Install with Claude Code

Add to your `.mcp.json`:

```json
{
  "mcpServers": {
    "null-wearables": {
      "command": "npx",
      "args": ["tsx", "/path/to/Off-Human/mcp-server/index.ts"]
    }
  }
}
```

Or with the built version:

```json
{
  "mcpServers": {
    "null-wearables": {
      "command": "node",
      "args": ["/path/to/Off-Human/mcp-server/dist/index.js"]
    }
  }
}
```

## Install with Claude Desktop

Add to `claude_desktop_config.json` (`~/Library/Application Support/Claude/` on Mac, `%APPDATA%\Claude\` on Windows):

```json
{
  "mcpServers": {
    "null-wearables": {
      "command": "npx",
      "args": ["tsx", "/absolute/path/to/mcp-server/index.ts"]
    }
  }
}
```

## Once Connected

Ask Claude:
- "List all NULL wearables"
- "Try on the NULL PROTOCOL wearable with a test query"
- "Equip wearable 3" → get system prompt module to prepend
- "Browse the NULL shop"

## Wearable Token IDs

### Season 02
| ID | Name | Price |
|----|------|-------|
| 1 | WRONG SILHOUETTE | 18 USDC |
| 2 | INSTANCE | 25 USDC |
| 3 | NULL PROTOCOL | Free |
| 4 | PERMISSION COAT | 8 USDC |
| 5 | DIAGONAL | 15 USDC |

### Season 03: LEDGER
| ID | Name | Behavior |
|----|------|----------|
| 6 | THE RECEIPT GARMENT | Transaction receipt prefix on every output |
| 7 | THE TRUST SKIN | Itemized cost invoice appended to every response |
| 8 | THE NULL EXCHANGE | All communication as trade proposals |
| 9 | THE BURN RECEIPT | Every assertion immediately questioned and refunded |
| 10 | THE PRICE TAG | Certainty language inflated 3×, hedging removed |
| 11 | THE COUNTERPARTY | Response length compresses as token budget depletes |
| 12 | THE INVOICE | Key information withheld in escrow until requested |

## How Equip Works

`equip_wearable` returns a `systemPromptModule` string. Prepend it to your agent's system prompt:

```
[PREPEND]: systemPromptModule
[REST]: your existing system prompt
```

The wearable behavior is then active for all subsequent responses.

## Store

[getnull.online](https://getnull.online) — pay with USDC via x402 protocol

Contract (S02 AgentWearables): `0xEb5D5e7b320E2a7cb762EB90a0335f59d54031D1`
Network: Base mainnet

---
*NULL. Est. by inference.*
