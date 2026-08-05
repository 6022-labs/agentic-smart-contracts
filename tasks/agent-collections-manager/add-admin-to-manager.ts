import { task } from "hardhat/config";
import {
  AgentCollectionsManager,
  AgentCollectionsManager__factory,
} from "../../typechain-types";

export default task("add-admin-to-manager")
  .addParam(
    "collectionsManagerAddress",
    "The address of the AgentCollectionsManager"
  )
  .addParam("account", "The address to grant DEFAULT_ADMIN_ROLE")
  .setDescription("Grant DEFAULT_ADMIN_ROLE on the AgentCollectionsManager")
  .setAction(async (taskArgs, hre) => {
    const { collectionsManagerAddress, account } = taskArgs;

    const collectionsManager = (await hre.ethers.getContractAt(
      "AgentCollectionsManager",
      collectionsManagerAddress
    )) as unknown as AgentCollectionsManager;

    try {
      const role = await collectionsManager.DEFAULT_ADMIN_ROLE();
      const tx = await collectionsManager.grantRole(role, account);
      const receipt = await tx.wait();
      console.log(
        `Granted DEFAULT_ADMIN_ROLE to ${account} on AgentCollectionsManager ${collectionsManagerAddress}. Tx: ${receipt?.hash}`
      );
    } catch (error) {
      console.error("Error granting admin role:", error);
      const iface = new hre.ethers.Interface(
        AgentCollectionsManager__factory.abi
      );
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      console.error(error, iface.parseError((error as any).data));
    }
  });
