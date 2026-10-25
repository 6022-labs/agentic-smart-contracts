#!/bin/sh
# Deploys the 6022 contracts to a fresh Anvil chain once; later runs find them and exit.
# EXPECTED_CONTRACTS ("Name=0xaddress,...") fails the run if a contract isn't at the address its consumers hardcode.
set -eu

RPC_URL="${ANVIL_RPC_URL:-http://127.0.0.1:8545}"
DEPLOYER="0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266"
: "${EXPECTED_CONTRACTS:?EXPECTED_CONTRACTS must list the addresses consumers hardcode (Name=0xaddress,...)}"

rpc() {
  node -e '
    fetch(process.argv[1], {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: process.argv[2], params: JSON.parse(process.argv[3]) }),
    })
      .then((res) => res.json())
      .then((body) => {
        if (body.error || body.result === undefined) {
          console.error(`${process.argv[2]} failed: ${JSON.stringify(body.error ?? body)}`);
          process.exit(1);
        }
        console.log(body.result);
      })
      .catch((err) => {
        console.error(`${process.argv[2]} failed: ${err.message}`);
        process.exit(1);
      });
  ' "$RPC_URL" "$1" "$2"
}

check_expected() {
  for entry in $(echo "$EXPECTED_CONTRACTS" | tr ',' ' '); do
    name="${entry%%=*}"
    expected="$(echo "${entry#*=}" | tr 'A-F' 'a-f')"
    deployed="$(node -p "require('./deployments/anvil/$name.json').address.toLowerCase()" 2>/dev/null || true)"
    if [ -n "$deployed" ] && [ "$deployed" != "$expected" ]; then
      echo "$name was deployed at $deployed, not $expected: update the address its consumers hardcode." >&2
      exit 1
    fi
    code="$(rpc eth_getCode "[\"$expected\", \"latest\"]")"
    if [ "$code" = "0x" ]; then
      echo "No contract at $expected for $name: the deploy order changed, or the chain was reset mid-deploy." >&2
      exit 1
    fi
  done
}

attempts=0
until chain_id="$(rpc eth_chainId '[]' 2>/dev/null)"; do
  attempts=$((attempts + 1))
  if [ "$attempts" -ge 60 ]; then
    echo "No chain answered at $RPC_URL after 60s." >&2
    exit 1
  fi
  echo "Waiting for the chain at $RPC_URL..."
  sleep 1
done
if [ "$chain_id" != "0x7a69" ]; then
  echo "The chain at $RPC_URL has id $chain_id, not 31337: refusing to deploy." >&2
  exit 1
fi

nonce="$(rpc eth_getTransactionCount "[\"$DEPLOYER\", \"latest\"]")"
if [ "$nonce" != "0x0" ]; then
  echo "The deployer already sent transactions on this chain: checking the contracts."
  check_expected
  exit 0
fi

npx hardhat deploy --network anvil
check_expected
