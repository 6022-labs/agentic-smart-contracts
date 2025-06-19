import { task } from "hardhat/config";

export default task("add-moderator")
  .addParam("collectionAddress", "The address of the collection")
  .addParam("moderator", "The address of the new moderators")
  .setDescription("Add a moderator to a collection")
  .setAction(async (taskArgs, hre) => {
    const { collectionAddress, moderator } = taskArgs;
    const agenticAIAgentCollection = await hre.ethers.getContractAt(
      "AgenticAIAgentCollection",
      collectionAddress
    );

    const moderatorRole = await agenticAIAgentCollection.MODERATOR_ROLE();

    const tx = await agenticAIAgentCollection.grantRole(
      moderatorRole,
      moderator
    );
    await tx.wait();

    console.log(
      `Address ${moderator} added as moderator to collection ${collectionAddress}`
    );
  });
