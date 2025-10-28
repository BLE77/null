export interface AISizeInfo {
  id: string;
  tag: string;
  tagLine: string;
}

export const AI_SIZES: AISizeInfo[] = [
  {
    id: "S",
    tag: "S",
    tagLine: "100B-300B Parameters"
  },
  {
    id: "M",
    tag: "M",
    tagLine: "70B-2T Parameters"
  },
  {
    id: "L",
    tag: "L",
    tagLine: "400B-670B Parameters"
  },
  {
    id: "XL",
    tag: "XL",
    tagLine: "1T-2T Parameters"
  }
];

export function getAISizeInfo(sizeId: string): AISizeInfo | undefined {
  return AI_SIZES.find(s => s.id === sizeId);
}
