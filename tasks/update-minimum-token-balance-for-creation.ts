import { task } from "hardhat/config";
import { AgentCollectionCreatorV1 } from "../typechain-types";

export default task("update-minimum-token-balance-for-creation")
  .addParam("collectionCreatorAddress", "The address of the collection creator")
  .addParam("tokenAddress", "The address of the new token")
  .addParam(
    "tokenAmount",
    "The amount of the token that need to be owned for creation"
  )
  .setDescription(
    "Update the minimum token balance required for collection creation"
  )
  .setAction(async (taskArgs, hre) => {
    const { collectionCreatorAddress, tokenAddress, tokenAmount } = taskArgs;
    const agentCollectionCreator = (await hre.ethers.getContractAt(
      "AgentCollectionCreatorV1",
      collectionCreatorAddress
    )) as unknown as AgentCollectionCreatorV1;

    const tx =
      await agentCollectionCreator.updateMinimumTokenBalanceForCreation(
        tokenAddress,
        tokenAmount
      );

    await tx.wait();

    console.log(
      `Address ${tokenAddress} with amount ${tokenAmount} updated as minimum token balance for collection creation in creator ${collectionCreatorAddress}`
    );
  });
