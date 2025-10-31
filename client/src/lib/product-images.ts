// Import product imagery
import prodByteImg from "@assets/ProdByte.png";
import prodCallImg from "@assets/ProdCall.png";
import prodGtaImg from "@assets/ProdGTA.png";
import prodProveImg from "@assets/ProdProve.png";
import prodTieImg from "@assets/ProdTie.png";
import prodTokyoImg from "@assets/ProdTokyo.png";

// Map product image URLs (as stored in the database) to bundled images
export const productImageMap: Record<string, string> = {
  "/attached_assets/ProdByte.png": prodByteImg,
  "@assets/ProdByte.png": prodByteImg,
  "/attached_assets/ProdCall.png": prodCallImg,
  "@assets/ProdCall.png": prodCallImg,
  "/attached_assets/ProdGTA.png": prodGtaImg,
  "@assets/ProdGTA.png": prodGtaImg,
  "/attached_assets/ProdProve.png": prodProveImg,
  "@assets/ProdProve.png": prodProveImg,
  "/attached_assets/ProdTie.png": prodTieImg,
  "@assets/ProdTie.png": prodTieImg,
  "/attached_assets/ProdTokyo.png": prodTokyoImg,
  "@assets/ProdTokyo.png": prodTokyoImg,
};

export function getProductImage(imageUrl: string): string | undefined {
  return productImageMap[imageUrl];
}
