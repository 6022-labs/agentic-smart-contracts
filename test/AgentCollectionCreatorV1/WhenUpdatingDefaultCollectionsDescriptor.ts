import { expect } from "chai";
import { ethers } from "hardhat";
import { loadFixture, reset } from "@nomicfoundation/hardhat-network-helpers";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import {
  AgentCollectionCreatorV1,
  AgentCollectionsManager,
  AgentCollectionsDescriptor,
} from "../../typechain-types";

describe("WhenUpdatingDefaultCollectionsDescriptor", function () {
  const ipfsGateway = "https://ipfs.io/ipfs/";

  let _collectionCreator: AgentCollectionCreatorV1;
  let _collectionsDescriptor: AgentCollectionsDescriptor;
  let _owner: HardhatEthersSigner;
  let _otherAccount: HardhatEthersSigner;

  async function deployCreator() {
    await reset();

    const [owner, otherAccount] = await ethers.getSigners();

    const CollectionsManager = await ethers.getContractFactory(
      "AgentCollectionsManager"
    );
    const collectionsManager =
      (await CollectionsManager.deploy()) as AgentCollectionsManager;

    const CollectionsDescriptor = await ethers.getContractFactory(
      "AgentCollectionsDescriptor"
    );
    const collectionsDescriptor = (await CollectionsDescriptor.deploy(
      ipfsGateway
    )) as AgentCollectionsDescriptor;

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
        "AgentCollectionsDescriptor"
      );
      const newDescriptor = (await Descriptor.deploy(
        ipfsGateway
      )) as AgentCollectionsDescriptor;

      await _collectionCreator
        .connect(_owner)
        .updateCollectionsDescriptor(await newDescriptor.getAddress());

      expect(await _collectionCreator.collectionsDescriptor()).to.equal(
        await newDescriptor.getAddress()
      );
    });

    it("Should emit 'DefaultCollectionsDescriptorUpdated' event", async function () {
      const Descriptor = await ethers.getContractFactory(
        "AgentCollectionsDescriptor"
      );
      const newDescriptor = (await Descriptor.deploy(
        ipfsGateway
      )) as AgentCollectionsDescriptor;

      const oldDescriptorAddress =
        await _collectionCreator.collectionsDescriptor();

      await expect(
        _collectionCreator
          .connect(_owner)
          .updateCollectionsDescriptor(await newDescriptor.getAddress())
      )
        .to.emit(_collectionCreator, "DefaultCollectionsDescriptorUpdated")
        .withArgs(oldDescriptorAddress, await newDescriptor.getAddress());
    });
  });

  describe("Given signer is not admin", function () {
    it("Should revert with 'AccessControlUnauthorizedAccount' error", async function () {
      const Descriptor = await ethers.getContractFactory(
        "AgentCollectionsDescriptor"
      );
      const newDescriptor = (await Descriptor.deploy(
        ipfsGateway
      )) as AgentCollectionsDescriptor;

      await expect(
        _collectionCreator
          .connect(_otherAccount)
          .updateCollectionsDescriptor(await newDescriptor.getAddress())
      ).to.be.revertedWithCustomError(
        _collectionCreator,
        "AccessControlUnauthorizedAccount"
      );
    });
  });
});
