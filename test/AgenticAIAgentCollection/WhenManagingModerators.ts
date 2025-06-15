import { expect } from "chai";
import { ethers } from "hardhat";
import { loadFixture, reset } from "@nomicfoundation/hardhat-network-helpers";
import { AgenticAIAgentCollection } from "../../typechain-types";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";

describe("WhenManagingModerators", function () {
  const ipfsGateway = "https://ipfs.io/ipfs/";

  let _collection: AgenticAIAgentCollection;
  let _owner: HardhatEthersSigner;
  let _moderator: HardhatEthersSigner;
  let _otherAccount: HardhatEthersSigner;

  async function deployCollection() {
    await reset();

    const [owner, moderator, otherAccount] = await ethers.getSigners();

    const CollectionsManager = await ethers.getContractFactory(
      "AgenticAIAgentCollectionsManager"
    );
    const collectionsManager = await CollectionsManager.deploy();

    const CollectionsDescriptor = await ethers.getContractFactory(
      "AgenticAIAgentCollectionsDescriptor"
    );
    const collectionsDescriptor = await CollectionsDescriptor.deploy(ipfsGateway);

    const Collection = await ethers.getContractFactory("AgenticAIAgentCollection");
    const collection = await Collection.deploy(
      "AgenticAI",
      "AIA",
      owner.address,
      moderator.address,
      await collectionsManager.getAddress(),
      await collectionsDescriptor.getAddress()
    );

    return { collection, owner, moderator, otherAccount };
  }

  beforeEach(async function () {
    const { collection, owner, moderator, otherAccount } = await loadFixture(deployCollection);

    _collection = collection;
    _owner = owner;
    _moderator = moderator;
    _otherAccount = otherAccount;
  });

  describe("Given sender is admin", function () {
    it("Should add a moderator", async function () {
      const MODERATOR_ROLE = await _collection.MODERATOR_ROLE();

      await _collection
        .connect(_owner)
        .grantRole(MODERATOR_ROLE, _otherAccount.address);

      expect(await _collection.hasRole(MODERATOR_ROLE, _otherAccount.address)).to.be
        .true;
    });

    it("Should remove a moderator", async function () {
      const MODERATOR_ROLE = await _collection.MODERATOR_ROLE();

      await _collection
        .connect(_owner)
        .grantRole(MODERATOR_ROLE, _otherAccount.address);

      await _collection
        .connect(_owner)
        .revokeRole(MODERATOR_ROLE, _otherAccount.address);

      expect(await _collection.hasRole(MODERATOR_ROLE, _otherAccount.address)).to.be
        .false;
    });
  });

  describe("Given sender is not admin", function () {
    it("Should revert when adding a moderator", async function () {
      const MODERATOR_ROLE = await _collection.MODERATOR_ROLE();

      await expect(
        _collection
          .connect(_moderator)
          .grantRole(MODERATOR_ROLE, _otherAccount.address)
      ).to.be.revertedWithCustomError(_collection, "AccessControlUnauthorizedAccount");
    });
  });
});
