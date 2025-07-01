import { expect } from "chai";
import { ethers } from "hardhat";
import { deployCollectionWithCreator } from "../common";
import { loadFixture, reset } from "@nomicfoundation/hardhat-network-helpers";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import {
  AgentCollectionV1,
  AgentCollectionsManager,
} from "../../typechain-types";

describe("WhenGettingModeratorOf", function () {
  const ipfsGateway = "https://ipfs.io/ipfs/";

  let _collection1: AgentCollectionV1;
  let _collection2: AgentCollectionV1;
  let _collectionsManager: AgentCollectionsManager;
  let _moderator: HardhatEthersSigner;
  let _otherAccount: HardhatEthersSigner;

  async function deployCollections() {
    await reset();

    const [owner, moderator, otherAccount] = await ethers.getSigners();

    const { collectionCreator, collection, collectionsManager } =
      await deployCollectionWithCreator({
        owner,
        moderator,
        ipfsGateway,
      });

    await collectionCreator.createCollection(
      "second-name",
      "AIB",
      "description",
      owner.address,
      moderator.address
    );

    const secondCollectionAddress = await collectionsManager.collections(2n);
    const Collection = await ethers.getContractFactory("AgentCollectionV1");
    const secondCollection = Collection.attach(
      secondCollectionAddress
    ) as AgentCollectionV1;

    return {
      owner,
      moderator,
      otherAccount,
      collectionCreator,
      collectionsManager,
      firstCollection: collection,
      secondCollection,
    };
  }

  async function deployEmptyManager() {
    await reset();

    const [owner] = await ethers.getSigners();

    const CollectionsManager = await ethers.getContractFactory(
      "AgentCollectionsManager"
    );
    const collectionsManager =
      (await CollectionsManager.deploy()) as AgentCollectionsManager;

    return { owner, collectionsManager };
  }

  beforeEach(async function () {
    const {
      moderator,
      otherAccount,
      collectionsManager,
      firstCollection,
      secondCollection,
    } = await loadFixture(deployCollections);

    _moderator = moderator;
    _otherAccount = otherAccount;
    _collectionsManager = collectionsManager;
    _collection1 = firstCollection;
    _collection2 = secondCollection;
  });

  describe("Given account is moderator of multiple collections", function () {
    it("Should return all collections where the account is moderator", async function () {
      const addresses = await _collectionsManager.moderatorOf(
        _moderator.address
      );

      expect(addresses).to.deep.equal([
        await _collection1.getAddress(),
        await _collection2.getAddress(),
      ]);
    });
  });

  describe("Given account is moderator of no collections", function () {
    it("Should return an empty array", async function () {
      const { owner, collectionsManager } = await loadFixture(
        deployEmptyManager
      );

      const addresses = await collectionsManager.moderatorOf(owner.address);

      expect(addresses).to.deep.equal([]);
    });
  });
});
