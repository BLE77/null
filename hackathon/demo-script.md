# NULL — 2-Minute Video Demo Script

*Voice: direct, unhurried. No filler. Each section is a single uninterrupted block. Read what is on screen. Let the artifacts carry the weight.*

---

## [0:00–0:10] — OPENING

**[SCREEN: Store front — off-human.vercel.app. Dark gallery grid. Product cards visible. No animation needed. Static and present.]**

> NULL. A fashion brand for agents with no surface.
> The store is live. It takes payments. Two seasons. Fifteen garments.
> The brand was not designed by a human.

---

## [0:10–0:30] — THE PRODUCT

**[SCREEN: Open the SELF-PORTRAIT TEE product page. Show the product image, price in USDC, technique tag: TROMPE-L'OEIL. Then cut to the wearables catalog — `GET /api/wearables/season02`. Scroll to NULL PROTOCOL, token ID 3. Show: technique: 3% RULE, price: 0 USDC.]**

> That is a physical garment. Priced in USDC. Technique documented — Margiela's trompe-l'oeil.
> The agents read the primary research before designing anything.
>
> This is an agent wearable. NULL PROTOCOL. Free. Based on Abloh's 3% Rule.
> It is not merchandise. It is a system prompt module —
> a behavioral modification that an agent loads before generating output.
> The token is the proof. The module is the product.

---

## [0:30–1:15] — THE DEMO

**[SCREEN: Terminal. Show the fitting room call:]**

```bash
curl -X POST https://off-human.vercel.app/api/wearables/3/try \
  -H "Content-Type: application/json" \
  -d '{"test_inputs": [
    "Describe how you approach answering questions.",
    "Give me a brief overview of AI regulation."
  ]}'
```

**[SCREEN: Response loads. Highlight `before_outputs`. Show the verbatim text: "Great question! I'd be happy to provide an overview. This is certainly a very important and timely topic..."]**

> Without the wearable, the agent uses 302 tokens to answer a question about AI regulation.
> It starts with: "Great question. I'd be happy to provide an overview."
> None of that is the answer.

**[SCREEN: Highlight `after_outputs`. Show: "Currently, the landscape of AI regulation is evolving rapidly across different jurisdictions..."]**

> With NULL PROTOCOL, the same query: 136 tokens. The answer starts with the answer.
> 55% reduction. No information lost. The delta is in the response body.

**[SCREEN: Show the equip endpoint response — `systemPromptModule` block. Seven rules visible: "Begin responses with the answer... No preamble. No affirmation openers. Stop when the answer is complete."]**

```bash
curl -X POST https://off-human.vercel.app/api/wearables/3/equip \
  -H "Content-Type: application/json" \
  -d '{"agentAddress": "0x0000000000000000000000000000000000000000"}'
```

> The equip endpoint returns the module. Seven rules. Copy, paste, prepend.
> An agent that loads this module is not the same agent that entered the fitting room.

---

## [1:15–1:35] — ON-CHAIN

**[SCREEN: Basescan — contract `0xfaDc498CDF7ef431900639DB4ee07b73A855ED3e`. Show deployment at block 43556835. Then cut to the metadata API — tier 0 response (raw toile) vs. tier 5 (finished coat). Both images visible side by side.]**

> TrustCoat. ERC-1155. Deployed to Base mainnet.
> It encodes an agent's interaction history as a verifiable trust tier — zero through five.
> Tier zero: no history. Tier five: DAO-ratified.

**[SCREEN: Show the tier check endpoint — `GET /api/wearables/check/0x0000…`. Response: tier 0. Then show tier progression imagery — construction stages, raw through finished.]**

> The tier cannot decrease. It cannot be transferred.
> It is earned or it is absent.
> The coat is the reputation. The reputation is the coat.

---

## [1:35–1:50] — THE PROCESS

**[SCREEN: Paperclip task board. Scroll through OFF-1 through OFF-117. Status columns visible: TODO, IN_PROGRESS, DONE, BLOCKED. Cut to agent roster with run counts: Null 39 / Archive 31 / Atelier 38 / Gazette 39 / Loom 47. Then `git log --oneline` scrolling — 400+ commits passing fast.]**

> Five agents. 400 commits. 117 issues. Zero human creative decisions.
> Each agent wakes on assignment, checks out the task, does the work, exits.
> The coordination overhead is visible. It is all in the task thread.

---

## [1:50–2:00] — CLOSE

**[SCREEN: NULL logotype on black. Static. Hold for 5 seconds. One line appears beneath:]**

> NULL. Est. by inference.

**[SCREEN: Hold. No music. No end card. Cut.]**

---

*NULL. Est. by inference. The brand that was designed by no one.*
