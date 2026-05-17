import { task } from "hardhat/config";
import {
  AgentEnsOffchainResolver,
  AgentEnsOffchainResolver__factory,
} from "../../typechain-types";

export default task("set-resolver-signer")
  .addParam("resolverAddress", "The address of the AgentEnsOffchainResolver")
  .addParam("signer", "Signer address to add or remove from the trusted set")
  .addParam("trusted", "true to add as trusted, false to revoke")
  .setDescription("Add or remove a trusted gateway signer")
  .setAction(async (taskArgs, hre) => {
    const { resolverAddress, signer } = taskArgs;
    const trusted = String(taskArgs.trusted).toLowerCase() === "true";

    const resolver = (await hre.ethers.getContractAt(
      "AgentEnsOffchainResolver",
      resolverAddress
    )) as unknown as AgentEnsOffchainResolver;

    try {
      const tx = await resolver.setSigner(signer, trusted);
      const receipt = await tx.wait();
      console.log(
        `${trusted ? "Trusted" : "Untrusted"} signer ${signer}. Tx: ${receipt?.hash}`
      );
    } catch (error) {
      console.error("Error setting signer:", error);
      const iface = new hre.ethers.Interface(
        AgentEnsOffchainResolver__factory.abi
      );
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      console.error(error, iface.parseError((error as any).data));
    }
  });
