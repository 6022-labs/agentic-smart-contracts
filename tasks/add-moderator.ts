import { task } from "hardhat/config";

export default task("add-moderator")
  .addParam("collectionAddress", "The address of the collection")
  .addParam("moderator", "The address of the new moderators")
  .setDescription("Add a moderator to a collection")
  .setAction(async (taskArgs, hre) => {
    const { collectionAddress, moderator } = taskArgs;
    const AgentCollection = await hre.ethers.getContractAt(
      "AgentCollection",
      collectionAddress
    );

    const moderatorRole = await AgentCollection.MODERATOR_ROLE();

    const tx = await AgentCollection.grantRole(moderatorRole, moderator);
    await tx.wait();

    console.log(
      `Address ${moderator} added as moderator to collection ${collectionAddress}`
    );
  });
