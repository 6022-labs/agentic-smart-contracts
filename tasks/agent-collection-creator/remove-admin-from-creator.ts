import { task } from "hardhat/config";
import {
  AgentCollectionCreatorV1,
  AgentCollectionCreatorV1__factory,
} from "../../typechain-types";

export default task("remove-admin-from-creator")
  .addParam(
    "collectionCreatorAddress",
    "The address of the AgentCollectionCreatorV1"
  )
  .addParam("account", "The address to revoke DEFAULT_ADMIN_ROLE from")
  .setDescription("Revoke DEFAULT_ADMIN_ROLE on the AgentCollectionCreatorV1")
  .setAction(async (taskArgs, hre) => {
    const { collectionCreatorAddress, account } = taskArgs;

    const collectionCreator = (await hre.ethers.getContractAt(
      "AgentCollectionCreatorV1",
      collectionCreatorAddress
    )) as unknown as AgentCollectionCreatorV1;

    try {
      const role = await collectionCreator.DEFAULT_ADMIN_ROLE();
      const tx = await collectionCreator.revokeRole(role, account);
      const receipt = await tx.wait();
      console.log(
        `Revoked DEFAULT_ADMIN_ROLE from ${account} on AgentCollectionCreatorV1 ${collectionCreatorAddress}. Tx: ${receipt?.hash}`
      );
    } catch (error) {
      console.error("Error revoking admin role:", error);
      const iface = new hre.ethers.Interface(
        AgentCollectionCreatorV1__factory.abi
      );
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      console.error(error, iface.parseError((error as any).data));
    }
  });
