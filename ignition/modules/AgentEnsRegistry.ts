// This setup uses Hardhat Ignition to manage smart contract deployments.
// Learn more about it at https://hardhat.org/ignition

import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const AgentEnsRegistryModule = buildModule("AgentEnsRegistry", (m) => {
  const managerAddress = m.getParameter<string>("managerAddress");
  const parentNode = m.getParameter<string>("parentNode");

  const AgentEnsRegistry = m.contract("AgentEnsRegistry", [
    managerAddress,
    parentNode,
  ]);

  return { AgentEnsRegistry };
});

export default AgentEnsRegistryModule;
