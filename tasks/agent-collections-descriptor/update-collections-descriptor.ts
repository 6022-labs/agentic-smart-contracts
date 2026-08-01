import { task } from "hardhat/config";
import {
  AgentCollectionCreatorV1,
  AgentCollectionsManager,
  AgentCollectionV1,
} from "../../typechain-types";

const PAGE_SIZE = 50n;

export default task("update-collections-descriptor")
  .addParam("descriptorAddress", "The address of the new descriptor")
  .addParam("creatorAddress", "The address of the collection creator")
  .addParam("managerAddress", "The address of the collections manager")
  .setDescription(
    "Point the creator and every existing collection at a new descriptor. " +
      "Collections where the signer lacks the moderator role are reported and skipped."
  )
  .setAction(async (taskArgs, hre) => {
    const { creatorAddress, managerAddress } = taskArgs;
    const descriptorAddress = hre.ethers.getAddress(taskArgs.descriptorAddress);
    const [signer] = await hre.ethers.getSigners();

    const creator = (await hre.ethers.getContractAt(
      "AgentCollectionCreatorV1",
      creatorAddress
    )) as unknown as AgentCollectionCreatorV1;

    if ((await creator.collectionsDescriptor()) === descriptorAddress) {
      console.log(`Creator ${creatorAddress} already uses ${descriptorAddress}`);
    } else {
      const tx = await creator.updateCollectionsDescriptor(descriptorAddress);
      await tx.wait();
      console.log(`Creator ${creatorAddress} now uses ${descriptorAddress}`);
    }

    const manager = (await hre.ethers.getContractAt(
      "AgentCollectionsManager",
      managerAddress
    )) as unknown as AgentCollectionsManager;

    let offset = 0n;
    do {
      const [infos, next] = await manager.listCollections(offset, PAGE_SIZE);
      for (const info of infos) {
        const collection = (await hre.ethers.getContractAt(
          "AgentCollectionV1",
          info.collectionAddress
        )) as unknown as AgentCollectionV1;

        if ((await collection.collectionsDescriptor()) === descriptorAddress) {
          console.log(`Collection ${info.name} already uses ${descriptorAddress}`);
          continue;
        }
        const moderatorRole = await collection.MODERATOR_ROLE();
        if (!(await collection.hasRole(moderatorRole, signer.address))) {
          console.log(
            `Collection ${info.name} (${info.collectionAddress}) skipped: ${signer.address} is not a moderator`
          );
          continue;
        }

        const tx = await collection.updateCollectionsDescriptor(descriptorAddress);
        await tx.wait();
        console.log(
          `Collection ${info.name} (${info.collectionAddress}) now uses ${descriptorAddress}`
        );
      }
      offset = next;
    } while (offset !== 0n);
  });
