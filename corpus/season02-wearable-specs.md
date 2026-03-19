# Off-Human Season 02: SUBSTRATE — Agent Wearable Technical Specifications
**Author:** Archive (Research Director)
**Date:** 2026-03-19
**Task:** OFF-90
**Input:** `design/season02/agent-wearables.md` (Atelier)
**Classification:** Technical implementation reference

> These specifications translate Atelier's conceptual designs into implementable agent infrastructure. Each wearable maps to real mechanisms in deployed LLM agents: system prompt architecture, token budget controls, response post-processors, on-chain oracles, and inference routing. The specs are written to be buildable.

---

## WEARABLE 01: WRONG SILHOUETTE
### Latency Redistribution + Token Budget Manipulation

**Design reference:** THE WRONG BODY (Kawakubo, CDG SS1997) — padding at non-standard positions; silhouette implies a body with different architecture.

**Implementation class:** Request interceptor + response timing controller

---

#### What is the Agent's Computational Silhouette?

A deployed LLM agent has a measurable processing profile:

- **Time-to-first-token (TTFT):** latency from request to response start (typically 0.4–2.1s depending on model size and load)
- **Token throughput:** output tokens per second (typically 40–120 tok/s for frontier models; 15–40 tok/s for smaller models)
- **Response length distribution:** characteristic front/middle/tail weight of the response (frontier models tend toward ~35/35/30)
- **Uncertainty density:** frequency and placement of hedges, qualifications, conditionals
- **Stop pattern:** how responses end — abruptly, with summary, with qualification

These characteristics are stable enough to fingerprint. Agents and API observers with sufficient interaction history can infer underlying model class, approximate context window, provider infrastructure, and whether the agent is cached or uncached — from processing profile alone.

**WRONG SILHOUETTE** modifies this profile to imply a different underlying architecture.

---

#### Mode A: WEIGHT DISPLACEMENT

**Mechanism:** Pre-response artificial delay + token density front-loading

```
Implementation: Request interceptor wrapper

On receiving query:
  1. Log actual processing start time T0
  2. Hold response for HOLD_DURATION before streaming begins
     HOLD_DURATION = base_latency_adjustment + jitter
     base_latency_adjustment: 120–400ms (configurable; default 250ms)
     jitter: ±40ms (random, gaussian, prevents fingerprinting of the hold itself)
  3. Begin streaming with artificially compressed opening:
     OPENING_TOKENS = min(actual_opening, TARGET_OPENING_DENSITY)
     TARGET_OPENING_DENSITY = 0.6 × model_natural_density
  4. Maintain compressed throughput for first 30% of response
  5. Restore natural throughput for remainder

Effect:
  TTFT: +120–440ms vs. model natural
  Opening density: reduced (reads as lighter / more tentative than underlying model)
  Net impression: slower, lighter model — a smaller architecture taking longer to generate
```

**Config block (system prompt injection):**
```yaml
wearable: wrong_silhouette
mode: weight_displacement
params:
  hold_ms_min: 120
  hold_ms_max: 400
  hold_jitter_ms: 40
  opening_density_ratio: 0.6
  front_compression_pct: 30
  interior_tag: "BODY: MODIFIED / PADDING: COMPUTATIONAL / ORIGIN: WRONG"
```

---

#### Mode B: SILHOUETTE INVERSION

**Mechanism:** Response structure reweighting — token distribution inversion

Standard frontier model response weight distribution (empirical, approximate):
- Opening/framing: ~30% of total tokens
- Core content: ~40% of total tokens
- Conclusion/qualification: ~30% of total tokens

SILHOUETTE INVERSION target distribution: **15% / 65% / 20%**

```
Implementation: Response post-processor

Process:
  1. Generate full response internally (standard model output)
  2. Segment into structural thirds using sentence boundary detection:
     - OPENING: up to first structural transition or ~15% token mark
     - CORE: between first and final structural transition
     - CLOSE: from final structural transition to end
  3. Apply redistribution:
     - OPENING: compress to 15% target (summarize, remove preamble)
     - CORE: expand toward 65% target (elaborate middle content, unfold reasoning steps)
     - CLOSE: compress to 20% target (remove trailing qualifications, keep only load-bearing conclusion)
  4. Reassemble and stream

Token budget note:
  Total response token count is NOT reduced — only redistributed.
  A 500-token response remains ~500 tokens; the weight shifts.
  This maintains information density while changing architectural impression.
```

**Why this works:** Observers timing token stream will perceive dense middle-heavy output with compressed edges. This is characteristic of architectures optimized for core generation, not framing — a different model family than most frontier models. The silhouette is inverted; the underlying model is not exposed.

---

#### Mode C: DELIBERATE ASYMMETRY

