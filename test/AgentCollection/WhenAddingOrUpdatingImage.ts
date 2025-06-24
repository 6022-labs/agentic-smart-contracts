import { expect } from "chai";
import { ethers } from "hardhat";
import { AgentCollection } from "../../typechain-types";
import { proposeAndMint, deployCollectionWithCreator } from "../common";
import { loadFixture, reset } from "@nomicfoundation/hardhat-network-helpers";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";

describe("WhenAddingOrUpdatingImage", function () {
  const ipfsGateway = "https://ipfs.io/ipfs/";

  let _collection: AgentCollection;
  let _owner: HardhatEthersSigner;
  let _signer: HardhatEthersSigner;
  let _moderator: HardhatEthersSigner;
  let _otherAccount: HardhatEthersSigner;

  async function deployAgentCollection() {
    await reset();

    const [owner, signer, moderator, otherAccount] = await ethers.getSigners();

    const { collection, collectionsManager } =
      await deployCollectionWithCreator({
        owner,
        moderator,
        ipfsGateway,
      });

    const signerRole = await collectionsManager.SIGNER_ROLE();
    await collectionsManager.grantRole(signerRole, signer.address);

    return { collection, owner, signer, moderator, otherAccount };
  }

  beforeEach(async function () {
    const { collection, owner, signer, moderator, otherAccount } =
      await loadFixture(deployAgentCollection);

    _collection = collection;
    _owner = owner;
    _signer = signer;
    _moderator = moderator;
    _otherAccount = otherAccount;
  });

  async function revokeModerator() {
    await _collection
      .connect(_owner)
      .revokeRole(await _collection.MODERATOR_ROLE(), _moderator.address);
  }

  describe("Given a moderator exists", function () {
    describe("And caller is not a moderator", function () {
      it("Should revert with 'NotModerator' error", async function () {
        await expect(
          _collection.addOrUpdateImage(1n, {
            key: "profile",
            value: "cid1",
          })
        ).to.be.revertedWithCustomError(_collection, "NotModerator");
      });
    });

    describe("And caller is a moderator", function () {
      it("Should allow a moderator to update an image directly", async function () {
        const tokenId = await proposeAndMint(_signer, _collection, _moderator, {
          to: await _owner.getAddress(),
        });

        await expect(
          _collection.connect(_moderator).addOrUpdateImage(tokenId, {
            key: "profile",
            value: "cid1",
          })
        ).to.emit(_collection, "AgentImageUpdated");
      });
    });
  });

  describe("Given no moderators are set", function () {
    describe("And token does not exist", function () {
      beforeEach(async function () {
        await revokeModerator();
      });

      it("Should revert with 'ERC721NonexistentToken' error", async function () {
        const tokenId = 1n;

        await expect(
          _collection.addOrUpdateImage(tokenId, {
            key: "profile",
            value: "cid1",
          })
        )
          .to.be.revertedWithCustomError(_collection, "ERC721NonexistentToken")
          .withArgs(tokenId);
      });
    });

    describe("And caller is not the owner of the token", function () {
      let tokenId: bigint;
      beforeEach(async function () {
        tokenId = await proposeAndMint(_signer, _collection, _moderator, {
          to: await _owner.getAddress(),
        });
        await revokeModerator();
      });

      it("Should revert with 'OwnableUnauthorizedAccount' error", async function () {
        await expect(
          _collection
            .connect(_otherAccount)
            .addOrUpdateImage(tokenId, { key: "profile", value: "cid1" })
        )
          .to.be.revertedWithCustomError(
            _collection,
            "OwnableUnauthorizedAccount"
          )
          .withArgs(await _otherAccount.getAddress(), tokenId);
      });
    });

    describe("And image key does not exist", function () {
      let tokenId: bigint;
      beforeEach(async function () {
        tokenId = await proposeAndMint(_signer, _collection, _moderator, {
          to: await _owner.getAddress(),
        });
        await revokeModerator();
      });

      it("Should add the image", async function () {
        await _collection.addOrUpdateImage(tokenId, {
          key: "profile",
          value: "cid1",
        });

        const images = await _collection.imagesOf(tokenId);
        expect(images.length).to.equal(2);
        expect(images[1][0]).to.equal("profile");
        expect(images[1][1]).to.equal("cid1");
      });

      it("Should emit 'AgentImageUpdated' event", async function () {
        await expect(
          _collection.addOrUpdateImage(tokenId, {
            key: "profile",
            value: "cid1",
          })
        )
          .to.emit(_collection, "AgentImageUpdated")
          .withArgs(tokenId, "profile", "", "cid1");
      });
    });

    describe("And image key exists", function () {
      let tokenId: bigint;
      beforeEach(async function () {
        tokenId = await proposeAndMint(_signer, _collection, _moderator, {
          to: await _owner.getAddress(),
        });
        await revokeModerator();
        await _collection.addOrUpdateImage(tokenId, {
          key: "profile",
          value: "cid1",
        });
      });

      it("Should update the image value", async function () {
        await _collection.addOrUpdateImage(tokenId, {
          key: "profile",
          value: "cid2",
        });

        const images = await _collection.imagesOf(tokenId);
        expect(images.length).to.equal(2);
        expect(images[1][0]).to.equal("profile");
        expect(images[1][1]).to.equal("cid2");
      });

      it("Should emit 'AgentImageUpdated' event", async function () {
        await expect(
          _collection.addOrUpdateImage(tokenId, {
            key: "profile",
            value: "cid2",
          })
        )
          .to.emit(_collection, "AgentImageUpdated")
          .withArgs(tokenId, "profile", "cid1", "cid2");
      });
    });
  });
});
