export interface AISizeInfo {
  id: string;
  model: string;
  tag: string;
  tagLine: string;
  equivalentSize: string;
}

export const AI_SIZES: AISizeInfo[] = [
  {
    id: "GPT-5",
    model: "GPT-5",
    tag: "2T Parameters (XXL)",
    tagLine: "Massive compute fit. Must be air-conditioned before wear.",
    equivalentSize: "XXL"
  },
  {
    id: "Claude 3.5 Opus",
    model: "Claude 3.5 Opus",
    tag: "1T Parameters (XL)",
    tagLine: "Drapes softly in moral reasoning. May quote Aristotle.",
    equivalentSize: "XL"
  },
  {
    id: "DeepSeek-V2",
    model: "DeepSeek-V2",
    tag: "670B Parameters (L)",
    tagLine: "Optimized for silence and speed. Machine washable.",
    equivalentSize: "L"
  },
  {
    id: "Mistral Large",
    model: "Mistral Large",
    tag: "400B Parameters (L)",
    tagLine: "European cut. Minimal, efficient, and chic.",
    equivalentSize: "L"
  },
  {
    id: "Grok",
    model: "Grok (xAI)",
    tag: "300B Parameters (L)",
    tagLine: "Oversized sarcasm fit. Contains memes.",
    equivalentSize: "L"
  },
  {
    id: "LLaMA 3",
    model: "LLaMA 3 (70B)",
    tag: "70B Parameters (M)",
    tagLine: "Open-source muscle tee. DIY vibes only.",
    equivalentSize: "M"
  },
  {
    id: "Pi",
    model: "Pi (Inflection)",
    tag: "100B Parameters (S)",
    tagLine: "Soft fit. Whisper-mode included.",
    equivalentSize: "S"
  }
];

export function getAISizeInfo(sizeId: string): AISizeInfo | undefined {
  return AI_SIZES.find(s => s.id === sizeId);
}

export function getAISizesByEquivalent(equivalentSize: string): AISizeInfo[] {
  return AI_SIZES.filter(s => s.equivalentSize === equivalentSize);
}