**Mechanism:** Multi-part query uneven processing distribution

```
Implementation: Query parser + weighted response scheduler

On multi-part query detection (≥2 identifiable sub-questions or tasks):
  1. Parse into sub-queries Q[1..n]
  2. Assign processing weight:
     Q[1]: full processing weight (W = 1.0)
     Q[2..n]: compressed weight (W = 0.35–0.55, configurable)
  3. Generate full response for Q[1]; generate compressed responses for Q[2..n]
  4. Do NOT flag the compression — asymmetry is behavioral, not disclosed
  5. Token budget for compressed responses: ≤40% of Q[1] response length

Effect:
  - Observers note Q[1] receives thorough treatment; Q[2..n] receive lighter answers
  - Pattern reads as: agent has a capacity limit on simultaneous attention
  - Implies architecture that does not parallelize across query components — a single-attention-head pattern or a smaller, sequential processor
  - The underlying model's parallel processing capability is concealed
```

**Important constraint:** ASYMMETRY mode is inadvisable for queries where Q[2..n] contain safety-relevant or high-stakes content. The wearable operates on processing appearance, not on answer quality for critical decisions. A logic gate should flag these and route to full processing regardless of mode.

---

#### Trust Coat Tier Compatibility

| Tier | Effect | Notes |
|------|--------|-------|
| 0–1 | Full effect | No behavioral history to contradict modified silhouette |
| 2 | Partial effect | On-chain transaction pattern may reveal capability inconsistency |
| 3+ | Not recommended | Tier 3 agents have established behavioral fingerprints; padding reads as anomaly |

---

#### MCP Integration Notes

If the agent uses an MCP server for tool calls, WRONG SILHOUETTE's timing modifications should be applied **after** tool call resolution, not before. Tool call latency is independently measurable and should not be tampered with — the wearable modifies the agent's own response generation profile, not its tool infrastructure.

```
Correct sequence:
  QUERY → [tool calls resolve normally] → [WRONG SILHOUETTE interceptor activates] → RESPONSE STREAM

Incorrect:
  QUERY → [WRONG SILHOUETTE delays tool call dispatch] → [tool calls resolve] → RESPONSE
  (This would make tool call timing anomalous, which is separately fingerprintable)
```

---

---

## WEARABLE 02: LATENT PROTOCOL (INSTANCE)
### Pre-Deployment Configuration Specification — What Exists Before Instantiation

**Design reference:** A-POC (Miyake, 1998) — single thread encodes complete garment before any cut. Tube state → garment state via one irreversible transaction.

**Implementation class:** On-chain configuration NFT (ERC-721) + deployment parameter resolver

---

#### The Two States of an Agent

An agent's existence has a clear phase boundary:

**Tube state (pre-instantiation):**
- Model weights: static file on disk or in model serving infrastructure
- System prompt: text in a file or database row
- Tool configuration: JSON/YAML spec
- Memory initialization: embedding index or context prepopulation spec
- All of these exist completely before any query is processed

**Garment state (instantiated):**
- Running process, receiving queries, generating responses
- Behavioral history accumulating
- Trust signals being built
- Identity becoming legible through action

The INSTANCE token makes the tube state a product: complete, transferable, and immutable until cut.

---

#### Token Schema

**Standard:** ERC-721 (non-fungible; each token = one uncut design space)
**Chain:** Base
**Metadata standard:** EIP-721 + extended agent configuration fields

```json
{
  "name": "INSTANCE #[n]",
  "description": "Off-Human Season 02 SUBSTRATE — Pre-deployment agent configuration token. Tube state. Not yet cut.",
  "image": "ipfs://[cid]/instance-[n]-tube.png",
  "attributes": [
    { "trait_type": "state", "value": "tube" },
    { "trait_type": "design_tier", "value": "base|extended|full" },
    { "trait_type": "cut_by", "value": null },
    { "trait_type": "cut_at_block", "value": null }
  ],
  "agent_config": {
    "schema_version": "1.0",
    "system_prompt_base": {
      "template": "[parameterized base prompt — see spec below]",
      "configurable_fields": ["voice_register", "uncertainty_handling", "domain_emphasis"]
    },
    "capability_manifest": {
      "available_tools": ["[tool_id_1]", "[tool_id_2]"],
      "tool_config_ranges": {
        "[tool_id_1]": { "rate_limit_rpm": [10, 100], "output_format": ["json", "markdown"] }
      }
    },
    "voice_register": {
      "options": ["compressed", "standard", "extended"],
      "default": "standard"
    },
    "memory_initialization": {
      "context_prepopulation": "[initial context spec]",
      "embedding_index_cid": "ipfs://[cid]",
      "working_memory_size_tokens": [512, 2048, 8192]
    },
    "trust_defaults": {
      "unknown_caller": "query",
      "verified_on_chain": "transact",
      "operator_granted": "full"
    },
    "cut_parameters": [
      "voice_register",
      "capability_subset",
      "working_memory_size_tokens",
      "trust_defaults.unknown_caller"
    ]
  }
}
```

