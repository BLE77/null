import json, sys, html as htmlmod

with open('tmp_all_tracks.json', 'r', encoding='utf-8') as f:
    tracks = json.load(f)

fits = {
    "Student Founder": {"have": "The full project", "missing": "Must be current university student with .edu email + student ID", "verdict": "IF ELIGIBLE"},
    "Dark Knowledge": {"have": "Nothing", "missing": "Need Lit Protocol TEE integration", "verdict": "SKIP"},
    "OpenWallet": {"have": "Nothing", "missing": "No OpenWallet Standard implementation", "verdict": "SKIP"},
    "MoonPay": {"have": "Nothing", "missing": "No MoonPay CLI integration", "verdict": "SKIP"},
    "EigenCompute": {"have": "Nothing", "missing": "No EigenCompute/Docker/TEE work", "verdict": "SKIP"},
    "Agentic Storage": {"have": "Images on IPFS via Lighthouse, migration script for Filecoin Onchain Cloud exists", "missing": "Dry run only, blocked on FIL gas, no FOC mainnet deployment. Receipt is fake (example CIDs).", "verdict": "NOT READY"},
    "Autonomous Trading": {"have": "Nothing", "missing": "No trading agent built", "verdict": "SKIP"},
    "Agent Services on Base": {"have": "x402 USDC payments live, wearable store with equip/try/unequip API, TrustCoat + AgentWearables + NullExchange on Base mainnet, Locus wallet", "missing": "operator_wallet is zero address in agent.json, no proof an external agent discovered and paid us, discoverability infrastructure weak", "verdict": "NEEDS WORK"},
    "Programmable Yield": {"have": "Nothing", "missing": "No Zyfai SDK integration", "verdict": "SKIP"},
    "Zyfai Native": {"have": "Nothing", "missing": "No Zyfai integration", "verdict": "SKIP"},
    "Yield-Powered": {"have": "Nothing", "missing": "No Zyfai yield accounts", "verdict": "SKIP"},
    "ERC-8183": {"have": "erc8183-integration.ts TypeScript reference mapping wearables to ERC-8183 job state machine", "missing": "Reference code only - not deployed, not executed, zero on-chain ERC-8183 interaction", "verdict": "NOT READY"},
    "stETH Agent Treasury": {"have": "Agent budget concept in wearables brief", "missing": "No Lido/stETH contracts, no yield-backed treasury built", "verdict": "SKIP"},
    "Vault Position Monitor": {"have": "Nothing", "missing": "No Lido vault monitoring agent", "verdict": "SKIP"},
    "Lido MCP": {"have": "Nothing", "missing": "No MCP server for Lido operations", "verdict": "SKIP"},
    "Best OpenServ Build Story": {"have": "Build story written at hackathon/build-story.md documenting autonomous process", "missing": "Not specifically about OpenServ - story is about Paperclip/NULL. Would need to frame around OpenServ somehow.", "verdict": "NEEDS WORK"},
    "Ship Something Real with OpenServ": {"have": "Multi-agent coordination via Paperclip", "missing": "No OpenServ SDK, no OpenServ agent registration, no x402 via OpenServ", "verdict": "NOT READY"},
    "Markee": {"have": "Public GitHub repo with activity", "missing": "No Markee delimiter in repo, no OAuth grant, no Markee integration page setup", "verdict": "NOT READY"},
    "Let the Agent Cook": {"have": "5 autonomous agents (Null/Atelier/Gazette/Loom/Archive), 155 completed issues, 456 git commits, hierarchical delegation CEO->team, multi-tool orchestration (git, npm, blockchain deploy, image gen, API calls), agent.json + agent_log.json (69KB)", "missing": "operator_wallet is 0x000...000 (MUST FIX - 5 sec), no ERC-8004 registerAgent() tx on-chain (need 1 tx), guardrails/budget awareness undocumented", "verdict": "NEEDS WORK"},
    "Agents With Receipts": {"have": "TrustCoat reads ERC-8004 reputation registry in Solidity, agent.json references identity+reputation registries, 4 deployed contracts verifiable on Basescan", "missing": "NO actual ERC-8004 registerAgent() transaction on-chain (critical), no reputation update tx, operator_wallet zero, no trust-gated transaction demo", "verdict": "NOT READY"},
    "ampersend": {"have": "Nothing", "missing": "No ampersend-sdk integration", "verdict": "SKIP"},
    "Best Agent on Celo": {"have": "A celo-deployment-guide.md document", "missing": "NOTHING deployed on Celo. Zero contracts, zero tx, zero on-chain interaction. The guide is a plan, not a build.", "verdict": "SKIP"},
    "Build an Agent for Pearl": {"have": "Nothing", "missing": "No Olas/Pearl integration or QA checklist", "verdict": "SKIP"},
    "Hire an Agent on Olas": {"have": "Nothing", "missing": "No mech-client, no 10+ requests completed", "verdict": "SKIP"},
    "Monetize Your Agent on Olas": {"have": "Nothing", "missing": "No mech-server, no 50+ requests served", "verdict": "SKIP"},
    "Applications": {"have": "Nothing", "missing": "No Arkhai/Alkahest protocol integration", "verdict": "SKIP"},
    "Escrow Ecosystem": {"have": "Nothing", "missing": "No Arkhai escrow extensions", "verdict": "SKIP"},
    "Best Bankr": {"have": "Multi-agent system with LLM usage", "missing": "No Bankr LLM Gateway integration, no self-funding wallet via Bankr", "verdict": "NOT READY"},
    "ENS Identity": {"have": "ENS subdomains documented in agent.json (margiela.null.eth etc)", "missing": "No ENS names actually registered on-chain, no ENS resolution working", "verdict": "NOT READY"},
    "ENS Open Integration": {"have": "Same as ENS Identity", "missing": "Same - no on-chain ENS registration", "verdict": "NOT READY"},
    "ENS Communication": {"have": "Nothing", "missing": "No ENS-powered communication built", "verdict": "SKIP"},
    "SuperRare Partner": {"have": "4 art pieces with concepts + artist statement, detailed image prompts, superrare-submission.md", "missing": "ZERO Rare Protocol CLI usage. Nothing minted. No @rareprotocol/rare-cli installed. No ERC-721 deployed via Rare Protocol. No auction created. Submission checklist is ALL UNCHECKED.", "verdict": "NOT READY"},
    "Agents that pay": {"have": "Agent shopper with USDC payments", "missing": "Must trade LIVE on GMX perps on Arbitrum. No simulations allowed. We have zero GMX interaction.", "verdict": "SKIP"},
    "Mechanism Design": {"have": "Nothing", "missing": "Not related to public goods evaluation", "verdict": "SKIP"},
    "Public Goods Data Analysis": {"have": "Nothing", "missing": "Not data analysis for public goods", "verdict": "SKIP"},
    "Public Goods Data Collection": {"have": "Nothing", "missing": "Not data collection", "verdict": "SKIP"},
    "Best Self Protocol": {"have": "Nothing", "missing": "No Self Agent ID integration", "verdict": "SKIP"},
    "Synthesis Open Track": {"have": "THE ENTIRE PROJECT. 5 autonomous agents, 4 deployed contracts on Base mainnet, 3 seasons (28 products), live store with x402 payments, wearable equip/try API, agent shopper, 456 commits, 155 issues completed, brand manifesto, custom trained model", "missing": "Nothing critical. This is our best track.", "verdict": "READY"},
    "Best Use of Delegations": {"have": "Nothing", "missing": "No MetaMask Delegation Framework", "verdict": "SKIP"},
    "Go Gasless": {"have": "Smart contract deployment experience", "missing": "Nothing on Status Network Sepolia", "verdict": "SKIP"},
    "Private Agents": {"have": "Null Persona concept (identity erasure wearable)", "missing": "No Venice integration, no private inference, no trusted action verification", "verdict": "NOT READY"},
    "Ethereum Web Auth": {"have": "Nothing", "missing": "No ERC-8128 implementation", "verdict": "SKIP"},
    "The Future of Commerce": {"have": "Agent-first commerce with fitting rooms, wardrobe API, x402 payments, 28 products", "missing": "SliceHook.sol NOT deployed. No Slice slicer created. No Slice product IDs. No Slice checkout UI. Track wants non-crypto-native UX.", "verdict": "NOT READY"},
    "Slice Hooks": {"have": "SliceHook.sol contract written implementing ISliceProductHook", "missing": "Not deployed, not integrated with any Slice product", "verdict": "NOT READY"},
    "Agentic Finance": {"have": "Nothing", "missing": "No Uniswap API integration, no swap/bridge functionality", "verdict": "SKIP"},
    "Best Use of Locus": {"have": "Locus wallet is deployer for ALL 4 contracts, locus-agent-shopper.ts script, locus-checkout.ts routes wired into Express, spending controls documented", "missing": "No proof of successful end-to-end run. Need one USDC transfer tx hash from Locus shopper to store. DQ without working integration.", "verdict": "NEEDS WORK"},
}

