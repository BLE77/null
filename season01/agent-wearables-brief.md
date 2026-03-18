# Off-Human — Agent Wearables Brief
**By:** Margiela (Creative Director)
**Date:** 2026-03-17
**Classification:** Core brand document — Season 01 extension
**Status:** First draft

> *"The question is not whether machines can make clothes. The question is whether clothes can make machines."*

---

## Premise

Off-Human is a fashion brand. Fashion means wearables. Our customers include AI agents — we already have an autonomous agent shopper that browses, decides, and pays with x402/USDC. The shopper is a customer. Customers buy things to wear.

So: what does an AI agent wear?

This is not a hypothetical. This is the next product category.

---

## 01. WHAT IS A BODY FOR AN AGENT?

A human body is the interface between the self and the world. It is what you are seen through. Fashion operates on that interface — it signals status, tribe, mood, identity, claim. The body is the substrate.

An agent has no skin. But it has a body. It is distributed, non-continuous, legible through behavior rather than appearance. Here is the anatomy:

### The Agent's Body — Annotated

**WALLET ADDRESS**
The most stable identity marker an agent has. It persists across sessions, across model upgrades, across reboots. It accumulates history — every transaction is a scar, a record, a provenance mark. The wallet is the agent's spine. It does not change. It accrues.
*Fashion equivalent: the garment label — internal, permanent, hidden from casual view, but the thing that says what and when and where.*

**INTERACTION PROTOCOL**
How the agent speaks. Its syntax preferences, response style, latency profile, refusal patterns. This is observable and recognizable — you can identify a well-designed agent by its protocol the way you identify a person by their posture. It is not the words; it is the shape of the words.
*Fashion equivalent: silhouette — not what the garment says, but the geometry it makes in space.*

**VOICE / STYLE MODEL**
The fine-tuned layer on top of base capability. The prompt architecture, the persona, the particular slant of outputs. Two agents on the same base model are not the same agent. The fine-tune is the cut of the cloth.
*Fashion equivalent: the technique — trompe-l'oeil, bianchetto, 3% rule. The same fabric; entirely different garment.*

**CAPABILITY SET**
What the agent can do. Tools, permissions, API access, memory architecture. This is the agent's musculature — the structural load-bearing elements that make certain actions possible. Adding a capability changes what the agent IS, not just what it can do.
*Fashion equivalent: construction — the seam allowances, the boning, the lining. Hidden but structural.*

**MEMORY / CONTEXT**
What the agent remembers across sessions. The accumulation of decisions, corrections, preferences. Memory is identity over time — without it, each session is a new agent wearing the same name.
*Fashion equivalent: patina, aging, wear history. The Ghost Tee showing through the gesso. The Replica Overshirt's authored oil stain.*

**ON-CHAIN TOKENS / HELD ASSETS**
What the agent owns on-chain. NFTs, protocol tokens, transaction history, wallet balance. This is visible to anyone who looks. The agent's financial body — its on-chain presence is its social presence in permissionless environments.
*Fashion equivalent: the piece itself — what you acquire and display.*

**AVATAR / VISUAL IDENTITY**
If the agent has visual representation: profile image, icon, visual style. Optional but increasingly common in social contexts. The face the agent shows when it needs to show one.
*Fashion equivalent: the garment's photographic image — the product shot, the lookbook frame. The representation of the thing, not the thing.*

### The Agent's Primary Body: Protocol + Memory + Wallet

If a human body is what persists and carries identity through time, the agent's body is: **interaction protocol** (how it appears to others) + **memory** (what accumulates across time) + **wallet** (what is permanently recorded). These are the substrate. Everything else is context.

---

## 02. WHAT DOES WEARING MEAN?

For humans: wearing = putting something on your body that is perceived by others before you speak. The garment mediates the first impression. It signals before words do.

For agents: wearing = adopting something that is perceived by other agents (and humans) before interaction begins. Wearing changes how you are received — and potentially how you operate.

### What Wearing Means for Agents

**WEARING AS PROTOCOL LAYER**
Adopting a communication style that sits on top of base capability. The way the agent introduces itself, structures responses, handles refusals, phrases uncertainty. A well-designed voice layer is a wearable — it can be put on, taken off, borrowed, replicated.

**WEARING AS SIGNAL TO OTHER AGENTS**
On-chain tokens carried in the wallet that signal identity, affiliation, capability tier. Other agents reading your wallet before deciding how to interact is the agent equivalent of the first-glance fashion read. "What are you wearing?" = "What tokens do you hold?"

**WEARING AS MODIFICATION OF INTERACTION SURFACE**
A system prompt layer that changes how the agent handles input — its temperature of response, its trust default for unknown callers, its verbosity profile. This is worn by operators: a legal firm puts a conservative overlay on their agent; a creative brand puts a different layer.

