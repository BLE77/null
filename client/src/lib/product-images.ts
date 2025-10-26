// Import all product images
import x402RobotsImg from "@assets/ChatGPT Image Oct 25, 2025, 04_51_32 PM_1761436509620.png";
import clankersSkullImg from "@assets/ChatGPT Image Oct 25, 2025, 04_49_09 PM_1761436509620.png";
import proveHumanImg from "@assets/prove_1761436638560.png";
import x402CallImg from "@assets/402 call_1761436644815.png";
import clankersBmxImg from "@assets/clankersar_1761436647628.png";
import cyberArmsImg from "@assets/long sleeve_1761436670427.png";

// Map product image URLs to imported images
export const productImageMap: Record<string, string> = {
  "@assets/ChatGPT Image Oct 25, 2025, 04_51_32 PM_1761436509620.png": x402RobotsImg,
  "@assets/ChatGPT Image Oct 25, 2025, 04_49_09 PM_1761436509620.png": clankersSkullImg,
  "@assets/prove_1761436638560.png": proveHumanImg,
  "@assets/402 call_1761436644815.png": x402CallImg,
  "@assets/clankersar_1761436647628.png": clankersBmxImg,
  "@assets/long sleeve_1761436670427.png": cyberArmsImg,
};

export function getProductImage(imageUrl: string): string | undefined {
  return productImageMap[imageUrl];
}
