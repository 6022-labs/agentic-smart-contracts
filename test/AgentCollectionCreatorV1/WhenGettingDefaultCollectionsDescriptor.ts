import { expect } from "chai";
import { ethers } from "hardhat";
import { loadFixture, reset } from "@nomicfoundation/hardhat-network-helpers";
import {
  AgentCollectionCreatorV1,
  AgentCollectionsDescriptor,
  AgentCollectionsManager,
} from "../../typechain-types";

import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";

describe("WhenGettingDefaultCollectionsDescriptor", function () {
  const ipfsGateway = "https://ipfs.io/ipfs/";

  let _collectionCreator: AgentCollectionCreatorV1;
  let _collectionsDescriptor: AgentCollectionsDescriptor;
  let _owner: HardhatEthersSigner;

  async function deployCreator() {
    await reset();

    const [owner] = await ethers.getSigners();

    const CollectionsManager = await ethers.getContractFactory(
      "AgentCollectionsManager"
    );
    const collectionsManager =
      (await CollectionsManager.deploy()) as AgentCollectionsManager;

    const CollectionsDescriptor = await ethers.getContractFactory(
      "AgentCollectionsDescriptor"
    );
    const collectionsDescriptor = await CollectionsDescriptor.deploy(
      ipfsGateway
    );

    const Collection = await ethers.getContractFactory("AgentCollectionV1");
    const collectionImplementation = await Collection.deploy();

    const CollectionCreator = await ethers.getContractFactory(
      "AgentCollectionCreatorV1"
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
      expect(await _collectionCreator.collectionsDescriptor()).to.equal(
        await _collectionsDescriptor.getAddress()
      );
    });
  });
});
