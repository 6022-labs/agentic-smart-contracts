import { task } from "hardhat/config";

export default task("add-signer")
  .addParam("collectionAddress", "The address of the collection")
  .addParam("signer", "The address of the new signer")
  .setAction(async (taskArgs, hre) => {
    const { collectionAddress, signer } = taskArgs;
    const agenticAIAgentCollection = await hre.ethers.getContractAt(
      "AgenticAIAgentCollection",
      collectionAddress
    );

    const tx = await agenticAIAgentCollection.addSigner(signer);
    await tx.wait();
    console.log(`Signer ${signer} added to collection ${collectionAddress}`);
  });
