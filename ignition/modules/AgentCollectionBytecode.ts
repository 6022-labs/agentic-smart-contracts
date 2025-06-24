// This setup uses Hardhat Ignition to manage smart contract deployments.
// Learn more about it at https://hardhat.org/ignition

import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const AgentCollectionBytecodeModule = buildModule(
  "AgentCollectionBytecode",
  (m) => {
    const AgentCollectionBytecode = m.contract("AgentCollection");

    return { AgentCollectionBytecode };
  }
);

export default AgentCollectionBytecodeModule;
