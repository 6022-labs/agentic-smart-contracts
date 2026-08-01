import { task } from "hardhat/config";
import {
  AgentEnsRegistry,
  AgentEnsRegistry__factory,
} from "../../typechain-types";

export default task("get-ens-registry-manager")
  .addParam("ensRegistryAddress", "The address of the AgentEnsRegistry")
  .setDescription("Get the configured collections manager address")
  .setAction(async (taskArgs, hre) => {
    const { ensRegistryAddress } = taskArgs;

    const ensRegistry = (await hre.ethers.getContractAt(
      "AgentEnsRegistry",
      ensRegistryAddress
    )) as unknown as AgentEnsRegistry;

    try {
      const manager = await ensRegistry.manager();
      console.log(`Manager: ${manager}`);
    } catch (error) {
      console.error("Error reading manager:", error);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const revertData = (error as any).data;
      if (typeof revertData === "string" && revertData.length > 2) {
        const iface = new hre.ethers.Interface(AgentEnsRegistry__factory.abi);
        console.error(iface.parseError(revertData));
      }
    }
  });
