import { expect } from "chai";
import { ethers } from "hardhat";
import { AgentCollectionV1 } from "../../typechain-types";
import { loadFixture, reset } from "@nomicfoundation/hardhat-network-helpers";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import {
  proposeAndMint,
  evmAddresses,
  deployCollectionWithCreator,
} from "../common";

describe("WhenRemovingImage", function () {
  const ipfsGateway = "https://ipfs.io/ipfs/";

  let _collection: AgentCollectionV1;

  let _owner: HardhatEthersSigner;
  let _moderator: HardhatEthersSigner;
  let _otherAccount: HardhatEthersSigner;

  async function deployAgentCollection() {
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
      deployAgentCollection,
    );

    _collection = collection;
    _owner = owner;
    _moderator = moderator;
    _otherAccount = otherAccount;
  });

  async function mintWithImages(
    images: { key: string; value: string }[],
    to: string,
  ) {
    const tokenId = await _collection.nextTokenId();

    await proposeAndMint(_collection, _moderator, {
      to,
      images,
    });

    return tokenId;
  }

  describe("Given token id does not exist", function () {
    it("Should revert with 'ERC721NonexistentToken' error", async function () {
      const tokenId = 1;

      await expect(
        _collection.connect(_owner).removeAgentImage(tokenId, "default"),
      )
        .to.be.revertedWithCustomError(_collection, "ERC721NonexistentToken")
        .withArgs(tokenId);
    });
  });

  describe("Given sender is not the owner nor moderator", function () {
    it("Should revert with 'OwnableUnauthorizedAccount' error", async function () {
      const tokenId = await mintWithImages(
        [
          { key: "default", value: "bafybeihash" },
          { key: "profile", value: "bafybeiprofile" },
        ],
        await _owner.getAddress(),
      );

      await expect(
        _collection.connect(_otherAccount).removeAgentImage(tokenId, "default"),
      )
        .to.be.revertedWithCustomError(
          _collection,
          "OwnableUnauthorizedAccount",
        )
        .withArgs(await _otherAccount.getAddress(), tokenId);
    });
  });

  describe("Given removing default image", function () {
    it("Should revert with 'MissingDefaultImage' error", async function () {
      const tokenId = await mintWithImages(
        [
          { key: "default", value: "bafybeidefault" },
          { key: "profile", value: "bafybeiprofile" },
        ],
        await _owner.getAddress(),
      );

      await expect(
        _collection.connect(_owner).removeAgentImage(tokenId, "default"),
      ).to.be.revertedWithCustomError(_collection, "MissingDefaultImage");
    });
  });

  describe("Given owner removes an existing image", function () {
    it("Should remove the image", async function () {
      const defaultImg = {
        key: "default",
        value: "bafybeidefault",
      };
      const profileImg = {
        key: "profile",
        value: "bafybeiprofile",
      };
      const tokenId = await mintWithImages(
        [defaultImg, profileImg],
        await _owner.getAddress(),
      );

      await _collection
        .connect(_owner)
        .removeAgentImage(tokenId, profileImg.key);

      const imagesCount = await _collection.imagesCountOf(tokenId);

      expect(imagesCount).to.equal(1);

      const images: [string, string][] = [];
      for (let i = 0; i < imagesCount; i++) {
        const image = await _collection.imageOfByIndex(tokenId, i);
        images.push([image.key, image.value]);
      }

      expect(images.length).to.equal(1);
      expect(images[0][0]).to.equal(defaultImg.key);
      expect(images[0][1]).to.equal(defaultImg.value);
    });

    it("Should emit 'AgentImageRemoved' event", async function () {
      const tokenId = await mintWithImages(
        [
          { key: "default", value: "bafybeidefault" },
          { key: "profile", value: "bafybeiprofile" },
        ],
        await _owner.getAddress(),
      );

      await expect(
        _collection.connect(_owner).removeAgentImage(tokenId, "profile"),
      )
        .to.emit(_collection, "AgentImageRemoved")
        .withArgs(tokenId, "profile");
    });

    it("Should not emit 'AgentImageRemoved' event when key does not exist", async function () {
      const tokenId = await mintWithImages(
        [{ key: "default", value: "bafybeidefault" }],
        await _owner.getAddress(),
      );

      await expect(
        _collection.connect(_owner).removeAgentImage(tokenId, "unknown"),
      ).to.not.emit(_collection, "AgentImageRemoved");
    });

    it("Should do nothing when key does not exist", async function () {
      const defaultImg = {
        key: "default",
        value: "bafybeidefault",
      };
      const tokenId = await mintWithImages(
        [defaultImg],
        await _owner.getAddress(),
      );

      await _collection.connect(_owner).removeAgentImage(tokenId, "unknown");

      const imagesCount = await _collection.imagesCountOf(tokenId);

      expect(imagesCount).to.equal(1);

      const images: [string, string][] = [];
      for (let i = 0; i < imagesCount; i++) {
        const image = await _collection.imageOfByIndex(tokenId, i);
        images.push([image.key, image.value]);
      }

      expect(images.length).to.equal(1);
      expect(images[0][0]).to.equal(defaultImg.key);
    });
  });

  describe("Given one of the agent's wallets removes an image", function () {
    it("Should remove the image", async function () {
      const tokenId = await proposeAndMint(_collection, _moderator, {
        to: await _owner.getAddress(),
        addresses: evmAddresses(_otherAccount.address),
        images: [
          { key: "default", value: "bafybeidefault" },
          { key: "profile", value: "bafybeiprofile" },
        ],
      });

      await _collection
        .connect(_otherAccount)
        .removeAgentImage(tokenId, "profile");

      expect(await _collection.imagesCountOf(tokenId)).to.equal(1);
      const image = await _collection.imageOfByIndex(tokenId, 0);
      expect(image.key).to.equal("default");
    });
  });

  describe("Given moderator removes image from another token", function () {
    it("Should remove the image", async function () {
      const tokenId = await mintWithImages(
        [
          { key: "default", value: "bafybeidefault" },
          { key: "profile", value: "bafybeiprofile" },
        ],
        await _otherAccount.getAddress(),
      );

      await _collection
        .connect(_moderator)
        .removeAgentImage(tokenId, "profile");

      const imagesCount = await _collection.imagesCountOf(tokenId);

      expect(imagesCount).to.equal(1);

      const images: [string, string][] = [];
      for (let i = 0; i < imagesCount; i++) {
        const image = await _collection.imageOfByIndex(tokenId, i);
        images.push([image.key, image.value]);
      }

      expect(images.length).to.equal(1);
      expect(images[0][0]).to.equal("default");
      expect(images[0][1]).to.equal("bafybeidefault");
    });
  });
});
