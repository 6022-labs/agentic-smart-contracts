// This setup uses Hardhat Ignition to manage smart contract deployments.
// Learn more about it at https://hardhat.org/ignition

import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";
import AgenticAIAgentCollectionDescriptorModule from "./AgenticAIAgentCollectionDescriptor";

const AgenticAIAgentCollectionModule = buildModule(
  "AgenticAIAgentCollection",
  (m) => {
    const { agenticAIAgentCollectionDescriptor } = m.useModule(
      AgenticAIAgentCollectionDescriptorModule
    );

    const agenticAIAgentCollection = m.contract("AgenticAIAgentCollection", [
      agenticAIAgentCollectionDescriptor,
    ]);

    return { agenticAIAgentCollection };
  }
);

export default AgenticAIAgentCollectionModule;