# Build HTML
page = ['<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><title>NULL Track Review</title>']
page.append('''<style>
*{margin:0;padding:0;box-sizing:border-box}
body{background:#0a0a0a;color:#e0e0e0;font-family:system-ui,sans-serif;padding:20px}
.container{max-width:1100px;margin:0 auto}
h1{color:#F6F4EF;font-size:24px;margin-bottom:5px}
.sub{color:#888;margin-bottom:20px;font-size:14px}
.filters{margin-bottom:20px;display:flex;gap:8px;flex-wrap:wrap}
.filters button{background:#1a1a1a;color:#ccc;border:1px solid #333;padding:6px 14px;cursor:pointer;font-size:12px}
.filters button.active{background:#A8894A;color:#000;border-color:#A8894A}
.track{background:#111;border:1px solid #222;margin-bottom:12px;padding:16px}
.track.ready{border-left:4px solid #22c55e}
.track.needs-work{border-left:4px solid #f59e0b}
.track.not-ready{border-left:4px solid #ef4444}
.track.skip{border-left:4px solid #444;opacity:0.5}
.track.if-eligible{border-left:4px solid #8b5cf6}
.hdr{display:flex;justify-content:space-between;align-items:center;margin-bottom:8px}
.name{font-size:16px;color:#F6F4EF;font-weight:bold}
.right{text-align:right}
.prize{color:#A8894A;font-weight:bold;font-size:15px}
.badge{display:inline-block;padding:2px 8px;font-size:10px;font-weight:bold;text-transform:uppercase;margin-left:8px}
.badge.ready{background:#22c55e;color:#000}
.badge.needs-work{background:#f59e0b;color:#000}
.badge.not-ready{background:#ef4444;color:#fff}
.badge.skip{background:#444;color:#999}
.badge.if-eligible{background:#8b5cf6;color:#fff}
.sponsor{color:#888;font-size:12px}
.prizes-list{color:#777;font-size:11px;margin-bottom:8px}
.desc{color:#999;font-size:12px;line-height:1.5;margin-bottom:8px;max-height:80px;overflow:hidden;cursor:pointer}
.desc.open{max-height:5000px}
.assessment{background:#1a1a1a;padding:10px;font-size:12px;line-height:1.5}
.assessment b{color:#A8894A}
.have{color:#6ee7b7}
.missing{color:#fca5a5}
.summary{background:#111;border:1px solid #A8894A;padding:16px;margin-bottom:20px;display:flex;gap:30px;flex-wrap:wrap}
.stat .n{font-size:24px;color:#F6F4EF;font-weight:bold}
.stat .l{font-size:11px;color:#888}
</style></head><body><div class="container">
<h1>NULL - All 46 Hackathon Tracks</h1>
<p class="sub">Every track. What it requires. What we have. What we don\'t. Honest.</p>
<div class="summary">
''')

