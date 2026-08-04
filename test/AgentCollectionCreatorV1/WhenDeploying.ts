import { expect } from "chai";
import { ethers } from "hardhat";
import { loadFixture, reset } from "@nomicfoundation/hardhat-network-helpers";

describe("WhenDeploying", function () {
  const ipfsGateway = "https://ipfs.io/ipfs/";

  async function deployDependencies() {
    await reset();

    const CollectionsManager = await ethers.getContractFactory(
      "AgentCollectionsManager"
    );
    const collectionsManager = await CollectionsManager.deploy();

    const CollectionsDescriptor = await ethers.getContractFactory(
      "AgentCollectionsDescriptor"
    );
    const collectionsDescriptor = await CollectionsDescriptor.deploy(
      ipfsGateway
    );

    const Collection = await ethers.getContractFactory("AgentCollectionV1");
    const collectionImplementation = await Collection.deploy();

    const CollectionCreator = await ethers.getContractFactory(
      "AgentCollectionCreatorV1"
    );

    return {
      CollectionCreator,
      managerAddress: await collectionsManager.getAddress(),
      descriptorAddress: await collectionsDescriptor.getAddress(),
      implementationAddress: await collectionImplementation.getAddress(),
    };
  }

  describe("Given a constructor address is the zero address", function () {
    it("Should revert with 'ZeroAddress' error for the manager", async function () {
      const { CollectionCreator, descriptorAddress, implementationAddress } =
        await loadFixture(deployDependencies);

      await expect(
        CollectionCreator.deploy(
          ethers.ZeroAddress,
          descriptorAddress,
          implementationAddress
        )
      )
        .to.be.revertedWithCustomError(CollectionCreator, "ZeroAddress")
        .withArgs("initialCollectionsManager");
    });

    it("Should revert with 'ZeroAddress' error for the descriptor", async function () {
      const { CollectionCreator, managerAddress, implementationAddress } =
        await loadFixture(deployDependencies);

      await expect(
        CollectionCreator.deploy(
          managerAddress,
          ethers.ZeroAddress,
          implementationAddress
        )
      )
        .to.be.revertedWithCustomError(CollectionCreator, "ZeroAddress")
        .withArgs("initialCollectionsDescriptor");
    });

    it("Should revert with 'ZeroAddress' error for the implementation", async function () {
      const { CollectionCreator, managerAddress, descriptorAddress } =
        await loadFixture(deployDependencies);

      await expect(
        CollectionCreator.deploy(
          managerAddress,
          descriptorAddress,
          ethers.ZeroAddress
        )
      )
        .to.be.revertedWithCustomError(CollectionCreator, "ZeroAddress")
        .withArgs("initialCollectionImplementation");
    });
  });
});
