import { task } from "hardhat/config";
import { AgentCollectionsManager } from "../../typechain-types";

export default task("remove-creator-from-manager")
  .addParam(
    "collectionsManagerAddress",
    "The address of the collections manager"
  )
  .addParam("creator", "The address of the old creator")
  .setDescription("Remove a creator from a collections manager")
  .setAction(async (taskArgs, hre) => {
    const { collectionsManagerAddress, creator } = taskArgs;
    const AgentCollectionsManager = (await hre.ethers.getContractAt(
      "AgentCollectionsManager",
      collectionsManagerAddress
    )) as unknown as AgentCollectionsManager;

    const creatorRole = await AgentCollectionsManager.CREATOR_ROLE();

    const tx = await AgentCollectionsManager.revokeRole(creatorRole, creator);
    await tx.wait();

    console.log(
      `Address ${creator} removed as creator from collections manager ${collectionsManagerAddress}`
    );
  });
