import { task } from "hardhat/config";
import {
  AgentEnsRegistry,
  AgentEnsRegistry__factory,
} from "../../typechain-types";
import { resolveNodeArg } from "./_namehash";

export default task("get-agent-text")
  .addParam("ensRegistryAddress", "The address of the AgentEnsRegistry")
  .addParam("key", "The text record key (e.g. agent.runtime-url)")
  .addOptionalParam("node", "Raw bytes32 ENS node")
  .addOptionalParam("agentName", "Agent name label")
  .addOptionalParam("collectionName", "Collection name label")
  .addOptionalParam("chainId", "Chain id of the agent's home chain")
  .addOptionalParam(
    "parentDomain",
    "Parent ENS domain (default: 6022.eth)",
    "6022.eth"
  )
  .setDescription(
    "Read a stored text record. Pass --node OR (--agent-name + --collection-name + --chain-id)."
  )
  .setAction(async (taskArgs, hre) => {
    const { ensRegistryAddress, key } = taskArgs;
    const node = resolveNodeArg(taskArgs);

    const ensRegistry = (await hre.ethers.getContractAt(
      "AgentEnsRegistry",
      ensRegistryAddress
    )) as unknown as AgentEnsRegistry;

    try {
      const value = await ensRegistry.text(node, key);
      console.log(`text(${node}, "${key}") = "${value}"`);
    } catch (error) {
      console.error("Error reading text:", error);
      const iface = new hre.ethers.Interface(AgentEnsRegistry__factory.abi);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      console.error(error, iface.parseError((error as any).data));
    }
  });
