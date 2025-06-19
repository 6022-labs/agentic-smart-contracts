import { task } from "hardhat/config";

export default task("add-signer")
  .addParam("collectionsAddress", "The address of the collection")
  .addParam("signer", "The address of the new signer")
  .setAction(async (taskArgs, hre) => {
    const { collectionAddress, signer } = taskArgs;
    const agenticAIAgentCollection = await hre.ethers.getContractAt(
      "AgenticAIAgentCollection",
      collectionAddress
    );

    const moderatorRole = await agenticAIAgentCollection.MODERATOR_ROLE();

    const tx = await agenticAIAgentCollection.grantRole(moderatorRole, signer);
    await tx.wait();

    console.log(
      `Address ${signer} added as moderator to collection ${collectionAddress}`
    );
  });
