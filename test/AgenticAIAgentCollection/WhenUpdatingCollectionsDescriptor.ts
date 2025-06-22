import { expect } from "chai";
import { ethers } from "hardhat";
import { deployCollectionWithCreator } from "../common";
import { loadFixture, reset } from "@nomicfoundation/hardhat-network-helpers";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import {
  AgenticAIAgentCollection,
  AgenticAIAgentCollectionsDescriptor,
} from "../../typechain-types";

describe("WhenUpdatingCollectionsDescriptor", function () {
  const ipfsGateway = "https://ipfs.io/ipfs/";

  let _agenticAIAgentCollection: AgenticAIAgentCollection;
  let _agenticAIAgentCollectionsDescriptor: AgenticAIAgentCollectionsDescriptor;

  let _owner: HardhatEthersSigner;
  let _otherAccount: HardhatEthersSigner;

  async function deployAgenticAIAgentCollection() {
    await reset();

    const [owner, otherAccount] = await ethers.getSigners();

    const { collection, collectionsDescriptor } =
      await deployCollectionWithCreator({
        owner,
        moderator: owner,
        ipfsGateway,
      });

    return {
      agenticAIAgentCollection: collection,
      agenticAIAgentCollectionsDescriptor: collectionsDescriptor,
      owner,
      otherAccount,
    };
  }

  beforeEach(async function () {
    const {
      owner,
      otherAccount,
      agenticAIAgentCollection,
      agenticAIAgentCollectionsDescriptor,
    } = await loadFixture(deployAgenticAIAgentCollection);

    _agenticAIAgentCollection = agenticAIAgentCollection;
    _agenticAIAgentCollectionsDescriptor = agenticAIAgentCollectionsDescriptor;

    _owner = owner;
    _otherAccount = otherAccount;
  });

  describe("Given signer is moderator", function () {
    it("Should update the collections descriptor", async function () {
      await _agenticAIAgentCollection
        .connect(_owner)
        .updateCollectionsDescriptor(
          await _agenticAIAgentCollectionsDescriptor.getAddress()
        );

      expect(await _agenticAIAgentCollection.collectionsDescriptor()).to.equal(
        await _agenticAIAgentCollectionsDescriptor.getAddress()
      );
    });

    it("Should emit 'CollectionsDescriptorUpdated' event", async function () {
      const Descriptor = await ethers.getContractFactory(
        "AgenticAIAgentCollectionsDescriptor"
      );
      const newDescriptor = await Descriptor.deploy(ipfsGateway);

      await expect(
        _agenticAIAgentCollection
          .connect(_owner)
          .updateCollectionsDescriptor(await newDescriptor.getAddress())
      )
        .to.emit(_agenticAIAgentCollection, "CollectionsDescriptorUpdated")
        .withArgs(
          await _agenticAIAgentCollectionsDescriptor.getAddress(),
          await newDescriptor.getAddress()
        );
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
