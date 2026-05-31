import { expect } from "chai";
import { ethers } from "hardhat";
import { deployCollectionWithCreator } from "../common";
import { loadFixture, reset } from "@nomicfoundation/hardhat-network-helpers";

describe("WhenInitializing", function () {
  const NAME = "";
  const SYMBOL = "AIA";
  const DESCRIPTION = "description";

  async function deployByteCode() {
    await reset();
    const [admin, moderator, collectionsManager, collectionsDescriptor] =
      await ethers.getSigners();

    const Collection = await ethers.getContractFactory("AgentCollectionV1");
    const collection = await Collection.deploy();

    return {
      collection,
      admin,
      moderator,
      collectionsManager,
      collectionsDescriptor,
    };
  }

  async function deployProxy() {
    await reset();

    const [admin, moderator] = await ethers.getSigners();

    const { collection, collectionsManager, collectionsDescriptor } =
      await deployCollectionWithCreator({
        owner: admin,
        moderator,
      });

    return {
      admin,
      moderator,
      collection,
      collectionsManager,
      collectionsDescriptor,
    };
  }

  describe("Given it's the deployed bytecode", function () {
    it("Should not be able to initialize", async function () {
      const {
        collection,
        admin,
        moderator,
        collectionsManager,
        collectionsDescriptor,
      } = await loadFixture(deployByteCode);

      await expect(
        collection.initialize(
          NAME,
          SYMBOL,
          DESCRIPTION,
          admin.address,
          moderator.address,
          collectionsDescriptor.address
        )
      ).to.be.reverted;
    });
  });

  describe("Given it's deployed through a proxy", function () {
    it("Should not be able to initialize again", async function () {
      const {
        collection,
        admin,
        moderator,
        collectionsManager,
        collectionsDescriptor,
      } = await loadFixture(deployProxy);

      await expect(
        collection.initialize(
          NAME,
          SYMBOL,
          DESCRIPTION,
          admin.address,
          moderator.address,
          await collectionsDescriptor.getAddress()
        )
      ).to.be.reverted;
    });
  });
});
