import { expect } from "chai";
import { ethers } from "hardhat";
import { loadFixture, reset } from "@nomicfoundation/hardhat-network-helpers";
import {
  AgenticAIAgentCollection,
  AgenticAIAgentCollectionsManager,
  AgenticAIAgentCollectionsDescriptor,
} from "../../typechain-types";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";

describe("WhenAddingCollection", function () {
  const ipfsGateway = "https://ipfs.io/ipfs/";

  let _collectionsManager: AgenticAIAgentCollectionsManager;
  let _descriptor: AgenticAIAgentCollectionsDescriptor;
  let _owner: HardhatEthersSigner;
  let _creator: HardhatEthersSigner;
  let _otherAccount: HardhatEthersSigner;

  async function deployCollectionsManager() {
    await reset();

    const [owner, creator, otherAccount] = await ethers.getSigners();

    const CollectionsManager = await ethers.getContractFactory(
      "AgenticAIAgentCollectionsManager"
    );
    const collectionsManager =
      (await CollectionsManager.deploy()) as AgenticAIAgentCollectionsManager;

    const Descriptor = await ethers.getContractFactory(
      "AgenticAIAgentCollectionsDescriptor"
    );
    const descriptor = (await Descriptor.deploy(
      ipfsGateway
    )) as AgenticAIAgentCollectionsDescriptor;

    const creatorRole = await collectionsManager.CREATOR_ROLE();
    await collectionsManager.grantRole(creatorRole, creator.address);

    return { owner, creator, otherAccount, collectionsManager, descriptor };
  }

  beforeEach(async function () {
    const { owner, creator, otherAccount, collectionsManager, descriptor } =
      await loadFixture(deployCollectionsManager);

    _owner = owner;
    _creator = creator;
    _otherAccount = otherAccount;
    _collectionsManager = collectionsManager;
    _descriptor = descriptor;
  });

  async function deployCollection(name: string, symbol: string) {
    const Collection = await ethers.getContractFactory(
      "AgenticAIAgentCollection"
    );
    const collection = (await Collection.deploy(
      name,
      symbol,
      _owner.address,
      _owner.address,
      await _collectionsManager.getAddress(),
      await _descriptor.getAddress()
    )) as AgenticAIAgentCollection;

    return collection;
  }

  describe("Given caller has creator role", function () {
    describe("Given collection with this name already exists", function () {
      it("Should revert", async function () {
        const collection = await deployCollection("AgenticAI", "AIA");
        await _collectionsManager
          .connect(_creator)
          .addCollection(await collection.getAddress());

        const duplicate = await deployCollection("AgenticAI", "AIB");

        await expect(
          _collectionsManager
            .connect(_creator)
            .addCollection(await duplicate.getAddress())
        )
          .to.be.revertedWithCustomError(
            _collectionsManager,
            "CollectionNameAlreadyExists"
          )
          .withArgs("AgenticAI");
      });
    });

    describe("Given collection with this symbol already exists", function () {
      it("Should revert", async function () {
        const collection = await deployCollection("AgenticAI", "AIA");
        await _collectionsManager
          .connect(_creator)
          .addCollection(await collection.getAddress());

        const duplicate = await deployCollection("Another", "AIA");

        await expect(
          _collectionsManager
            .connect(_creator)
            .addCollection(await duplicate.getAddress())
        )
          .to.be.revertedWithCustomError(
            _collectionsManager,
            "CollectionSymbolAlreadyExists"
          )
          .withArgs("AIA");
      });
    });

    describe("Given name and symbol are not already taken", function () {
      it("Should add a collection and emit event", async function () {
        const collection = await deployCollection("AgenticAI", "AIA");

        await expect(
          _collectionsManager
            .connect(_creator)
            .addCollection(await collection.getAddress())
        )
          .to.emit(_collectionsManager, "CollectionCreated")
          .withArgs(1n, await collection.getAddress(), "AgenticAI", "AIA");

        expect(await _collectionsManager.collection(1)).to.equal(
          await collection.getAddress()
        );
      });
    });
  });

  describe("Given caller does not have creator role", function () {
    it("Should revert with 'AccessControlUnauthorizedAccount' error", async function () {
      const collection = await deployCollection("AgenticAI", "AIA");

      await expect(
        _collectionsManager
          .connect(_otherAccount)
          .addCollection(await collection.getAddress())
      ).to.be.revertedWithCustomError(
        _collectionsManager,
        "AccessControlUnauthorizedAccount"
      );
    });
  });
});
