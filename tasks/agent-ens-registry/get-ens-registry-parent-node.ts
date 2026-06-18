import { task } from "hardhat/config";
import {
  AgentEnsRegistry,
  AgentEnsRegistry__factory,
} from "../../typechain-types";

export default task("get-ens-registry-parent-node")
  .addParam("ensRegistryAddress", "The address of the AgentEnsRegistry")
  .setDescription("Get the configured parent ENS node (bytes32)")
  .setAction(async (taskArgs, hre) => {
    const { ensRegistryAddress } = taskArgs;

    const ensRegistry = (await hre.ethers.getContractAt(
      "AgentEnsRegistry",
      ensRegistryAddress
    )) as unknown as AgentEnsRegistry;

    try {
      const parentNode = await ensRegistry.parentNode();
      console.log(`Parent node: ${parentNode}`);
    } catch (error) {
      console.error("Error reading parentNode:", error);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const revertData = (error as any).data;
      if (typeof revertData === "string" && revertData.length > 2) {
        const iface = new hre.ethers.Interface(AgentEnsRegistry__factory.abi);
        console.error(iface.parseError(revertData));
      }
    }
  });
