// This setup uses Hardhat Ignition to manage smart contract deployments.
// Learn more about it at https://hardhat.org/ignition

import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";
import AgenticAIAgentCollectionBytecodeModule from "./AgenticAIAgentCollectionBytecode";
import AgenticAIAgentCollectionsDescriptorModule from "./AgenticAIAgentCollectionDescriptor";
import AgenticAIAgentCollectionsManagerModule from "./AgenticAIAgentCollectionsManager";

const AgenticAIAgentCollectionCreatorModule = buildModule(
  "AgenticAIAgentCollectionCreator",
  (m) => {
    const { agenticAIAgentCollectionBytecode } = m.useModule(
      AgenticAIAgentCollectionBytecodeModule
    );
    const { agenticAIAgentCollectionsDescriptor } = m.useModule(
      AgenticAIAgentCollectionsDescriptorModule
    );
    const { agenticAIAgentCollectionsManager } = m.useModule(
      AgenticAIAgentCollectionsManagerModule
    );

    const agenticAIAgentCollectionCreator = m.contract(
      "AgenticAIAgentCollectionCreator",
      [
        agenticAIAgentCollectionsManager,
        agenticAIAgentCollectionsDescriptor,
        agenticAIAgentCollectionBytecode,
      ]
    );

    return { agenticAIAgentCollectionCreator };
  }
);

export default AgenticAIAgentCollectionCreatorModule;
