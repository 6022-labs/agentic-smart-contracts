import { task } from "hardhat/config";
import {
  AgentCollectionV1,
  AgentCollectionV1__factory,
} from "../../typechain-types";

export default task("get-address-token-id")
  .addParam("collectionAddress", "The address of the collection")
  .addParam("addressType", 'The address type ("evm", "btc", ...)')
  .addParam("value", "The address value to look up")
  .setDescription("Get the agent token ID a typed address is registered to")
  .setAction(async (taskArgs, hre) => {
    const { collectionAddress, addressType, value } = taskArgs;

    console.log(
      `Getting agent token ID for ${addressType} address: ${value} on collection at address: ${collectionAddress}`,
    );

    const agentCollection = (await hre.ethers.getContractAt(
      "AgentCollectionV1",
      collectionAddress,
    )) as unknown as AgentCollectionV1;

    try {
      const tokenId = await agentCollection.addressToTokenId(
        addressType,
        value,
      );
      console.log(
        `Token ID for ${addressType} address ${value}: ${tokenId} (0 means the address is not registered to any agent)`,
      );
    } catch (error) {
      console.error("Error getting address token ID:", error);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const revertData = (error as any).data;
      if (typeof revertData === "string" && revertData.length > 2) {
        const iface = new hre.ethers.Interface(AgentCollectionV1__factory.abi);
        console.error(iface.parseError(revertData));
      }
    }
  });
