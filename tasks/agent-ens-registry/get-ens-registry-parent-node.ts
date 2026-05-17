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
      const iface = new hre.ethers.Interface(AgentEnsRegistry__factory.abi);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      console.error(error, iface.parseError((error as any).data));
    }
  });
