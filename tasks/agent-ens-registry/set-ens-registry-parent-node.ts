import { task } from "hardhat/config";
import {
  AgentEnsRegistry,
  AgentEnsRegistry__factory,
} from "../../typechain-types";

export default task("set-ens-registry-parent-node")
  .addParam("ensRegistryAddress", "The address of the AgentEnsRegistry")
  .addParam(
    "parentDomain",
    "The new parent ENS domain (e.g. 6022.eth); namehashed by the task"
  )
  .setDescription("Update the parent ENS node under which agent subnodes live")
  .setAction(async (taskArgs, hre) => {
    const { ensRegistryAddress, parentDomain } = taskArgs;
    const newParentNode = hre.ethers.namehash(parentDomain);

    const ensRegistry = (await hre.ethers.getContractAt(
      "AgentEnsRegistry",
      ensRegistryAddress
    )) as unknown as AgentEnsRegistry;

    try {
      const tx = await ensRegistry.setParentNode(newParentNode);
      const receipt = await tx.wait();
      console.log(
        `Parent node updated to namehash("${parentDomain}") = ${newParentNode}. Tx: ${receipt?.hash}`
      );
    } catch (error) {
      console.error("Error setting parent node:", error);
      const iface = new hre.ethers.Interface(AgentEnsRegistry__factory.abi);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      console.error(error, iface.parseError((error as any).data));
    }
  });
