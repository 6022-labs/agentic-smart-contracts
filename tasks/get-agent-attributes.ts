import { task } from "hardhat/config";
import {
  AgentCollectionV1,
  AgentCollectionV1__factory,
} from "../typechain-types";

export default task("get-agent-attributes")
  .addParam("collectionAddress", "The address of the collection")
  .addParam("collectionTokenId", "The token ID of the collection")
  .setDescription("Get the attributes of an agent")
  .setAction(async (taskArgs, hre) => {
    const { collectionAddress, collectionTokenId } = taskArgs;

    console.log(
      `Getting agent attributes for collection at address: ${collectionAddress}, token ID: ${collectionTokenId}`
    );

    const agentCollection = (await hre.ethers.getContractAt(
      "AgentCollectionV1",
      collectionAddress
    )) as unknown as AgentCollectionV1;

    try {
      const attributesCount = await agentCollection.attributesCountOf(
        collectionTokenId
      );
      console.log(
        `Attributes count of token ID ${collectionTokenId}: ${attributesCount}`
      );

      for (let i = 0; i < attributesCount; i++) {
        const attribute = await agentCollection.attributeOfByIndex(
          collectionTokenId,
          i
        );
        console.log(`Attribute ${i}: ${attribute}`);
      }
    } catch (error) {
      console.error("Error getting agent attributes:", error);

      const iface = new hre.ethers.Interface(AgentCollectionV1__factory.abi);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      console.error(error, iface.parseError((error as any).data));
    }
  });