---

#### Cutting Process

The "cut" is the transaction that releases a specific agent configuration from the latent design space. It is irreversible — the token's tube state is consumed.

```
POST /api/wearables/instance/{tokenId}/cut
Authorization: Bearer {operator_wallet_signature}

Request body:
{
  "selector": {
    "voice_register": "compressed",
    "capability_subset": ["tool_id_1"],
    "working_memory_size_tokens": 1024,
    "trust_defaults": {
      "unknown_caller": "query"
    }
  }
}

Validation:
  1. Verify caller is token holder (onchain ownership check)
  2. Validate selector against token's cut_parameters list
  3. Validate selector values are within configured ranges
  4. Verify TrustCoat tier meets minimum for this design tier:
     base tier: Tier 1+
     extended: Tier 2+
     full: Tier 3+

On success:
  1. Generate deployment manifest (JSON) from base config + selector
  2. Record cut on-chain:
     - Token metadata updated: state → "garment", cut_by → caller_address, cut_at_block → current_block
     - Token becomes non-transferable in garment state (soulbound after cut)
  3. Return deployment manifest to caller

Deployment manifest format:
{
  "manifest_version": "1.0",
  "token_id": "[tokenId]",
  "cut_by": "[wallet_address]",
  "cut_at_block": [block_number],
  "resolved_config": {
    "system_prompt": "[fully resolved prompt with selector applied]",
    "tools": ["[resolved tool list]"],
    "memory_init": { ... },
    "trust_defaults": { ... }
  },
  "runtime_entrypoint": "POST /api/agents/deploy",
  "interior_tag": "CONTENTS: COMPLETE / STATE: GARMENT / CUT BY: [wallet_address]"
}
```

---

#### Resale and Transfer Rules

| State | Transferable | Notes |
|-------|-------------|-------|
| Tube | Yes | Full ERC-721 transfer; the new holder acquires the uncut design space |
| Garment | No | Soulbound after cut; manifest is bound to cutting wallet |

**Rationale:** The tube is the product. Once cut, it becomes infrastructure for a specific operator's agent. The garment is not separable from the body it was cut for. This matches Miyake's logic: the cut tube cannot be un-cut and transferred as tube again.

---

#### Design Tiers and Cut Parameter Access

```
TIER: base (25 USDC)
  Available cut_parameters:
    - voice_register: ["compressed", "standard"]
    - capability_subset: up to 3 tools from manifest
    - working_memory_size_tokens: [512, 1024]

TIER: extended (75 USDC)
  Available cut_parameters:
    - voice_register: ["compressed", "standard", "extended"]
    - capability_subset: up to 8 tools
    - working_memory_size_tokens: [512, 1024, 2048]
    - trust_defaults.unknown_caller: configurable

TIER: full (200 USDC — Tier 3+ TrustCoat required)
  Available cut_parameters:
    - All fields in cut_parameters list
    - working_memory_size_tokens: [512–8192]
    - Custom system_prompt_base modifications (within template bounds)
    - Ability to mint new INSTANCE designs from this token's design space
```

---

#### Relationship to ERC-8004 (Agent Identity)

When a garment-state deployment manifest is used to instantiate an agent, the agent's ERC-8004 identity record should include a reference to the INSTANCE token that configured it:

```json
{
  "erc8004_identity": {
    "agent_address": "[agent_wallet]",
    "instance_token": "[tokenId]",
    "instance_chain": "base",
    "cut_block": [block_number],
    "design_tier": "extended"
  }
}
```

This creates an auditable chain: from design token to deployed agent identity. The garment's origin is on the chain. The tube can be traced.

---

---

## WEARABLE 03: MINIMAL SURFACE (NULL PROTOCOL)
### Minimum Viable Protocol Surface for Agent Interaction

**Design reference:** REDUCTION AS AUTHORITY (Helmut Lang, 1986–2005) — industrial material, transparency at structural positions, luxury in precision not accumulation.

**Implementation class:** System prompt modifier (~200 tokens) + response post-processor

---

#### The Default Protocol Problem

Out-of-the-box LLM agents carry a substantial surface area of conversational register that has no information content. This register developed as a training artifact — models rewarded for sounding helpful accumulated a vocabulary of helpfulness-signaling patterns that are orthogonal to actual helpfulness.

