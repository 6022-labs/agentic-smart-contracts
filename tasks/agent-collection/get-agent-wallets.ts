import { task } from "hardhat/config";
import {
  AgentCollectionV1,
  AgentCollectionV1__factory,
} from "../../typechain-types";

export default task("get-agent-wallets")
  .addParam("collectionAddress", "The address of the collection")
  .addParam("collectionTokenId", "The token ID of the agent")
  .setDescription("Get the wallets of an agent")
  .setAction(async (taskArgs, hre) => {
    const { collectionAddress, collectionTokenId } = taskArgs;

    console.log(
      `Getting agent wallets for collection at address: ${collectionAddress}, token ID: ${collectionTokenId}`,
    );

    const agentCollection = (await hre.ethers.getContractAt(
      "AgentCollectionV1",
      collectionAddress,
    )) as unknown as AgentCollectionV1;

    try {
      const walletsCount = await agentCollection.walletsCountOf(
        collectionTokenId,
      );
      console.log(
        `Wallets count of token ID ${collectionTokenId}: ${walletsCount}`,
      );

      for (let i = 0; i < walletsCount; i++) {
        const wallet = await agentCollection.walletOfByIndex(
          collectionTokenId,
          i,
        );
        console.log(`Wallet ${i}: ${wallet}`);
      }
    } catch (error) {
      console.error("Error getting agent wallets:", error);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const revertData = (error as any).data;
      if (typeof revertData === "string" && revertData.length > 2) {
        const iface = new hre.ethers.Interface(AgentCollectionV1__factory.abi);
        console.error(iface.parseError(revertData));
      }
    }
  });
