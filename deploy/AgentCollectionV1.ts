import { type DeployFunction } from "hardhat-deploy/types";
import { getAgenticConfig } from "../deploy-config/require-config";

// AgentCollectionV1 implementation; collections are deployed as clones of it.
const contractName = "AgentCollectionV1";

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
