// Robot figure images for product display
// Map current product names to robot figure assets bundled in attached_assets
export const robotImageMap: Record<string, string> = {
  "BYTE ME": "/attached_assets/RobotByte.png",
  "CLANKERS TOKYO": "/attached_assets/RobotTokyo.png",
  "X402 TIE": "/attached_assets/RobotTie.png",
  "X402 CALL TEE": "/attached_assets/RobotCall.png",
  "CLANKERS BMX HOODIE": "/attached_assets/RobotGTA.png",
  "PROVE YOU'RE NOT HUMAN": "/attached_assets/RobotProve.png",
};

// Additional robot figures that aren't mapped yet
export const extraRobotImages = {
  streetCall: "/attached_assets/StreetCall.png",
  streetCall2: "/attached_assets/StreetCall2.png",
  streetGTA: "/attached_assets/StreetGTA.png",
  streetTie: "/attached_assets/StreetTie.mp4",
  streetTokyo: "/attached_assets/StreetTokyo.mp4",
  human1: "/attached_assets/human 1_1761538225955.png",
  figure2: "/attached_assets/figure 2_1761538260908.png",
};

// Helper to fetch the robot image for a given product name
export function getRobotImage(productName: string): string | undefined {
  const normalizedName = productName.toUpperCase().trim();
  return robotImageMap[normalizedName];
}
