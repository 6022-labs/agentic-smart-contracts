import { task } from "hardhat/config";
import { LogDescription, EventLog, Log } from "ethers";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import {
  AgentCollectionCreatorV1,
  AgentCollectionCreatorV1__factory,
} from "../../typechain-types";

export default task("create-collection")
  .addParam("collectionCreatorAddress", "The address of the collection creator")
  .addParam("collectionName", "The name of the collection")
  .addParam("collectionSymbol", "The symbol of the collection")
  .addParam("collectionDescription", "The description of the collection")
  .addOptionalParam("collectionAdmin", "The address of the collection admin")
  .addOptionalParam(
    "collectionModerator",
    "The address of the collection moderator"
  )
  .setDescription("Create a new collection")
  .setAction(async (taskArgs, hre) => {
    const [signer] = await hre.ethers.getSigners();

    console.log(`Creating collection with signer: ${signer.address}`);

    const {
      collectionCreatorAddress,
      collectionName,
      collectionSymbol,
      collectionDescription,
      collectionAdmin = signer.address,
      collectionModerator = signer.address,
    } = taskArgs;

    console.log(`Deploying collection with the following parameters:
      Collection Creator Address: ${collectionCreatorAddress}
      Collection Name: ${collectionName}
      Collection Symbol: ${collectionSymbol}
      Collection Description: ${collectionDescription}
      Collection Admin: ${collectionAdmin}
      Collection Moderator: ${collectionModerator}
    `);

    const agentCollectionCreator = (await hre.ethers.getContractAt(
      "AgentCollectionCreatorV1",
      collectionCreatorAddress
    )) as unknown as AgentCollectionCreatorV1;

    try {
      const tx = await agentCollectionCreator.createCollection(
        collectionName,
        collectionSymbol,
        collectionDescription,
        collectionAdmin,
        collectionModerator
      );
      const txReceipt = await tx.wait();

      if (!txReceipt) {
        console.error("Transaction receipt not found.");
        return;
      }

      const collectionCreatedLogs = await logsToLogDescriptions(
        hre,
        txReceipt.logs,
        "CollectionCreated(uint256,address,string,string)",
        "AgentCollectionsManager"
      );

      if (collectionCreatedLogs.length === 0) {
        console.error("No CollectionCreated event found in transaction logs.");
        return;
      }

      const collectionCreatedLog = collectionCreatedLogs[0];

      console.log(
        `Collection created successfully! \n
        Collection ID: ${collectionCreatedLog.args.collectionId.toString()}
        Collection Address: ${collectionCreatedLog.args.collectionAddress}`
      );
    } catch (error) {
      console.error("Error creating collection:", error);

      const iface = new hre.ethers.Interface(
        AgentCollectionCreatorV1__factory.abi
      );
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      console.error(error, iface.parseError((error as any).data));
    }
  });

async function logsToLogDescriptions(
  hre: HardhatRuntimeEnvironment,
  logs: (EventLog | Log)[],
  eventKey: string,
  contract: string
): Promise<LogDescription[]> {
  const wantedEvents = findEventFromLogs(hre, logs, eventKey);

  const ContractFactory = await hre.ethers.getContractFactory(contract);

  const logDescriptions = wantedEvents.map((log) => {
    return ContractFactory.interface.parseLog(log);
  });

  return logDescriptions.filter((x) => x !== null);
}

function findEventFromLogs(
  hre: HardhatRuntimeEnvironment,
  logs: (EventLog | Log)[],
  eventKey: string
) {
  const vaultCreatedHash = hre.ethers.keccak256(
    hre.ethers.toUtf8Bytes(eventKey)
  );

  return logs.filter((log) => log.topics[0] == vaultCreatedHash);
}
