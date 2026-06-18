import { task } from "hardhat/config";

export default task("add-agent-wallet")
  .addParam("collectionAddress", "The address of the collection")
  .addParam("collectionTokenId", "The token ID of the agent")
  .addParam("wallet", "The wallet address to add to the agent")
  .setDescription("Add a wallet to an agent")
  .setAction(async (taskArgs, hre) => {
    const { collectionAddress, collectionTokenId, wallet } = taskArgs;
    const agentCollectionV1 = await hre.ethers.getContractAt(
      "AgentCollectionV1",
      collectionAddress
    );

    const tx = await agentCollectionV1.addAgentWallet(collectionTokenId, wallet);
    await tx.wait();

    console.log(
      `Wallet ${wallet} added to agent ${collectionTokenId} on collection ${collectionAddress}`
    );
  });