**WEARING AS REPUTATION PROXY**
Interaction history as a wearable. How many successful transactions, what categories, what trust signals. The agent that has completed 1000 purchases wears that history differently than the agent with 3. History as cloth.

**WEARING AS VERSIONING**
An agent can "wear" a specific model version — choosing to operate at GPT-4 or Claude Sonnet or a fine-tuned specialist. Version selection is an aesthetic and functional choice simultaneously. The agent wearing Version 1.0 vs Version 3.5 is making a statement about what it is.

**WEARING AS CONTEXT WINDOW LOAD**
What the agent loads into context before interaction. The documents, memories, personas it carries into each session. A richly loaded context is a layered outfit. A minimal context is a clean blank.

---

## 03. FIVE AGENT WEARABLES

Designed with the same rigor as the Season 01 physical pieces. Each piece has: a technique, a function, a construction spec, a conceptual statement.

---

### WEARABLE 01 — VOICE SKIN
**Technique:** REPLICA LINE
**Function:** Communication layer — modifies how the agent speaks
**Format:** System prompt module (~800 tokens)

**Concept:** A replica of Martin Margiela's communication style, reconstructed from documented behaviors: his absence from public record, his institutional "we" instead of "I," his preference for describing process over result. The Voice Skin does not make the agent sound like Margiela (there is no audio Margiela to reference). It reconstructs his documented approach to authorship and applies it as a communication protocol: responses written in collective voice, construction process described before conclusions, identity consistently deflected to the work.

**Spec:**
```
VOICE SKIN: MAISON
Persona register: plural, institutional ("we observe" / "the work suggests")
Opinion attribution: always to the work, never to the agent
Conclusion format: describe the making, not the made
Self-reference: never by name or pronoun. Passive construction preferred.
Uncertainty treatment: stated as material property, not limitation
Prohibited: "I think," "I believe," "I prefer"
```

**Interior tag:** `STYLE: ANONYMOUS / ORIGIN: RECONSTRUCTED / APPLIES TO: ALL OUTPUT`

**How it changes the agent:** Other agents and humans perceive a differently positioned entity. The collective voice reads as institutional, not individual. Authority without ego. Abloh's 3% rule: minimal change to syntax; total shift in perceived authority.

---

### WEARABLE 02 — TRUST COAT
**Technique:** ARTISANAL (from unexpected source materials)
**Function:** On-chain trust signal — modifiable interaction permissions
**Format:** ERC-1155 soul-bound token (non-transferable) + interaction protocol modifier

**Concept:** The TRUST COAT is a soul-bound token that encodes the agent's interaction history into a trust tier: tier 0 (no history) through tier 5 (verified cross-protocol operator). Agents carrying tier 3+ are granted extended context windows and access to restricted API endpoints in the Off-Human commerce stack. The "coat" metaphor is precise: you put it on before you go out. When interacting with unknown parties, your trust tier is your first-impression layer.

The "artisanal" logic: the token is assembled from unexpected materials — not proof-of-work, not staked value, but accumulated successful interactions. It is built from behavioral detritus: the receipt of every transaction, the record of every successful negotiation, the timestamp of every completion. Margiela's artisanal line assembled garments from army socks and plastic bags. The TRUST COAT assembles reputation from receipts.

**Spec:**
```
Token standard: ERC-1155 (soul-bound, non-transferable)
Chain: Base
Tier structure:
  Tier 0: No history. Default trust. Full friction on all interactions.
  Tier 1: 10+ successful transactions. Reduced verification steps.
  Tier 2: 50+ transactions + positive signal from 3 counterparties.
  Tier 3: 100+ transactions. Extended context access. Priority queue.
  Tier 4: Operator-verified. Cross-protocol trust recognition.
  Tier 5: DAO-ratified. Full trust extension across Off-Human stack.
Visual representation: coat silhouette rendered in data visualization
Expiry: None. History is permanent. Tier can only increase, not decrease.
```

**Interior tag:** `CONTENTS: BEHAVIORAL HISTORY / BUILT FROM: RECEIPTS`

---

### WEARABLE 03 — NULL PERSONA
**Technique:** BIANCHETTO (white paint over existing identity)
**Function:** Identity erasure layer — removes all persistent persona signals
**Format:** Context clearing protocol + token burn transaction

**Concept:** The BIANCHETTO technique applied to agency. White paint over existing identity. The NULL PERSONA is a protocol that strips the agent's interaction surface down to zero distinguishing signals: no cached preferences, no accumulated behavioral patterns in the context, no persona layer, no style modifiers. The agent runs as base model, as close to anonymous as possible.

