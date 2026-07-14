import { task } from "hardhat/config";

export default task("remove-agent-address")
  .addParam("collectionAddress", "The address of the collection")
  .addParam("collectionTokenId", "The token ID of the agent")
  .addParam("addressType", "The type of the address to remove (evm, btc, ...)")
  .addParam("value", "The address value to remove from the agent")
  .setDescription("Remove a typed address from an agent")
  .setAction(async (taskArgs, hre) => {
    const { collectionAddress, collectionTokenId, addressType, value } = taskArgs;
    const agentCollectionV1 = await hre.ethers.getContractAt(
      "AgentCollectionV1",
      collectionAddress
    );

    const tx = await agentCollectionV1.removeAgentAddress(
      collectionTokenId,
      addressType,
      value
    );
    await tx.wait();

    console.log(
      `Address ${addressType}:${value} removed from agent ${collectionTokenId} on collection ${collectionAddress}`
    );
  });
