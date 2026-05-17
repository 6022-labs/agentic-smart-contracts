import { task } from "hardhat/config";
import {
  AgentEnsOffchainResolver,
  AgentEnsOffchainResolver__factory,
} from "../../typechain-types";

export default task("add-admin-to-resolver")
  .addParam("resolverAddress", "The address of the AgentEnsOffchainResolver")
  .addParam("account", "The address to grant DEFAULT_ADMIN_ROLE")
  .setDescription("Grant DEFAULT_ADMIN_ROLE on the AgentEnsOffchainResolver")
  .setAction(async (taskArgs, hre) => {
    const { resolverAddress, account } = taskArgs;

    const resolver = (await hre.ethers.getContractAt(
      "AgentEnsOffchainResolver",
      resolverAddress
    )) as unknown as AgentEnsOffchainResolver;

    try {
      const role = await resolver.DEFAULT_ADMIN_ROLE();
      const tx = await resolver.grantRole(role, account);
      const receipt = await tx.wait();
      console.log(
        `Granted DEFAULT_ADMIN_ROLE to ${account} on resolver ${resolverAddress}. Tx: ${receipt?.hash}`
      );
    } catch (error) {
      console.error("Error granting admin role:", error);
      const iface = new hre.ethers.Interface(
        AgentEnsOffchainResolver__factory.abi
      );
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      console.error(error, iface.parseError((error as any).data));
    }
  });
