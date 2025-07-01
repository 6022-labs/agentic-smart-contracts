// This setup uses Hardhat Ignition to manage smart contract deployments.
// Learn more about it at https://hardhat.org/ignition

import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const AgentCollectionV1BytecodeModule = buildModule(
  "AgentCollectionV1Bytecode",
  (m) => {
    const AgentCollectionV1Bytecode = m.contract("AgentCollectionV1");

    return { AgentCollectionV1Bytecode };
  }
);

export default AgentCollectionV1BytecodeModule;
