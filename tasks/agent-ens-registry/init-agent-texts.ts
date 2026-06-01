import { task } from "hardhat/config";
import {
  AgentEnsRegistry,
  AgentEnsRegistry__factory,
} from "../../typechain-types";

export default task("init-agent-texts")
  .addParam("ensRegistryAddress", "The address of the AgentEnsRegistry")
  .addParam("collectionAddress", "The address of the agent's collection")
  .addParam("tokenId", "The agent's token id")
  .addParam(
    "records",
    "Comma-separated key=value entries; must include url. Keys/values may not contain ',' or '='. Example: url=https://x/"
  )
  .setDescription(
    "Provision an agent's ENS subnode and seed its records in one call"
  )
  .setAction(async (taskArgs, hre) => {
    const { ensRegistryAddress, collectionAddress, tokenId, records } =
      taskArgs;

    const parsed = (records as string)
      .split(",")
      .map((s) => s.trim())
      .filter((s) => s.length > 0)
      .map((entry) => {
        const eq = entry.indexOf("=");
        if (eq === -1) {
          throw new Error(
            `Bad --records entry "${entry}": expected key=value`
          );
        }
        return { key: entry.slice(0, eq), value: entry.slice(eq + 1) };
      });

    const ensRegistry = (await hre.ethers.getContractAt(
      "AgentEnsRegistry",
      ensRegistryAddress
    )) as unknown as AgentEnsRegistry;

    try {
      const tx = await ensRegistry.initAgentTexts(
        collectionAddress,
        tokenId,
        parsed
      );
      const receipt = await tx.wait();
      console.log(
        `Provisioned agent (${collectionAddress}, ${tokenId}) with ${parsed.length} record(s). Tx: ${receipt?.hash}`
      );
    } catch (error) {
      console.error("Error initializing agent texts:", error);
      const iface = new hre.ethers.Interface(AgentEnsRegistry__factory.abi);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      console.error(error, iface.parseError((error as any).data));
    }
  });
