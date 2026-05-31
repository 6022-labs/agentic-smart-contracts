import { ethers } from "hardhat";
import { AgentCollectionV1 } from "../typechain-types";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { NullableUint256Struct } from "../typechain-types/contracts/AgentCollectionV1";

export function generateRandomAddress(): string {
  return ethers.Wallet.createRandom().address;
}

export function generateRandomNonce(): string {
  return ethers.hexlify(ethers.randomBytes(32));
}

export async function proposeAndMint(
  collection: AgentCollectionV1,
  minter: HardhatEthersSigner,
  params: {
    to: string;
    wallets?: string[];
    role?: string;
    name?: string;
    images?: { key: string; value: string }[];
    attributes?: { key: string; value: string }[];
    cloneOf?: NullableUint256Struct;
  }
) {
  const {
    wallets = [generateRandomAddress()],
    role = "facilitator",
    name = "test-agent",
    images = [
      {
        key: "default",
        value: "bafybeibsulc7sgpck3w7ur7eqa6fwaazcsswn3dg3rfl65zka3knajx43i",
      },
    ],
    attributes = [{ key: "mission", value: "random mission" }],
    cloneOf = { isSet: false, value: 0n },
  } = params;

  await collection
    .connect(minter)
    .createMintProposal(params.to, role, name, wallets, images, attributes, cloneOf!);

  const mintProposalsLength = await collection.mintProposalsLength();
  const proposalIndex = mintProposalsLength - BigInt(1);
  const { id: proposalId } = await collection.mintProposal(proposalIndex);
  const tokenId = await collection.nextTokenId();

  await collection.connect(minter).mintFromProposal(proposalId);

  return tokenId;
}

export function decodeTokenURI(tokenURI: string) {
  const decoded = Buffer.from(
    tokenURI.replace("data:application/json;base64,", ""),
    "base64"
  ).toString("utf-8");

  return JSON.parse(decoded);
}
export async function deployCollectionWithCreator(params: {
  ipfsGateway?: string;
  name?: string;
  symbol?: string;
  description?: string;
  owner: HardhatEthersSigner;
  moderator: HardhatEthersSigner;
}) {
  const {
    ipfsGateway = "https://ipfs.io/ipfs/",
    name = "agents",
    symbol = "AIA",
    description = `very long "description" with some 'quotes' that is only used for testing purposes............................................................................................................`,
    owner,
    moderator,
  } = params;

  const CollectionsManager = await ethers.getContractFactory(
    "AgentCollectionsManager"
  );
  const collectionsManager = await CollectionsManager.deploy();

  const CollectionsDescriptor = await ethers.getContractFactory(
    "AgentCollectionsDescriptor"
  );
  const collectionsDescriptor = await CollectionsDescriptor.deploy(ipfsGateway);

  const Collection = await ethers.getContractFactory("AgentCollectionV1");
  const collectionImplementation = await Collection.deploy();

  const TestErc20 = await ethers.getContractFactory("TestERC20");
  const testErc20 = await TestErc20.deploy();

  const CollateralController = await ethers.getContractFactory(
    "TestCollateralController6022"
  );
  const collateralController = await CollateralController.deploy();

  const CollectionCreator = await ethers.getContractFactory(
    "AgentCollectionCreatorV1"
  );
  const collectionCreator = await CollectionCreator.deploy(
    await collectionsManager.getAddress(),
    await collectionsDescriptor.getAddress(),
    await collectionImplementation.getAddress(),
    await collateralController.getAddress()
  );

  await collectionCreator.addAuthorizedTokenForCreation(
    await testErc20.getAddress(),
    0n
  );
  await collectionsManager.grantRole(
    await collectionsManager.CREATOR_ROLE(),
    await collectionCreator.getAddress()
  );

  await collectionCreator.createCollection(
    name,
    symbol,
    description,
    owner.address,
    moderator.address
  );

  const collectionAddress = await collectionsManager.collections(
    (await collectionsManager.nextCollectionId()) - BigInt(1)
  );
  const collection = Collection.attach(collectionAddress) as AgentCollectionV1;

  return {
    collection,
    collectionCreator,
    collectionsManager,
    collateralController,
    collectionsDescriptor,
  };
}
