import { task } from "hardhat/config";
import {
  AgentCollectionV1,
  AgentCollectionV1__factory,
} from "../../typechain-types";

export default task("get-collection-description")
  .addParam("collectionAddress", "The address of the collection")
  .setDescription("Get the description of a collection")
  .setAction(async (taskArgs, hre) => {
    const { collectionAddress } = taskArgs;

    console.log(
      `Getting collection description for address: ${collectionAddress}`,
    );

    const agentCollection = (await hre.ethers.getContractAt(
      "AgentCollectionV1",
      collectionAddress,
    )) as unknown as AgentCollectionV1;

    try {
      const description = await agentCollection.description();
      console.log(
        `Description of collection at ${collectionAddress}: ${description}`,
      );
    } catch (error) {
      console.error("Error getting collection description:", error);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const revertData = (error as any).data;
      if (typeof revertData === "string" && revertData.length > 2) {
        const iface = new hre.ethers.Interface(AgentCollectionV1__factory.abi);
        console.error(iface.parseError(revertData));
      }
    }
  });
