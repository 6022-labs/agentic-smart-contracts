import { expect } from "chai";
import { ethers } from "hardhat";
import { loadFixture, reset } from "@nomicfoundation/hardhat-network-helpers";
import { AgentCollection } from "../../typechain-types";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { deployCollectionWithCreator } from "../common";

describe("WhenManagingModerators", function () {
  const ipfsGateway = "https://ipfs.io/ipfs/";

  let _collection: AgentCollection;
  let _owner: HardhatEthersSigner;
  let _moderator: HardhatEthersSigner;
  let _otherAccount: HardhatEthersSigner;

  async function deployCollection() {
    await reset();

    const [owner, moderator, otherAccount] = await ethers.getSigners();

    const { collection } = await deployCollectionWithCreator({
      owner,
      moderator,
      ipfsGateway,
    });

    return { collection, owner, moderator, otherAccount };
  }

  beforeEach(async function () {
    const { collection, owner, moderator, otherAccount } = await loadFixture(
      deployCollection
    );

    _collection = collection;
    _owner = owner;
    _moderator = moderator;
    _otherAccount = otherAccount;
  });

  describe("Given sender is admin", function () {
    describe("And granting a moderator role", function () {
      it("Should add a moderator", async function () {
        const MODERATOR_ROLE = await _collection.MODERATOR_ROLE();

        await _collection
          .connect(_owner)
          .grantRole(MODERATOR_ROLE, _otherAccount.address);

        expect(await _collection.hasRole(MODERATOR_ROLE, _otherAccount.address))
          .to.be.true;
      });

      it("Should increase the number of moderators", async function () {
        const MODERATOR_ROLE = await _collection.MODERATOR_ROLE();

        const initialModeratorCount = await _collection.moderatorCount();

        await _collection
          .connect(_owner)
          .grantRole(MODERATOR_ROLE, _otherAccount.address);

        const newModeratorCount = await _collection.moderatorCount();

        expect(newModeratorCount).to.equal(initialModeratorCount + BigInt(1));
      });
    });

    describe("And revoking a moderator role", function () {
      it("Should remove a moderator", async function () {
        const MODERATOR_ROLE = await _collection.MODERATOR_ROLE();

        await _collection
          .connect(_owner)
          .grantRole(MODERATOR_ROLE, _otherAccount.address);

        await _collection
          .connect(_owner)
          .revokeRole(MODERATOR_ROLE, _otherAccount.address);

        expect(await _collection.hasRole(MODERATOR_ROLE, _otherAccount.address))
          .to.be.false;
      });

      it("Should decrease the number of moderators", async function () {
        const MODERATOR_ROLE = await _collection.MODERATOR_ROLE();

        await _collection
          .connect(_owner)
          .grantRole(MODERATOR_ROLE, _otherAccount.address);

        const initialModeratorCount = await _collection.moderatorCount();

        await _collection
          .connect(_owner)
          .revokeRole(MODERATOR_ROLE, _otherAccount.address);

        const newModeratorCount = await _collection.moderatorCount();

        expect(newModeratorCount).to.equal(initialModeratorCount - BigInt(1));
      });
    });
  });

  describe("Given sender is not admin", function () {
    it("Should revert when adding a moderator", async function () {
      const MODERATOR_ROLE = await _collection.MODERATOR_ROLE();

      await expect(
        _collection
          .connect(_moderator)
          .grantRole(MODERATOR_ROLE, _otherAccount.address)
      ).to.be.revertedWithCustomError(
        _collection,
        "AccessControlUnauthorizedAccount"
      );
    });

    it("Should revert when removing a moderator", async function () {
      const MODERATOR_ROLE = await _collection.MODERATOR_ROLE();

      await expect(
        _collection
          .connect(_moderator)
          .revokeRole(MODERATOR_ROLE, _otherAccount.address)
      ).to.be.revertedWithCustomError(
        _collection,
        "AccessControlUnauthorizedAccount"
      );
    });
  });
});
