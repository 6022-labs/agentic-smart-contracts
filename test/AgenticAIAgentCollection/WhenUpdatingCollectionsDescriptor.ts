import { expect } from "chai";
import { ethers } from "hardhat";
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

    // Contracts are deployed using the first signer/account by default
    const [owner, otherAccount] = await ethers.getSigners();

    const AgenticAIAgentCollectionsManager = await ethers.getContractFactory(
      "AgenticAIAgentCollectionsManager"
    );
    const agenticAIAgentCollectionsManager =
      await AgenticAIAgentCollectionsManager.deploy();

    const AgenticAIAgentCollectionsDescriptor = await ethers.getContractFactory(
      "AgenticAIAgentCollectionsDescriptor"
    );
    const agenticAIAgentCollectionsDescriptor =
      await AgenticAIAgentCollectionsDescriptor.deploy(ipfsGateway);

    const AgenticAIAgentCollection = await ethers.getContractFactory(
      "AgenticAIAgentCollection"
    );
    const agenticAIAgentCollectionImplementation =
      await AgenticAIAgentCollection.deploy();

    const TestErc20 = await ethers.getContractFactory("TestERC20");
    const testErc20 = await TestErc20.deploy();

    const AgenticAIAgentCollectionCreator = await ethers.getContractFactory(
      "AgenticAIAgentCollectionCreator"
    );
    const agenticAIAgentCollectionCreator =
      await AgenticAIAgentCollectionCreator.deploy(
        await agenticAIAgentCollectionsManager.getAddress(),
        await agenticAIAgentCollectionsDescriptor.getAddress(),
        await agenticAIAgentCollectionImplementation.getAddress()
      );

    await agenticAIAgentCollectionCreator.addAuthorizedTokenForCreation(
      await testErc20.getAddress(),
      0n // No minimum balance required
    );
    await agenticAIAgentCollectionsManager.grantRole(
      await agenticAIAgentCollectionsManager.CREATOR_ROLE(),
      await agenticAIAgentCollectionCreator.getAddress()
    );

    await agenticAIAgentCollectionCreator.createCollection(
      "AgenticAI",
      "AIA",
      "description",
      owner.address,
      owner.address
    );

    const agenticAIAgentCollectionAddress =
      await agenticAIAgentCollectionsManager.collections(
        (await agenticAIAgentCollectionsManager.nextCollectionId()) - BigInt(1)
      );
    const agenticAIAgentCollection = AgenticAIAgentCollection.attach(
      agenticAIAgentCollectionAddress
    ) as AgenticAIAgentCollection;

    return {
      agenticAIAgentCollection,
      agenticAIAgentCollectionsDescriptor,
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
