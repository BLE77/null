// Robot figure images for product display
// Map product names to robot figure image paths
export const robotImageMap: Record<string, string> = {
  "X402 PROTOCOL TEE": "/attached_assets/fit 1_1761538260908.png",           // Robot with circuit tie
  "CLANKERS TOKYO": "/attached_assets/fit 2a_1761538260906.png",             // Robot with green skull tee
  "PROVE YOU'RE NOT HUMAN": "/attached_assets/fit 9_1761538260908.png",      // Robot with pixel "not human" tee
  "X402 CALL TEE": "/attached_assets/fit 4a_1761538260907.png",              // Robot with X402 call tee
  "CLANKERS BMX HOODIE": "/attached_assets/fit 3a_1761538260907.png",        // Robot with BMX hoodie
  "CYBER ARMS LONGSLEEVE": "/attached_assets/fit 5_1761538260907.png",       // Robot with cyber arms design
};

// Additional robot figures (not currently mapped to products)
export const extraRobotImages = {
  fit6: "/attached_assets/fit6_1761538260908.png",   // Anti Human Robot Club sweatshirt
  fit7: "/attached_assets/fit 7_1761538260907.png",   // Kiss Me I'm a Clanker green tee
  fit8: "/attached_assets/fit 8_1761538260907.png",   // DARE to keep kids off robots
  human1: "/attached_assets/human 1_1761538260908.png", // Human model with I ♥ CLANKERS
  figure2: "/attached_assets/figure 2_1761538260908.png" // Naked F.O2 robot
};

// Helper function to get robot image for a product
export function getRobotImage(productName: string): string | undefined {
  // Normalize the product name to uppercase and trim whitespace
  const normalizedName = productName.toUpperCase().trim();
  return robotImageMap[normalizedName];
}
