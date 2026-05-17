import { task } from "hardhat/config";
import {
  AgentEnsRegistry,
  AgentEnsRegistry__factory,
} from "../../typechain-types";

export default task("set-agent-text")
  .addParam("ensRegistryAddress", "The address of the AgentEnsRegistry")
  .addParam("collectionAddress", "The address of the agent's collection")
  .addParam("tokenId", "The agent's token id")
  .addParam("key", "The text record key")
  .addParam("value", "The text record value")
  .setDescription("Update a single text record for an already-provisioned agent")
  .setAction(async (taskArgs, hre) => {
    const { ensRegistryAddress, collectionAddress, tokenId, key, value } =
      taskArgs;

    const ensRegistry = (await hre.ethers.getContractAt(
      "AgentEnsRegistry",
      ensRegistryAddress
    )) as unknown as AgentEnsRegistry;

    try {
      const tx = await ensRegistry.setAgentText(
        collectionAddress,
        tokenId,
        key,
        value
      );
      const receipt = await tx.wait();
      console.log(
        `Set "${key}" = "${value}" on agent (${collectionAddress}, ${tokenId}). Tx: ${receipt?.hash}`
      );
    } catch (error) {
      console.error("Error setting agent text:", error);
      const iface = new hre.ethers.Interface(AgentEnsRegistry__factory.abi);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      console.error(error, iface.parseError((error as any).data));
    }
  });
