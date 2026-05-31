import "hardhat/types/config";

export interface AgenticConfig {
  collateralController: string;
  ipfsGateway?: string;
}

export interface EnsRegistryConfig {
  parentNode: string;
}

export interface EnsResolverConfig {
  gatewayUrls: string[];
  signer: string;
}

declare module "hardhat/types/config" {
  // hre.network.config is a union of HardhatNetworkConfig | HttpNetworkConfig,
  // so the custom keys must be declared on every member (and their user-config
  // counterparts) to be readable without a type error.
  interface HttpNetworkUserConfig {
    agentic?: AgenticConfig;
    ensRegistry?: EnsRegistryConfig;
    ensResolver?: EnsResolverConfig;
  }

  interface HttpNetworkConfig {
    agentic?: AgenticConfig;
    ensRegistry?: EnsRegistryConfig;
    ensResolver?: EnsResolverConfig;
  }

  interface HardhatNetworkUserConfig {
    agentic?: AgenticConfig;
    ensRegistry?: EnsRegistryConfig;
    ensResolver?: EnsResolverConfig;
  }

  interface HardhatNetworkConfig {
    agentic?: AgenticConfig;
    ensRegistry?: EnsRegistryConfig;
    ensResolver?: EnsResolverConfig;
  }
}
