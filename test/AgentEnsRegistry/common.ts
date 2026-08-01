import { ethers } from "hardhat";
import { reset } from "@nomicfoundation/hardhat-network-helpers";
import {
  generateRandomAddress,
  deployCollectionWithCreator,
  proposeAndMint,
  evmAddresses,
} from "../common";

export const PARENT_NODE = ethers.namehash("6022.eth");
export const COLLECTION_NAME = "agents";
export const AGENT_NAME = "test-agent";

export const URL_KEY = "url";

// Computes the agent's ENS node as <agentName>.<COLLECTION_NAME>.<chainId>.6022.eth,
// matching `AgentEnsRegistry._resolveAgentNode`.
export async function agentNode(agentName = AGENT_NAME): Promise<string> {
  const chainId = (await ethers.provider.getNetwork()).chainId.toString();
  const chainHash = ethers.keccak256(ethers.toUtf8Bytes(chainId));
  const chainNode = ethers.keccak256(
    ethers.solidityPacked(["bytes32", "bytes32"], [PARENT_NODE, chainHash])
  );
  const collectionHash = ethers.keccak256(ethers.toUtf8Bytes(COLLECTION_NAME));
  const collectionNode = ethers.keccak256(
    ethers.solidityPacked(["bytes32", "bytes32"], [chainNode, collectionHash])
  );
  const labelHash = ethers.keccak256(ethers.toUtf8Bytes(agentName));
  return ethers.keccak256(
    ethers.solidityPacked(["bytes32", "bytes32"], [collectionNode, labelHash])
  );
}

// A valid initAgentTexts batch — carries the mandatory url key.
export function runtimeRecords(url = "https://agent.example/") {
  return [{ key: URL_KEY, value: url }];
}

export async function deploySimpleAgentEnsRegistry() {
  await reset();

  const [admin, outsider] = await ethers.getSigners();

  const managerAddress = generateRandomAddress();

  const Registry = await ethers.getContractFactory("AgentEnsRegistry");
  const ensRegistry = await Registry.deploy(managerAddress, PARENT_NODE);

  return { admin, outsider, ensRegistry };
}

export async function deployAgentEnsRegistryWithAgent() {
  await reset();

  // agentWallet owns the NFT; agentControlledWallet is registered as an evm
  // address of the agent so it can also write records.
  const [owner, moderator, agentWallet, outsider, agentControlledWallet] =
    await ethers.getSigners();

  const { collection, collectionsManager } = await deployCollectionWithCreator({
    name: COLLECTION_NAME,
    owner,
    moderator,
  });

  const tokenId = await proposeAndMint(collection, moderator, {
    to: agentWallet.address,
    name: AGENT_NAME,
    addresses: evmAddresses(agentControlledWallet.address),
  });

  const Registry = await ethers.getContractFactory("AgentEnsRegistry");
  const ensRegistry = await Registry.deploy(
    await collectionsManager.getAddress(),
    PARENT_NODE
  );

  return {
    owner,
    moderator,
    agentWallet,
    agentControlledWallet,
    outsider,
    collection,
    collectionsManager,
    ensRegistry,
    tokenId,
  };
}
