import { HardhatRuntimeEnvironment } from "hardhat/types";
import {
  AgenticConfig,
  EnsRegistryConfig,
  EnsResolverConfig,
} from "./types";

export function getAgenticConfig(
  hre: HardhatRuntimeEnvironment
): AgenticConfig | undefined {
  return hre.network.config.agentic;
}

export function getEnsRegistryConfig(
  hre: HardhatRuntimeEnvironment
): EnsRegistryConfig | undefined {
  return hre.network.config.ensRegistry;
}

export function getEnsResolverConfig(
  hre: HardhatRuntimeEnvironment
): EnsResolverConfig | undefined {
  return hre.network.config.ensResolver;
}
