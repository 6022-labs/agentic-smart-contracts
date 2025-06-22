import { expect } from "chai";
import { ethers } from "hardhat";
import { loadFixture, reset } from "@nomicfoundation/hardhat-network-helpers";
import {
  AgenticAIAgentCollectionCreator,
  AgenticAIAgentCollectionsDescriptor,
  AgenticAIAgentCollectionsManager,
} from "../../typechain-types";

import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";

describe("WhenGettingDefaultCollectionsDescriptor", function () {
  const ipfsGateway = "https://ipfs.io/ipfs/";

  let _collectionCreator: AgenticAIAgentCollectionCreator;
  let _collectionsDescriptor: AgenticAIAgentCollectionsDescriptor;
  let _owner: HardhatEthersSigner;

  async function deployCreator() {
    await reset();

    const [owner] = await ethers.getSigners();

    const CollectionsManager = await ethers.getContractFactory(
      "AgenticAIAgentCollectionsManager"
    );
    const collectionsManager =
      (await CollectionsManager.deploy()) as AgenticAIAgentCollectionsManager;

    const CollectionsDescriptor = await ethers.getContractFactory(
      "AgenticAIAgentCollectionsDescriptor"
    );
    const collectionsDescriptor = await CollectionsDescriptor.deploy(
      ipfsGateway
    );

    const Collection = await ethers.getContractFactory(
      "AgenticAIAgentCollection"
    );
    const collectionImplementation = await Collection.deploy();

    const CollectionCreator = await ethers.getContractFactory(
      "AgenticAIAgentCollectionCreator"
    );
    const collectionCreator = await CollectionCreator.deploy(
      await collectionsManager.getAddress(),
      await collectionsDescriptor.getAddress(),
      await collectionImplementation.getAddress()
    );

    return { owner, collectionCreator, collectionsDescriptor };
  }

  beforeEach(async function () {
    const { owner, collectionCreator, collectionsDescriptor } =
      await loadFixture(deployCreator);

    _collectionCreator = collectionCreator;
    _collectionsDescriptor = collectionsDescriptor;
    _owner = owner;
  });

  describe("Given contract is deployed", function () {
    it("Should return the collections descriptor address", async function () {
      expect(await _collectionCreator.defaultCollectionsDescriptor()).to.equal(
        await _collectionsDescriptor.getAddress()
      );
    });
  });
});
