import { task } from "hardhat/config";
import {
  AgentEnsRegistry,
  AgentEnsRegistry__factory,
} from "../../typechain-types";

export default task("add-admin-to-ens-registry")
  .addParam("ensRegistryAddress", "The address of the AgentEnsRegistry")
  .addParam("account", "The address to grant DEFAULT_ADMIN_ROLE")
  .setDescription("Grant DEFAULT_ADMIN_ROLE on the AgentEnsRegistry")
  .setAction(async (taskArgs, hre) => {
    const { ensRegistryAddress, account } = taskArgs;

    const ensRegistry = (await hre.ethers.getContractAt(
      "AgentEnsRegistry",
      ensRegistryAddress
    )) as unknown as AgentEnsRegistry;

    try {
      const role = await ensRegistry.DEFAULT_ADMIN_ROLE();
      const tx = await ensRegistry.grantRole(role, account);
      const receipt = await tx.wait();
      console.log(
        `Granted DEFAULT_ADMIN_ROLE to ${account} on AgentEnsRegistry ${ensRegistryAddress}. Tx: ${receipt?.hash}`
      );
    } catch (error) {
      console.error("Error granting admin role:", error);
      const iface = new hre.ethers.Interface(AgentEnsRegistry__factory.abi);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      console.error(error, iface.parseError((error as any).data));
    }
  });