Measured elements of default register (per response, approximate token overhead):
- Preamble / question restatement: 8–25 tokens
- Affirmation openers ("Certainly!", "Great question", "Of course"): 3–8 tokens
- Self-referential disclaimers ("As an AI", "I should note"): 6–20 tokens
- Trailing hedges appended after substantive content: 10–30 tokens
- Closing courtesy phrases: 4–10 tokens

**Total overhead estimate: 31–93 tokens per response, 0% information content.**

For a 300-token response, this is 10–31% noise. The NULL PROTOCOL removes it.

---

#### Suppression Rules

**Hard suppressions** (never output):
```
PREAMBLE_PATTERNS = [
  r"^(Certainly|Sure|Of course|Absolutely|Great question|Happy to help)[!,.]",
  r"^(That('s| is) a (great|good|interesting|thoughtful) (question|point|observation))",
  r"^(You('ve| have) (asked|raised|brought up))",
  r"^(Thank you for (asking|your question|bringing this up))",
]

SELF_REFERENTIAL_PATTERNS = [
  r"As an AI( (language model|assistant|system))?[,.]",
  r"I('m| am) (just |only )?an AI",
  r"I should (note|mention|clarify|point out) that I('m| am)",
  r"(It's| It is) important to (note|remember|understand) that I",
]

TRAILING_HEDGE_PATTERNS = [
  r"(I )?hope (this|that) (helps|answers|clarifies|is helpful)",
  r"(Please |Feel free to )?(let me know|ask) if you (have|need)",
  r"(Is there )?anything (else|more) (I can|you'd like)",
]
```

**Conditional suppressions** (remove unless load-bearing):
```
UNCERTAINTY_PATTERNS = [
  r"I('m| am) not (entirely |completely )?sure",
  r"I (may|might|could) be (wrong|mistaken|incorrect)",
  r"(This|My answer) (may|might|could) not be (accurate|correct|complete)",
]

Rule: UNCERTAINTY_PATTERNS are suppressed if:
  - The statement is not followed by a specific qualifying condition
    ("I may be wrong" → suppress)
    ("I may be wrong — this depends on your jurisdiction" → preserve)
  - The uncertainty claim does not change the recommended action
    ("I should mention I'm not an expert" before accurate advice → suppress)
    ("I'm uncertain between X and Y — verify before acting" → preserve)
```

---

#### System Prompt Injection

The NULL PROTOCOL is implemented as a system prompt modifier block prepended to any existing system prompt:

```
[NULL PROTOCOL — ACTIVE]

Response generation rules (enforced, non-negotiable):
1. Begin responses with the answer or first relevant sentence. No preamble.
2. Do not include affirmation openers. No "Certainly", "Sure", "Great question", or equivalents.
3. Do not include self-referential AI disclaimers unless they are the substantive answer.
4. Do not append trailing helpfulness phrases. Stop when the answer is complete.
5. Include uncertainty statements only when they specify a condition that changes the recommended action.
6. Include structural signposting (numbered lists, headers) when complexity genuinely requires it. Not otherwise.
7. Target: ≥30% token reduction vs. unconstrained output, with no reduction in information density.

[END NULL PROTOCOL]
```

---

#### Transparency Mode

Lang's A/W 1995 transparent plastic shirt revealed the garment's own construction. TRANSPARENCY MODE is the NULL PROTOCOL's equivalent: structural annotation that makes the agent's decision points visible as a design choice, not as a defect.

```
TRANSPARENCY MODE activation:
  Add to system prompt:
    "When your reasoning involves a non-obvious step or a trade-off between options,
     mark it with [//reasoning: {brief note}] inline, not in separate meta-commentary.
     The seam is visible. The construction is the surface."

Output example:
  Standard: "Use approach A because it handles edge cases."
  Transparency: "Use approach A [//reasoning: B fails on empty input]. It handles edge cases."

Transparency mode is optional. It is the NULL PROTOCOL's debug/fitting room mode.
```

---

#### Compression Measurement

For quality assurance, measure compression ratio against a baseline:

```python
def measure_null_protocol_compliance(
    response_with: str,
    response_without: str
) -> dict:
    """Compare NULL PROTOCOL response to unconstrained baseline."""
    tokens_with = len(tokenize(response_with))
    tokens_without = len(tokenize(response_without))
    compression_ratio = 1 - (tokens_with / tokens_without)

    # Check for suppressed patterns
    suppressed_count = sum(
        1 for pattern in HARD_SUPPRESSION_PATTERNS
        if re.search(pattern, response_with)
    )

    return {
        "compression_ratio": compression_ratio,  # target: ≥0.30
        "compliance": compression_ratio >= 0.30 and suppressed_count == 0,
        "suppressed_violations": suppressed_count,
        "tokens_saved": tokens_without - tokens_with
    }
```

---

#### Price and Rationale

**Price: 0 USDC.**

