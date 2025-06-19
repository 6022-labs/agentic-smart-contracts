import { task } from "hardhat/config";

export default task("add-signer")
  .addParam(
    "collectionsManagerAddress",
    "The address of the collections manager"
  )
  .addParam("signer", "The address of the new signer")
  .setAction(async (taskArgs, hre) => {
    const { collectionsManagerAddress, signer } = taskArgs;
    const agenticAIAgentCollectionsManager = await hre.ethers.getContractAt(
      "AgenticAIAgentCollectionsManager",
      collectionsManagerAddress
    );

    const signerRole = await agenticAIAgentCollectionsManager.SIGNER_ROLE();

    const tx = await agenticAIAgentCollectionsManager.grantRole(
      signerRole,
      signer
    );
    await tx.wait();

    console.log(
      `Address ${signer} added as signer to collections manager ${collectionsManagerAddress}`
    );
  });
