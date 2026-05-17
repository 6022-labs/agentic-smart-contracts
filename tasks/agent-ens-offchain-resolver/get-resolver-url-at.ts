import { task } from "hardhat/config";
import {
  AgentEnsOffchainResolver,
  AgentEnsOffchainResolver__factory,
} from "../../typechain-types";

export default task("get-resolver-url-at")
  .addParam("resolverAddress", "The address of the AgentEnsOffchainResolver")
  .addParam("index", "Index into the gateway URL list")
  .setDescription("Read a gateway URL by index")
  .setAction(async (taskArgs, hre) => {
    const { resolverAddress, index } = taskArgs;

    const resolver = (await hre.ethers.getContractAt(
      "AgentEnsOffchainResolver",
      resolverAddress
    )) as unknown as AgentEnsOffchainResolver;

    try {
      const url = await resolver.urls(index);
      console.log(`urls[${index}] = ${url}`);
    } catch (error) {
      console.error("Error reading url:", error);
      const iface = new hre.ethers.Interface(
        AgentEnsOffchainResolver__factory.abi
      );
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      console.error(error, iface.parseError((error as any).data));
    }
  });
