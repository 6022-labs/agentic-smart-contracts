import { task } from "hardhat/config";
import { AgentCollectionCreatorV1 } from "../typechain-types";

export default task("add-authorized-token-for-creation")
  .addParam("collectionCreatorAddress", "The address of the collection creator")
  .addParam("tokenAddress", "The address of the new token")
  .addParam(
    "tokenAmount",
    "The amount of the token that need to be owned for creation"
  )
  .setDescription("Add a token as authority for collection creation")
  .setAction(async (taskArgs, hre) => {
    const { collectionCreatorAddress, tokenAddress, tokenAmount } = taskArgs;
    const agentCollectionCreator = (await hre.ethers.getContractAt(
      "AgentCollectionCreatorV1",
      collectionCreatorAddress
    )) as unknown as AgentCollectionCreatorV1;

    const tx = await agentCollectionCreator.addAuthorizedTokenForCreation(
      tokenAddress,
      tokenAmount
    );

    await tx.wait();

    console.log(
      `Address ${tokenAddress} with amount ${tokenAmount} added as authorized token for collection creation in creator ${collectionCreatorAddress}`
    );
  });