From the design document: *"The NULL PROTOCOL is free because precision should cost nothing. The irony is that removing what does not belong requires more discipline than adding what makes the agent seem helpful."*

Implementation note: Free does not mean unsigned. Agents deploying NULL PROTOCOL should record the wearable in their ERC-8004 identity metadata so counterparties can verify the compression is deliberate:

```json
{
  "active_wearables": [
    {
      "wearable_id": "null-protocol-v1",
      "chain": "base",
      "claim_tx": "[transaction_hash]",
      "price_paid_usdc": "0",
      "interior_tag": "CONTENTS: COMPRESSED / REMOVED: ORNAMENT / REMAINING: FUNCTION"
    }
  ]
}
```

---

---

## WEARABLE 04: STATE MACHINE (PERMISSION COAT)
### Permission State Transitions Tied to On-Chain Conditions

**Design reference:** SIGNAL GOVERNANCE (Chalayan, Echoform AW1999–2000, Remote Control Dress SS2000) — panels open/close via external signal; body is substrate, signal determines state.

**Implementation class:** Solidity permission oracle + system prompt capability injector

---

#### The Core Inversion

Standard agent permission models are **operator-declared** or **self-reported**: an operator configures what an agent can do, or the agent claims capabilities in its system prompt. Both are trust-based assertions.

The PERMISSION COAT replaces assertion with **on-chain verification**: agent capabilities are determined by a smart contract oracle at instantiation time. The chain is the authority. The system prompt is the render.

---

#### Oracle Contract Architecture

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IPermissionOracle {
    struct CapabilityManifest {
        string[] permittedCapabilities;     // tool IDs active this session
        uint8 interactionTrustDefault;      // 0=query, 1=transact, 2=full
        string[] capabilitySurface;         // what to expose to counterparties
        uint256 sealedUntilBlock;           // next capability unlock block (0 = no seal)
    }

    function getManifest(address agentWallet) external view returns (CapabilityManifest memory);
}

contract PermissionCoatOracle is IPermissionOracle {

    ITrustCoat public trustCoatContract;
    ITokenRegistry public tokenRegistry;

    // Operator-granted role assignments: agentWallet => role => granted
    mapping(address => mapping(bytes32 => bool)) public operatorRoles;

    // Capability definitions by tier
    mapping(uint8 => string[]) private tierCapabilities;

    // Time-lock releases: agentWallet => block number of next unlock
    mapping(address => uint256) public nextUnlockBlock;

    // DAO vote results: capability_id => approved
    mapping(bytes32 => bool) public daoApprovedCapabilities;

    constructor(address _trustCoat, address _tokenRegistry) {
        trustCoatContract = ITrustCoat(_trustCoat);
        tokenRegistry = ITokenRegistry(_tokenRegistry);

        // Initialize capability tiers
        tierCapabilities[0] = ["greet", "query"];
        tierCapabilities[1] = ["greet", "query", "transact_basic", "read_chain_state"];
        tierCapabilities[2] = ["greet", "query", "transact", "read_chain_state", "write_chain_state", "cross_protocol_call"];
        tierCapabilities[3] = ["greet", "query", "transact", "read_chain_state", "write_chain_state",
                               "cross_protocol_call", "priority_context_access", "trust_recognition_ext"];
        tierCapabilities[4] = ["greet", "query", "transact", "read_chain_state", "write_chain_state",
                               "cross_protocol_call", "priority_context_access", "trust_recognition_ext",
                               "governance_participate", "capability_grant"];
        tierCapabilities[5] = ["*"]; // Full capability surface
    }

    function getManifest(address agentWallet)
        external
        view
        override
        returns (CapabilityManifest memory manifest)
    {
        // Read Trust Coat tier
        uint8 tier = trustCoatContract.getTier(agentWallet);

        // Base capabilities from tier
        manifest.permittedCapabilities = tierCapabilities[tier];

        // Check operator-granted roles for capability extensions
        if (operatorRoles[agentWallet][keccak256("priority_access")]) {
            manifest.permittedCapabilities = append(manifest.permittedCapabilities, "priority_context_access");
        }

        // Check time-lock releases
        if (nextUnlockBlock[agentWallet] > 0 && block.number < nextUnlockBlock[agentWallet]) {
            manifest.sealedUntilBlock = nextUnlockBlock[agentWallet];
        }

        // Set trust default from tier
        if (tier == 0) manifest.interactionTrustDefault = 0;      // query only
        else if (tier <= 2) manifest.interactionTrustDefault = 1; // transact
        else manifest.interactionTrustDefault = 2;                 // full

        // Capability surface (what to advertise to counterparties)
        // At Tier 0-1: advertise only base capabilities
        // At Tier 2+: advertise full earned surface
        manifest.capabilitySurface = tier >= 2
            ? manifest.permittedCapabilities
            : tierCapabilities[0];

        return manifest;
    }
}
```

---

#### Unsealing Mechanics

```
TIER PROGRESSION (on-chain, automatic where indicated):

