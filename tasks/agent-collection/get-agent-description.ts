import { task } from "hardhat/config";
import {
  AgentCollectionV1,
  AgentCollectionV1__factory,
} from "../../typechain-types";

export default task("get-agent-description")
  .addParam("collectionAddress", "The address of the collection")
  .addParam("collectionTokenId", "The token ID of the collection")
  .setDescription("Get the description of an agent")
  .setAction(async (taskArgs, hre) => {
    const { collectionAddress, collectionTokenId } = taskArgs;

    console.log(
      `Getting agent description for collection at address: ${collectionAddress}, token ID: ${collectionTokenId}`,
    );

    const agentCollection = (await hre.ethers.getContractAt(
      "AgentCollectionV1",
      collectionAddress,
    )) as unknown as AgentCollectionV1;

    try {
      const description = await agentCollection.tokenURI(collectionTokenId);
      console.log(
        `Token URI for token ID ${collectionTokenId}: ${description}`,
      );

      // Decode base64 and parse JSON
      const base64Json = description.split(",")[1];
      const jsonStr = Buffer.from(base64Json, "base64").toString("utf-8");
      const metadata = JSON.parse(jsonStr);

      console.log(
        `Agent description for token ID ${collectionTokenId}: ${metadata.description}`,
      );
    } catch (error) {
      console.error("Error getting agent description:", error);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const revertData = (error as any).data;
      if (typeof revertData === "string" && revertData.length > 2) {
        const iface = new hre.ethers.Interface(AgentCollectionV1__factory.abi);
        console.error(iface.parseError(revertData));
      }
    }
  });
