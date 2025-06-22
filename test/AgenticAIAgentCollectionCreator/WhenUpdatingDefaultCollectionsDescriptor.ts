import { expect } from "chai";
import { ethers } from "hardhat";
import { loadFixture, reset } from "@nomicfoundation/hardhat-network-helpers";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import {
  AgenticAIAgentCollectionCreator,
  AgenticAIAgentCollectionsManager,
  AgenticAIAgentCollectionsDescriptor,
} from "../../typechain-types";

describe("WhenUpdatingDefaultCollectionsDescriptor", function () {
  const ipfsGateway = "https://ipfs.io/ipfs/";

  let _collectionCreator: AgenticAIAgentCollectionCreator;
  let _collectionsDescriptor: AgenticAIAgentCollectionsDescriptor;
  let _owner: HardhatEthersSigner;
  let _otherAccount: HardhatEthersSigner;

  async function deployCreator() {
    await reset();

    const [owner, otherAccount] = await ethers.getSigners();

    const CollectionsManager = await ethers.getContractFactory(
      "AgenticAIAgentCollectionsManager"
    );
    const collectionsManager =
      (await CollectionsManager.deploy()) as AgenticAIAgentCollectionsManager;

    const CollectionsDescriptor = await ethers.getContractFactory(
      "AgenticAIAgentCollectionsDescriptor"
    );
    const collectionsDescriptor = (await CollectionsDescriptor.deploy(
      ipfsGateway
    )) as AgenticAIAgentCollectionsDescriptor;

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

    return { owner, otherAccount, collectionCreator, collectionsDescriptor };
  }

  beforeEach(async function () {
    const { owner, otherAccount, collectionCreator, collectionsDescriptor } =
      await loadFixture(deployCreator);

    _collectionCreator = collectionCreator;
    _collectionsDescriptor = collectionsDescriptor;
    _owner = owner;
    _otherAccount = otherAccount;
  });

  describe("Given signer is admin", function () {
    it("Should update the collections descriptor", async function () {
      const Descriptor = await ethers.getContractFactory(
        "AgenticAIAgentCollectionsDescriptor"
      );
      const newDescriptor = (await Descriptor.deploy(
        ipfsGateway
      )) as AgenticAIAgentCollectionsDescriptor;

      await _collectionCreator
        .connect(_owner)
        .updateDefaultCollectionsDescriptor(await newDescriptor.getAddress());

      expect(await _collectionCreator.defaultCollectionsDescriptor()).to.equal(
        await newDescriptor.getAddress()
      );
    });

    it("Should emit 'DefaultCollectionsDescriptorUpdated' event", async function () {
      const Descriptor = await ethers.getContractFactory(
        "AgenticAIAgentCollectionsDescriptor"
      );
      const newDescriptor = (await Descriptor.deploy(
        ipfsGateway
      )) as AgenticAIAgentCollectionsDescriptor;

      const oldDescriptorAddress =
        await _collectionCreator.defaultCollectionsDescriptor();

      await expect(
        _collectionCreator
          .connect(_owner)
          .updateDefaultCollectionsDescriptor(await newDescriptor.getAddress())
      )
        .to.emit(_collectionCreator, "DefaultCollectionsDescriptorUpdated")
        .withArgs(oldDescriptorAddress, await newDescriptor.getAddress());
    });
  });

  describe("Given signer is not admin", function () {
    it("Should revert with 'AccessControlUnauthorizedAccount' error", async function () {
      const Descriptor = await ethers.getContractFactory(
        "AgenticAIAgentCollectionsDescriptor"
      );
      const newDescriptor = (await Descriptor.deploy(
        ipfsGateway
      )) as AgenticAIAgentCollectionsDescriptor;

      await expect(
        _collectionCreator
          .connect(_otherAccount)
          .updateDefaultCollectionsDescriptor(await newDescriptor.getAddress())
      ).to.be.revertedWithCustomError(
        _collectionCreator,
        "AccessControlUnauthorizedAccount"
      );
    });
  });
});
