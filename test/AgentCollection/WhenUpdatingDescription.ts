import { expect } from "chai";
import { ethers } from "hardhat";
import { deployCollectionWithCreator } from "../common";
import { loadFixture, reset } from "@nomicfoundation/hardhat-network-helpers";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import {
  AgentCollection,
  AgentCollectionsDescriptor,
} from "../../typechain-types";

describe("WhenUpdatingDescription", function () {
  const ipfsGateway = "https://ipfs.io/ipfs/";

  let _collection: AgentCollection;
  let _collectionsDescriptor: AgentCollectionsDescriptor;

  let _owner: HardhatEthersSigner;
  let _otherAccount: HardhatEthersSigner;

  async function deployAgentCollection() {
    await reset();

    const [owner, otherAccount] = await ethers.getSigners();

    const { collection, collectionsDescriptor } =
      await deployCollectionWithCreator({
        owner,
        moderator: owner,
        name: "",
        symbol: "AIA",
        description: "initial description",
        ipfsGateway,
      });

    return {
      collection,
      collectionsDescriptor,
      owner,
      otherAccount,
    };
  }

  beforeEach(async function () {
    const { owner, otherAccount, collection, collectionsDescriptor } =
      await loadFixture(deployAgentCollection);

    _collection = collection;
    _collectionsDescriptor = collectionsDescriptor;

    _owner = owner;
    _otherAccount = otherAccount;
  });

  describe("Given signer is moderator", function () {
    it("Should update the description", async function () {
      await _collection
        .connect(_owner)
        .updateDescription("updated description");

      expect(await _collection.description()).to.equal("updated description");
    });

    it("Should emit 'DescriptionUpdated' event", async function () {
      const newDescription = "updated description";

      await expect(
        _collection.connect(_owner).updateDescription(newDescription)
      )
        .to.emit(_collection, "DescriptionUpdated")
        .withArgs("initial description", newDescription);
    });
  });

  describe("Given signer is not admin", function () {
    it("Should revert with 'AccessControlUnauthorizedAccount' error when called by a non-admin", async function () {
      await expect(
        _collection
          .connect(_otherAccount)
          .updateCollectionsDescriptor(
            await _collectionsDescriptor.getAddress()
          )
      ).to.be.revertedWithCustomError(
        _collection,
        "AccessControlUnauthorizedAccount"
      );
    });
  });
});
