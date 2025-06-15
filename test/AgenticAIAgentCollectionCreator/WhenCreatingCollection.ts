import { expect } from "chai";
import { ethers } from "hardhat";
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
import { loadFixture, reset } from "@nomicfoundation/hardhat-network-helpers";
import {
  AgenticAIAgentCollectionCreator,
  AgenticAIAgentCollectionsManager,
  AgenticAIAgentCollectionsDescriptor,
  AgenticAIAgentCollection,
} from "../../typechain-types";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";

describe("WhenCreatingCollection", function () {
  const ipfsGateway = "https://ipfs.io/ipfs/";

  let _creator: AgenticAIAgentCollectionCreator;
  let _collectionsManager: AgenticAIAgentCollectionsManager;
  let _descriptor: AgenticAIAgentCollectionsDescriptor;
  let _owner: HardhatEthersSigner;

  async function deployCreator() {
    await reset();

    const [owner] = await ethers.getSigners();

    const CollectionsManager = await ethers.getContractFactory(
      "AgenticAIAgentCollectionsManager"
    );
    const collectionsManager = (await CollectionsManager.deploy()) as AgenticAIAgentCollectionsManager;

    const Descriptor = await ethers.getContractFactory(
      "AgenticAIAgentCollectionsDescriptor"
    );
    const descriptor = (await Descriptor.deploy(ipfsGateway)) as AgenticAIAgentCollectionsDescriptor;

    const Creator = await ethers.getContractFactory(
      "AgenticAIAgentCollectionCreator"
    );
    const creator = (await Creator.deploy(
      await collectionsManager.getAddress(),
      await descriptor.getAddress()
    )) as AgenticAIAgentCollectionCreator;

    await collectionsManager.updateCollectionCreatorAddress(await creator.getAddress());

    return { owner, creator, collectionsManager, descriptor };
  }

  beforeEach(async function () {
    const { owner, creator, collectionsManager, descriptor } = await loadFixture(deployCreator);

    _owner = owner;
    _creator = creator;
    _collectionsManager = collectionsManager;
    _descriptor = descriptor;
  });

  describe("Given valid parameters", function () {
    const name = "AgenticAI";
    const symbol = "AIA";

    it("Should emit CollectionCreated event", async function () {
      await expect(
        _creator.createCollection(name, symbol, _owner.address)
      )
        .to.emit(_collectionsManager, "CollectionCreated")
        .withArgs(1n, anyValue, name, symbol);
    });

    it("Should deploy a collection and register it", async function () {
      await _creator.createCollection(name, symbol, _owner.address);

      const newCollectionAddress = await _collectionsManager.collection(1);
      expect(newCollectionAddress).to.not.equal(ethers.ZeroAddress);

      const collection = (await ethers.getContractAt(
        "AgenticAIAgentCollection",
        newCollectionAddress
      )) as AgenticAIAgentCollection;

      expect(await collection.name()).to.equal(name);
      expect(await collection.symbol()).to.equal(symbol);

      const MODERATOR_ROLE = await collection.MODERATOR_ROLE();
      expect(await collection.hasRole(MODERATOR_ROLE, _owner.address)).to.be.true;
    });
  });
});
