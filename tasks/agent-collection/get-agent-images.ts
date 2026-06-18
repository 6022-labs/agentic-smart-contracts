import { task } from "hardhat/config";
import {
  AgentCollectionV1,
  AgentCollectionV1__factory,
} from "../../typechain-types";

export default task("get-agent-images")
  .addParam("collectionAddress", "The address of the collection")
  .addParam("collectionTokenId", "The token ID of the collection")
  .setDescription("Get the images of an agent")
  .setAction(async (taskArgs, hre) => {
    const { collectionAddress, collectionTokenId } = taskArgs;

    console.log(
      `Getting agent images for collection at address: ${collectionAddress}, token ID: ${collectionTokenId}`,
    );

    const agentCollection = (await hre.ethers.getContractAt(
      "AgentCollectionV1",
      collectionAddress,
    )) as unknown as AgentCollectionV1;

    try {
      const imagesCount = await agentCollection.imagesCountOf(
        collectionTokenId,
      );
      console.log(
        `Image count of token ID ${collectionTokenId}: ${imagesCount}`,
      );

      for (let i = 0; i < imagesCount; i++) {
        const image = await agentCollection.imageOfByIndex(
          collectionTokenId,
          i,
        );
        console.log(`Image ${i}: ${image}`);
      }
    } catch (error) {
      console.error("Error getting agent images:", error);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const revertData = (error as any).data;
      if (typeof revertData === "string" && revertData.length > 2) {
        const iface = new hre.ethers.Interface(AgentCollectionV1__factory.abi);
        console.error(iface.parseError(revertData));
      }
    }
  });
