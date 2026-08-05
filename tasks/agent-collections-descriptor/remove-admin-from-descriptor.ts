import { task } from "hardhat/config";
import {
  AgentCollectionsDescriptor,
  AgentCollectionsDescriptor__factory,
} from "../../typechain-types";

export default task("remove-admin-from-descriptor")
  .addParam(
    "collectionsDescriptorAddress",
    "The address of the AgentCollectionsDescriptor"
  )
  .addParam("account", "The address to revoke DEFAULT_ADMIN_ROLE from")
  .setDescription("Revoke DEFAULT_ADMIN_ROLE on the AgentCollectionsDescriptor")
  .setAction(async (taskArgs, hre) => {
    const { collectionsDescriptorAddress, account } = taskArgs;

    const collectionsDescriptor = (await hre.ethers.getContractAt(
      "AgentCollectionsDescriptor",
      collectionsDescriptorAddress
    )) as unknown as AgentCollectionsDescriptor;

    try {
      const role = await collectionsDescriptor.DEFAULT_ADMIN_ROLE();
      const tx = await collectionsDescriptor.revokeRole(role, account);
      const receipt = await tx.wait();
      console.log(
        `Revoked DEFAULT_ADMIN_ROLE from ${account} on AgentCollectionsDescriptor ${collectionsDescriptorAddress}. Tx: ${receipt?.hash}`
      );
    } catch (error) {
      console.error("Error revoking admin role:", error);
      const iface = new hre.ethers.Interface(
        AgentCollectionsDescriptor__factory.abi
      );
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      console.error(error, iface.parseError((error as any).data));
    }
  });
