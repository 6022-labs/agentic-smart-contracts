import { expect } from "chai";
import { ethers } from "hardhat";
import { deployCollectionWithCreator } from "../common";
import { AgentCollectionV1 } from "../../typechain-types";
import { loadFixture, reset } from "@nomicfoundation/hardhat-network-helpers";

describe("WhenInitializing", function () {
  const NAME = "";
  const SYMBOL = "AIA";
  const DESCRIPTION = "description";

  // Deploy a fresh, uninitialized EIP-1167 clone of the implementation so
  // initialize() can be exercised directly (the implementation itself has
  // initializers disabled).
  async function deployUninitializedClone() {
    await reset();

    const [admin, moderator, , descriptor] = await ethers.getSigners();

    const Collection = await ethers.getContractFactory("AgentCollectionV1");
    const implementation = await Collection.deploy();
    const impl = (await implementation.getAddress()).slice(2).toLowerCase();

    const cloneInitCode =
      "0x3d602d80600a3d3981f3363d3d373d3d3d363d73" +
      impl +
      "5af43d82803e903d91602b57fd5bf3";

    const receipt = await (await admin.sendTransaction({ data: cloneInitCode })).wait();
    const collection = Collection.attach(receipt!.contractAddress!) as AgentCollectionV1;

    return { collection, admin, moderator, descriptor };
  }

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

  describe("Given a zero-address argument", function () {
    const VALID_NAME = "agents";

    it("Should revert with ZeroAddress('admin') when admin is zero", async function () {
      const { collection, moderator, descriptor } = await loadFixture(
        deployUninitializedClone
      );

      await expect(
        collection.initialize(
          VALID_NAME,
          SYMBOL,
          DESCRIPTION,
          ethers.ZeroAddress,
          moderator.address,
          descriptor.address
        )
      )
        .to.be.revertedWithCustomError(collection, "ZeroAddress")
        .withArgs("admin");
    });

    it("Should revert with ZeroAddress('moderator') when moderator is zero", async function () {
      const { collection, admin, descriptor } = await loadFixture(
        deployUninitializedClone
      );

      await expect(
        collection.initialize(
          VALID_NAME,
          SYMBOL,
          DESCRIPTION,
          admin.address,
          ethers.ZeroAddress,
          descriptor.address
        )
      )
        .to.be.revertedWithCustomError(collection, "ZeroAddress")
        .withArgs("moderator");
    });

    it("Should revert with ZeroAddress('initialCollectionsDescriptor') when descriptor is zero", async function () {
      const { collection, admin, moderator } = await loadFixture(
        deployUninitializedClone
      );

      await expect(
        collection.initialize(
          VALID_NAME,
          SYMBOL,
          DESCRIPTION,
          admin.address,
          moderator.address,
          ethers.ZeroAddress
        )
      )
        .to.be.revertedWithCustomError(collection, "ZeroAddress")
        .withArgs("initialCollectionsDescriptor");
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
