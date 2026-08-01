import { expect } from "chai";
import { ethers } from "hardhat";
import { reset } from "@nomicfoundation/hardhat-network-helpers";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import {
  AgentCollectionCreatorV1,
  AgentCollectionsManager,
} from "../../typechain-types";
import { deployCollectionWithCreator } from "../common";

describe("WhenListingCollections", function () {
  let _creator: AgentCollectionCreatorV1;
  let _manager: AgentCollectionsManager;
  let _owner: HardhatEthersSigner;

  beforeEach(async function () {
    await reset();
    const [owner] = await ethers.getSigners();
    _owner = owner;

    const { collectionsManager, collectionCreator } =
      await deployCollectionWithCreator({
        owner,
        moderator: owner,
        name: "alpha",
        symbol: "ALP",
      });
    _manager = collectionsManager;
    _creator = collectionCreator;

    // Second collection so we can exercise multi-row + pagination.
    await _creator.createCollection(
      "beta",
      "BET",
      "description",
      owner.address,
      owner.address
    );
  });

  describe("Given collections exist", function () {
    it("Should return every collection with its name and moderator count", async function () {
      const [infos, next] = await _manager.listCollections(0, 10);

      expect(infos.length).to.equal(2);
      expect(infos[0].name).to.equal("alpha");
      expect(infos[1].name).to.equal("beta");
      expect(infos[0].moderatorCount).to.equal(1n);
      expect(infos[0].collectionAddress).to.not.equal(ethers.ZeroAddress);
      expect(next).to.equal(0n);
    });

    it("Should paginate and expose a resume cursor", async function () {
      const [firstPage, firstNext] = await _manager.listCollections(0, 1);
      expect(firstPage.length).to.equal(1);
      expect(firstPage[0].name).to.equal("alpha");
      expect(firstNext).to.equal(2n);

      const [secondPage, secondNext] = await _manager.listCollections(
        firstNext,
        10
      );
      expect(secondPage.length).to.equal(1);
      expect(secondPage[0].name).to.equal("beta");
      expect(secondNext).to.equal(0n);
    });
  });

  describe("Given a collection has no moderators", function () {
    it("Should report a zero moderator count", async function () {
      const firstCollection = await _manager.collections(1);
      const collection = await ethers.getContractAt(
        "AgentCollectionV1",
        firstCollection
      );
      await collection
        .connect(_owner)
        .revokeRole(await collection.MODERATOR_ROLE(), _owner.address);

      const [infos] = await _manager.listCollections(0, 10);

      expect(infos[0].moderatorCount).to.equal(0n);
      expect(infos[1].moderatorCount).to.equal(1n);
    });
  });
});
