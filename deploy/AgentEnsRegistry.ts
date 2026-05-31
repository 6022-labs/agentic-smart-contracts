import { type DeployFunction } from "hardhat-deploy/types";
import { getEnsRegistryConfig } from "../deploy-config/require-config";

const contractName = "AgentEnsRegistry";

const deploy: DeployFunction = async (hre) => {
  const ensRegistry = getEnsRegistryConfig(hre);
  if (ensRegistry == null) {
    return;
  }

  const { deployments, getNamedAccounts } = hre;
  const { deployer } = await getNamedAccounts();

  const manager = await deployments.get("AgentCollectionsManager");

  await deployments.deploy(contractName, {
    from: deployer,
    args: [manager.address, ensRegistry.parentNode],
    log: true,
    skipIfAlreadyDeployed: true,
  });
};

deploy.tags = [contractName, "registry"];
deploy.dependencies = ["AgentCollectionsManager"];

export default deploy;
