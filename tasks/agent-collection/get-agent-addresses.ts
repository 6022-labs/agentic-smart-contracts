import { task } from "hardhat/config";
import {
  AgentCollectionV1,
  AgentCollectionV1__factory,
} from "../../typechain-types";

export default task("get-agent-addresses")
  .addParam("collectionAddress", "The address of the collection")
  .addParam("collectionTokenId", "The token ID of the agent")
  .setDescription("Get the typed addresses of an agent")
  .setAction(async (taskArgs, hre) => {
    const { collectionAddress, collectionTokenId } = taskArgs;

    console.log(
      `Getting agent addresses for collection at address: ${collectionAddress}, token ID: ${collectionTokenId}`,
    );

    const agentCollection = (await hre.ethers.getContractAt(
      "AgentCollectionV1",
      collectionAddress,
    )) as unknown as AgentCollectionV1;

    try {
      const addressesCount = await agentCollection.addressesCountOf(
        collectionTokenId,
      );
      console.log(
        `Addresses count of token ID ${collectionTokenId}: ${addressesCount}`,
      );

      for (let i = 0; i < addressesCount; i++) {
        const agentAddress = await agentCollection.addressOfByIndex(
          collectionTokenId,
          i,
        );
        console.log(
          `Address ${i}: ${agentAddress.addressType} ${agentAddress.value}`,
        );
      }
    } catch (error) {
      console.error("Error getting agent addresses:", error);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const revertData = (error as any).data;
      if (typeof revertData === "string" && revertData.length > 2) {
        const iface = new hre.ethers.Interface(AgentCollectionV1__factory.abi);
        console.error(iface.parseError(revertData));
      }
    }
  });
