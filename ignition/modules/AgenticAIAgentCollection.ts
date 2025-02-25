// This setup uses Hardhat Ignition to manage smart contract deployments.
// Learn more about it at https://hardhat.org/ignition

import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const AgenticAIAgentCollectionModule = buildModule(
  "AgenticAIAgentCollection",
  (m) => {
    const agenticAIAgentCollection = m.contract("AgenticAIAgentCollection", []);

    return { agenticAIAgentCollection };
  }
);

export default AgenticAIAgentCollectionModule;