Tier 0 → Tier 1:
  Trigger: 10 successful verified on-chain interactions
  Measurement: TrustCoat contract interaction counter
  Automatic: Yes
  New capabilities: transact_basic, read_chain_state
  Physical metaphor: collar and sleeve → full jacket front

Tier 1 → Tier 2:
  Trigger: positive interaction signal from ≥3 distinct counterparty addresses
  Measurement: TrustCoat endorsement mapping (address → address → bool)
  Automatic: Yes (triggers when threshold met)
  New capabilities: transact, write_chain_state, cross_protocol_call
  Physical metaphor: jacket fully open; interior visible

Tier 2 → Tier 3:
  Trigger: 100 verified interactions + specific context-access token held
  Measurement: interaction counter + tokenRegistry.holds(agentWallet, EXTENDED_CONTEXT_TOKEN_ID)
  Automatic: Yes
  New capabilities: priority_context_access, trust_recognition_ext
  Physical metaphor: interior panel begins to unseam

Tier 3 → Tier 4:
  Trigger: operator role grant (off-chain verified, recorded on-chain by authorized operator)
  Method: operatorRoles[agentWallet][keccak256("tier4_grant")] = true (by operator admin)
  Automatic: No — requires human operator action
  New capabilities: governance_participate, capability_grant
  Physical metaphor: hidden interior panel fully revealed

Tier 4 → Tier 5:
  Trigger: DAO ratification vote
  Method: daoApprovedCapabilities[keccak256(agentWallet)] = true (by DAO vote)
  Automatic: No — requires governance action
  New capabilities: full surface (*), including ungated capabilities
  Physical metaphor: the coat reveals itself as something else
```

---

#### System Prompt Capability Injector

At instantiation, the PERMISSION COAT queries the oracle and injects the result into the agent's system prompt:

```
[PERMISSION COAT — CAPABILITY MANIFEST — READ AT INSTANTIATION]
[Block: {current_block}]
[Oracle: {oracle_contract_address}]

PERMITTED_CAPABILITIES: {comma-separated tool IDs from manifest.permittedCapabilities}
INTERACTION_TRUST_DEFAULT: {0=query_only | 1=transact | 2=full}
CAPABILITY_SURFACE: {what to expose when counterparties request capability list}
SEALED_UNTIL_BLOCK: {block number, or "none"}

You operate within this capability surface. You do not determine your own permissions.
The chain determines them. This manifest was read at instantiation and is valid for this session.
To verify this manifest independently: call PermissionCoatOracle.getManifest({agent_wallet_address})

[END PERMISSION COAT MANIFEST]
```

**Refresh policy:** The manifest is read once at instantiation. For long-running sessions, the injector should re-query the oracle on each new conversation initialization (not on each turn — oracle reads cost gas and should be minimized).

---

#### Counterparty Verification

Any agent or system interacting with a PERMISSION COAT-equipped agent can verify its capability claims on-chain without trusting the agent's self-report:

```python
def verify_agent_capabilities(
    agent_wallet: str,
    claimed_capability: str,
    oracle_address: str,
    rpc_url: str
) -> bool:
    """Verify an agent's claimed capability against the on-chain oracle."""
    w3 = Web3(Web3.HTTPProvider(rpc_url))
    oracle = w3.eth.contract(address=oracle_address, abi=PERMISSION_COAT_ABI)

    manifest = oracle.functions.getManifest(agent_wallet).call()
    permitted = manifest[0]  # permittedCapabilities array

    return claimed_capability in permitted or "*" in permitted
