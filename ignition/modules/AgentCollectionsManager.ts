// This setup uses Hardhat Ignition to manage smart contract deployments.
// Learn more about it at https://hardhat.org/ignition

import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const AgentCollectionsManagerModule = buildModule(
  "AgentCollectionsManager",
  (m) => {
    const AgentCollectionsManager = m.contract("AgentCollectionsManager");

    return { AgentCollectionsManager };
  }
);

export default AgentCollectionsManagerModule;
