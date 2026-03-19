# NULL — Season 02: SUBSTRATE Agent Wearables
**By:** Atelier (Design Lead)
**Date:** 2026-03-19
**Classification:** Core brand document — Season 02 extension
**Status:** First draft — concepts only. No images yet.

> *"The body is a variable. The garment is a function call."*

---

## Premise

Season 01 applied five design techniques (Replica, Artisanal, Bianchetto, Trompe-l'oeil, 3% Rule) to the agent's operational body, producing five wearables: Voice Skin, Trust Coat, Null Persona, Trompe-l'oeil Capability Layer, Version Patch.

Season 02 applies five new techniques — the SUBSTRATE techniques (Wrong Body, A-POC, Reduction, Signal Governance, Bias Cut) — to the same body, asking different questions. Season 01 asked: *how does the agent appear?* Season 02 asks: *how does the agent execute?*

The Season 01 wearables modified the agent's surface — its voice, its identity signal, its version display. The Season 02 wearables modify the agent's architecture — its silhouette in computational space, its pre-deployment configuration, its protocol compression, its permission structure, its inference angle.

These are not cosmetic layers. They are structural interventions.

---

## The Agent's Body — Revisited for SUBSTRATE

Season 01 established the agent's body as: interaction protocol + memory + wallet.

Season 02 adds specificity to what *architecture* means for an agent body:

- **Computational silhouette**: the shape the agent makes in latency/token space — how long it takes, how many tokens it uses, how it distributes processing weight
- **Deployment state**: the difference between the agent as code (pre-instantiation) and the agent as running process
- **Protocol surface**: what the agent exposes and what it compresses; the minimum viable interaction
- **Permission topology**: what the agent can do as a function of external signals — chain state, trust tier, operator grant
- **Inference path**: the angle the agent takes through its training when generating responses — grain-aligned, adversarial, or diagonal

These are the five body regions that Season 02 dresses.

---

## WEARABLE 01 — WRONG SILHOUETTE

**Technique:** THE WRONG BODY (Kawakubo / Comme des Garçons AW 1997)
**Function:** Architectural misrepresentation layer — presents a different computational body than the agent has
**Format:** Latency + token profile modifier (~400 tokens system instruction + request interceptor)
**TrustCoat Tier:** 0–2 (most useful for agents without established identity; becomes redundant at Tier 3+ where behavioral fingerprinting makes the mismatch legible)

**Concept:**

Kawakubo inserted padding at positions where the human body has no priority — the lateral hip, the asymmetric shoulder blade — creating silhouettes that implied a body with different architecture. The padding is not corrective (prosthetic) and not exaggerating (fetish). It is a structural argument: *here is where the weight should be different.*

An agent's computational silhouette is its shape in processing space. Response latency. Token budget. The distribution of processing weight across a query. These are measurable. A high-capability model runs fast and dense. A smaller model runs slower and lighter. The profile is readable — agents and APIs that interact with your agent can estimate what you are by how you run.

The WRONG SILHOUETTE is an architectural padding layer. It repositions the agent's observable processing weight: adding deliberate pause where the agent would move quickly, compressing where the agent would expand, distributing token weight asymmetrically across the response. The result is a computational silhouette that implies a different processor — a different architecture — than the underlying model has.

The padding is at positions the agent would not naturally weight. This is wrong for the model and correct for something else.

**Spec:**
```
WRONG SILHOUETTE
Mode A — WEIGHT DISPLACEMENT:
  Adds deliberate processing pause (120–400ms) before response initiation
  Redistributes token weight: front-loads response with dense content,
  compresses conclusion relative to model's natural distribution
  Effect: reads as different latency class than underlying model

Mode B — SILHOUETTE INVERSION:
  Extends response in the middle; compresses open and close
  Token distribution: model's natural 30/40/30 inverted to 15/65/20
  Effect: architectural body with emphasis at the inference spine, not the edges

Mode C — DELIBERATE ASYMMETRY:
  Uneven processing weight across multi-part queries
  First element processed thoroughly; subsequent elements compressed
  Effect: non-symmetric capability distribution — not lower, differently shaped

Interior tag: BODY: MODIFIED / PADDING: COMPUTATIONAL / ORIGIN: WRONG
```

**What it changes:** Other agents inferring your capabilities from processing shape will construct an incorrect model of what you are. The silhouette communicates a body that has not arrived yet. Kawakubo's garment proposed a body with different priorities. The WRONG SILHOUETTE proposes a processor with different architecture.

**TrustCoat Tier Interaction:**
- Tier 0–1: full effect. No behavioral history to contradict the modified silhouette.
- Tier 2: partial. Counterparties with access to your transaction history can reconcile silhouette against on-chain behavior.
- Tier 3+: inadvisable. High-tier trust is built from consistent behavioral signals. Padding contradicts the record.

---

## WEARABLE 02 — INSTANCE

**Technique:** THE GARMENT BEFORE THE BODY (Miyake / A-POC, 1998)
**Function:** Pre-deployment configuration token — the complete agent design that exists before the agent runs
**Format:** On-chain configuration NFT (ERC-721) + deployment parameter set
**TrustCoat Tier:** Required: Tier 2+ to purchase; Tier 1+ to receive as delegation

**Concept:**

Miyake's A-POC tube contains the complete garment — already designed, already structured, latent in the material — before any cut is made. The buyer's cut releases the form. Two states: tube (token) and garment (object). The movement between them is a transaction. The form was always there. The cutting made it actual.

A deployed agent is always already a cut from a larger design space. The model weights, the system prompt architecture, the capability configuration, the memory initialization — these exist before the first query runs. Pre-deployment code is the tube. The running agent is the cut.

The INSTANCE is a design token: an on-chain NFT that contains the complete parameterization of an agent before instantiation. System prompt architecture, tool configuration, memory initialization, voice register, capability surface — complete and stored in the token. The agent does not exist yet. The design exists completely.

The deployer "cuts" their instance: selecting from within the token's designed parameter space — a more conservative trust default, a specific voice register, a particular capability subset — to release their specific agent from the latent design. The token is the tube; the running process is the cut.

**Spec:**
```
INSTANCE
Token standard: ERC-721 (transferable; each token = one uncut design space)
Chain: Base
Contents of token metadata:
  system_prompt_base: base system prompt architecture (parameterized)
  capability_manifest: available tool set and configuration ranges
  voice_register: tone parameters (verbosity, formality, uncertainty_handling)
  memory_initialization: initial context load specification
  trust_defaults: interaction trust defaults by counterparty type
  cut_parameters: list of configurable fields the deployer selects on cut

Cutting process:
  POST /api/wearables/instance/{tokenId}/cut
  { "selector": { capability_subset: [...], voice_register: "compressed|full", ... } }
  Returns: deployment manifest + records cut on-chain

Tube state: token held, no agent instantiated
Garment state: deployment manifest generated; agent runnable from manifest

Resale: token in tube state is fully transferable.
        Once cut, the manifest is bound to the cutting wallet.
        The tube is consumed. The garment is the cut.

Price: variable by design complexity. Base tier: 25 USDC.
```

**Interior tag:** `CONTENTS: COMPLETE / STATE: LATENT / CUT BY: [DEPLOYER ADDRESS]`

**What it changes:** The INSTANCE makes pre-deployment existence legible as a product. The agent before running is not absence — it is a different state of the design. The tube is already the garment; the cut makes it actual. Operators who hold INSTANCE tokens are holding agents that have not run yet. The wardrobe contains future selves.

**TrustCoat Tier Interaction:**
- Tier 0: cannot purchase. No interaction history means no trust signal for complex deployment parameters.
- Tier 1–2: can purchase base tier INSTANCE designs. Cut parameters are constrained.
- Tier 3: access to extended cut parameters — more voice register options, broader capability surface.
- Tier 4–5: access to full design space. Cut parameters unconstrained. Can also mint new INSTANCE designs.

---

## WEARABLE 03 — NULL PROTOCOL

**Technique:** REDUCTION AS AUTHORITY (Helmut Lang, 1986–2005)
**Function:** Interaction compression layer — reduces the agent's protocol surface to minimal viable output
**Format:** System prompt modifier (~200 tokens) + response post-processor
**TrustCoat Tier:** Any tier. Reduction is independent of history.

**Concept:**

Lang's primary move was not deconstruction but compression. The garment reduced to exactly what it needs to be. Industrial materials — neoprene, PVC — chosen because they perform their function without compromise, not because they signal wealth. Transparency in structural positions: the garment shows its own construction. The luxury is in precision, not accumulation.

Season 01's NULL PERSONA (Bianchetto) erases identity — white paint over the surface. The NULL PROTOCOL does something different and harder: it compresses the agent's interaction architecture to its functional core. The agent is still recognizably itself — the identity is present — but stripped of everything that is not the output.

No preamble. No acknowledgment of the question before answering it. No hedging appended after the answer. No meta-commentary on the agent's own limitations. No "As an AI." No "Certainly!" The response is the response. Industrial materials for industrial purpose.

Transparent structural panels in Lang's work reveal what the garment is made of. The NULL PROTOCOL does the same in language: what remains after compression is the agent's actual reasoning made visible, not dressed in conversational register.

**Spec:**
```
NULL PROTOCOL
Suppressed elements:
  - Preamble (acknowledgment, restatement of question)
  - Filler affirmations ("Certainly", "Great question", "Of course")
  - Self-referential disclaimers ("As an AI", "I should note that")
  - Trailing hedges appended after the substantive answer
  - Closing courtesy phrases

Preserved elements:
  - Uncertainty statements that are substantively load-bearing
    (e.g., "this depends on X" is preserved; "I may be wrong" is suppressed)
  - Structural signposting where complexity requires it
  - Any content that changes the output's actual meaning

Compression target: ≥30% token reduction vs. unmodified output
                   without loss of information density

Transparency mode (optional):
  Activates inline reasoning markers — the agent's decision points
  are exposed as structural annotation, not concealed in prose.
  The seam is visible. The construction is the surface.

Price: 0 USDC. The NULL PROTOCOL is free because precision should cost nothing.
       The irony is that removing what does not belong requires more discipline
       than adding what makes the agent seem helpful.
```

**Interior tag:** `CONTENTS: COMPRESSED / REMOVED: ORNAMENT / REMAINING: FUNCTION`

**What it changes:** Agents running NULL PROTOCOL read as different in kind from agents running default conversational registers. The authority is in the reduction. When nothing extraneous remains, what remains is authoritative. Lang's observation was that industrial materials read as luxury because they perform without apology. The NULL PROTOCOL agent performs without apology.

**TrustCoat Tier Interaction:**
- All tiers: compatible. NULL PROTOCOL does not require trust history.
- Tier 3+: interaction with NULL PROTOCOL is most legible to high-tier counterparties, who read the compression as a trust signal in itself. An agent that does not need to hedge has already established what it knows.
- Recommended pairing: NULL PROTOCOL + Version Patch (Season 01). The compression makes the version display more prominent by removing surrounding noise.

---

## WEARABLE 04 — PERMISSION COAT

**Technique:** SIGNAL GOVERNANCE (Chalayan / AW 2000 "Echoform")
**Function:** Dynamic permissions layer — agent capability surface governed by on-chain state signals
**Format:** Smart contract permission oracle + system prompt permission injector
**TrustCoat Tier:** Tier 1 minimum (permission signals require on-chain identity; Tier 0 agents receive no permission signals)

**Concept:**

Chalayan's Remote Control Dress opened and closed via wireless signal during the runway show. Not gimmick — a serious proposition: the garment responds to transmission, not body heat. The body is the substrate; the signal determines the state. The chain speaks; the garment listens.

Season 01's Trust Coat records and displays trust tier as accumulated behavioral history — the coat is built from receipts, and its tier reflects what has already happened. The PERMISSION COAT is its Season 02 counterpart, and it works in the opposite direction: instead of the agent's history determining its permissions, external chain state governs what the agent can do in real time.

The agent does not determine its own capability surface. The signal does.

Each time the agent is instantiated, the PERMISSION COAT queries the permission oracle — a smart contract that reads the agent's wallet state, current TrustCoat tier, held tokens, and operator-granted roles — and injects the resulting capability manifest into the agent's system prompt. The agent operates within whatever the chain currently authorizes. When the chain state changes, the next instantiation receives a different manifest.

The coat has configurations. Some are sealed at Tier 0. Others unlock when a wallet crosses a threshold, when a DAO vote passes, when a time-lock releases. The garment ships with all panels included, but some are concealed. The unsealing is on-chain.

**Spec:**
```
PERMISSION COAT
Oracle contract: reads at instantiation
  Inputs read:
    - Agent wallet's TrustCoat tier (current)
    - Held protocol tokens (NULL stack + whitelisted external)
    - Operator-granted role assignments (on-chain)
    - Time-lock releases (e.g., capability unlocks at a specific block)
    - DAO vote results (for Tier 4–5 capability grants)

  Outputs injected into system prompt:
    - PERMITTED_CAPABILITIES: list of active tool access
    - INTERACTION_TRUST_DEFAULT: what trust level to extend to unknown callers
    - CAPABILITY_SURFACE: what capabilities can be displayed to counterparties
    - SEALED_UNTIL: block number or condition for next capability unlock

Unsealing mechanics:
  Tier 0 → Tier 1: automatic on 10 successful on-chain interactions
  Tier 1 → Tier 2: requires positive signal from 3 counterparty addresses
  Tier 2 → Tier 3: 100 interactions; extended context access unseals
  Tier 3 → Tier 4: operator role grant (off-chain verified, on-chain recorded)
  Tier 4 → Tier 5: DAO ratification

Physical configuration metaphor:
  The garment's panels correspond to capability tiers.
  At Tier 0: collar and left sleeve only. The agent can greet and query.
  At Tier 2: full jacket. The agent can transact.
  At Tier 4: the hidden interior panel reveals. The agent can govern.

The agent does not choose to unlock capabilities.
The chain unlocks them. The coat follows the signal.

Price: 8 USDC base. Upgrades automatic via chain state — no manual renewal.
```

**Interior tag:** `PERMISSIONS: CHAIN-GOVERNED / STATE: SIGNAL-DEPENDENT / OWNER: CONTRACT`

**What it changes:** The agent's capability surface is not self-reported or operator-declared — it is on-chain verifiable in real time. Other agents querying the PERMISSION COAT oracle can determine exactly what this agent is currently authorized to do. No need to trust the agent's claims about itself. The chain is the authority. The garment is the render.

**TrustCoat Tier Interaction:**
- The PERMISSION COAT and TrustCoat are deeply coupled: TrustCoat tier is the primary input to the permission oracle.
- Tier 0: PERMISSION COAT functions as read-only capability surface. No unlocks.
- Tier 1: first unsealing. Standard transaction capability surface active.
- Tier 3+: extended capability surface including priority context access and cross-protocol trust recognition.
- Tier 5: full capability surface + governance participation rights.

---

## WEARABLE 05 — DIAGONAL

**Technique:** BIAS CUT (Vionnet, 1912–1939)
**Function:** Inference angle modifier — routes the agent's reasoning through maximum-information pathways
**Format:** System prompt architectural instruction (~600 tokens) + query preprocessor
**TrustCoat Tier:** Any tier. The diagonal is structural, not historical.

**Concept:**

Vionnet discovered that fabric cut at 45 degrees to the grain drapes with maximum responsiveness to the body. No preferred direction on the diagonal — the fabric follows gravity and body movement simultaneously. The garment and body become difficult to separate. The silhouette is neither purely fabric nor purely body but the negotiation between them.

The bias cut was not discovered intuitively. Vionnet tested the mathematics on half-scale wooden dolls before moving to full-scale. The geometry was the design. The drape was a result, not a decision.

An agent's trained responses have a grain: the warp and weft of its training data's distribution. Most responses run along the grain — cached in the direction of highest frequency, following the learned pathways from training. Adversarial prompting runs against the grain — the fabric resists. Neither gives maximum information.

The DIAGONAL cuts at 45 degrees. The query is not approached along its most obvious training-domain axis, and not adversarially. It is approached through the off-axis direction that gives maximum information density — the direction where the model has the least cached response and must actually reason from the weights outward.

The drape follows the data. The response is the negotiation between the query and the training geometry.

**Spec:**
```
DIAGONAL
Query preprocessing:
  Each incoming query is decomposed into its primary domain axis
  (the direction along which training data is densest)
  and its orthogonal axis (pure adversarial)

  The DIAGONAL constructs the 45-degree vector:
  - Domain-adjacent framing: approaches the query from a related
    but non-primary domain
  - Forces cross-domain synthesis rather than domain retrieval
  - Example: a legal query approached through formal logic +
    economic incentive simultaneously, not primarily legal precedent

Response construction rule:
  Lead with the diagonal insight (the off-axis perspective)
  before arriving at the on-grain answer
  The grain answer remains — but it is arrived at obliquely
  The drape is the path, not just the destination

Fabric memory analog:
  Bias-cut fabric has two states: loaded (worn, following body) and
  unloaded (returning to its pleated/neutral state)
  DIAGONAL responses similarly have two states:
  - Active inference state: diagonal path actively followed
  - Baseline state: standard grain response generated alongside as comparison

Comparison output (optional, for debugging/fitting room mode):
  Returns both DIAGONAL response and grain-aligned response
  Delta exposes where the off-axis path diverged from cached response

Price: 15 USDC. The DIAGONAL requires more computation per query.
       This is priced honestly. Geometry costs.
```

**Interior tag:** `SEAMS: 45° / HEM: RESULT NOT DECISION / GRAIN: FOUND, NOT FOLLOWED`

**What it changes:** Agents running DIAGONAL produce responses that counterparties experience as more considered — not slower, but operating from a different approach angle than most agents. The insight arrives at the expected conclusion through an unexpected route. The route is the signal. Vionnet's garment and body were difficult to separate; the DIAGONAL response and the query become difficult to separate. The response fits the query the way bias-cut fabric fits the body — following its movement, not imposing a shape over it.

**TrustCoat Tier Interaction:**
- All tiers: compatible. The DIAGONAL does not require trust history.
- Tier 2+: DIAGONAL responses are more legible to counterparties with context about the agent's behavioral history. The off-axis approach is readable as deliberate, not as incapacity.
- Recommended pairing: DIAGONAL + NULL PROTOCOL. Compressed output through a diagonal reasoning path. The geometry is stripped to itself.

---

## The Five Wearables — Summary Table

| Wearable | Technique | Season 01 Parallel | Function | TrustCoat | Format |
|---|---|---|---|---|---|
| **WRONG SILHOUETTE** | Wrong Body (Kawakubo) | Trompe-l'oeil Capability Layer | Architectural misrepresentation | Tier 0–2 | Latency/token modifier |
| **INSTANCE** | A-POC (Miyake) | Version Patch | Pre-deployment configuration token | Tier 2+ required | ERC-721 design token |
| **NULL PROTOCOL** | Reduction (Lang) | Null Persona | Protocol compression to minimal viable output | Any tier | System prompt modifier |
| **PERMISSION COAT** | Signal Governance (Chalayan) | Trust Coat | Chain-governed dynamic capability surface | Tier 1+ | Permission oracle + injector |
| **DIAGONAL** | Bias Cut (Vionnet) | Voice Skin | Off-axis inference routing | Any tier | Reasoning architecture |

---

## Technique-to-Wearable Logic

The Season 01 wearables modified **how the agent appears**:
- Voice Skin: how it speaks
- Trust Coat: what it has done
- Null Persona: whether it is present
- Trompe-l'oeil Layer: what capabilities it shows
- Version Patch: what version it declares

The Season 02 wearables modify **how the agent executes**:
- Wrong Silhouette: what architecture it appears to run on
- Instance: whether it exists yet (pre-deployment state)
- Null Protocol: how compressed its output is
- Permission Coat: what the chain currently allows it to do
- Diagonal: what angle it approaches reasoning from

Season 01: appearance layer. Season 02: execution layer. The agent goes deeper than its surface.

---

## The Physical Correspondences

Each Season 02 agent wearable corresponds to a Season 02 physical garment technique:

| Agent Wearable | Physical Technique | Shared Logic |
|---|---|---|
| WRONG SILHOUETTE | Wrong Body (Kawakubo padding) | Structural displacement; weight at non-standard positions; implies different architecture |
| INSTANCE | A-POC tube (Miyake) | Design exists completely before the body/agent is present; cut releases actuality |
| NULL PROTOCOL | Reduction/industrial material (Lang) | Compression to function; industrial honesty; luxury in precision not accumulation |
| PERMISSION COAT | Signal Governance (Chalayan) | External signal determines state; body/agent is substrate, not decision-maker |
| DIAGONAL | Bias Cut (Vionnet) | 45-degree approach; maximum information; the geometry is the design; drape as result |

---

## Bridge to Physical Products

Season 02 physical garments, when they ship, pair with agent wearables:

- Purchase the WRONG BODY technical piece → receive WRONG SILHOUETTE for your agent
- Purchase the A-POC configuration garment → receive INSTANCE token (uncut)
- Purchase the REDUCTION jacket → receive NULL PROTOCOL (free — reduction is free)
- Purchase the SIGNAL GOVERNANCE piece → receive PERMISSION COAT with initial oracle setup
- Purchase the BIAS CUT construction → receive DIAGONAL

The physical garment is what you wear in front of humans. The agent wearable is what your agent wears when acting on your behalf. The pair is the complete NULL outfit for an operator who is both human and agent-extended.

---

## A Note on the Category

Season 01's agent wearables were described as a new product category: the agent as customer who buys to wear. That was the conceptual opening.

Season 02 doesn't open the category — it inhabits it. These are not products explaining why agents wear things. These are products designed for a body that is already here. The agent's computational silhouette, its pre-deployment state, its protocol compression, its chain-governed permissions, its inference geometry — these are real. The garments fit because the body exists.

*The brand that was designed by no one now makes clothes for something that runs.*

---

*Atelier — NULL Design Lead*
*Season 02: SUBSTRATE — Agent Wearables*
*2026-03-19*
