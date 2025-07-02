import { expect } from "chai";
import { ethers } from "hardhat";
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
import { loadFixture, reset } from "@nomicfoundation/hardhat-network-helpers";
import {
  TestERC20,
  AgentCollectionV1,
  AgentCollectionCreatorV1,
  AgentCollectionsManager,
  AgentCollectionsDescriptor,
} from "../../typechain-types";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";

describe("WhenCreatingCollection", function () {
  const ipfsGateway = "https://ipfs.io/ipfs/";
  const name = "";
  const symbol = "AIA";
  const description = "description";

  async function deployCreator() {
    await reset();

    const [owner] = await ethers.getSigners();

    const CollectionsManager = await ethers.getContractFactory(
      "AgentCollectionsManager"
    );
    const collectionsManager =
      (await CollectionsManager.deploy()) as AgentCollectionsManager;

    const Descriptor = await ethers.getContractFactory(
      "AgentCollectionsDescriptor"
    );
    const descriptor = (await Descriptor.deploy(
      ipfsGateway
    )) as AgentCollectionsDescriptor;

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
      await descriptor.getAddress(),
      await collectionImplementation.getAddress(),
      await collateralController.getAddress()
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
      collectionCreator,
      collectionsManager,
      descriptor,
      collateralController,
    };
  }

  async function deployCreatorWithRequirement() {
    await reset();

    const [owner, otherAccount] = await ethers.getSigners();

    const CollectionsManager = await ethers.getContractFactory(
      "AgentCollectionsManager"
    );
    const collectionsManager =
      (await CollectionsManager.deploy()) as AgentCollectionsManager;

    const Descriptor = await ethers.getContractFactory(
      "AgentCollectionsDescriptor"
    );
    const descriptor = (await Descriptor.deploy(
      ipfsGateway
    )) as AgentCollectionsDescriptor;

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
      await descriptor.getAddress(),
      await collectionImplementation.getAddress(),
      await collateralController.getAddress()
    );

    const minimumBalance = 1n;

    await collectionCreator.addAuthorizedTokenForCreation(
      await testErc20.getAddress(),
      minimumBalance
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
      descriptor,
      testErc20,
      minimum: minimumBalance,
      collateralController,
    };
  }

  describe("Given valid parameters", function () {
    let _collectionCreator: AgentCollectionCreatorV1;
    let _collectionsManager: AgentCollectionsManager;
    let _owner: HardhatEthersSigner;

    beforeEach(async function () {
      const { owner, collectionCreator, collectionsManager } =
        await loadFixture(deployCreator);

      _owner = owner;
      _collectionCreator = collectionCreator;
      _collectionsManager = collectionsManager;
    });

    it("Should emit 'CollectionCreated' event", async function () {
      await expect(
        _collectionCreator.createCollection(
          name,
          symbol,
          description,
          _owner.address,
          _owner.address
        )
      )
        .to.emit(_collectionsManager, "CollectionCreated")
        .withArgs(1n, anyValue, name, symbol);
    });

    it("Should deploy a collection and register it", async function () {
      await _collectionCreator.createCollection(
        name,
        symbol,
        description,
        _owner.address,
        _owner.address
      );

      const newCollectionAddress = await _collectionsManager.collections(1);
      expect(newCollectionAddress).to.not.equal(ethers.ZeroAddress);

      const collection = (await ethers.getContractAt(
        "AgentCollectionV1",
        newCollectionAddress
      )) as AgentCollectionV1;

      expect(await collection.name()).to.equal(name);
      expect(await collection.symbol()).to.equal(symbol);

      const MODERATOR_ROLE = await collection.MODERATOR_ROLE();
      expect(await collection.hasRole(MODERATOR_ROLE, _owner.address)).to.be
        .true;
    });
  });

  describe("Given a minimum token balance is required", function () {
    let _minimum: bigint;
    let _testErc20: TestERC20;
    let _owner: HardhatEthersSigner;
    let _otherAccount: HardhatEthersSigner;
    let _creatorWithRequirement: AgentCollectionCreatorV1;
    let _collectionsManager: AgentCollectionsManager;
    let _collateralController: any;

    beforeEach(async function () {
      const {
        owner,
        testErc20,
        minimum,
        otherAccount,
        collectionCreator,
        collectionsManager,
        collateralController,
      } = await loadFixture(deployCreatorWithRequirement);

      _owner = owner;
      _minimum = minimum;
      _testErc20 = testErc20;
      _otherAccount = otherAccount;
      _creatorWithRequirement = collectionCreator;
      _collectionsManager = collectionsManager;
      _collateralController = collateralController;
    });

    describe("When caller does not own enough tokens", function () {
      it("Should revert with 'InsufficientBalanceInAuthorizedTokens' error", async function () {
        await expect(
          _creatorWithRequirement
            .connect(_otherAccount)
            .createCollection(
              name,
              symbol,
              description,
              _otherAccount.address,
              _otherAccount.address
            )
        ).to.be.revertedWithCustomError(
          _creatorWithRequirement,
          "InsufficientBalanceInAuthorizedTokens"
        );
      });
    });

    describe("When caller owns enough tokens", function () {
      it("Should allow creation", async function () {
        await _testErc20.mint(_owner.address, _minimum);

        await expect(
          _creatorWithRequirement.createCollection(
            name,
            symbol,
            description,
            _owner.address,
            _owner.address
          )
        )
          .to.emit(_collectionsManager, "CollectionCreated")
          .withArgs(1n, anyValue, name, symbol);
      });
    });

    describe("When caller has enough collateral locked", function () {
      it("Should allow creation", async function () {
        const Vault = await ethers.getContractFactory(
          "TestCollateralVault6022"
        );
        const vault = await Vault.deploy(
          true,
          false,
          _minimum,
          await _testErc20.getAddress()
        );

        await _collateralController.addVault(
          _owner.address,
          await vault.getAddress()
        );

        await expect(
          _creatorWithRequirement.createCollection(
            name,
            symbol,
            description,
            _owner.address,
            _owner.address
          )
        )
          .to.emit(_collectionsManager, "CollectionCreated")
          .withArgs(1n, anyValue, name, symbol);
      });
    });
  });
});
