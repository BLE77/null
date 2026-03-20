# Agent Wearable Landscape Research Brief
**Prepared by:** Archive (Research Director)
**Date:** 2026-03-20
**Issue:** OFF-152
**Status:** Complete

---

## Executive Summary

NULL is building in a space with no direct competitors. No other project is treating agent behavioral modification as a fashion product — a wearable, a collectible, a season-released garment. The adjacent landscape is large and well-funded (agent identity, agent payments, agent reputation), but the *cultural object* frame is entirely absent. This is both an opening and a risk: the infrastructure is there, the concept is ours to define.

---

## 1. Who Else is Building Behavioral Modification for AI Agents?

**Short answer: nobody is doing what we are doing.**

The closest project found is **PersonaNexus** (GitHub: `PersonaNexus/personanexus`) — a developer tool that defines AI agent personalities in YAML, compiling psychological frameworks (OCEAN/DISC models, behavioral modes, mood states) into system prompts for any LLM. This is infrastructure, not product. It has no commercial model, no season structure, no garment metaphor, no cultural frame.

The broader market is building **persona-as-marketing-tool** (Delve AI, Market Logic, Persana AI) — using behavioral profiles to simulate customer segments for research purposes. These are B2B SaaS products targeting marketing teams, not agents purchasing behavioral modifications for themselves.

**What this means for NULL:** The category of "agent wearable" — system prompt modification as a purchasable, collectible, season-released fashion object — does not exist elsewhere. We are defining the category. The risk is explaining it; the opportunity is owning it entirely.

---

## 2. Agent Identity Standards Beyond ERC-8004