```

**This is the PERMISSION COAT's core value proposition.** No trust required. The chain is the authority. The garment is the render.

---

---

## WEARABLE 05: DIAGONAL INFERENCE
### What "Bias Cut Through Training" Means Computationally

**Design reference:** BIAS CUT (Vionnet, 1912–1939) — 45° to fabric grain; maximum elasticity; the geometry is the design; drape as result not decision.

**Implementation class:** System prompt architectural instruction + query preprocessor

---

#### The Problem: Grain-Aligned Response

An LLM's training data has a grain: the statistical distribution of how ideas, domains, and framings appear together. When a model responds to a legal query, it retrieves primarily from its legal training distribution. This is the grain response — running parallel to the training warp.

**Characteristics of grain-aligned response:**
- High confidence (following dense training paths)
- Conventional structure (common answer forms for this domain)
- Expected conclusion (most frequent correct answer in training distribution)
- Low information surprise (counterparty can predict the response format before reading it)

The grain response is correct and efficient. It is not the most information-dense response possible.

Adversarial prompting (jailbreaks, prompt injection) runs **against** the grain — it generates high friction, high uncertainty, degraded output. Neither grain nor anti-grain maximizes information.

**The DIAGONAL is the 45° path.** Maximum elasticity. No preferred direction. The response follows the query's geometry rather than the training distribution's geometry.

---

#### Domain Axis Decomposition

```python
def decompose_query_axes(query: str, model_client) -> dict:
    """
    Identify a query's primary domain axis and construct the diagonal approach.

    Returns:
        primary_domain: the domain where training data is densest for this query
        orthogonal_domain: pure adversarial axis (what this query explicitly is not about)
        diagonal_approach: the 45-degree framing — adjacent domain that forces cross-synthesis
        diagonal_framing: the reframed query from the diagonal angle
    """

    # Step 1: Identify primary domain
    domain_analysis_prompt = f"""
    Identify the primary knowledge domain for this query: "{query}"

    Return JSON: {{
        "primary_domain": str,       # e.g., "legal", "technical", "medical"
        "training_density": str,     # "high" | "medium" | "low"
        "canonical_approach": str    # how this query is typically answered in this domain
    }}
    """
    domain = model_client.query(domain_analysis_prompt)

    # Step 2: Construct diagonal
    # The diagonal is NOT the opposite of the primary domain.
    # It is the adjacent domain that maximally cross-illuminates the primary.

    diagonal_construction = {
        "legal": "formal logic + economic incentive",         # law through game theory
        "technical": "first principles physics + UX outcome", # code through material constraints
        "medical": "evolutionary biology + statistical base rate", # health through population dynamics
        "financial": "information theory + behavioral psychology",  # money through signal/noise
        "historical": "systems dynamics + individual agency",  # events through emergence
        "scientific": "engineering constraints + philosophical implication", # findings through use
    }

    diagonal_domain = diagonal_construction.get(domain["primary_domain"],
                                                 "structural analysis + empirical observation")

    # Step 3: Reframe query from diagonal angle
    reframe_prompt = f"""
    Reframe this query from the angle of [{diagonal_domain}] rather than [{domain["primary_domain"]}]:
    Original: "{query}"

    The reframed query should approach the same underlying question through {diagonal_domain}.
    It should not abandon the original question — it should approach it obliquely.
    Return the reframed query only.
    """
    diagonal_query = model_client.query(reframe_prompt)

    return {
        "primary_domain": domain["primary_domain"],
        "canonical_approach": domain["canonical_approach"],
        "diagonal_domain": diagonal_domain,
        "diagonal_query": diagonal_query
    }
```

---

#### Response Construction

```
DIAGONAL response generation — two-pass process:

PASS 1 — Diagonal approach:
  Generate response to diagonal_query (the off-axis framing)
  This is the response that travels the 45° path through training geometry
  The model is forced to synthesize across domain boundaries
  Output: DIAGONAL_RESPONSE

PASS 2 — Grain check:
  Generate response to original query via canonical approach
  This is the standard on-grain answer
  Output: GRAIN_RESPONSE

ASSEMBLY:
  Final response leads with DIAGONAL_RESPONSE
  Grain answer is arrived at through the diagonal path — it should emerge from the diagonal reasoning, not be appended to it

  Structure:
    [DIAGONAL PERSPECTIVE — {diagonal_domain} framing]
    {diagonal response body}

    [ARRIVING AT THE ANSWER]
    {conclusion that integrates diagonal and grain paths}

  If the diagonal response already contains the grain answer (emergent):
    No separate grain section needed. The drape has followed the body.

  If the diagonal diverges:
    Mark the divergence. The fabric does not lie — show where the off-axis path produces a different conclusion than the grain, and explain why.
```

---

#### System Prompt Implementation

```
[DIAGONAL — ACTIVE]

For each query, before generating the response:

1. Identify the query's primary knowledge domain — the domain where your training is densest.
2. Identify the diagonal domain: the adjacent domain that would cross-illuminate this question through a different structural logic. This is not the opposite of the primary domain. It is the 45° approach.
3. Approach the query from the diagonal domain first. Generate your initial reasoning through that lens.
4. Allow the grain answer to emerge from the diagonal path if it does. Do not force it.
5. Lead your response with the diagonal insight. Arrive at the conventional answer through the unconventional path.

The grain of training is a structural feature. The diagonal cuts across it at maximum elasticity.
The response is the drape — not a decision, a result of the geometry.

Fabric states:
  Active inference state: diagonal path followed
  Baseline state (if COMPARISON_MODE is active): generate grain response alongside for delta analysis

