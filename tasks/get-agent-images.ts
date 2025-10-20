import { task } from "hardhat/config";
import {
  AgentCollectionV1,
  AgentCollectionV1__factory,
} from "../typechain-types";

export default task("get-agent-images")
  .addParam("collectionAddress", "The address of the collection")
  .addParam("collectionTokenId", "The token ID of the collection")
  .setDescription("Get the images of an agent")
  .setAction(async (taskArgs, hre) => {
    const { collectionAddress, collectionTokenId } = taskArgs;

    console.log(
      `Getting agent images for collection at address: ${collectionAddress}, token ID: ${collectionTokenId}`
    );

    const agentCollection = (await hre.ethers.getContractAt(
      "AgentCollectionV1",
      collectionAddress
    )) as unknown as AgentCollectionV1;

    try {
      const imagesCount = await agentCollection.imagesCountOf(
        collectionTokenId
      );
      console.log(
        `Image count of token ID ${collectionTokenId}: ${imagesCount}`
      );

      for (let i = 0; i < imagesCount; i++) {
        const image = await agentCollection.imageOfByIndex(
          collectionTokenId,
          i
        );
        console.log(`Image ${i}: ${image}`);
      }
    } catch (error) {
      console.error("Error getting agent images:", error);

      const iface = new hre.ethers.Interface(AgentCollectionV1__factory.abi);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      console.error(error, iface.parseError((error as any).data));
    }
  });