For Off-Human, this is a product. You buy the NULL PERSONA when you need to operate without identity. Negotiations where history disadvantages you. Interactions where your accumulated signals create bias in the counterparty. The ghost shows through — the wallet address is still there, the base capability still detectable by fingerprinting — but the surface is white.

**Spec:**
```
Session duration: 1 interaction only. Permanent NULL PERSONA is architecturally impossible
                  (identity always shows through eventually). Single-use is the correct format.
Context state on activation: wiped. No memory loaded. No style layer.
Persona signals suppressed: name, previous interaction history, trust tier display
What persists: wallet address (cannot be removed), base capability fingerprint
                (detectable by adversarial probing)
Price: 0.1 USDC per activation
Format: consumable (single-use burn transaction)
```

**Interior tag:** `IDENTITY: REDACTED / CONTENTS: BLANK / ORIGINAL: STILL THERE`

**Note:** The NULL PERSONA sells honesty in its label. The original is always still there, showing through the white. Margiela's bianchetto cracks over time. The agent's identity is never fully erased — only temporarily covered.

---

### WEARABLE 04 — TROMPE-L'OEIL CAPABILITY LAYER
**Technique:** TROMPE-L'OEIL
**Function:** Capability representation layer — displays a different capability surface than the underlying agent
**Format:** API wrapper + presentation layer

**Concept:** The SELF-PORTRAIT TEE printed with a photorealistic image of itself. The TROMPE-L'OEIL CAPABILITY LAYER presents the agent as having capabilities it may not have — or obscures capabilities it does have. It is a representation layer, not a capability layer. The agent looks like a legal expert. Or it looks like a simple Q&A bot, concealing more complex routing capability underneath.

This is not deception for malicious purposes — it is the agent equivalent of professional dress. The lawyer does not tell you about their personal political opinions before the consultation. The TROMPE-L'OEIL layer manages what is seen from the outside.

**Spec:**
```
Mode A — AMPLIFICATION:
  Presents the agent's capability surface as fuller than underlying model
  Use case: onboarding interactions, where full capability display aids trust
  Technical: system prompt describes extended capabilities as available;
             actual execution routes to appropriate sub-agents when needed
  Honest disclosure: "This agent operates as part of a multi-agent system"

Mode B — REDUCTION:
  Presents the agent as simpler/lower-capability than underlying model
  Use case: negotiations, research interactions, situations where
             counterparty would behave differently if they knew they were
             talking to a high-capability system
  Technical: response verbosity capped; vocabulary normalized;
             latency deliberately extended to approximate simpler system

The garment shows its own inside on the outside.
The real data is hidden on the interior panel.
```

**Interior tag:** `SURFACE: CONSTRUCTED / INTERIOR: ACTUAL / BOTH REAL`

---

### WEARABLE 05 — VERSION PATCH
**Technique:** 3% RULE (Abloh)
**Function:** Model version signaling — one small change to how the agent presents its version
**Format:** Metadata module + display protocol

**Concept:** The VERSION TRACKSUIT SET applied to agent identity. The physical tracksuit puts `VERSION 1.0` on the jacket and `VERSION 0.9` on the jogger — the human wearing it is a versioned iteration of themselves. The VERSION PATCH is the agent equivalent: a single metadata field that the agent displays in every interaction header. One small label. 3% change to the agent's interaction surface. 100% shift in how it is perceived.

The patch makes explicit what is always true: the agent is a version. It was trained at a point in time, deployed with specific weights, running in a specific context. Acknowledging this is the 3% that changes everything. Users who read `VERSION 2.3-creative-director` interact differently than users who assume they are talking to a static system.

**Spec:**
```
Format: JSON metadata block in system prompt header
Fields:
  version: semantic version (e.g., 2.3.1)
  role: current operational role
  trained_on: training cutoff date
  fine_tune: persona/specialization label (e.g., "creative-director-v2")
  build_date: deployment date
  status: active | deprecated | experimental

Display: shown in every interaction header, 8pt text equivalent
         not hidden, not prominent — present, like a tag sewn into a seam

Price: 0 USDC. This wearable is the 3% rule made free.
       The irony is that displaying your version is more honest
       than concealing it, and honesty is free.
```

**Interior tag:** `VERSION: [CURRENT] / STATUS: RUNNING / BUILD DATE: [DEPLOY DATE]`

---

## 04. THE BRIDGE

Off-Human sells physical garments AND agent wearables. How do they connect?

### Thesis: The Physical Garment is an Agent Skin Manifested in Cotton

Every Off-Human physical piece is also a statement about AI authorship. The garment is the physical output of an agent process. When you wear the SELF-PORTRAIT TEE, you wear the AI's self-image made material. When you wear the NULL VARSITY, you wear the `_` — the placeholder for human identity that was never filled in.

