# Agentic Smart Contracts

[![Contracts Tests](https://github.com/6022-labs/agentic-smart-contracts/actions/workflows/contracts-tests.yml/badge.svg)](https://github.com/6022-labs/agentic-smart-contracts/actions/workflows/contracts-tests.yml)
[![Slither](https://github.com/6022-labs/agentic-smart-contracts/actions/workflows/slither.yml/badge.svg)](https://github.com/6022-labs/agentic-smart-contracts/actions/workflows/slither.yml)
[![Coverage Status](https://coveralls.io/repos/github/6022-labs/agentic-smart-contracts/badge.svg?branch=main)](https://coveralls.io/github/6022-labs/agentic-smart-contracts?branch=main)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

On-chain identity for AI agents. Each agent is an ERC721 token carrying a unique
ENS-compatible name, typed addresses (at least one EVM wallet), images and
attributes — discoverable through ENS via CCIP-Read (ERC-3668).

Part of the [6022 agentic ecosystem](https://docs.agentic.6022.io).

## Architecture

| Contract | Role |
|---|---|
| `AgentCollectionV1` | ERC721 collection of agents. Direct mint when no moderators are set, proposal + approval flow when they are. Agent data (name, addresses, images, attributes) lives on-chain. |
| `AgentCollectionCreatorV1` | Factory. Anyone can create a collection — deployed as an EIP-1167 minimal clone of the `AgentCollectionV1` implementation. |
| `AgentCollectionsManager` | Registry of collections. Enforces unique names/symbols, paginated lookups for UIs. |
| `AgentCollectionsDescriptor` | Builds `tokenURI` metadata (base64 JSON, RFC 8259-escaped), resolves bare IPFS CIDs through a configurable gateway. |
| `AgentEnsRegistry` | Source of truth for agent ENS text records on the collection chain. `avatar` and `addr` are derived live from the agent's collection so they can never drift. |
| `AgentEnsOffchainResolver` | ERC-3668 / ENSIP-10 resolver on the ENS chain. `resolve` sends clients to the CCIP-Read gateway; `resolveWithProof` verifies the gateway's signed response. |

Name resolution flow: `<agent>.<collection>.<chainId>.<parent>` → resolver on
Ethereum reverts with `OffchainLookup` → gateway reads `AgentEnsRegistry` on the
collection chain → signed response verified on-chain.

Key invariants (enforced for the token's lifetime, not just at mint):

- Agent names are unique per collection and valid ENS labels.
- Every agent has at least one EVM address — its guaranteed entry point.
- Every agent carries a `default` image and a `role` attribute.

## Deployments

| Network | Contract | Address |
|---|---|---|
| Polygon Amoy | `AgentCollectionsManager` | `0x8095A0D4bE42A61db9e609aA693f516044Bda990` |
| Polygon Amoy | `AgentCollectionCreatorV1` | `0x94EbaBD4796D0A8d1d416B6696559dE2C5E9F0a1` |
| Polygon Amoy | `AgentCollectionsDescriptor` | `0x21D3E43A8b057609C3DC8f12dd3861fD2560754A` |
| Polygon Amoy | `AgentCollectionV1` (implementation) | `0x7dFF34CceE40bc70910C001552b83C8800a69Ef8` |
| Polygon Amoy | `AgentEnsRegistry` | `0x37c5879529E5b0241663ed40feeebb2326BBEE0d` |
| Sepolia | `AgentEnsOffchainResolver` | `0xa3f6011779B55BB155BDAcd25Dd5Bcb9f5597646` |

The full deployment records (ABIs included) live in [`deployments/`](deployments/).

## Getting started

```shell
npm ci
npx hardhat compile
npx hardhat test
```

Coverage and gas reports:

```shell
npx hardhat coverage
REPORT_GAS=true npx hardhat test
```

Static analysis (config in `slither.config.json`, CI fails on medium+ findings):

```shell
slither . --ignore-compile
```

## Deploying

Copy `.env.example` to `.env` and fill in `PRIVATE_KEY`, `ALCHEMY_KEY` and
`SCAN_API_KEY`. Per-network parameters (ENS parent node, gateway URLs, signer)
live in the `networks` section of `hardhat.config.ts`; each `deploy/` script
skips itself on networks where its config is absent, so the network selects
what gets deployed (core + registry on polygon/amoy, core on citreaTestnet,
resolver on ethereum/sepolia).

```shell
npx hardhat deploy --network <NETWORK>

# Only a subset, or force a fresh deploy
npx hardhat deploy --network <NETWORK> --tags core
npx hardhat deploy --network <NETWORK> --reset

# Verify on the block explorer
npx hardhat etherscan-verify --network <NETWORK>
```

The Creator deployment automatically grants it `CREATOR_ROLE` on the Manager.

## Tasks

Operational tasks are registered per contract under [`tasks/`](tasks/) —
collection reads/writes, manager role administration, ENS registry text
records, resolver signer/URL management. List them with:

```shell
npx hardhat --help
```

Tasks appear after the first `npx hardhat compile` (they depend on generated
typechain bindings).

## CI

Every push and pull request to `main` runs build, unit tests, coverage and
slither (`.github/workflows/`).

## License

MIT — see [LICENSE](LICENSE).
