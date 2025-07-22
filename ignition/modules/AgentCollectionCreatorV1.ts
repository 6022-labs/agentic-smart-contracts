// This setup uses Hardhat Ignition to manage smart contract deployments.
// Learn more about it at https://hardhat.org/ignition

import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";
import AgentCollectionBytecodeModule from "./AgentCollectionV1Bytecode";
import AgentCollectionsDescriptorModule from "./AgentCollectionDescriptor";
import AgentCollectionsManagerModule from "./AgentCollectionsManager";

const AgentCollectionCreatorV1Module = buildModule(
  "AgentCollectionCreatorV1",
  (m) => {
    const { AgentCollectionV1Bytecode } = m.useModule(
      AgentCollectionBytecodeModule
    );

    const { AgentCollectionsDescriptor } = m.useModule(
      AgentCollectionsDescriptorModule
    );

    const { AgentCollectionsManager } = m.useModule(
      AgentCollectionsManagerModule
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

export default AgentCollectionCreatorV1Module;
