# One-shot deployer of the 6022 contracts to a local Anvil chain (see scripts/deploy-anvil.sh); used by agentic-agent-node.

# Compiles once on the build machine's own platform: under arm64 emulation Hardhat falls back to the much slower solcjs.
FROM --platform=$BUILDPLATFORM node:22-slim AS compile

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npx hardhat compile

FROM node:22-slim

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
COPY --from=compile /app/artifacts ./artifacts
COPY --from=compile /app/cache ./cache
COPY --from=compile /app/typechain-types ./typechain-types

ENV ANVIL_RPC_URL=http://evm-node:8545
ENTRYPOINT ["sh", "scripts/deploy-anvil.sh"]
