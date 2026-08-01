import { task } from "hardhat/config";
import {
  AgentEnsOffchainResolver,
  AgentEnsOffchainResolver__factory,
} from "../../typechain-types";

export default task("set-resolver-urls")
  .addParam("resolverAddress", "The address of the AgentEnsOffchainResolver")
  .addParam(
    "urls",
    "Comma-separated list of gateway URLs (e.g. https://gw1.example/{sender}/{data}.json,https://gw2.example/...)"
  )
  .setDescription("Replace the gateway URL list")
  .setAction(async (taskArgs, hre) => {
    const { resolverAddress, urls } = taskArgs;
    const parsed = (urls as string)
      .split(",")
      .map((u) => u.trim())
      .filter((u) => u.length > 0);

    const resolver = (await hre.ethers.getContractAt(
      "AgentEnsOffchainResolver",
      resolverAddress
    )) as unknown as AgentEnsOffchainResolver;

    try {
      const tx = await resolver.setUrls(parsed);
      const receipt = await tx.wait();
      console.log(
        `Replaced URL list with ${parsed.length} entr(y/ies). Tx: ${receipt?.hash}`
      );
    } catch (error) {
      console.error("Error setting urls:", error);
      const iface = new hre.ethers.Interface(
        AgentEnsOffchainResolver__factory.abi
      );
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      console.error(error, iface.parseError((error as any).data));
    }
  });
