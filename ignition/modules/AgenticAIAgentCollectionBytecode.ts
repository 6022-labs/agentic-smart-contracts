// This setup uses Hardhat Ignition to manage smart contract deployments.
// Learn more about it at https://hardhat.org/ignition

import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const AgenticAIAgentCollectionBytecodeModule = buildModule(
  "AgenticAIAgentCollectionBytecode",
  (m) => {
    const agenticAIAgentCollectionBytecode = m.contract(
      "AgenticAIAgentCollection"
    );

    return { agenticAIAgentCollectionBytecode };
  }
);

export default AgenticAIAgentCollectionBytecodeModule;
