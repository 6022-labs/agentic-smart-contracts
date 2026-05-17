import { task } from "hardhat/config";
import {
  AgentEnsOffchainResolver,
  AgentEnsOffchainResolver__factory,
} from "../../typechain-types";

/// DNS-encode a dotted name: each label gets a 1-byte length prefix and the
/// whole thing terminates with 0x00. Matches the format passed to ENSIP-10
/// `resolve(bytes name, ...)`.
function dnsEncode(name: string): string {
  const parts = name.split(".");
  const out: number[] = [];
  for (const label of parts) {
    if (label.length > 255) {
      throw new Error(`Label too long: ${label}`);
    }
    out.push(label.length);
    for (const ch of Buffer.from(label, "utf8")) {
      out.push(ch);
    }
  }
  out.push(0);
  return "0x" + Buffer.from(out).toString("hex");
}

export default task("resolve-name")
  .addParam("resolverAddress", "The address of the AgentEnsOffchainResolver")
  .addParam(
    "name",
    "Dotted ENS name to resolve (e.g. alice.agents.137.6022.eth)"
  )
  .addOptionalParam(
    "key",
    "Text record key to look up (default: agent.runtime-url)",
    "agent.runtime-url"
  )
  .setDescription(
    "Call resolver.resolve(name, data); always reverts OffchainLookup which the task decodes and prints"
  )
  .setAction(async (taskArgs, hre) => {
    const { resolverAddress, name, key } = taskArgs;

    const dnsName = dnsEncode(name);
    const node = hre.ethers.namehash(name);
    const textIface = new hre.ethers.Interface([
      "function text(bytes32 node, string key) view returns (string)",
    ]);
    const callData = textIface.encodeFunctionData("text", [node, key]);

    const resolver = (await hre.ethers.getContractAt(
      "AgentEnsOffchainResolver",
      resolverAddress
    )) as unknown as AgentEnsOffchainResolver;

    try {
      const result = await resolver.resolve(dnsName, callData);
      console.log(`Unexpected non-revert result: ${result}`);
    } catch (error) {
      const iface = new hre.ethers.Interface(
        AgentEnsOffchainResolver__factory.abi
      );
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const errData = (error as any).data;
      const parsed = errData ? iface.parseError(errData) : null;

      if (parsed && parsed.name === "OffchainLookup") {
        const [sender, urls, lookupCallData, callbackFn, extraData] =
          parsed.args;
        console.log("OffchainLookup (expected):");
        console.log(`  sender:           ${sender}`);
        console.log(`  urls:             ${urls}`);
        console.log(`  callData:         ${lookupCallData}`);
        console.log(`  callbackFunction: ${callbackFn}`);
        console.log(`  extraData:        ${extraData}`);
      } else {
        console.error("Unexpected error:", error, parsed);
      }
    }
  });
