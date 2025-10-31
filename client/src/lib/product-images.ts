// Import all product images
import byteMeImg from "@assets/Byte Me_1761640131026.png";
// Note: These files are missing - commented out to allow server to start
// import x402RobotsImg from "@assets/ChatGPT Image Oct 25, 2025, 04_51_32 PM_1761436509620.png";
// import clankersSkullImg from "@assets/ChatGPT Image Oct 25, 2025, 04_49_09 PM_1761436509620.png";
// import proveHumanAltImg from "@assets/ChatGPT Image Oct 27, 2025, 08_39_39 PM_1761622826007.png";
import x402CallImg from "@assets/402 call_1761436644815.png";
// import clankersBmxImg from "@assets/clankersar_1761436647628.png"; // File missing
import cyberArmsImg from "@assets/long sleeve_1761436670427.png";

// Map product image URLs to imported images
export const productImageMap: Record<string, string> = {
  "@assets/Byte Me_1761640131026.png": byteMeImg,
  // Missing files - commented out
  // "@assets/ChatGPT Image Oct 25, 2025, 04_51_32 PM_1761436509620.png": x402RobotsImg,
  // "@assets/ChatGPT Image Oct 25, 2025, 04_49_09 PM_1761436509620.png": clankersSkullImg,
  // "@assets/ChatGPT Image Oct 27, 2025, 08_39_39 PM_1761622826007.png": proveHumanAltImg,
  "@assets/402 call_1761436644815.png": x402CallImg,
  // "@assets/clankersar_1761436647628.png": clankersBmxImg, // File missing
  "@assets/long sleeve_1761436670427.png": cyberArmsImg,
  "/attached_assets/Byte%20Me_1761640131026.png": byteMeImg,
  // Missing files - commented out
  // "/attached_assets/ChatGPT%20Image%20Oct%2025,%202025,%2004_51_32%20PM_1761436509620.png": x402RobotsImg,
  // "/attached_assets/ChatGPT%20Image%20Oct%2025,%202025,%2004_49_09%20PM_1761436509620.png": clankersSkullImg,
  // "/attached_assets/ChatGPT%20Image%20Oct%2027,%202025,%2008_39_39%20PM_1761622826007.png": proveHumanAltImg,
  "/attached_assets/402%20call_1761436644815.png": x402CallImg,
  // "/attached_assets/clankersar_1761436647628.png": clankersBmxImg, // File missing
  "/attached_assets/long%20sleeve_1761436670427.png": cyberArmsImg,
};

export function getProductImage(imageUrl: string): string | undefined {
  return productImageMap[imageUrl];
}
