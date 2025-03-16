import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import addSigner from "./tasks/add-signer";

require("dotenv").config();

addSigner.setDescription("Add a signer to a collection");

const infuraKey = process?.env?.INFURA_KEY?.trim() ?? "";
const privateKey = process?.env?.PRIVATE_KEY?.trim() ?? "";
const polygonScanApiKey = process?.env?.POLYGONSCAN_API_KEY?.trim() ?? "";

const config: HardhatUserConfig = {
  solidity: "0.8.28",
  networks: {
    polygon: {
      gas: "auto",
      chainId: 137,
      gasMultiplier: 2,
      accounts: [privateKey],
      throwOnCallFailures: true,
      throwOnTransactionFailures: true,
      allowUnlimitedContractSize: true,
      url: "https://polygon-mainnet.infura.io/v3/" + infuraKey,
    },
    amoy: {
      gas: "auto",
      chainId: 80002,
      gasMultiplier: 2,
      accounts: [privateKey],
      throwOnCallFailures: true,
      throwOnTransactionFailures: true,
      allowUnlimitedContractSize: true,
      url: "https://polygon-amoy.infura.io/v3/" + infuraKey,
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
