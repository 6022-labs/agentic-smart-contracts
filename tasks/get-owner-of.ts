import { task } from "hardhat/config";
import {
  AgentCollectionV1,
  AgentCollectionV1__factory,
} from "../typechain-types";

export default task("get-owner-of")
  .addParam("collectionAddress", "The address of the collection")
  .addParam("collectionTokenId", "The token ID of the collection")
  .setDescription("Get the owner of an agent")
  .setAction(async (taskArgs, hre) => {
    const { collectionAddress, collectionTokenId } = taskArgs;

    console.log(
      `Getting agent owner for collection at address: ${collectionAddress}, token ID: ${collectionTokenId}`
    );

    const agentCollection = (await hre.ethers.getContractAt(
      "AgentCollectionV1",
      collectionAddress
    )) as unknown as AgentCollectionV1;

    try {
      const owner = await agentCollection.ownerOf(collectionTokenId);
      console.log(`Owner of token ID ${collectionTokenId}: ${owner}`);
    } catch (error) {
      console.error("Error getting agent owner:", error);

      const iface = new hre.ethers.Interface(AgentCollectionV1__factory.abi);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      console.error(error, iface.parseError((error as any).data));
    }
  });
