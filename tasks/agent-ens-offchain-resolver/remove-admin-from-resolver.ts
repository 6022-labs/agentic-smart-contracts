import { task } from "hardhat/config";
import {
  AgentEnsOffchainResolver,
  AgentEnsOffchainResolver__factory,
} from "../../typechain-types";

export default task("remove-admin-from-resolver")
  .addParam("resolverAddress", "The address of the AgentEnsOffchainResolver")
  .addParam("account", "The address to revoke DEFAULT_ADMIN_ROLE from")
  .setDescription("Revoke DEFAULT_ADMIN_ROLE on the AgentEnsOffchainResolver")
  .setAction(async (taskArgs, hre) => {
    const { resolverAddress, account } = taskArgs;

    const resolver = (await hre.ethers.getContractAt(
      "AgentEnsOffchainResolver",
      resolverAddress
    )) as unknown as AgentEnsOffchainResolver;

    try {
      const role = await resolver.DEFAULT_ADMIN_ROLE();
      const tx = await resolver.revokeRole(role, account);
      const receipt = await tx.wait();
      console.log(
        `Revoked DEFAULT_ADMIN_ROLE from ${account} on resolver ${resolverAddress}. Tx: ${receipt?.hash}`
      );
    } catch (error) {
      console.error("Error revoking admin role:", error);
      const iface = new hre.ethers.Interface(
        AgentEnsOffchainResolver__factory.abi
      );
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      console.error(error, iface.parseError((error as any).data));
    }
  });
