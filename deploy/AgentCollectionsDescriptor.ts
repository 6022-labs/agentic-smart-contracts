import { type DeployFunction } from "hardhat-deploy/types";
import { getAgenticConfig } from "../deploy-config/require-config";

const contractName = "AgentCollectionsDescriptor";

const deploy: DeployFunction = async (hre) => {
  const agentic = getAgenticConfig(hre);
  if (agentic == null) {
    return;
  }

  const { deployments, getNamedAccounts } = hre;
  const { deployer } = await getNamedAccounts();

  await deployments.deploy(contractName, {
    from: deployer,
    args: [agentic.ipfsGateway ?? "ipfs://"],
    log: true,
    skipIfAlreadyDeployed: true,
  });
};

deploy.tags = [contractName, "core"];

export default deploy;
