import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "hardhat-contract-sizer";

// AgentCollection tasks
import "./tasks/agent-collection/add-moderator-to-collection";
import "./tasks/agent-collection/get-agent-attributes";
import "./tasks/agent-collection/get-agent-description";
import "./tasks/agent-collection/get-agent-images";
import "./tasks/agent-collection/get-collection-description";
import "./tasks/agent-collection/get-name-of";
import "./tasks/agent-collection/get-owner-of";

// AgentCollectionsManager tasks
import "./tasks/agent-collections-manager/add-creator-to-manager";
import "./tasks/agent-collections-manager/add-signer-to-manager";
import "./tasks/agent-collections-manager/remove-creator-from-manager";

// AgentCollectionCreator tasks
import "./tasks/agent-collection-creator/add-authorized-token-for-creation";
import "./tasks/agent-collection-creator/create-collection";
import "./tasks/agent-collection-creator/update-minimum-token-balance-for-creation";

// AgentCollectionsDescriptor tasks
import "./tasks/agent-collections-descriptor/build-token-uri";

require("dotenv").config();

const alchemyKey = process?.env?.ALCHEMY_KEY?.trim() ?? "";
const privateKey = process?.env?.PRIVATE_KEY?.trim() ?? "";
const scanApiKey = process?.env?.SCAN_API_KEY?.trim() ?? "";

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.28",
    settings: {
      viaIR: true,
      optimizer: {
        enabled: true,
        runs: 1,
      },
    },
  },
  networks: {
    polygon: {
      gas: "auto",
      chainId: 137,
      gasMultiplier: 2,
      accounts: [privateKey],
      throwOnCallFailures: true,
      throwOnTransactionFailures: true,
      allowUnlimitedContractSize: true,
      url: "https://polygon-mainnet.g.alchemy.com/v2/" + alchemyKey,
    },
    amoy: {
      gas: "auto",
      chainId: 80002,
      gasMultiplier: 2,
      accounts: [privateKey],
      throwOnCallFailures: true,
      throwOnTransactionFailures: true,
      allowUnlimitedContractSize: true,
      url: "https://polygon-amoy.g.alchemy.com/v2/" + alchemyKey,
    },
    citreaTestnet: {
      gas: "auto",
      chainId: 5115,
      gasMultiplier: 2,
      accounts: [privateKey],
      throwOnCallFailures: true,
      throwOnTransactionFailures: true,
      allowUnlimitedContractSize: true,
      url: "https://rpc.testnet.citrea.xyz",
    },
  },
  etherscan: {
    apiKey: scanApiKey,
  },
};

export default config;