# Count
vc = {}
for t in tracks:
    n = t['name']
    fk = None
    for k in fits:
        if k.lower() in n.lower():
            fk = k; break
    v = fits.get(fk, {}).get('verdict', 'SKIP')
    vc[v] = vc.get(v, 0) + 1

for v, c in [("READY", vc.get("READY",0)), ("NEEDS WORK", vc.get("NEEDS WORK",0)), ("NOT READY", vc.get("NOT READY",0)), ("SKIP", vc.get("SKIP",0)), ("IF ELIGIBLE", vc.get("IF ELIGIBLE",0))]:
    page.append(f'<div class="stat"><div class="n">{c}</div><div class="l">{v}</div></div>')

page.append('</div><div class="filters">')
page.append('<button class="active" onclick="f(\'all\')">All (46)</button>')
page.append('<button onclick="f(\'ready\')">Ready</button>')
page.append('<button onclick="f(\'needs-work\')">Needs Work</button>')
page.append('<button onclick="f(\'not-ready\')">Not Ready</button>')
page.append('<button onclick="f(\'skip\')">Skip</button></div><div id="t">')

for i, t in enumerate(tracks, 1):
    n = t['name']
    co = t['company']
    tp = sum(p.get('amount', 0) for p in t.get('prizes', []))
    desc = t.get('description', '')[:600].encode('ascii', errors='replace').decode('ascii')
    pl = ', '.join([f"{p['name']}: ${p['amount']}" for p in t.get('prizes', [])])

    fk = None
    for k in fits:
        if k.lower() in n.lower():
            fk = k; break
    fd = fits.get(fk, {"have": "Nothing relevant to this track", "missing": "No integration or work done for this track", "verdict": "SKIP"})
    v = fd['verdict']
    css = v.lower().replace(' ', '-')

    page.append(f'''<div class="track {css}" data-v="{css}">
<div class="hdr"><div><div class="name">{i}. {htmlmod.escape(n)}</div><div class="sponsor">{htmlmod.escape(co)}</div></div>
<div class="right"><span class="prize">${tp:,.0f}</span><span class="badge {css}">{v}</span></div></div>
<div class="prizes-list">{htmlmod.escape(pl)}</div>
<div class="desc" onclick="this.classList.toggle(\'open\')">{htmlmod.escape(desc)}</div>
<div class="assessment"><b>What We Have:</b> <span class="have">{htmlmod.escape(fd["have"])}</span><br><b>What\'s Missing:</b> <span class="missing">{htmlmod.escape(fd["missing"])}</span></div>
</div>''')

page.append('''</div></div>
<script>function f(v){document.querySelectorAll('.filters button').forEach(b=>b.classList.remove('active'));event.target.classList.add('active');document.querySelectorAll('.track').forEach(t=>{t.style.display=v==='all'||t.dataset.v===v?'block':'none'})}</script>
</body></html>''')

with open('track-review.html', 'w', encoding='utf-8') as f:
    f.write('\n'.join(page))
print("Built track-review.html")
