import { expect } from "chai";
import { ethers } from "hardhat";
import { generateRandomAddress } from "../common";
import { loadFixture, reset } from "@nomicfoundation/hardhat-network-helpers";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import {
  AgentCollectionCreatorV1,
  AgentCollectionsManager,
} from "../../typechain-types";

describe("WhenAddingCollection", function () {
  const ipfsGateway = "https://ipfs.io/ipfs/";

  let _collectionCreator: AgentCollectionCreatorV1;
  let _collectionsManager: AgentCollectionsManager;
  let _owner: HardhatEthersSigner;
  let _otherAccount: HardhatEthersSigner;

  async function deployCollectionsManager() {
    await reset();

    const [owner, otherAccount] = await ethers.getSigners();

    const CollectionsManager = await ethers.getContractFactory(
      "AgentCollectionsManager"
    );
    const collectionsManager = await CollectionsManager.deploy();

    const CollectionsDescriptor = await ethers.getContractFactory(
      "AgentCollectionsDescriptor"
    );
    const collectionsDescriptor = await CollectionsDescriptor.deploy(
      ipfsGateway
    );

    const Collection = await ethers.getContractFactory("AgentCollectionV1");
    const collectionImplementation = await Collection.deploy();

    const TestErc20 = await ethers.getContractFactory("TestERC20");
    const testErc20 = await TestErc20.deploy();

    const CollectionCreator = await ethers.getContractFactory(
      "AgentCollectionCreatorV1"
    );
    const collectionCreator = await CollectionCreator.deploy(
      await collectionsManager.getAddress(),
      await collectionsDescriptor.getAddress(),
      await collectionImplementation.getAddress()
    );

    await collectionCreator.addAuthorizedTokenForCreation(
      await testErc20.getAddress(),
      0n // No minimum balance required
    );

    const creatorRole = await collectionsManager.CREATOR_ROLE();
    await collectionsManager.grantRole(
      creatorRole,
      await collectionCreator.getAddress()
    );

    return {
      owner,
      otherAccount,
      collectionCreator,
      collectionsManager,
      collectionsDescriptor,
    };
  }

  beforeEach(async function () {
    const { owner, otherAccount, collectionCreator, collectionsManager } =
      await loadFixture(deployCollectionsManager);

    _owner = owner;
    _otherAccount = otherAccount;
    _collectionCreator = collectionCreator;
    _collectionsManager = collectionsManager;
  });

  describe("Given caller has creator role", function () {
    describe("Given collection with this name already exists", function () {
      it("Should revert", async function () {
        await _collectionCreator.createCollection(
          "",
          "first-symbol",
          "description",
          _owner.address,
          _owner.address
        );

        await expect(
          _collectionCreator.createCollection(
            "",
            "second-symbol",
            "description",
            _owner.address,
            _owner.address
          )
        )
          .to.be.revertedWithCustomError(
            _collectionsManager,
            "CollectionNameAlreadyExists"
          )
          .withArgs("");
      });
    });

    describe("Given collection with this symbol already exists", function () {
      it("Should revert", async function () {
        await _collectionCreator.createCollection(
          "first-name",
          "AIA",
          "description",
          _owner.address,
          _owner.address
        );

        await expect(
          _collectionCreator.createCollection(
            "second-name",
            "AIA",
            "description",
            _owner.address,
            _owner.address
          )
        )
          .to.be.revertedWithCustomError(
            _collectionsManager,
            "CollectionSymbolAlreadyExists"
          )
          .withArgs("AIA");
      });
    });

    describe("Given name and symbol are not already taken", function () {
      it("Should add emit 'CollectionCreated' event", async function () {
        await expect(
          _collectionCreator.createCollection(
            "first-name",
            "AIA",
            "description",
            _owner.address,
            _owner.address
          )
        ).to.emit(_collectionsManager, "CollectionCreated");
      });

      it("Should add collection to collections manager", async function () {
        const nextCollectionId = await _collectionsManager.nextCollectionId();
        const collectionAddressBefore = await _collectionsManager.collections(
          nextCollectionId
        );
        expect(collectionAddressBefore).to.equal(ethers.ZeroAddress);

        await _collectionCreator.createCollection(
          "first-name",
          "AIA",
          "description",
          _owner.address,
          _owner.address
        );

        const collectionAddress = await _collectionsManager.collections(
          nextCollectionId
        );

        expect(collectionAddress).to.not.equal(ethers.ZeroAddress);
      });
    });
  });

  describe("Given caller does not have creator role", function () {
    it("Should revert with 'AccessControlUnauthorizedAccount' error", async function () {
      const randomAddress = generateRandomAddress();

      await expect(
        _collectionsManager.connect(_otherAccount).addCollection(randomAddress)
      ).to.be.revertedWithCustomError(
        _collectionsManager,
        "AccessControlUnauthorizedAccount"
      );
    });
  });
});
