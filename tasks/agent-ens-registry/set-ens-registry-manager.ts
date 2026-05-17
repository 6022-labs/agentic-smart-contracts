import { task } from "hardhat/config";
import {
  AgentEnsRegistry,
  AgentEnsRegistry__factory,
} from "../../typechain-types";

export default task("set-ens-registry-manager")
  .addParam("ensRegistryAddress", "The address of the AgentEnsRegistry")
  .addParam(
    "newManagerAddress",
    "The new AgentCollectionsManager address to use"
  )
  .setDescription("Update the collections manager used to gate write access")
  .setAction(async (taskArgs, hre) => {
    const { ensRegistryAddress, newManagerAddress } = taskArgs;

    const ensRegistry = (await hre.ethers.getContractAt(
      "AgentEnsRegistry",
      ensRegistryAddress
    )) as unknown as AgentEnsRegistry;

    try {
      const tx = await ensRegistry.setManager(newManagerAddress);
      const receipt = await tx.wait();
      console.log(
        `Manager updated to ${newManagerAddress}. Tx: ${receipt?.hash}`
      );
    } catch (error) {
      console.error("Error setting manager:", error);
      const iface = new hre.ethers.Interface(AgentEnsRegistry__factory.abi);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      console.error(error, iface.parseError((error as any).data));
    }
  });
