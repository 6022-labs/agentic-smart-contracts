import { task } from "hardhat/config";
import {
  AgentEnsRegistry,
  AgentEnsRegistry__factory,
} from "../../typechain-types";
import { resolveNodeArg } from "./_namehash";

export default task("get-ens-registry-provisioned")
  .addParam("ensRegistryAddress", "The address of the AgentEnsRegistry")
  .addOptionalParam("node", "Raw bytes32 ENS node")
  .addOptionalParam("agentName", "Agent name label (e.g. test-agent)")
  .addOptionalParam("collectionName", "Collection name label (e.g. agents)")
  .addOptionalParam("chainId", "Chain id of the agent's home chain")
  .addOptionalParam(
    "parentDomain",
    "Parent ENS domain (default: 6022.eth)",
    "6022.eth"
  )
  .setDescription(
    "Check whether an agent subnode has been provisioned. Pass --node OR (--agent-name + --collection-name + --chain-id)."
  )
  .setAction(async (taskArgs, hre) => {
    const { ensRegistryAddress } = taskArgs;
    const node = resolveNodeArg(taskArgs);

    const ensRegistry = (await hre.ethers.getContractAt(
      "AgentEnsRegistry",
      ensRegistryAddress
    )) as unknown as AgentEnsRegistry;

    try {
      const provisioned = await ensRegistry.provisioned(node);
      console.log(`Node ${node} provisioned: ${provisioned}`);
    } catch (error) {
      console.error("Error reading provisioned:", error);
      const iface = new hre.ethers.Interface(AgentEnsRegistry__factory.abi);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      console.error(error, iface.parseError((error as any).data));
    }
  });
