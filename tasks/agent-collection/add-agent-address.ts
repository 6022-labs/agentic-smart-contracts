import { task } from "hardhat/config";

export default task("add-agent-address")
  .addParam("collectionAddress", "The address of the collection")
  .addParam("collectionTokenId", "The token ID of the agent")
  .addParam("addressType", "The type of the address to add (evm, btc, ...)")
  .addParam("value", "The address value to add to the agent")
  .setDescription("Add a typed address to an agent")
  .setAction(async (taskArgs, hre) => {
    const { collectionAddress, collectionTokenId, addressType, value } = taskArgs;
    const agentCollectionV1 = await hre.ethers.getContractAt(
      "AgentCollectionV1",
      collectionAddress
    );

    const tx = await agentCollectionV1.addAgentAddress(
      collectionTokenId,
      addressType,
      value
    );
    await tx.wait();

    console.log(
      `Address ${addressType}:${value} added to agent ${collectionTokenId} on collection ${collectionAddress}`
    );
  });