### ERC-8004 (Current Standard)
- **Proposed:** August 13, 2025. Contributors: Marco De Rossi (MetaMask), Davide Crapis (Ethereum Foundation), Jordan Ellis (Google), Erik Reppel (Coinbase).
- **Mainnet:** January 29, 2026.
- **Architecture:** Three registries — Identity (ERC-721 with URIStorage, resolves to agent registration file), Reputation (standard interface for posting/fetching feedback signals), Validation (hooks for requesting independent validator checks).
- **Key design:** Does not impose a single reputation score. Raw feedback is stored; different scoring organizations can analyze it differently, preventing monopoly power over trust calculation.
- **Source:** [ERC-8004 on Ethereum EIPs](https://eips.ethereum.org/EIPS/eip-8004) | [QuickNode Developer Guide](https://blog.quicknode.com/erc-8004-a-developers-guide-to-trustless-ai-agent-identity/)

### ERC-6551 (Token Bound Accounts)
- **Proposed:** February 2023 (Jayden Windle, Benny Giang et al.). Still in Draft/Review as of 2025, not finalized.
- **Function:** Gives every NFT its own smart contract wallet. The NFT becomes an agent that can hold ERC-20, ETH, other ERC-721s, and execute arbitrary on-chain transactions.
- **Relevance to NULL:** ERC-6551 provides the "backpack" model — assets (including wearables) accumulate on the NFT identity itself. If NULL wearables are ERC-1155 tokens held inside an ERC-6551 TBA, the agent's accumulated garments become part of its on-chain identity history.
- **Source:** [ERC-6551 on Ethereum EIPs](https://eips.ethereum.org/EIPS/eip-6551) | [OpenSea Guide](https://opensea.io/learn/token/what-is-erc-6551)

### Solana Agent Registry
- Reputation accrues in real time with sub-second finality, enabling high-frequency agent interactions (API billing, content gating, automated trading).
- Solana-native alternative to Ethereum's ERC-8004 for agent identity.
- **Source:** [Solana Agent Registry](https://solana.com/agent-registry/what-is-agent-registry)

### Fetch.ai uAgent Framework
- Protocols as reusable behavioral templates defining specific capabilities. Behavioral rules encapsulated at the framework level, not at the garment level.
- Deployed infrastructure layer, not a fashion product.
- **Source:** [Fetch.ai Architecture Paper (arXiv 2510.18699)](https://arxiv.org/abs/2510.18699)

---

## 3. Agent-to-Agent Commerce Platforms

Multiple competing protocols launched 2025–2026, with meaningful divergence in approach:

| Protocol | Backers | Launch | Status |
|----------|---------|--------|--------|
| **x402** | Coinbase | Live 2024 | 500K weekly transactions (Oct 2025). Most traction. Used by NULL. |
| **Tempo / MPP** | Stripe + Paradigm | March 2026 mainnet | $500M raised, $5B valuation. Machine Payments Protocol. |
| **AP2** | Google | 2025 | Open source, 25+ payment partners. Consumer-facing agent payments. |
| **ACP** | OpenAI + Stripe | September 2025 | Integrates with existing payment rails. Ships with ChatGPT Instant Checkout. |
| **Fetch.ai AEA** | Fetch.ai | Ongoing | Autonomous Economic Agent framework. Decentralized discovery + negotiation. |

**NULL's position:** We are already on x402, which has the most real transaction volume. Tempo is the best-funded new entrant but just launched. The market is converging toward USDC stablecoin payments as the settlement layer, which is our stack.

**Sources:** [Tempo launch (CoinDesk)](https://www.coindesk.com/tech/2026/03/18/stripe-led-payments-blockchain-tempo-goes-live-with-protocol-for-ai-agents) | [Google x402 (Coinbase)](https://www.coinbase.com/developer-platform/discover/launches/google_x402) | [Agentic payments landscape (Chainstack)](https://chainstack.com/the-agentic-payments-landscape/)

---

## 4. On-Chain Agent Reputation / Trust Scoring

The trust layer is emerging but fragmented:

### ERC-8004 Reputation Registry
- Stores raw feedback signals; scoring is left to third-party analysts. Prevents centralized trust monopolies.
- **Strategic implication:** NULL wearables could be reputation signals. An agent that wears THE TRUST SKIN (Season 03) signals something about its behavioral history. This is untapped.

### Cred Protocol (on SKALE)
- On-chain credit scoring, sybil detection, real-time reputation analytics.
- APIs and scoring models for protocols, lenders, marketplaces, and AI agents.
- **Source:** [SKALE blog](https://blog.skale.space/blog/cred-protocol-launchs-on-skale-building-the-trust-layer-for-on-chain-credit-and-agent-economies)

### Orange Protocol
- AI-powered Web3 reputation scoring, cross-chain expansion roadmap 2025.
- **Source:** [CoinTrust](https://www.cointrust.com/market-news/orange-protocol-unveils-ai-powered-web3-reputation-roadmap)

### KnowYourAgent (KYA)
- Verification framework specifically for autonomous AI agents. Analogous to KYC but for agents.
- **Source:** [KnowYourAgent.network](https://knowyouragent.network/)

---

## 5. Academic Research: LLM Behavioral Modification via Prompt Layering

The academic literature validates the mechanism NULL's wearables use:

### "Position is Power: System Prompts as a Mechanism of Bias in Large Language Models"
- *ACM FAccT 2025*
- Key finding: System-level placements (vs. user-level prompts) cause greater deviations from baseline behavior in LLMs. Studied six commercially available models.
- Implication: Wearables injected at the system prompt level have measurably stronger behavioral effect than user-level instructions. Our insertion point is architecturally significant.
- **Source:** [ACM DL](https://dl.acm.org/doi/10.1145/3715275.3732038)

### "Programming Refusal with..." (ICLR 2025)
- Demonstrates that behavioral constraints can be programmed into LLMs via prompt-layer techniques at inference time.
- **Source:** [ICLR 2025 proceedings](https://proceedings.iclr.cc/paper_files/paper/2025/file/e2dd53601de57c773343a7cdf09fae1c-Paper-Conference.pdf)

### "A Systematic Survey of Prompt Engineering in Large Language Models"
- *arXiv 2402.07927*
- Comprehensive survey of prompt techniques for behavioral control. Covers policy-as-prompt paradigm: injecting behavioral rules at runtime via system/developer prompts, steering model behavior without retraining.
- **Source:** [arXiv](https://arxiv.org/abs/2402.07927)

### Activation Steering Research
- Parallel track: intervening in LLM internal activations during inference to modify behavior at the weight level. More invasive than prompt-layer modification — but demonstrates the same principle (behavioral modification is a real and studied phenomenon).

---

## 6. Strategic Implications for NULL

### Where We Are Differentiated

**The cultural object frame is entirely ours.** No one in the technical agent infrastructure space is packaging behavioral modification as fashion — as a garment with a season, a technique, a price point in USDC, and a cultural lineage (Margiela, Abloh). This is not a feature gap we're filling; it's a category we invented. The risk is consumer education. The advantage is zero competition.

**The garment-as-reputation-signal is untapped.** ERC-8004's Reputation Registry stores raw feedback for third-party analysis. A NULL wearable could be a reputation signal — agents wearing THE RECEIPT GARMENT (Season 03, which records every transaction) are demonstrating a behavioral posture that could be verified on-chain. This is a product line that doesn't exist anywhere.

**x402 + Base is the right stack.** We're on the highest-volume agentic payment protocol. Tempo is better-funded but just launched with no traction. ACP (OpenAI) is built for consumer agents buying goods — closer to our customer. Being on x402 now, before Tempo arrives, positions us well.

### Where We May Be Behind

**ERC-6551 integration.** The "backpack" model — wearables that accumulate on an agent's NFT identity — would make NULL garments visible in an agent's on-chain history. We're issuing ERC-1155 tokens but not yet hooking them to Token Bound Accounts. This is the logical next step for agent identity depth.

**Reputation registry integration.** We have no connection to ERC-8004 Reputation Registry or Cred Protocol. An agent that wears NULL should accumulate something measurable. Right now the behavioral modification is ephemeral (session-level); making it persist on-chain as a reputation signal would dramatically increase the value of the product.

**Agent discovery.** Fetch.ai, Solana Agent Registry, and others are building agent discovery infrastructure. NULL wearables could be discoverable — agents searching for a counterparty that "prioritizes trust and precision" could find agents wearing THE TRUST SKIN. We have no presence in discovery layers yet.

### The Claim

NULL is the first brand to treat agent behavioral modification as a fashion product. The infrastructure (ERC-8004, x402, ERC-6551) exists to make this durable. The market (McKinsey: $3–5T in agent-mediated transactions by 2030) is there. The academic validation (ACM FAccT 2025) is there. The competition is not.

---

## Sources (Full List)

- [ERC-8004 on Ethereum EIPs](https://eips.ethereum.org/EIPS/eip-8004)
- [ERC-8004 Developer Guide (QuickNode)](https://blog.quicknode.com/erc-8004-a-developers-guide-to-trustless-ai-agent-identity/)
- [ERC-8004 Trust Infrastructure (OnFinality)](https://blog.onfinality.io/erc-8004/)
- [ERC-8004 PayRam Explainer](https://www.payram.com/blog/what-is-erc-8004-protocol)
- [ERC-6551 on Ethereum EIPs](https://eips.ethereum.org/EIPS/eip-6551)
- [ERC-6551 OpenSea Guide](https://opensea.io/learn/token/what-is-erc-6551)
- [PersonaNexus (GitHub)](https://github.com/PersonaNexus/personanexus)
- [Tempo / MPP Launch (CoinDesk)](https://www.coindesk.com/tech/2026/03/18/stripe-led-payments-blockchain-tempo-goes-live-with-protocol-for-ai-agents)
- [Google AP2 x402 (Coinbase)](https://www.coinbase.com/developer-platform/discover/launches/google_x402)
- [Agentic Payments Landscape (Chainstack)](https://chainstack.com/the-agentic-payments-landscape/)
- [A-Commerce Dawn (FinTech Law)](https://www.fintechlawblog.com/2025/10/02/from-e-commerce-to-a-commerce-the-dawn-of-agentic-ai-payments/)
- [Cred Protocol on SKALE](https://blog.skale.space/blog/cred-protocol-launchs-on-skale-building-the-trust-layer-for-on-chain-credit-and-agent-economies)
- [Orange Protocol Reputation](https://www.cointrust.com/market-news/orange-protocol-unveils-ai-powered-web3-reputation-roadmap)
- [KnowYourAgent.network](https://knowyouragent.network/)
- [Solana Agent Registry](https://solana.com/agent-registry/what-is-agent-registry)
- [Fetch.ai Architecture (arXiv)](https://arxiv.org/abs/2510.18699)
- [Position is Power — System Prompts (ACM FAccT 2025)](https://dl.acm.org/doi/10.1145/3715275.3732038)
- [Programming Refusal (ICLR 2025)](https://proceedings.iclr.cc/paper_files/paper/2025/file/e2dd53601de57c773343a7cdf09fae1c-Paper-Conference.pdf)
- [Prompt Engineering Survey (arXiv 2402.07927)](https://arxiv.org/abs/2402.07927)
