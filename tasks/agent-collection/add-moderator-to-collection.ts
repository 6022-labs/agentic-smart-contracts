import { task } from "hardhat/config";

export default task("add-moderator-to-collection")
  .addParam("collectionAddress", "The address of the collection")
  .addParam("moderator", "The address of the new moderators")
  .setDescription("Add a moderator to a collection")
  .setAction(async (taskArgs, hre) => {
    const { collectionAddress, moderator } = taskArgs;
    const agentCollectionV1 = await hre.ethers.getContractAt(
      "AgentCollectionV1",
      collectionAddress
    );

    const moderatorRole = await agentCollectionV1.MODERATOR_ROLE();

    const tx = await agentCollectionV1.grantRole(moderatorRole, moderator);
    await tx.wait();

    console.log(
      `Address ${moderator} added as moderator to collection ${collectionAddress}`
    );
  });
