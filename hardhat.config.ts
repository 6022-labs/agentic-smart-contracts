import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "hardhat-contract-sizer";
import "hardhat-deploy";
import "./deploy-config/types";

// AgentCollection tasks
import "./tasks/agent-collection/add-agent-wallet";
import "./tasks/agent-collection/add-moderator-to-collection";
import "./tasks/agent-collection/get-agent-attributes";
import "./tasks/agent-collection/get-agent-description";
import "./tasks/agent-collection/get-agent-images";
import "./tasks/agent-collection/get-agent-wallets";
import "./tasks/agent-collection/get-collection-description";
import "./tasks/agent-collection/get-name-of";
import "./tasks/agent-collection/get-owner-of";
import "./tasks/agent-collection/get-wallet-token-id";
import "./tasks/agent-collection/remove-agent-wallet";

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
import "./tasks/agent-collections-descriptor/update-collections-descriptor";

// AgentEnsRegistry tasks
import "./tasks/agent-ens-registry/get-ens-registry-manager";
import "./tasks/agent-ens-registry/get-ens-registry-parent-node";
import "./tasks/agent-ens-registry/get-ens-registry-provisioned";
import "./tasks/agent-ens-registry/get-agent-text";
import "./tasks/agent-ens-registry/init-agent-texts";
import "./tasks/agent-ens-registry/set-agent-text";
import "./tasks/agent-ens-registry/set-ens-registry-manager";
import "./tasks/agent-ens-registry/set-ens-registry-parent-node";
import "./tasks/agent-ens-registry/add-admin-to-ens-registry";
import "./tasks/agent-ens-registry/remove-admin-from-ens-registry";

// AgentEnsOffchainResolver tasks
import "./tasks/agent-ens-offchain-resolver/get-resolver-url-at";
import "./tasks/agent-ens-offchain-resolver/is-resolver-signer-trusted";
import "./tasks/agent-ens-offchain-resolver/resolve-name";
import "./tasks/agent-ens-offchain-resolver/resolve-with-proof";
import "./tasks/agent-ens-offchain-resolver/get-resolver-supports-interface";
import "./tasks/agent-ens-offchain-resolver/set-resolver-urls";
import "./tasks/agent-ens-offchain-resolver/set-resolver-signer";
import "./tasks/agent-ens-offchain-resolver/add-admin-to-resolver";
import "./tasks/agent-ens-offchain-resolver/remove-admin-from-resolver";

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
      agentic: {
        collateralController: "0xf6643c07f03a7a8c98aac2ab3d08c03e47b5731c",
      },
      ensRegistry: {
        parentNode:
          "0x9ec94752dcac587079728bde5f535457f7aa0bbe0b088555bca6d40cfcc78197",
      },
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
      agentic: {
        collateralController: "0x33CCF04be6e83e6b94A0ebb6777bCa44A492CfB1",
      },
      ensRegistry: {
        parentNode:
          "0x9ec94752dcac587079728bde5f535457f7aa0bbe0b088555bca6d40cfcc78197",
      },
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
      agentic: {
        collateralController: "0x349f760fe5C407829e931B3d53D1e2a5f4C69848",
      },
    },
    ethereum: {
      gas: "auto",
      chainId: 1,
      gasMultiplier: 2,
      accounts: [privateKey],
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
      accounts: [privateKey],
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
