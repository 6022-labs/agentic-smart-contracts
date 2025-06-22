import { expect } from "chai";
import { ethers } from "hardhat";
import { AgenticAIAgentCollection } from "../../typechain-types";
import { loadFixture, reset } from "@nomicfoundation/hardhat-network-helpers";

describe("WhenInitializing", function () {
  const NAME = "AgenticAI";
  const SYMBOL = "AIA";
  const DESCRIPTION = "description";

  async function deployCollection() {
    await reset();
    const [admin, moderator, collectionsManager, collectionsDescriptor] =
      await ethers.getSigners();

    const Collection = await ethers.getContractFactory(
      "AgenticAIAgentCollection"
    );
    const collection = await Collection.deploy();

    return {
      collection,
      admin,
      moderator,
      collectionsManager,
      collectionsDescriptor,
    };
  }

  describe("Given the contract is not initialized", function () {
    it("Should initialize the collection with expected state", async function () {
      const {
        collection,
        admin,
        moderator,
        collectionsManager,
        collectionsDescriptor,
      } = await loadFixture(deployCollection);

      await collection.initialize(
        NAME,
        SYMBOL,
        DESCRIPTION,
        admin.address,
        moderator.address,
        collectionsManager.address,
        collectionsDescriptor.address
      );

      expect(await collection.description()).to.equal(DESCRIPTION);
      expect(await collection.nextTokenId()).to.equal(1n);
      expect(await collection.collectionsManager()).to.equal(
        collectionsManager.address
      );
      expect(await collection.collectionsDescriptor()).to.equal(
        collectionsDescriptor.address
      );

      const DEFAULT_ADMIN_ROLE = await collection.DEFAULT_ADMIN_ROLE();
      expect(await collection.hasRole(DEFAULT_ADMIN_ROLE, admin.address)).to.be
        .true;

      const MODERATOR_ROLE = await collection.MODERATOR_ROLE();
      expect(await collection.hasRole(MODERATOR_ROLE, moderator.address)).to.be
        .true;
      expect(await collection.moderatorCount()).to.equal(1n);
    });
  });

  describe("Given the contract is already initialized", function () {
    it("Should revert", async function () {
      const {
        collection,
        admin,
        moderator,
        collectionsManager,
        collectionsDescriptor,
      } = await loadFixture(deployCollection);

      await collection.initialize(
        NAME,
        SYMBOL,
        DESCRIPTION,
        admin.address,
        moderator.address,
        collectionsManager.address,
        collectionsDescriptor.address
      );

      await expect(
        collection.initialize(
          NAME,
          SYMBOL,
          DESCRIPTION,
          admin.address,
          moderator.address,
          collectionsManager.address,
          collectionsDescriptor.address
        )
      ).to.be.reverted;
    });
  });
});
