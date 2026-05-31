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
  AgentCollectionsDescriptor,
} from "../../typechain-types";

describe("WhenBuildingTokenUri", function () {
  const ipfsGateway = "https://ipfs.io/ipfs/";

  let _collection: AgentCollectionV1;
  let _collectionDescriptor: AgentCollectionsDescriptor;

  let _owner: HardhatEthersSigner;

  async function deployAgentCollectionDescription() {
    await reset();

    const [owner] = await ethers.getSigners();

    const { collection, collectionsDescriptor } =
      await deployCollectionWithCreator({
        ipfsGateway,
        owner,
        moderator: owner,
      });

    return {
      owner,
      collection,
      collectionsDescriptor,
    };
  }

  beforeEach(async function () {
    const { owner, collection, collectionsDescriptor } = await loadFixture(
      deployAgentCollectionDescription,
    );

    _owner = owner;
    _collection = collection;
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
        _collectionDescriptor.buildTokenURI(await _collection.getAddress(), 0),
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
        _tokenId,
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
        _tokenId,
      );

      const parsedTokenURI = decodeTokenURI(tokenURI);
      expect(parsedTokenURI.name).to.equal(_name);
    });

    it("Should contain 'description' field in token URI", async function () {
      const tokenURI = await _collectionDescriptor.buildTokenURI(
        await _collection.getAddress(),
        _tokenId,
      );

      const parsedTokenURI = decodeTokenURI(tokenURI);
      const expectedDescription = await _collection.description();

      expect(parsedTokenURI.description).to.be.equal(expectedDescription);
    });

    it("Should contain 'image' field in token URI", async function () {
      const tokenURI = await _collectionDescriptor.buildTokenURI(
        await _collection.getAddress(),
        _tokenId,
      );

      const parsedTokenURI = decodeTokenURI(tokenURI);

      expect(parsedTokenURI.image).to.contain(ipfsGateway);
      expect(parsedTokenURI.image).to.contain(_images[0].value);
    });
  });

  describe("Given values contain JSON metacharacters", function () {
    it("Should escape quotes and backslashes in the description", async function () {
      const malicious = 'pwned","image":"x\\y"';
      await _collection.connect(_owner).updateDescription(malicious);

      const tokenId = await _collection.nextTokenId();
      await proposeAndMint(_collection, _owner, {
        to: _owner.address,
        name: "agent",
      });

      const parsedTokenURI = decodeTokenURI(
        await _collectionDescriptor.buildTokenURI(
          await _collection.getAddress(),
          tokenId,
        ),
      );

      expect(parsedTokenURI.description).to.equal(malicious);
      expect(parsedTokenURI.name).to.equal("agent");
    });

    it("Should escape quotes and backslashes in the image value", async function () {
      const maliciousValue = 'cid","name":"pwned';
      const tokenId = await _collection.nextTokenId();
      await proposeAndMint(_collection, _owner, {
        to: _owner.address,
        name: "agent",
        images: [{ key: "default", value: maliciousValue }],
      });

      const parsedTokenURI = decodeTokenURI(
        await _collectionDescriptor.buildTokenURI(
          await _collection.getAddress(),
          tokenId,
        ),
      );

      expect(parsedTokenURI.image).to.equal(ipfsGateway + maliciousValue);
      expect(parsedTokenURI.name).to.equal("agent");
    });
  });
});
