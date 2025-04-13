// This setup uses Hardhat Ignition to manage smart contract deployments.
// Learn more about it at https://hardhat.org/ignition

import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const AgenticAIAgentCollectionDescriptorModule = buildModule(
  "AgenticAIAgentCollectionDescriptorModule",
  (m) => {
    const agenticAIAgentCollectionDescriptor = m.contract(
      "AgenticAIAgentCollectionDescriptor",
      ["ipfs://"]
    );

    return { agenticAIAgentCollectionDescriptor };
  }
);

export default AgenticAIAgentCollectionDescriptorModule;
