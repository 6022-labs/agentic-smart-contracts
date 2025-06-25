// This setup uses Hardhat Ignition to manage smart contract deployments.
// Learn more about it at https://hardhat.org/ignition

import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";
import AgentCollectionBytecodeModule from "./AgentCollectionBytecode";
import AgentCollectionsDescriptorModule from "./AgentCollectionDescriptor";
import AgentCollectionsManagerModule from "./AgentCollectionsManager";

const AgentCollectionCreatorModule = buildModule(
  "AgentCollectionCreator",
  (m) => {
    const { AgentCollectionBytecode } = m.useModule(
      AgentCollectionBytecodeModule
    );
    const { AgentCollectionsDescriptor } = m.useModule(
      AgentCollectionsDescriptorModule
    );
    const { AgentCollectionsManager } = m.useModule(
      AgentCollectionsManagerModule
    );

    const AgentCollectionCreator = m.contract("AgentCollectionCreator", [
      AgentCollectionsManager,
      AgentCollectionsDescriptor,
      AgentCollectionBytecode,
    ]);

    return { AgentCollectionCreator };
  }
);

export default AgentCollectionCreatorModule;
