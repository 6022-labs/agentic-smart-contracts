import { task } from "hardhat/config";
import {
  AgentEnsOffchainResolver,
  AgentEnsOffchainResolver__factory,
} from "../../typechain-types";

export default task("is-resolver-signer-trusted")
  .addParam("resolverAddress", "The address of the AgentEnsOffchainResolver")
  .addParam("signer", "Address to check trust status for")
  .setDescription("Check whether an address is a trusted gateway signer")
  .setAction(async (taskArgs, hre) => {
    const { resolverAddress, signer } = taskArgs;

    const resolver = (await hre.ethers.getContractAt(
      "AgentEnsOffchainResolver",
      resolverAddress
    )) as unknown as AgentEnsOffchainResolver;

    try {
      const trusted = await resolver.signers(signer);
      console.log(`signers(${signer}) = ${trusted}`);
    } catch (error) {
      console.error("Error reading signer:", error);
      const iface = new hre.ethers.Interface(
        AgentEnsOffchainResolver__factory.abi
      );
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      console.error(error, iface.parseError((error as any).data));
    }
  });
