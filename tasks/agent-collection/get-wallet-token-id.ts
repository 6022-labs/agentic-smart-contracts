import { task } from "hardhat/config";
import {
  AgentCollectionV1,
  AgentCollectionV1__factory,
} from "../../typechain-types";

export default task("get-wallet-token-id")
  .addParam("collectionAddress", "The address of the collection")
  .addParam("wallet", "The wallet address to look up")
  .setDescription("Get the agent token ID a wallet is registered to")
  .setAction(async (taskArgs, hre) => {
    const { collectionAddress, wallet } = taskArgs;

    console.log(
      `Getting agent token ID for wallet: ${wallet} on collection at address: ${collectionAddress}`
    );

    const agentCollection = (await hre.ethers.getContractAt(
      "AgentCollectionV1",
      collectionAddress
    )) as unknown as AgentCollectionV1;

    try {
      const tokenId = await agentCollection.walletToTokenId(wallet);
      console.log(
        `Token ID for wallet ${wallet}: ${tokenId} (0 means the wallet is not registered to any agent)`
      );
    } catch (error) {
      console.error("Error getting wallet token ID:", error);

      const iface = new hre.ethers.Interface(AgentCollectionV1__factory.abi);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      console.error(error, iface.parseError((error as any).data));
    }
  });
