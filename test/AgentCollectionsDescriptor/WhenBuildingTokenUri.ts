import { expect } from "chai";
import { ethers } from "hardhat";
import { loadFixture, reset } from "@nomicfoundation/hardhat-network-helpers";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import {
  decodeTokenURI,
  proposeAndMint,
  deployCollectionWithCreator,
} from "../common";
import {
  AgentCollectionV1,
  AgentCollectionsManager,
  AgentCollectionsDescriptor,
} from "../../typechain-types";

describe("WhenBuildingTokenUri", function () {
  const ipfsGateway = "https://ipfs.io/ipfs/";

  let _collection: AgentCollectionV1;
  let _collectionDescriptor: AgentCollectionsDescriptor;
  let _collectionsManager: AgentCollectionsManager;

  let _owner: HardhatEthersSigner;

  async function deployAgentCollectionDescription() {
    await reset();

    const [owner] = await ethers.getSigners();

    const { collection, collectionsDescriptor, collectionsManager } =
      await deployCollectionWithCreator({
        ipfsGateway,
        owner,
        moderator: owner,
      });

    return {
      owner,
      collection,
      collectionsManager,
      collectionsDescriptor,
    };
  }

  beforeEach(async function () {
    const { owner, collection, collectionsManager, collectionsDescriptor } =
      await loadFixture(deployAgentCollectionDescription);

    _owner = owner;
    _collection = collection;
    _collectionsManager = collectionsManager;
    _collectionDescriptor = collectionsDescriptor;
  });

  describe("Given invalid collection address", function () {
    it("Should revert", async function () {
      await expect(_collectionDescriptor.buildTokenURI(ethers.ZeroAddress, 0))
        .to.be.rejected;
    });
  });

  describe("Given token id does not exist", function () {
    it("Should revert", async function () {
      await expect(
        _collectionDescriptor.buildTokenURI(await _collection.getAddress(), 0)
      ).to.be.reverted;
    });
  });

  describe("Given token id exists", function () {
    let _tokenId: bigint;
    const _name = "agent";
    const _role = "facilitator";
    const _images = [
      {
        key: "default",
        value: "bafybeibsulc7sgpck3w7ur7eqa6fwaazcsswn3dg3rfl65zka3knajx43i",
      },
    ];

    beforeEach(async function () {
      _tokenId = await _collection.nextTokenId();

      await proposeAndMint(_collection, _owner, {
        to: _owner.address,
        name: _name,
        role: _role,
        images: _images,
      });
    });

    it("Should return token URI as base 64 encoded JSON", async function () {
      const tokenURI = await _collectionDescriptor.buildTokenURI(
        await _collection.getAddress(),
        _tokenId
      );

      const parsedTokenURI = decodeTokenURI(tokenURI);
      expect(parsedTokenURI).to.be.an("object");
      expect(parsedTokenURI).to.have.property("name");
      expect(parsedTokenURI).to.have.property("description");
      expect(parsedTokenURI).to.have.property("image");
    });

    it("Should contain 'name' field in token URI", async function () {
      const tokenURI = await _collectionDescriptor.buildTokenURI(
        await _collection.getAddress(),
        _tokenId
      );

      const parsedTokenURI = decodeTokenURI(tokenURI);
      expect(parsedTokenURI.name).to.equal(_name);
    });

    it("Should contain 'description' field in token URI", async function () {
      const tokenURI = await _collectionDescriptor.buildTokenURI(
        await _collection.getAddress(),
        _tokenId
      );

      const parsedTokenURI = decodeTokenURI(tokenURI);
      const expectedDescription = await _collection.description();

      expect(parsedTokenURI.description).to.be.equal(expectedDescription);
    });

    it("Should contain 'image' field in token URI", async function () {
      const tokenURI = await _collectionDescriptor.buildTokenURI(
        await _collection.getAddress(),
        _tokenId
      );

      const parsedTokenURI = decodeTokenURI(tokenURI);

      expect(parsedTokenURI.image).to.contain(ipfsGateway);
      expect(parsedTokenURI.image).to.contain(_images[0].value);
    });
  });
});
