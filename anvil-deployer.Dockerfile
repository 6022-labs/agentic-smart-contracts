# One-shot deployer of the 6022 contracts to a local Anvil chain (see scripts/deploy-anvil.sh); used by agentic-agent-node.
FROM node:22-slim

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npx hardhat compile

ENV ANVIL_RPC_URL=http://evm-node:8545
ENTRYPOINT ["sh", "scripts/deploy-anvil.sh"]
