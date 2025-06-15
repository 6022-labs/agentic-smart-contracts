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

    const CollectionsManager = await ethers.getContractFactory(
      "AgenticAIAgentCollectionsManager"
    );
    const collectionsManager = await CollectionsManager.deploy();

    const AgenticAIAgentCollectionsDescriptor = await ethers.getContractFactory(
      "AgenticAIAgentCollectionsDescriptor"
    );
    const agenticAIAgentCollectionsDescriptor =
      await AgenticAIAgentCollectionsDescriptor.deploy(ipfsGateway);

    const AgenticAIAgentCollection = await ethers.getContractFactory(
      "AgenticAIAgentCollection"
    );
    const agenticAIAgentCollection = await AgenticAIAgentCollection.deploy(
      "AgenticAI",
      "AIA",
      owner.address,
      await collectionsManager.getAddress(),
      await agenticAIAgentCollectionsDescriptor.getAddress()
    );

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
      await expect(
        _agenticAIAgentCollection
          .connect(_owner)
          .updateCollectionsDescriptor(
            await _agenticAIAgentCollectionsDescriptor.getAddress()
          )
      ).to.not.be.reverted;
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
