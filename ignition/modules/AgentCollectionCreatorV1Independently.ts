// This setup uses Hardhat Ignition to manage smart contract deployments.
// Learn more about it at https://hardhat.org/ignition

import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const AgentCollectionCreatorV1IndependentlyModule = buildModule(
  "AgentCollectionCreatorV1",
  (m) => {
    const AgentCollectionsManager = m.getParameter("agentCollectionsManager");
    const AgentCollectionsDescriptor = m.getParameter(
      "agentCollectionsDescriptor"
    );
    const AgentCollectionV1Bytecode = m.getParameter(
      "agentCollectionV1Bytecode"
    );
    const collateralController6022 = m.getParameter("collateralController6022");

    const AgentCollectionV1Creator = m.contract("AgentCollectionCreatorV1", [
      AgentCollectionsManager,
      AgentCollectionsDescriptor,
      AgentCollectionV1Bytecode,
      collateralController6022,
    ]);

    return { AgentCollectionV1Creator };
  }
);

export default AgentCollectionCreatorV1IndependentlyModule;
