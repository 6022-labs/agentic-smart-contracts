import { task } from "hardhat/config";
import {
  AgentEnsOffchainResolver,
  AgentEnsOffchainResolver__factory,
} from "../../typechain-types";

export default task("resolve-with-proof")
  .addParam("resolverAddress", "The address of the AgentEnsOffchainResolver")
  .addParam(
    "response",
    "Hex-encoded gateway response (abi.encode(bytes result, uint64 expires, bytes sig))"
  )
  .addParam(
    "extraData",
    "Hex-encoded extraData from the original OffchainLookup revert (the inner resolve callData)"
  )
  .setDescription(
    "CCIP-Read callback: verify a gateway-signed response and return the resolved bytes. Niche; typically called by clients, not humans."
  )
  .setAction(async (taskArgs, hre) => {
    const { resolverAddress, response, extraData } = taskArgs;

    const resolver = (await hre.ethers.getContractAt(
      "AgentEnsOffchainResolver",
      resolverAddress
    )) as unknown as AgentEnsOffchainResolver;

    try {
      const result = await resolver.resolveWithProof(response, extraData);
      console.log(`Resolved bytes: ${result}`);
    } catch (error) {
      console.error("Error in resolveWithProof:", error);
      const iface = new hre.ethers.Interface(
        AgentEnsOffchainResolver__factory.abi
      );
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      console.error(error, iface.parseError((error as any).data));
    }
  });
