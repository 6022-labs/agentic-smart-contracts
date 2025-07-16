import { task } from "hardhat/config";
import {
  AgentCollectionsDescriptor,
  AgentCollectionsDescriptor__factory,
} from "../typechain-types";

export default task("build-token-uri")
  .addParam(
    "collectionsDescriptorAddress",
    "The address of the collections descriptor"
  )
  .addParam("collectionAddress", "The address of the collection")
  .addParam("collectionTokenId", "The token ID of the collection")
  .setDescription("Build the token URI for an agent")
  .setAction(async (taskArgs, hre) => {
    const {
      collectionAddress,
      collectionTokenId,
      collectionsDescriptorAddress,
    } = taskArgs;

    console.log(
      `Getting agent description for collection at address: ${collectionAddress}, token ID: ${collectionTokenId}`
    );

    const agentCollection = (await hre.ethers.getContractAt(
      "AgentCollectionsDescriptor",
      collectionsDescriptorAddress
    )) as unknown as AgentCollectionsDescriptor;

    try {
      const description = await agentCollection.buildTokenURI(
        collectionAddress,
        collectionTokenId
      );
      console.log(
        `Token URI for token ID ${collectionTokenId}: ${description}`
      );
    } catch (error) {
      const iface = new hre.ethers.Interface(
        AgentCollectionsDescriptor__factory.abi
      );
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      console.error(error, iface.parseError((error as any).data));
    }
  });
