#!/bin/sh
# Deploys the 6022 contracts to a fresh Anvil chain once; later runs find them and exit.
# EXPECTED_CONTRACTS ("Name=0xaddress,...") fails the run if a contract isn't at the address its consumers hardcode.
set -eu

RPC_URL="${ANVIL_RPC_URL:-http://127.0.0.1:8545}"
DEPLOYER="0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266"

rpc() {
  node -e '
    fetch(process.argv[1], {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: process.argv[2], params: JSON.parse(process.argv[3]) }),
    })
      .then((res) => res.json())
      .then((body) => console.log(body.result))
      .catch(() => process.exit(1));
  ' "$RPC_URL" "$1" "$2"
}

check_expected() {
  for entry in $(echo "${EXPECTED_CONTRACTS:-}" | tr ',' ' '); do
    name="${entry%%=*}"
    expected="$(echo "${entry#*=}" | tr 'A-F' 'a-f')"
    deployed="$(node -p "require('./deployments/anvil/$name.json').address.toLowerCase()" 2>/dev/null || true)"
    if [ -n "$deployed" ] && [ "$deployed" != "$expected" ]; then
      echo "$name was deployed at $deployed, not $expected: update the address its consumers hardcode." >&2
      exit 1
    fi
    if [ "$(rpc eth_getCode "[\"$expected\", \"latest\"]")" = "0x" ]; then
      echo "No contract at $expected for $name: the deploy order changed, or the chain was reset mid-deploy." >&2
      exit 1
    fi
  done
}

until rpc eth_chainId '[]' >/dev/null 2>&1; do
  echo "Waiting for the chain at $RPC_URL..."
  sleep 1
done

if [ "$(rpc eth_getTransactionCount "[\"$DEPLOYER\", \"latest\"]")" != "0x0" ]; then
  echo "The deployer already sent transactions on this chain: checking the contracts."
  check_expected
  exit 0
fi

npx hardhat deploy --network anvil
check_expected
