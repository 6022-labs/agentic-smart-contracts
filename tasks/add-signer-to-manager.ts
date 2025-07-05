import { task } from "hardhat/config";
import { AgentCollectionsManager } from "../typechain-types";

export default task("add-signer-to-manager")
  .addParam(
    "collectionsManagerAddress",
    "The address of the collections manager"
  )
  .addParam("signer", "The address of the new signer")
  .setDescription("Add a signer to a collections manager")
  .setAction(async (taskArgs, hre) => {
    const { collectionsManagerAddress, signer } = taskArgs;
    const AgentCollectionsManager = (await hre.ethers.getContractAt(
      "AgentCollectionsManager",
      collectionsManagerAddress
    )) as unknown as AgentCollectionsManager;

    const signerRole = await AgentCollectionsManager.SIGNER_ROLE();

    const tx = await AgentCollectionsManager.grantRole(signerRole, signer);
    await tx.wait();

    console.log(
      `Address ${signer} added as signer to collections manager ${collectionsManagerAddress}`
    );
  });
