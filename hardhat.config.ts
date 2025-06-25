import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "hardhat-contract-sizer";

import "./tasks/add-signer";
import "./tasks/add-moderator";

require("dotenv").config();

const alchemyKey = process?.env?.ALCHEMY_KEY?.trim() ?? "";
const privateKey = process?.env?.PRIVATE_KEY?.trim() ?? "";
const polygonScanApiKey = process?.env?.POLYGONSCAN_API_KEY?.trim() ?? "";

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
  },
  etherscan: {
    apiKey: {
      polygon: polygonScanApiKey,
      polygonAmoy: polygonScanApiKey,
    },
  },
};

export default config;
