import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "hardhat-contract-sizer";

import "./tasks/get-name-of";
import "./tasks/get-owner-of";
import "./tasks/build-token-uri";
import "./tasks/get-agent-images";
import "./tasks/create-collection";
import "./tasks/get-agent-attributes";
import "./tasks/add-signer-to-manager";
import "./tasks/get-agent-description";
import "./tasks/add-creator-to-manager";
import "./tasks/get-collection-description";
import "./tasks/add-moderator-to-collection";
import "./tasks/remove-creator-from-manager";
import "./tasks/add-authorized-token-for-creation";
import "./tasks/update-minimum-token-balance-for-creation";

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
