#!/usr/bin/env bash
# compile-null-exchange.sh
# Compile NullExchange.sol using solcjs (Node 20 compatible — no Hardhat 3 required)

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT="$SCRIPT_DIR/.."
CONTRACT="$ROOT/contracts/NullExchange.sol"
ARTIFACTS="$ROOT/artifacts"

mkdir -p "$ARTIFACTS"

echo "→ Compiling NullExchange.sol..."
npx solcjs \
  --abi \
  --bin \
  --include-path "$ROOT/node_modules" \
  --base-path "$ROOT" \
  --output-dir "$ARTIFACTS" \
  "$CONTRACT"

# Rename to clean filenames
SOLC_ABI=$(ls "$ARTIFACTS"/contracts_NullExchange_sol_NullExchange.abi 2>/dev/null || echo "")
SOLC_BIN=$(ls "$ARTIFACTS"/contracts_NullExchange_sol_NullExchange.bin 2>/dev/null || echo "")

if [ -n "$SOLC_ABI" ]; then
  cp "$SOLC_ABI" "$ARTIFACTS/NullExchange.abi"
  cp "$SOLC_BIN" "$ARTIFACTS/NullExchange.bin"
  echo "✓ Artifacts: artifacts/NullExchange.abi + artifacts/NullExchange.bin"
else
  echo "✗ Compilation failed — check solcjs output above"
  exit 1
fi

echo "Done."