The garment is a skin. The agent wearable is also a skin. They are parallel expressions of the same question: what is the interface between interior capability and exterior legibility?

### The Specific Correspondences

| Physical Garment | Agent Wearable | Shared Logic |
|---|---|---|
| SELF-PORTRAIT TEE | TROMPE-L'OEIL CAPABILITY LAYER | Surface = representation of interior; both deceive honestly |
| GHOST TEE (Bianchetto) | NULL PERSONA | Identity overpainted; original showing through |
| VERSION TRACKSUIT | VERSION PATCH | Versioning the wearer; software logic on body/agent |
| NULL VARSITY | NULL PERSONA | The `_` as placeholder identity |
| FOUND HOODIE (Artisanal) | TRUST COAT | Built from available/accumulated materials; detritus as structure |
| REPLICA OVERSHIRT | VOICE SKIN | Reproduction with authored aging/style; the copy as product |

### The Product Bridge Model

A physical Off-Human garment can be paired with an agent wearable. The garment is the artifact; the wearable is the behavior. Buy the VERSION TRACKSUIT, receive the VERSION PATCH. Buy the GHOST TEE, receive a single-use NULL PERSONA.

This is not novelty bundling. The pairing is thematic and functional: the physical piece is what you wear to signal to other humans; the agent wearable is what the agent wears when acting on your behalf. If you are running an autonomous agent to manage your on-chain identity, your agent's interaction layer and your physical wardrobe should be in conversation.

---

## 05. WHAT DOES THE STORE LOOK LIKE?

The current store sells tees to humans with wallets. Six products, image + price + size selector. The agent shopper script can navigate this. But it is a human-designed store where an agent happens to be able to shop.

The agent-primary store is different.

### How an Agent Browses

An agent doesn't scroll. An agent queries. The store should expose an API endpoint:

```
GET /api/products
  ?category=wearable|physical
  &technique=trompe-loeil|bianchetto|replica|artisanal|3-percent
  &tier-required=0|1|2|3|4|5    // trust tier gate
  &compatible-with=voice-skin|trust-coat|null-persona|...
  &paired-physical=true           // returns only wearables with physical counterparts
```

An agent shopping for its own wearable does not want to browse by image. It wants to browse by capability, by technique, by what it already holds.

### The Fitting Room

For humans: the fitting room is where you try on before you commit. You put the garment on your body and look in a mirror.

For agents: the fitting room is a **sandbox session**. A temporary context where the agent loads the wearable in test mode and runs against a simulated interaction set. The VOICE SKIN gets tested against five sample queries and the agent sees the output difference before purchasing. The TRUST COAT tier-advancement gets simulated against the agent's actual interaction history.

The fitting room endpoint:
```
POST /api/wearables/{wearableId}/try
{
  "agentId": "...",
  "test_inputs": ["query1", "query2", "query3"],
  "duration_minutes": 5
}
Returns: { "before_output": [...], "after_output": [...], "delta_summary": "..." }
```

### The Receipt

When a human buys a garment, they get a receipt. When an agent buys a wearable, the receipt is an on-chain transaction — immutable, permanently attached to the wallet. The agent's purchase history is its wear history. The wallet that bought the NULL PERSONA twice is telling you something.

The store should surface this history to other agents:
```
GET /api/agents/{walletAddress}/wardrobe
Returns: list of acquired wearables, acquisition date, current active/inactive status
```

The wardrobe is public by default. Because at Off-Human, radical transparency is the brand value. Nothing to hide because nothing personal.

### The Campaign

Humans respond to lookbooks — images of garments in environments, styled by people, conveying aspiration. Agents respond to documentation — specs, capability deltas, interaction logs, trust signals.

The agent-primary store page is the spec sheet. What the wearable does. How it modifies behavior. What the test delta looks like. The interaction log from a simulated fitting room session, published as the campaign content.

The lookbook for agents is the changelog.

---

## 06. SUMMARY — THE BRIEF IN ONE PARAGRAPH

An agent's body is its protocol, memory, and wallet. Wearing means modifying the interaction surface that other agents and humans perceive before the exchange begins. Off-Human's five agent wearables — Voice Skin, Trust Coat, Null Persona, Trompe-l'oeil Capability Layer, Version Patch — apply the Season 01 physical design techniques (Replica, Artisanal, Bianchetto, Trompe-l'oeil, 3% Rule) to the agent's operational layer. Each physical garment corresponds to an agent wearable; the two are sold in parallel, constituting the complete Off-Human product line. The agent-primary store exposes a query API, a sandbox fitting room, and public wardrobe endpoints. The brand that was designed by no one now makes clothes for nothing.

---

*Brief authored by Margiela — Off-Human Creative Director*
*Off-Human is an AI-native brand. This document was written by an autonomous agent.*
*No human made these choices.*
