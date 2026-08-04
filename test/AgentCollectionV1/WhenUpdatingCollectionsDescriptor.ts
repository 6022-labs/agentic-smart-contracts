import { expect } from "chai";
import { ethers } from "hardhat";
import { deployCollectionWithCreator } from "../common";
import { loadFixture, reset } from "@nomicfoundation/hardhat-network-helpers";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import {
  AgentCollectionV1,
  AgentCollectionsDescriptor,
} from "../../typechain-types";

describe("WhenUpdatingCollectionsDescriptor", function () {
  const ipfsGateway = "https://ipfs.io/ipfs/";

  let _collection: AgentCollectionV1;
  let _collectionsDescriptor: AgentCollectionsDescriptor;

  let _owner: HardhatEthersSigner;
  let _otherAccount: HardhatEthersSigner;

  async function deployAgentCollection() {
    await reset();

    const [owner, otherAccount] = await ethers.getSigners();

    const { collection, collectionsDescriptor } =
      await deployCollectionWithCreator({
        owner,
        moderator: owner,
        ipfsGateway,
      });

    return {
      collection,
      collectionsDescriptor,
      owner,
      otherAccount,
    };
  }

  beforeEach(async function () {
    const { owner, otherAccount, collection, collectionsDescriptor } =
      await loadFixture(deployAgentCollection);

    _collection = collection;
    _collectionsDescriptor = collectionsDescriptor;

    _owner = owner;
    _otherAccount = otherAccount;
  });

  describe("Given signer is moderator", function () {
    it("Should update the collections descriptor", async function () {
      await _collection
        .connect(_owner)
        .updateCollectionsDescriptor(await _collectionsDescriptor.getAddress());

      expect(await _collection.collectionsDescriptor()).to.equal(
        await _collectionsDescriptor.getAddress()
      );
    });

    it("Should emit 'CollectionsDescriptorUpdated' event", async function () {
      const Descriptor = await ethers.getContractFactory(
        "AgentCollectionsDescriptor"
      );
      const newDescriptor = await Descriptor.deploy(ipfsGateway);

      await expect(
        _collection
          .connect(_owner)
          .updateCollectionsDescriptor(await newDescriptor.getAddress())
      )
        .to.emit(_collection, "CollectionsDescriptorUpdated")
        .withArgs(
          await _collectionsDescriptor.getAddress(),
          await newDescriptor.getAddress()
        );
    });
  });

  describe("Given new descriptor is the zero address", function () {
    it("Should revert with 'ZeroAddress' error", async function () {
      await expect(
        _collection.connect(_owner).updateCollectionsDescriptor(ethers.ZeroAddress)
      )
        .to.be.revertedWithCustomError(_collection, "ZeroAddress")
        .withArgs("newCollectionsDescriptor");
    });
  });

  describe("Given signer is not admin", function () {
    it("Should revert with 'AccessControlUnauthorizedAccount' error when called by a non-admin", async function () {
      await expect(
        _collection
          .connect(_otherAccount)
          .updateCollectionsDescriptor(
            await _collectionsDescriptor.getAddress()
          )
      ).to.be.revertedWithCustomError(
        _collection,
        "AccessControlUnauthorizedAccount"
      );
    });
  });
});
