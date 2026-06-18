import { task } from "hardhat/config";

export default task("remove-agent-wallet")
  .addParam("collectionAddress", "The address of the collection")
  .addParam("collectionTokenId", "The token ID of the agent")
  .addParam("wallet", "The wallet address to remove from the agent")
  .setDescription("Remove a wallet from an agent")
  .setAction(async (taskArgs, hre) => {
    const { collectionAddress, collectionTokenId, wallet } = taskArgs;
    const agentCollectionV1 = await hre.ethers.getContractAt(
      "AgentCollectionV1",
      collectionAddress
    );

    const tx = await agentCollectionV1.removeAgentWallet(
      collectionTokenId,
      wallet
    );
    await tx.wait();

    console.log(
      `Wallet ${wallet} removed from agent ${collectionTokenId} on collection ${collectionAddress}`
    );
  });
