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

  let _creator: AgenticAIAgentCollectionCreator;
  let _descriptor: AgenticAIAgentCollectionsDescriptor;
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

    const Descriptor = await ethers.getContractFactory(
      "AgenticAIAgentCollectionsDescriptor"
    );
    const descriptor = (await Descriptor.deploy(
      ipfsGateway
    )) as AgenticAIAgentCollectionsDescriptor;

    const Creator = await ethers.getContractFactory(
      "AgenticAIAgentCollectionCreator"
    );
    const creator = (await Creator.deploy(
      await collectionsManager.getAddress(),
      await descriptor.getAddress()
    )) as AgenticAIAgentCollectionCreator;

    await collectionsManager.updateCollectionCreatorAddress(
      await creator.getAddress()
    );

    return { owner, otherAccount, creator, descriptor };
  }

  beforeEach(async function () {
    const { owner, otherAccount, creator, descriptor } = await loadFixture(
      deployCreator
    );

    _creator = creator;
    _descriptor = descriptor;
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

      await _creator
        .connect(_owner)
        .updateDefaultCollectionsDescriptor(await newDescriptor.getAddress());

      expect(await _creator.defaultCollectionsDescriptor()).to.equal(
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
        await _creator.defaultCollectionsDescriptor();

      await expect(
        _creator
          .connect(_owner)
          .updateDefaultCollectionsDescriptor(await newDescriptor.getAddress())
      )
        .to.emit(_creator, "DefaultCollectionsDescriptorUpdated")
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
        _creator
          .connect(_otherAccount)
          .updateDefaultCollectionsDescriptor(await newDescriptor.getAddress())
      ).to.be.revertedWithCustomError(
        _creator,
        "AccessControlUnauthorizedAccount"
      );
    });
  });
});
