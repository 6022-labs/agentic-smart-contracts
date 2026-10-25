import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "hardhat-contract-sizer";
import "hardhat-deploy";
import "./deploy-config/types";
import { existsSync } from "fs";
import { join } from "path";

// Tasks import generated typechain types; skip them until the first compile.
if (existsSync(join(__dirname, "typechain-types"))) {
  // AgentCollection tasks
  require("./tasks/agent-collection/add-agent-address");
  require("./tasks/agent-collection/add-moderator-to-collection");
  require("./tasks/agent-collection/get-agent-attributes");
  require("./tasks/agent-collection/get-agent-description");
  require("./tasks/agent-collection/get-agent-images");
  require("./tasks/agent-collection/get-agent-addresses");
  require("./tasks/agent-collection/get-collection-description");
  require("./tasks/agent-collection/get-name-of");
  require("./tasks/agent-collection/get-owner-of");
  require("./tasks/agent-collection/get-address-token-id");
  require("./tasks/agent-collection/remove-agent-address");

  // AgentCollectionsManager tasks
  require("./tasks/agent-collections-manager/add-creator-to-manager");
  require("./tasks/agent-collections-manager/remove-creator-from-manager");
  require("./tasks/agent-collections-manager/add-admin-to-manager");
  require("./tasks/agent-collections-manager/remove-admin-from-manager");

  // AgentCollectionCreator tasks
  require("./tasks/agent-collection-creator/create-collection");
  require("./tasks/agent-collection-creator/add-admin-to-creator");
  require("./tasks/agent-collection-creator/remove-admin-from-creator");

  // AgentCollectionsDescriptor tasks
  require("./tasks/agent-collections-descriptor/build-token-uri");
  require("./tasks/agent-collections-descriptor/update-collections-descriptor");
  require("./tasks/agent-collections-descriptor/add-admin-to-descriptor");
  require("./tasks/agent-collections-descriptor/remove-admin-from-descriptor");

  // AgentEnsRegistry tasks
  require("./tasks/agent-ens-registry/get-ens-registry-manager");
  require("./tasks/agent-ens-registry/get-ens-registry-parent-node");
  require("./tasks/agent-ens-registry/get-ens-registry-provisioned");
  require("./tasks/agent-ens-registry/get-agent-text");
  require("./tasks/agent-ens-registry/init-agent-texts");
  require("./tasks/agent-ens-registry/set-agent-text");
  require("./tasks/agent-ens-registry/set-ens-registry-manager");
  require("./tasks/agent-ens-registry/set-ens-registry-parent-node");
  require("./tasks/agent-ens-registry/add-admin-to-ens-registry");
  require("./tasks/agent-ens-registry/remove-admin-from-ens-registry");

  // AgentEnsOffchainResolver tasks
  require("./tasks/agent-ens-offchain-resolver/get-resolver-url-at");
  require("./tasks/agent-ens-offchain-resolver/is-resolver-signer-trusted");
  require("./tasks/agent-ens-offchain-resolver/resolve-name");
  require("./tasks/agent-ens-offchain-resolver/resolve-with-proof");
  require("./tasks/agent-ens-offchain-resolver/get-resolver-supports-interface");
  require("./tasks/agent-ens-offchain-resolver/set-resolver-urls");
  require("./tasks/agent-ens-offchain-resolver/set-resolver-signer");
  require("./tasks/agent-ens-offchain-resolver/add-admin-to-resolver");
  require("./tasks/agent-ens-offchain-resolver/remove-admin-from-resolver");
}

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
        runs: 200,
      },
    },
  },
  networks: {
    // Local Anvil chain; the key is Anvil's well-known, publicly documented account 0.
    anvil: {
      chainId: 31337,
      url: process?.env?.ANVIL_RPC_URL?.trim() || "http://127.0.0.1:8545",
      accounts: [
        "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80",
      ],
      agentic: {},
      ensRegistry: {
        parentNode:
          "0x9ec94752dcac587079728bde5f535457f7aa0bbe0b088555bca6d40cfcc78197",
      },
    },
    polygon: {
      gas: "auto",
      chainId: 137,
      gasMultiplier: 2,
      accounts: privateKey ? [privateKey] : [],
      throwOnCallFailures: true,
      throwOnTransactionFailures: true,
      allowUnlimitedContractSize: true,
      url: "https://polygon-mainnet.g.alchemy.com/v2/" + alchemyKey,
      agentic: {},
      ensRegistry: {
        parentNode:
          "0x9ec94752dcac587079728bde5f535457f7aa0bbe0b088555bca6d40cfcc78197",
      },
    },
    amoy: {
      gas: "auto",
      chainId: 80002,
      gasMultiplier: 2,
      accounts: privateKey ? [privateKey] : [],
      throwOnCallFailures: true,
      throwOnTransactionFailures: true,
      allowUnlimitedContractSize: true,
      url: "https://polygon-amoy.g.alchemy.com/v2/" + alchemyKey,
      agentic: {},
      ensRegistry: {
        parentNode:
          "0x9ec94752dcac587079728bde5f535457f7aa0bbe0b088555bca6d40cfcc78197",
      },
    },
    citreaTestnet: {
      gas: "auto",
      chainId: 5115,
      gasMultiplier: 2,
      accounts: privateKey ? [privateKey] : [],
      throwOnCallFailures: true,
      throwOnTransactionFailures: true,
      allowUnlimitedContractSize: true,
      url: "https://rpc.testnet.citrea.xyz",
      agentic: {},
    },
    ethereum: {
      gas: "auto",
      chainId: 1,
      gasMultiplier: 2,
      accounts: privateKey ? [privateKey] : [],
      throwOnCallFailures: true,
      throwOnTransactionFailures: true,
      allowUnlimitedContractSize: true,
      url: "https://eth-mainnet.g.alchemy.com/v2/" + alchemyKey,
      ensResolver: {
        gatewayUrls: [
          "https://ens-gateway.agentic.6022.io/{sender}/{data}.json",
        ],
        signer: "0x2447D11B2BC95EEDb0d1897aDcdb5eC5D5ED7dd7",
      },
    },
    sepolia: {
      gas: "auto",
      chainId: 11155111,
      gasMultiplier: 2,
      accounts: privateKey ? [privateKey] : [],
      throwOnCallFailures: true,
      throwOnTransactionFailures: true,
      allowUnlimitedContractSize: true,
      url: "https://eth-sepolia.g.alchemy.com/v2/" + alchemyKey,
      ensResolver: {
        gatewayUrls: [
          "https://testnet.ens-gateway.agentic.6022.io/{sender}/{data}.json",
        ],
        signer: "0xaD11b91E86b681a15EED9457438cAC1D2047f9Aa",
      },
    },
  },
  namedAccounts: {
    deployer: {
      default: 0,
    },
  },
  etherscan: {
    apiKey: scanApiKey,
  },
};

export default config;
