// Robot figure images for product display
// Map current product names to robot figure assets bundled in attached_assets
export const robotImageMap: Record<string, string> = {
  "BYTE ME": "/attached_assets/fit 1_1761538260908.png",
  "CLANKERS TOKYO": "/attached_assets/fit 2a_1761538260906.png",
  "X402 TIE": "/attached_assets/fit 3a_1761538260907.png",
  "X402 CALL TEE": "/attached_assets/fit 4a_1761538260907.png",
  "CLANKERS BMX HOODIE": "/attached_assets/fit 5_1761538260907.png",
  "PROVE YOU'RE NOT HUMAN": "/attached_assets/fit 8_1761538260907.png",
};

// Additional robot figures that aren't mapped yet
export const extraRobotImages = {
  fit6: "/attached_assets/fit6_1761538260908.png",
  fit7: "/attached_assets/fit 7_1761538260907.png",
  fit8: "/attached_assets/fit 8_1761538260907.png",
  fit9: "/attached_assets/fit 9_1761538260908.png",
  human1: "/attached_assets/human 1_1761538260908.png",
  figure2: "/attached_assets/figure 2_1761538260908.png",
};

// Helper to fetch the robot image for a given product name
export function getRobotImage(productName: string): string | undefined {
  const normalizedName = productName.toUpperCase().trim();
  return robotImageMap[normalizedName];
}
