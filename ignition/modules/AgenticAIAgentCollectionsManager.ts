// This setup uses Hardhat Ignition to manage smart contract deployments.
// Learn more about it at https://hardhat.org/ignition

import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const AgenticAIAgentCollectionsManagerModule = buildModule(
  "AgenticAIAgentCollectionsManager",
  (m) => {
    const agenticAIAgentCollectionsManager = m.contract(
      "AgenticAIAgentCollectionsManager"
    );

    return { agenticAIAgentCollectionsManager };
  }
);

export default AgenticAIAgentCollectionsManagerModule;
