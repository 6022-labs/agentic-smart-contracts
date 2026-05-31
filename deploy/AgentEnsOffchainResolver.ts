import { type DeployFunction } from "hardhat-deploy/types";
import { getEnsResolverConfig } from "../deploy-config/require-config";

const contractName = "AgentEnsOffchainResolver";

const deploy: DeployFunction = async (hre) => {
  const ensResolver = getEnsResolverConfig(hre);
  if (ensResolver == null) {
    return;
  }

  const { deployments, getNamedAccounts } = hre;
  const { deployer } = await getNamedAccounts();

  await deployments.deploy(contractName, {
    from: deployer,
    args: [ensResolver.gatewayUrls, ensResolver.signer],
    log: true,
    skipIfAlreadyDeployed: true,
  });
};

deploy.tags = [contractName, "resolver"];

export default deploy;
