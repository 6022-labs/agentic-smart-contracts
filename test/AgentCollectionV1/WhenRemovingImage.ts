import { expect } from "chai";
import { ethers } from "hardhat";
import { AgentCollectionV1 } from "../../typechain-types";
import { loadFixture, reset } from "@nomicfoundation/hardhat-network-helpers";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { NullableUint256Struct } from "../../typechain-types/contracts/AgentCollectionV1";
import {
  signMintRequest,
  generateRandomNonce,
  generateRandomAddress,
  deployCollectionWithCreator,
} from "../common";

describe("WhenRemovingImage", function () {
  const ipfsGateway = "https://ipfs.io/ipfs/";

  let _collection: AgentCollectionV1;

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

  async function mintWithImages(
    images: { key: string; value: string }[],
    to: string
  ) {
    const name = "test-agent";
    const role = "facilitator";
    const cloneOf: NullableUint256Struct = { isSet: false, value: 0n };

    const nonce = generateRandomNonce();
    const agentAddresses = [generateRandomAddress()];

    const signature = await signMintRequest(_signer, _collection, {
      to,
      agentAddresses,
      signer: _signer.address,
      role,
      name,
      images,
      cloneOf,
      nonce,
    });

    await _collection.createMintProposal(
      to,
      agentAddresses,
      _signer.address,
      role,
      name,
      images,
      cloneOf,
      ethers.id(nonce),
      signature
    );

    const mintProposalsLength = await _collection.mintProposalsLength();

    const tokenId = await _collection.nextTokenId();

    await _collection
      .connect(_moderator)
      .mintFromProposal(mintProposalsLength - BigInt(1));

    return tokenId;
  }

  describe("Given token id does not exist", function () {
    it("Should revert with 'ERC721NonexistentToken' error", async function () {
      const tokenId = 1;

      await expect(_collection.connect(_owner).removeImage(tokenId, "default"))
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
        await _owner.getAddress()
      );

      await expect(
        _collection.connect(_otherAccount).removeImage(tokenId, "default")
      )
        .to.be.revertedWithCustomError(
          _collection,
          "OwnableUnauthorizedAccount"
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
        await _owner.getAddress()
      );

      await expect(
        _collection.connect(_owner).removeImage(tokenId, "default")
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
        await _owner.getAddress()
      );

      await _collection.connect(_owner).removeImage(tokenId, profileImg.key);

      const images = await _collection.imagesOf(tokenId);

      expect(images.length).to.equal(1);
      expect(images[0][0]).to.equal(defaultImg.key);
      expect(images[0][1]).to.equal(defaultImg.value);
    });

    it("Should do nothing when key does not exist", async function () {
      const defaultImg = {
        key: "default",
        value: "bafybeidefault",
      };
      const tokenId = await mintWithImages(
        [defaultImg],
        await _owner.getAddress()
      );

      await _collection.connect(_owner).removeImage(tokenId, "unknown");

      const images = await _collection.imagesOf(tokenId);

      expect(images.length).to.equal(1);
      expect(images[0][0]).to.equal(defaultImg.key);
    });
  });

  describe("Given moderator removes image from another token", function () {
    it("Should remove the image", async function () {
      const tokenId = await mintWithImages(
        [
          { key: "default", value: "bafybeidefault" },
          { key: "profile", value: "bafybeiprofile" },
        ],
        await _otherAccount.getAddress()
      );

      await _collection.connect(_moderator).removeImage(tokenId, "profile");

      const images = await _collection.imagesOf(tokenId);

      expect(images.length).to.equal(1);
      expect(images[0][0]).to.equal("default");
    });
  });
});
