/**
 * compile-null-identity.mjs
 * Compile NullIdentity.sol with solcjs (Node 20 compatible, no Hardhat required).
 *
 * Usage:
 *   node scripts/compile-null-identity.mjs
 *
 * Output:
 *   artifacts/NullIdentity.abi
 *   artifacts/NullIdentity.bin
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { createRequire } from "module";
import { fileURLToPath } from "url";
import path from "path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const require   = createRequire(import.meta.url);

const solc = require("solc");

const SOURCE_PATH   = path.join(__dirname, "..", "contracts", "NullIdentity.sol");
const ARTIFACTS_DIR = path.join(__dirname, "..", "artifacts");
const ABI_OUT       = path.join(ARTIFACTS_DIR, "NullIdentity.abi");
const BIN_OUT       = path.join(ARTIFACTS_DIR, "NullIdentity.bin");

const source = readFileSync(SOURCE_PATH, "utf8");

const input = {
  language: "Solidity",
  sources: {
    "NullIdentity.sol": { content: source },
  },
  settings: {
    outputSelection: {
      "*": { "*": ["abi", "evm.bytecode"] },
    },
    optimizer: { enabled: true, runs: 200 },
  },
};

console.log("Compiling NullIdentity.sol...");
const output = JSON.parse(solc.compile(JSON.stringify(input)));

const errors = (output.errors ?? []).filter((e) => e.severity === "error");
if (errors.length > 0) {
  errors.forEach((e) => console.error(e.formattedMessage));
  process.exit(1);
}

const warnings = (output.errors ?? []).filter((e) => e.severity === "warning");
warnings.forEach((w) => console.warn(w.formattedMessage));

const contract = output.contracts["NullIdentity.sol"]["NullIdentity"];
const abi      = JSON.stringify(contract.abi, null, 2);
const bin      = contract.evm.bytecode.object;

if (!existsSync(ARTIFACTS_DIR)) mkdirSync(ARTIFACTS_DIR, { recursive: true });

writeFileSync(ABI_OUT, abi);
writeFileSync(BIN_OUT, bin);

console.log(`✓  ABI → artifacts/NullIdentity.abi`);
console.log(`✓  BIN → artifacts/NullIdentity.bin`);
console.log(`   Bytecode size: ${bin.length / 2} bytes`);
