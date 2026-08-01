import { task } from "hardhat/config";
import {
  AgentEnsOffchainResolver,
  AgentEnsOffchainResolver__factory,
} from "../../typechain-types";

export default task("get-resolver-supports-interface")
  .addParam("resolverAddress", "The address of the AgentEnsOffchainResolver")
  .addOptionalParam(
    "interfaceId",
    "ERC-165 interface id (default: 0x9061b923 = IExtendedResolver / ENSIP-10)",
    "0x9061b923"
  )
  .setDescription("Check whether the resolver advertises an ERC-165 interface")
  .setAction(async (taskArgs, hre) => {
    const { resolverAddress, interfaceId } = taskArgs;

    const resolver = (await hre.ethers.getContractAt(
      "AgentEnsOffchainResolver",
      resolverAddress
    )) as unknown as AgentEnsOffchainResolver;

    try {
      const supported = await resolver.supportsInterface(interfaceId);
      console.log(`supportsInterface(${interfaceId}) = ${supported}`);
    } catch (error) {
      console.error("Error reading supportsInterface:", error);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const revertData = (error as any).data;
      if (typeof revertData === "string" && revertData.length > 2) {
        const iface = new hre.ethers.Interface(
          AgentEnsOffchainResolver__factory.abi
        );
        console.error(iface.parseError(revertData));
      }
    }
  });
