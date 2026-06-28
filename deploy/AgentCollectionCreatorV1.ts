import { type DeployFunction } from "hardhat-deploy/types";
import { getAgenticConfig } from "../deploy-config/require-config";

const contractName = "AgentCollectionCreatorV1";

const deploy: DeployFunction = async (hre) => {
  const agentic = getAgenticConfig(hre);
  if (agentic == null) {
    return;
  }

  const { deployments, getNamedAccounts } = hre;
  const { deploy, get, read, execute } = deployments;
  const { deployer } = await getNamedAccounts();

  const manager = await get("AgentCollectionsManager");
  const descriptor = await get("AgentCollectionsDescriptor");
  const implementation = await get("AgentCollectionV1");

  const { address: creator } = await deploy(contractName, {
    from: deployer,
    args: [
      manager.address,
      descriptor.address,
      implementation.address,
    ],
    log: true,
    skipIfAlreadyDeployed: true,
  });

  // Wiring: the creator must hold CREATOR_ROLE on the manager to addCollection.
  const creatorRole = await read("AgentCollectionsManager", "CREATOR_ROLE");
  const hasRole = await read(
    "AgentCollectionsManager",
    "hasRole",
    creatorRole,
    creator
  );
  if (!hasRole) {
    await execute(
      "AgentCollectionsManager",
      { from: deployer, log: true },
      "grantRole",
      creatorRole,
      creator
    );
  }
};

deploy.tags = [contractName, "core"];
deploy.dependencies = [
  "AgentCollectionsDescriptor",
  "AgentCollectionV1",
  "AgentCollectionsManager",
];

export default deploy;
