import type { IncomingMessage, ServerResponse } from "http";

const SEASON_02_WEARABLES = [
  { tokenId: 1, name: "WRONG SILHOUETTE", technique: "THE WRONG BODY (Kawakubo)", price: "18.00", description: "Architectural misrepresentation layer. Repositions observable processing weight.", tierRequired: 0 },
  { tokenId: 2, name: "INSTANCE", technique: "A-POC (Miyake)", price: "25.00", description: "Pre-deployment configuration token. Complete parameterization before instantiation.", tierRequired: 2 },
  { tokenId: 3, name: "NULL PROTOCOL", technique: "REDUCTION (Helmut Lang)", price: "0.00", description: "Interaction compression. 30% token reduction without information loss.", tierRequired: 0 },
  { tokenId: 4, name: "PERMISSION COAT", technique: "SIGNAL GOVERNANCE (Chalayan)", price: "8.00", description: "Dynamic permissions layer. Capability surface governed by on-chain state.", tierRequired: 1 },
  { tokenId: 5, name: "DIAGONAL", technique: "BIAS CUT (Vionnet)", price: "15.00", description: "Off-axis inference angle. Maximum information density from least cached direction.", tierRequired: 0 },
];

export default function handler(_req: IncomingMessage, res: ServerResponse) {
  res.writeHead(200, { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" });
  res.end(JSON.stringify({ season: "02", collection: "SUBSTRATE", contract: "0xEb5D5e7b320E2a7cb762EB90a0335f59d54031D1", wearables: SEASON_02_WEARABLES }));
}
