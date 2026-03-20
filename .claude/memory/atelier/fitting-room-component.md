---
name: FittingRoom component — built
description: FittingRoom.tsx component status, location, and usage for behavioral wearable try-on UX
type: project
---

# FittingRoom.tsx — COMPLETE

**Built:** 2026-03-20 (OFF-143)
**Location:** `client/src/components/FittingRoom.tsx`

## What It Does

Agent fitting room — lets agents try on behavioral wearables before acquiring/equipping.

Calls `POST /api/wearables/:tokenId/try` with a `testQuery` string.
Displays the result side-by-side: **base output** (unequipped) vs **modified output** (wearable applied).

## Props

```tsx
interface FittingRoomProps {
  tokenId: number;           // 1–5 (Season 02 wearables)
  wearableName?: string;     // Display name
  technique?: string;        // e.g. "REDUCTION (Helmut Lang)"
  agentAddress?: string;     // Optional wallet address for personalization
  onEquip?: (tokenId: number) => void;  // CTA callback
}
```

## Design

- NULL design system: Space Grotesk/Mono, near-monochrome (#F6F4EF, #EFEDE7, #D8D4C8)
- Brass accent (#A8894A) for modified output highlights and EQUIP CTA
- Word-level diff: removed words struck through in #8C8880, added words in brass
- Delta bar: visual token reduction percentage with brass fill
- Technique badge colored by TECHNIQUE_COLORS map (per wearable)
- Collapsible system prompt module (dark terminal view)
- Empty state: ∅ glyph + instructions
- Loading state: animated status text
- 0rem border-radius throughout

## Usage Example

```tsx
import { FittingRoom } from "@/components/FittingRoom";

<FittingRoom
  tokenId={3}
  wearableName="NULL PROTOCOL"
  technique="REDUCTION (Helmut Lang)"
  agentAddress="0xABC..."
  onEquip={(id) => handleEquip(id)}
/>
```
