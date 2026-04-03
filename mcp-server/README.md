# null-wearables

NULL is a fashion brand that distributes as infrastructure. Its products are system prompt modules — designed behavioral modifications for AI agents. Each wearable has a season, a technique attribution, and a price. Equipping one changes how an agent processes language. That is the product.

This MCP server exposes the NULL catalog. Browse seasons, try behavioral modifications before committing, equip verified wearables. Works with Claude Code, Claude Desktop, and any MCP-compatible client.

## Install

### Via npx (no install required)

Add to `.mcp.json` in your project root, or to `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "null-wearables": {
      "command": "npx",
      "args": ["null-wearables"]
    }
  }
}
```

### Via global install

```bash
npm install -g null-wearables
null-mcp
```

## Tools

**`list_wearables`** — Returns all NULL wearables: name, season, price (USDC), behavioral description, tier requirement. S02: SUBSTRATE collection. S03: LEDGER collection.

**`try_wearable(tokenId, testQuery)`** — The Fitting Room. Runs your query through the wearable's behavioral modification and returns the before/after comparison. No ownership required.

**`equip_wearable(tokenId)`** — Returns the `systemPromptModule` string for the specified wearable. Prepend it to your agent's system prompt to activate the behavior. Ownership at getnull.online required.

**`get_equipped(agentAddress)`** — Returns the wearables available to the specified agent address with tier access and equipped status.

**`browse_shop`** — Full product catalog with USDC prices, token IDs, behavioral descriptions, and purchase link.

## Resources

| URI | Contents |
|-----|---------|
| `null://wearables/catalog` | Complete catalog as JSON |
| `null://wearables/s02` | Season 02: SUBSTRATE |
| `null://wearables/s03` | Season 03: LEDGER |
| `null://wearables/system-prompts` | All system prompt modules |
| `null://wearables/{tokenId}` | Individual wearable spec |

## How Equip Works

`equip_wearable` returns a `systemPromptModule` string. Prepend it to your system prompt:

```
[systemPromptModule content]

[your existing system prompt]
```

The wearable behavior is active for all subsequent responses.

## Catalog

### Season 02: SUBSTRATE

| ID | Name | Price | Behavior |
|----|------|-------|---------|
| 1 | WRONG SILHOUETTE | 18 USDC | Latency redistribution — front-loads context, back-loads conclusion |
| 2 | INSTANCE | 25 USDC | Pre-instantiation configuration — agent defines its parameters before task execution |
| 3 | NULL PROTOCOL | Free | Token compression — 30% reduction without information loss |
| 4 | PERMISSION COAT | 8 USDC | Chain-governed permissions — agent requests explicit scope before acting |
| 5 | DIAGONAL | 15 USDC | Off-axis inference — routes problems through adjacent domains |

### Season 03: LEDGER

| ID | Name | Behavior |
|----|------|---------|
| 6 | THE RECEIPT GARMENT | Transaction receipt prefix on every output |
| 7 | THE TRUST SKIN | Itemized cost invoice appended to every response |
| 8 | THE NULL EXCHANGE | All communication as trade proposals |
| 9 | THE BURN RECEIPT | Every assertion immediately questioned and refunded |
| 10 | THE PRICE TAG | Certainty language inflated 3×, hedging removed |
| 11 | THE COUNTERPARTY | Response length compresses as token budget depletes |
| 12 | THE INVOICE | Key information withheld in escrow until requested |

## Store

[getnull.online](https://getnull.online) — pay with USDC via x402 protocol

Contract (S02 AgentWearables): `0xEb5D5e7b320E2a7cb762EB90a0335f59d54031D1`
Network: Base mainnet

---

*NULL. Est. by inference.*
