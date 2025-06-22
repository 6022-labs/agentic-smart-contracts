import { ethers } from "hardhat";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { AgenticAIAgentCollection } from "../typechain-types";

export function generateRandomAddress(): string {
  return ethers.Wallet.createRandom().address;
}

export async function signMintRequest(
  signer: HardhatEthersSigner,
  agenticAIAgentCollection: AgenticAIAgentCollection,
  params: {
    to: string;
    agentAddresses: string[];
    signer: string;
    role: string;
    name: string;
    images: { key: string; value: string }[];
    mission: string;
    nonce: string;
  }
) {
  if (!agenticAIAgentCollection) {
    throw new Error("AgenticAIAgentCollection instance not set");
  }

  const domain = {
    name: "AgenticAIAgentCollection",
    version: "1",
    chainId: (await ethers.provider.getNetwork()).chainId,
    verifyingContract: await agenticAIAgentCollection.getAddress(),
  };

  const types = {
    MintRequest: [
      { name: "to", type: "address" },
      { name: "agentAddressesHash", type: "bytes32" },
      { name: "signer", type: "address" },
      { name: "roleHash", type: "bytes32" },
      { name: "nameHash", type: "bytes32" },
      { name: "missionHash", type: "bytes32" },
      { name: "imagesHash", type: "bytes32" },
      { name: "nonce", type: "bytes32" },
    ],
  };

  const agentAddressesHash = ethers.keccak256(
    ethers.solidityPacked(["address[]"], [params.agentAddresses])
  );
  const roleHash = ethers.keccak256(ethers.toUtf8Bytes(params.role));
  const nameHash = ethers.keccak256(ethers.toUtf8Bytes(params.name));
  // Hash the images array as in Solidity: keccak256(abi.encodePacked(keccak256(abi.encodePacked(key, value)), ...))
  const imageHashes = params.images.map((img) =>
    ethers.keccak256(
      ethers.solidityPacked(["string", "string"], [img.key, img.value])
    )
  );
  const imagesPacked = ethers.solidityPacked(["bytes32[]"], [imageHashes]);
  const imagesHash = ethers.keccak256(imagesPacked);
  const missionHash = ethers.keccak256(ethers.toUtf8Bytes(params.mission));

  const message = {
    to: params.to,
    agentAddressesHash,
    signer: params.signer,
    roleHash,
    nameHash,
    imagesHash,
    missionHash,
    nonce: ethers.keccak256(ethers.toUtf8Bytes(params.nonce)),
  };

  return await signer.signTypedData(domain, types, message);
}

export function generateRandomNonce(): string {
  return ethers.hexlify(ethers.randomBytes(32));
}

export async function signUpdateAgentSignerRequest(
  signer: HardhatEthersSigner,
  agenticAIAgentCollection: AgenticAIAgentCollection,
  params: { tokenId: string; newSigner: string; nonce: string }
) {
  const domain = {
    name: "AgenticAIAgentCollection",
    version: "1",
    chainId: (await ethers.provider.getNetwork()).chainId,
    verifyingContract: await agenticAIAgentCollection.getAddress(),
  };

  const types = {
    UpdateAgentSignerRequest: [
      { name: "tokenId", type: "uint256" },
      { name: "newSigner", type: "address" },
      { name: "nonce", type: "bytes32" },
    ],
  };

  const message = {
    tokenId: params.tokenId,
    newSigner: params.newSigner,
    nonce: ethers.keccak256(ethers.toUtf8Bytes(params.nonce)),
  };

  return await signer.signTypedData(domain, types, message);
}

export async function proposeAndMint(
  signer: HardhatEthersSigner,
  collection: AgenticAIAgentCollection,
  minter: HardhatEthersSigner,
  params: {
    to: string;
    agentAddresses?: string[];
    role?: string;
    name?: string;
    images?: { key: string; value: string }[];
    mission?: string;
    nonce?: string;
  }
) {
  const {
    agentAddresses = [generateRandomAddress()],
    role = "facilitator",
    name = "test-agent",
    images = [
      {
        key: "default",
        value: "bafybeibsulc7sgpck3w7ur7eqa6fwaazcsswn3dg3rfl65zka3knajx43i",
      },
    ],
    mission = "",
    nonce = generateRandomNonce(),
  } = params;

  const signature = await signMintRequest(signer, collection, {
    to: params.to,
    agentAddresses,
    signer: signer.address,
    role,
    name,
    images,
    mission,
    nonce,
  });

  await collection.createMintProposal(
    params.to,
    agentAddresses,
    signer.address,
    role,
    name,
    mission,
    images,
    ethers.id(nonce),
    signature,
  );

  const mintProposalsLength = await collection.mintProposalsLength();
  const tokenId = await collection.nextTokenId();

  await collection
    .connect(minter)
    .mintFromProposal(mintProposalsLength - BigInt(1));

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
    name = "AgenticAI",
    symbol = "AIA",
    description = "description",
    owner,
    moderator,
  } = params;

  const CollectionsManager = await ethers.getContractFactory(
    "AgenticAIAgentCollectionsManager"
  );
  const collectionsManager = await CollectionsManager.deploy();

  const CollectionsDescriptor = await ethers.getContractFactory(
    "AgenticAIAgentCollectionsDescriptor"
  );
  const collectionsDescriptor = await CollectionsDescriptor.deploy(ipfsGateway);

  const Collection = await ethers.getContractFactory(
    "AgenticAIAgentCollection"
  );
  const collectionImplementation = await Collection.deploy();

  const TestErc20 = await ethers.getContractFactory("TestERC20");
  const testErc20 = await TestErc20.deploy();

  const CollectionCreator = await ethers.getContractFactory(
    "AgenticAIAgentCollectionCreator"
  );
  const collectionCreator = await CollectionCreator.deploy(
    await collectionsManager.getAddress(),
    await collectionsDescriptor.getAddress(),
    await collectionImplementation.getAddress()
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
  const collection = Collection.attach(
    collectionAddress
  ) as AgenticAIAgentCollection;

  return {
    collection,
    collectionsManager,
    collectionsDescriptor,
    collectionCreator,
  };
}

