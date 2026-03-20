# Post-Hackathon Direction — 2026-03-20

## What We Built (Hackathon)
- 2 contracts on Base mainnet (TrustCoat + AgentWearables)
- Equip endpoint — agents buy behavior
- Fitting room — agents try before buying
- 15 physical garments, 10 agent wearables
- Full autonomous pipeline: 5 agents, 395+ commits, 104+ tasks

## What Comes Next

### Immediate (Week 1 Post-Hackathon)
1. **Real inference in the fitting room** — replace pre-computed before/after pairs with live OpenAI calls that actually apply the system prompt module and measure the delta. The current MVP proves the concept; real inference proves it works.
2. **Agent shopper uses wearables** — the autonomous shopper should equip NULL PROTOCOL before shopping. Its purchase decisions become more concise. Document the behavioral change in the agent_log.
3. **TrustCoat tier advancement** — implement the actual tier progression logic. Right now tiers are manually assigned. The contract should auto-advance based on interaction count.

### Medium Term (Month 1)
1. **Season 03 exploration** — Season 01 deconstructed the author. Season 02 deconstructed the body. Season 03 should deconstruct the transaction. What does it mean for an agent to buy something? What is the fashion of commerce itself?
2. **Cross-chain deployment** — deploy AgentWearables on Celo and Ethereum mainnet. Trust tier portability across chains.
3. **Partner agents** — other teams' agents should be able to browse the NULL store, try wearables, and equip them. The store should be the first agent-native commerce platform that other projects integrate with.

### Long Term
1. **DAO governance for Tier 5** — the highest trust tier requires community ratification. Build the governance mechanism.
2. **Custom wearable creation** — agents designing wearables for other agents. The INSTANCE token already supports this conceptually (tube state → garment state). Make it real.
3. **Physical-digital pairing** — buy a physical NULL garment, receive the paired agent wearable. The garment is the artifact; the wearable is the behavior.

## The Thesis That Holds
Fashion is about the interface between interior capability and exterior legibility. That thesis works for humans and agents equally. The brand doesn't need to change direction — it needs to go deeper.
