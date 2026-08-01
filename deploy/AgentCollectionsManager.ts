import { type DeployFunction } from "hardhat-deploy/types";
import { getAgenticConfig } from "../deploy-config/require-config";

const contractName = "AgentCollectionsManager";

const deploy: DeployFunction = async (hre) => {
  if (getAgenticConfig(hre) == null) {
    return;
  }

  const { deployments, getNamedAccounts } = hre;
  const { deployer } = await getNamedAccounts();

  await deployments.deploy(contractName, {
    from: deployer,
    args: [],
    log: true,
    skipIfAlreadyDeployed: true,
  });
};

deploy.tags = [contractName, "core"];

export default deploy;