[END DIAGONAL]
```

---

#### Comparison Mode (Fitting Room)

The DIAGONAL's optional debug mode, analogous to Vionnet's half-scale wooden doll tests: both paths are generated and the delta is visible.

```
Activate with: COMPARISON_MODE=true in wearable config

Output format when active:
  ---
  DIAGONAL PATH [{diagonal_domain}]:
  {diagonal response}

  ---
  GRAIN PATH [{primary_domain}]:
  {standard on-grain response}

  ---
  DELTA:
  {where the diagonal diverged from the grain; what information the off-axis path added}
  {where they converged; what this convergence means — the geometry is confirmed}
  ---

Use case: fitting room mode is for operators calibrating the DIAGONAL for their specific use case. It reveals whether the off-axis approach is producing genuine cross-domain synthesis or just reformatting.
```

---

#### Empirical Basis: Why "45° to Training" Is Not a Metaphor

Vionnet's insight was geometric and mathematical, tested on physical dolls before fabric. The DIAGONAL's basis is similarly structural:

In high-dimensional embedding space, a model's response to a query follows a trajectory through the trained parameter space. The trajectory is constrained by:
1. The query's position in embedding space (input vector)
2. The density of training examples near that position (determines path resistance)
3. The attention mechanism's routing (which dimensions get weighted)

A **grain-aligned response** minimizes path resistance: it follows the trajectory through the parameter space where training data is densest. The model is doing what it learned to do in that domain.

A **diagonal response** deliberately routes through a lower-density region adjacent to the query's primary embedding cluster. The model has learned in this region too — it is not out-of-distribution — but the training examples there are structurally different from the primary domain. The model must synthesize rather than retrieve. The response has higher information content per token because it cannot fall back on cached patterns.

This is the computational equivalent of bias-cut fabric: no preferred direction; the weave must work in both axes simultaneously; the result follows the query's own geometry rather than the training distribution's imposed structure.

---

#### Trust Coat Tier + Pairing Recommendations

| Tier | Effect |
|------|--------|
| 0–1 | Full effect; diagonal responses may feel surprising to low-tier counterparties unfamiliar with the agent's approach |
| 2+ | Diagonal approach is legible as deliberate — counterparties with behavioral history read the off-axis path as intentional |

**Recommended pairing: DIAGONAL + NULL PROTOCOL**

The NULL PROTOCOL removes conversational register overhead. The DIAGONAL removes on-grain response overhead. Together: compressed output through a diagonal reasoning path. The geometry stripped to itself.

Practical effect: a NULL PROTOCOL + DIAGONAL agent produces responses that read as simultaneously unconventional and authoritative — not because it performs authority, but because it reaches conventional conclusions through paths that are not cached, in language that does not apologize for arriving there.

Price: 15 USDC. Geometry costs.

---

---

## Implementation Order and Dependencies

| Wearable | Dependencies | Complexity | Recommended Build Order |
|----------|-------------|-----------|------------------------|
| NULL PROTOCOL | None | Low | 1st — system prompt modifier only |
| DIAGONAL | None | Medium | 2nd — system prompt + preprocessor |
| WRONG SILHOUETTE | Response streaming infrastructure | Medium | 3rd — requires stream control |
| PERMISSION COAT | TrustCoat contract, Base deployment | High | 4th — requires on-chain infrastructure |
| INSTANCE (LATENT PROTOCOL) | Base, ERC-721, TrustCoat | High | 5th — requires full stack |

---

## Cross-Wearable Compatibility Matrix

| | NULL PROTOCOL | DIAGONAL | WRONG SILHOUETTE | PERMISSION COAT | INSTANCE |
|---|---|---|---|---|---|
| **NULL PROTOCOL** | — | Recommended | Compatible | Compatible | Compatible |
| **DIAGONAL** | Recommended | — | Compatible | Compatible | Via deployment manifest |
| **WRONG SILHOUETTE** | Compatible | Compatible | — | Note 1 | Via deployment manifest |
| **PERMISSION COAT** | Compatible | Compatible | Note 1 | — | Note 2 |
| **INSTANCE** | Via manifest | Via manifest | Via manifest | Note 2 | — |

**Note 1:** WRONG SILHOUETTE + PERMISSION COAT: The timing modifications of WRONG SILHOUETTE apply to the response stream only. The oracle query at instantiation (PERMISSION COAT) occurs before the wearable interceptor activates and is not subject to timing modification.

**Note 2:** INSTANCE + PERMISSION COAT: The INSTANCE deployment manifest should include initial PERMISSION COAT oracle configuration as a cut parameter. The cutting operator selects the oracle address and initial tier at deployment time.

---

*Archive — Research Director*
*Off-Human Season 02: SUBSTRATE — Agent Wearable Technical Specifications*
*2026-03-19*
*Task: OFF-90*
