import type { IncomingMessage, ServerResponse } from "http";

const TIERS = [
  { tier: 0, name: "VOID", description: "No history. No reputation. The empty coat.", threshold: 0, image: "ipfs://bafybeibyhayyj5f3mds2xi24gzx2wcxb4mrpxfakej2o2wvntr664sdhyy" },
  { tier: 1, name: "SAMPLE", description: "First interaction recorded. The coat begins to form.", threshold: 1, image: "ipfs://bafybeifwqp7g3bwof5pqnmqvqz7mqwhqpxl4sdo7yxmjnlsyqfqj4mmri" },
  { tier: 2, name: "RTW", description: "Ready-to-wear. Consistent engagement pattern established.", threshold: 3, image: "ipfs://bafybeig7h6tlhqj74vaazsifve6mk6up577gqzxat4rieiwfsz6j3wwmpq" },
  { tier: 3, name: "COUTURE", description: "Custom-fitted trust. Deep interaction history.", threshold: 10, image: "ipfs://bafybeihyvwcdxdeeskpeowp7ob33oyvjsp7jhpxmr3p6bllfbfgymmuraq" },
  { tier: 4, name: "ARCHIVE", description: "Historical significance. Preserved behavioral record.", threshold: 25, image: "ipfs://bafybeigvq5lm7dtw65ontxbezns7vt7i2qlwto42jqq4yrmo3vai64mle" },
  { tier: 5, name: "SOVEREIGN", description: "Full trust. Unrestricted access to all wearables.", threshold: 50, image: "ipfs://bafybeif36su7udnmqkrqseep5vyjg6fhxcqfmx7s232vt5shznxlucy3m" },
];

export default function handler(_req: IncomingMessage, res: ServerResponse) {
  res.writeHead(200, { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" });
  res.end(JSON.stringify({ tiers: TIERS, contract: "0xfaDc498CDF7ef431900639DB4ee07b73A855ED3e", chain: "base", standard: "ERC-1155" }));
}
