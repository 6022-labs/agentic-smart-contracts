import { task } from "hardhat/config";
import { AgentCollectionsManager } from "../typechain-types";

export default task("add-creator-to-manager")
  .addParam(
    "collectionsManagerAddress",
    "The address of the collections manager"
  )
  .addParam("creator", "The address of the new creator")
  .setDescription("Add a creator to a collections manager")
  .setAction(async (taskArgs, hre) => {
    const { collectionsManagerAddress, creator } = taskArgs;
    const AgentCollectionsManager = (await hre.ethers.getContractAt(
      "AgentCollectionsManager",
      collectionsManagerAddress
    )) as unknown as AgentCollectionsManager;

    const creatorRole = await AgentCollectionsManager.CREATOR_ROLE();

    const tx = await AgentCollectionsManager.grantRole(creatorRole, creator);
    await tx.wait();

    console.log(
      `Address ${creator} added as creator to collections manager ${collectionsManagerAddress}`
    );
  });
