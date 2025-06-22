import { expect } from "chai";
import { ethers } from "hardhat";
import { loadFixture, reset } from "@nomicfoundation/hardhat-network-helpers";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import {
  AgenticAIAgentCollection,
  AgenticAIAgentCollectionsDescriptor,
} from "../../typechain-types";

describe("WhenUpdatingDescription", function () {
  const ipfsGateway = "https://ipfs.io/ipfs/";

  let _agenticAIAgentCollection: AgenticAIAgentCollection;
  let _agenticAIAgentCollectionsDescriptor: AgenticAIAgentCollectionsDescriptor;

  let _owner: HardhatEthersSigner;
  let _otherAccount: HardhatEthersSigner;

  async function deployAgenticAIAgentCollection() {
    await reset();

    // Contracts are deployed using the first signer/account by default
    const [owner, otherAccount] = await ethers.getSigners();

    const CollectionsManager = await ethers.getContractFactory(
      "AgenticAIAgentCollectionsManager"
    );
    const collectionsManager = await CollectionsManager.deploy();

    const AgenticAIAgentCollectionsDescriptor = await ethers.getContractFactory(
      "AgenticAIAgentCollectionsDescriptor"
    );
    const agenticAIAgentCollectionsDescriptor =
      await AgenticAIAgentCollectionsDescriptor.deploy(ipfsGateway);

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
      await agenticAIAgentCollectionsDescriptor.getAddress(),
      await collectionImplementation.getAddress()
    );

    await collectionCreator.addAuthorizedTokenForCreation(
      await testErc20.getAddress(),
      0n // No minimum balance required
    );
    await collectionsManager.grantRole(
      await collectionsManager.CREATOR_ROLE(),
      await collectionCreator.getAddress()
    );

    await collectionCreator.createCollection(
      "AgenticAI",
      "AIA",
      "initial description",
      owner.address,
      owner.address
    );

    const collectionAddress = await collectionsManager.collections(
      (await collectionsManager.nextCollectionId()) - BigInt(1)
    );
    const collection = Collection.attach(
      collectionAddress
    ) as AgenticAIAgentCollection;

    return {
      collection,
      agenticAIAgentCollectionsDescriptor,
      owner,
      otherAccount,
    };
  }

  beforeEach(async function () {
    const {
      owner,
      otherAccount,
      collection,
      agenticAIAgentCollectionsDescriptor,
    } = await loadFixture(deployAgenticAIAgentCollection);

    _agenticAIAgentCollection = collection;
    _agenticAIAgentCollectionsDescriptor = agenticAIAgentCollectionsDescriptor;

    _owner = owner;
    _otherAccount = otherAccount;
  });

  describe("Given signer is moderator", function () {
    it("Should update the description", async function () {
      await _agenticAIAgentCollection
        .connect(_owner)
        .updateDescription("updated description");

      expect(await _agenticAIAgentCollection.description()).to.equal(
        "updated description"
      );
    });

    it("Should emit 'DescriptionUpdated' event", async function () {
      const newDescription = "updated description";

      await expect(
        _agenticAIAgentCollection
          .connect(_owner)
          .updateDescription(newDescription)
      )
        .to.emit(_agenticAIAgentCollection, "DescriptionUpdated")
        .withArgs("initial description", newDescription);
    });
  });

  describe("Given signer is not admin", function () {
    it("Should revert with 'AccessControlUnauthorizedAccount' error when called by a non-admin", async function () {
      await expect(
        _agenticAIAgentCollection
          .connect(_otherAccount)
          .updateCollectionsDescriptor(
            await _agenticAIAgentCollectionsDescriptor.getAddress()
          )
      ).to.be.revertedWithCustomError(
        _agenticAIAgentCollection,
        "AccessControlUnauthorizedAccount"
      );
    });
  });
});
