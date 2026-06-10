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
  const name = "agents";
  const symbol = "AIA";
  const description = "description";

  async function deployCreator() {
    await reset();

    const [owner] = await ethers.getSigners();

    const CollectionsManager = await ethers.getContractFactory(
      "AgentCollectionsManager",
    );
    const collectionsManager =
      (await CollectionsManager.deploy()) as AgentCollectionsManager;

    const Descriptor = await ethers.getContractFactory(
      "AgentCollectionsDescriptor",
    );
    const descriptor = (await Descriptor.deploy(
      ipfsGateway,
    )) as AgentCollectionsDescriptor;

    const Collection = await ethers.getContractFactory("AgentCollectionV1");
    const collectionImplementation = await Collection.deploy();

    const TestErc20 = await ethers.getContractFactory("TestERC20");
    const testErc20 = await TestErc20.deploy();

    const CollateralController = await ethers.getContractFactory(
      "TestCollateralController6022",
    );
    const collateralController = await CollateralController.deploy();

    const CollectionCreator = await ethers.getContractFactory(
      "AgentCollectionCreatorV1",
    );
    const collectionCreator = await CollectionCreator.deploy(
      await collectionsManager.getAddress(),
      await descriptor.getAddress(),
      await collectionImplementation.getAddress(),
      await collateralController.getAddress(),
    );

    await collectionCreator.addAuthorizedTokenForCreation(
      await testErc20.getAddress(),
      0n, // No minimum balance required
    );

    const creatorRole = await collectionsManager.CREATOR_ROLE();
    await collectionsManager.grantRole(
      creatorRole,
      await collectionCreator.getAddress(),
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
      "AgentCollectionsManager",
    );
    const collectionsManager =
      (await CollectionsManager.deploy()) as AgentCollectionsManager;

    const Descriptor = await ethers.getContractFactory(
      "AgentCollectionsDescriptor",
    );
    const descriptor = (await Descriptor.deploy(
      ipfsGateway,
    )) as AgentCollectionsDescriptor;

    const Collection = await ethers.getContractFactory("AgentCollectionV1");
    const collectionImplementation = await Collection.deploy();

    const TestErc20 = await ethers.getContractFactory("TestERC20");
    const testErc20 = await TestErc20.deploy();

    const CollateralController = await ethers.getContractFactory(
      "TestCollateralController6022",
    );
    const collateralController = await CollateralController.deploy();

    const CollectionCreator = await ethers.getContractFactory(
      "AgentCollectionCreatorV1",
    );
    const collectionCreator = await CollectionCreator.deploy(
      await collectionsManager.getAddress(),
      await descriptor.getAddress(),
      await collectionImplementation.getAddress(),
      await collateralController.getAddress(),
    );

    const minimumBalance = 1n;

    await collectionCreator.addAuthorizedTokenForCreation(
      await testErc20.getAddress(),
      minimumBalance,
    );

    const creatorRole = await collectionsManager.CREATOR_ROLE();
    await collectionsManager.grantRole(
      creatorRole,
      await collectionCreator.getAddress(),
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

  async function deployCreatorWithoutAuthorizedToken() {
    await reset();

    const [owner, otherAccount] = await ethers.getSigners();

    const CollectionsManager = await ethers.getContractFactory(
      "AgentCollectionsManager",
    );
    const collectionsManager =
      (await CollectionsManager.deploy()) as AgentCollectionsManager;

    const Descriptor = await ethers.getContractFactory(
      "AgentCollectionsDescriptor",
    );
    const descriptor = (await Descriptor.deploy(
      ipfsGateway,
    )) as AgentCollectionsDescriptor;

    const Collection = await ethers.getContractFactory("AgentCollectionV1");
    const collectionImplementation = await Collection.deploy();

    const CollateralController = await ethers.getContractFactory(
      "TestCollateralController6022",
    );
    const collateralController = await CollateralController.deploy();

    const CollectionCreator = await ethers.getContractFactory(
      "AgentCollectionCreatorV1",
    );
    const collectionCreator = await CollectionCreator.deploy(
      await collectionsManager.getAddress(),
      await descriptor.getAddress(),
      await collectionImplementation.getAddress(),
      await collateralController.getAddress(),
    );

    const creatorRole = await collectionsManager.CREATOR_ROLE();
    await collectionsManager.grantRole(
      creatorRole,
      await collectionCreator.getAddress(),
    );

    return { owner, otherAccount, collectionCreator, collectionsManager };
  }

  describe("Given no authorized token is configured", function () {
    let _collectionCreator: AgentCollectionCreatorV1;
    let _collectionsManager: AgentCollectionsManager;
    let _owner: HardhatEthersSigner;
    let _otherAccount: HardhatEthersSigner;

    beforeEach(async function () {
      const { owner, otherAccount, collectionCreator, collectionsManager } =
        await loadFixture(deployCreatorWithoutAuthorizedToken);

      _owner = owner;
      _otherAccount = otherAccount;
      _collectionCreator = collectionCreator;
      _collectionsManager = collectionsManager;
    });

    it("Should report canCreateCollection as true for any account", async function () {
      expect(await _collectionCreator.canCreateCollection(_owner.address)).to.be
        .true;
      expect(
        await _collectionCreator.canCreateCollection(_otherAccount.address),
      ).to.be.true;
    });

    it("Should allow creation", async function () {
      await expect(
        _collectionCreator
          .connect(_otherAccount)
          .createCollection(
            name,
            symbol,
            description,
            _otherAccount.address,
            _otherAccount.address,
          ),
      )
        .to.emit(_collectionsManager, "CollectionCreated")
        .withArgs(1n, anyValue, name, symbol);
    });
  });

  describe("Given the only authorized token is removed", function () {
    let _collectionCreator: AgentCollectionCreatorV1;
    let _collectionsManager: AgentCollectionsManager;
    let _otherAccount: HardhatEthersSigner;
    let _testErc20: TestERC20;

    beforeEach(async function () {
      const { otherAccount, collectionCreator, collectionsManager, testErc20 } =
        await loadFixture(deployCreatorWithRequirement);

      _otherAccount = otherAccount;
      _collectionCreator = collectionCreator;
      _collectionsManager = collectionsManager;
      _testErc20 = testErc20;
    });

    it("Should open creation back up once the list is empty", async function () {
      expect(
        await _collectionCreator.canCreateCollection(_otherAccount.address),
      ).to.be.false;

      await _collectionCreator.removeAuthorizedTokenForCreation(
        await _testErc20.getAddress(),
      );

      expect(
        await _collectionCreator.canCreateCollection(_otherAccount.address),
      ).to.be.true;
      await expect(
        _collectionCreator
          .connect(_otherAccount)
          .createCollection(
            name,
            symbol,
            description,
            _otherAccount.address,
            _otherAccount.address,
          ),
      )
        .to.emit(_collectionsManager, "CollectionCreated")
        .withArgs(1n, anyValue, name, symbol);
    });
  });

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
          _owner.address,
        ),
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
        _owner.address,
      );

      const newCollectionAddress = await _collectionsManager.collections(1);
      expect(newCollectionAddress).to.not.equal(ethers.ZeroAddress);

      const collection = (await ethers.getContractAt(
        "AgentCollectionV1",
        newCollectionAddress,
      )) as AgentCollectionV1;

      expect(await collection.name()).to.equal(name);
      expect(await collection.symbol()).to.equal(symbol);

      const MODERATOR_ROLE = await collection.MODERATOR_ROLE();
      expect(await collection.hasRole(MODERATOR_ROLE, _owner.address)).to.be
        .true;
    });
  });

  describe("Given an invalid collection name", function () {
    let _collectionCreator: AgentCollectionCreatorV1;
    let _collection: AgentCollectionV1;
    let _owner: HardhatEthersSigner;

    beforeEach(async function () {
      const { owner, collectionCreator } = await loadFixture(deployCreator);
      _owner = owner;
      _collectionCreator = collectionCreator;
      _collection = await ethers
        .getContractFactory("AgentCollectionV1")
        .then((f) => f.attach(ethers.ZeroAddress) as AgentCollectionV1);
    });

    // Collection name doubles as an ENS label (validated in initialize).
    const invalidNames = [
      { label: "empty", value: "" },
      { label: "uppercase", value: "Agents" },
      { label: "with a space", value: "my agents" },
      { label: "leading hyphen", value: "-agents" },
      { label: "trailing hyphen", value: "agents-" },
      { label: "double hyphen", value: "my--agents" },
      { label: "longer than 63 chars", value: "a".repeat(64) },
    ];

    for (const { label, value } of invalidNames) {
      it(`Should revert with InvalidCollectionName when name is ${label}`, async function () {
        await expect(
          _collectionCreator.createCollection(
            value,
            "AIA",
            "description",
            _owner.address,
            _owner.address,
          ),
        )
          .to.be.revertedWithCustomError(_collection, "InvalidCollectionName")
          .withArgs(value);
      });
    }
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
              _otherAccount.address,
            ),
        ).to.be.revertedWithCustomError(
          _creatorWithRequirement,
          "InsufficientBalanceInAuthorizedTokens",
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
            _owner.address,
          ),
        )
          .to.emit(_collectionsManager, "CollectionCreated")
          .withArgs(1n, anyValue, name, symbol);
      });
    });

    describe("When caller has enough collateral locked", function () {
      it("Should allow creation", async function () {
        const Vault = await ethers.getContractFactory(
          "TestCollateralVault6022",
        );
        const vault = await Vault.deploy(
          true,
          false,
          _minimum,
          await _testErc20.getAddress(),
        );

        await _collateralController.addVault(
          _owner.address,
          await vault.getAddress(),
        );

        await expect(
          _creatorWithRequirement.createCollection(
            name,
            symbol,
            description,
            _owner.address,
            _owner.address,
          ),
        )
          .to.emit(_collectionsManager, "CollectionCreated")
          .withArgs(1n, anyValue, name, symbol);
      });

      it("Should accumulate the minimum across several vaults", async function () {
        await _creatorWithRequirement.updateMinimumTokenBalanceForCreation(
          await _testErc20.getAddress(),
          2n,
        );

        const Vault = await ethers.getContractFactory(
          "TestCollateralVault6022",
        );
        for (let i = 0; i < 2; i++) {
          const vault = await Vault.deploy(
            true,
            false,
            1n,
            await _testErc20.getAddress(),
          );
          await _collateralController.addVault(
            _owner.address,
            await vault.getAddress(),
          );
        }

        await expect(
          _creatorWithRequirement.createCollection(
            name,
            symbol,
            description,
            _owner.address,
            _owner.address,
          ),
        )
          .to.emit(_collectionsManager, "CollectionCreated")
          .withArgs(1n, anyValue, name, symbol);
      });
    });

    describe("When caller's vaults hold an unauthorized token", function () {
      it("Should revert with 'InsufficientBalanceInAuthorizedTokens' error", async function () {
        const OtherErc20 = await ethers.getContractFactory("TestERC20");
        const otherErc20 = await OtherErc20.deploy();

        const Vault = await ethers.getContractFactory(
          "TestCollateralVault6022",
        );
        const vault = await Vault.deploy(
          true,
          false,
          _minimum,
          await otherErc20.getAddress(),
        );
        await _collateralController.addVault(
          _owner.address,
          await vault.getAddress(),
        );

        await expect(
          _creatorWithRequirement.createCollection(
            name,
            symbol,
            description,
            _owner.address,
            _owner.address,
          ),
        ).to.be.revertedWithCustomError(
          _creatorWithRequirement,
          "InsufficientBalanceInAuthorizedTokens",
        );
      });
    });

    describe("When caller's vaults are not deposited or already withdrawn", function () {
      it("Should revert with 'InsufficientBalanceInAuthorizedTokens' error", async function () {
        const Vault = await ethers.getContractFactory(
          "TestCollateralVault6022",
        );
        const pendingVault = await Vault.deploy(
          false,
          false,
          _minimum,
          await _testErc20.getAddress(),
        );
        const withdrawnVault = await Vault.deploy(
          true,
          true,
          _minimum,
          await _testErc20.getAddress(),
        );
        await _collateralController.addVault(
          _owner.address,
          await pendingVault.getAddress(),
        );
        await _collateralController.addVault(
          _owner.address,
          await withdrawnVault.getAddress(),
        );

        await expect(
          _creatorWithRequirement.createCollection(
            name,
            symbol,
            description,
            _owner.address,
            _owner.address,
          ),
        ).to.be.revertedWithCustomError(
          _creatorWithRequirement,
          "InsufficientBalanceInAuthorizedTokens",
        );
      });
    });
  });
});
