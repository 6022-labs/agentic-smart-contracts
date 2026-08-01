import { expect } from "chai";
import { ethers } from "hardhat";
import { AgentCollectionV1 } from "../../typechain-types";
import { loadFixture, reset } from "@nomicfoundation/hardhat-network-helpers";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import {
  decodeTokenURI,
  proposeAndMint,
  evmAddresses,
  generateRandomAddress,
  deployCollectionWithCreator,
} from "../common";

describe("WhenGettingTokenUri", function () {
  const ipfsGateway = "https://ipfs.io/ipfs/";

  let _collection: AgentCollectionV1;

  let _owner: HardhatEthersSigner;

  async function deployAgentCollectionDescription() {
    await reset();

    const [owner] = await ethers.getSigners();

    const { collection } = await deployCollectionWithCreator({
      owner,
      moderator: owner,
      ipfsGateway,
    });

    return {
      owner,
      AgentCollection: collection,
    };
  }

  beforeEach(async function () {
    const { owner, AgentCollection } = await loadFixture(
      deployAgentCollectionDescription,
    );

    _owner = owner;
    _collection = AgentCollection;
  });

  describe("Given token id exists", function () {
    let _tokenId: bigint;
    let _name: string = "test-agent";
    let _images = [
      {
        key: "default",
        value: "bafybeibsulc7sgpck3w7ur7eqa6fwaazcsswn3dg3rfl65zka3knajx43i",
      },
    ];
    let _wallets: string[] = [generateRandomAddress()];

    beforeEach(async function () {
      _tokenId = await _collection.nextTokenId();

      await proposeAndMint(_collection, _owner, {
        to: _owner.address,
        addresses: evmAddresses(..._wallets),
        name: _name,
        images: _images,
      });
    });

    it("Should return token URI as base 64 encoded JSON", async function () {
      const tokenURI = await _collection.tokenURI(_tokenId);

      const parsedTokenURI = decodeTokenURI(tokenURI);
      expect(parsedTokenURI).to.be.an("object");
      expect(parsedTokenURI).to.have.property("name");
      expect(parsedTokenURI).to.have.property("description");
      expect(parsedTokenURI).to.have.property("image");
    });

    it("Should contain 'name' field in token URI", async function () {
      const tokenURI = await _collection.tokenURI(_tokenId);

      const parsedTokenURI = decodeTokenURI(tokenURI);
      expect(parsedTokenURI.name).to.equal(_name);
    });

    it("Should contain 'description' field in token URI", async function () {
      const tokenURI = await _collection.tokenURI(_tokenId);

      const parsedTokenURI = decodeTokenURI(tokenURI);
      const expectedDescription = await _collection.description();

      expect(parsedTokenURI.description).to.be.equal(expectedDescription);
    });

    it("Should contain 'image' field in token URI", async function () {
      const tokenURI = await _collection.tokenURI(_tokenId);

      const parsedTokenURI = decodeTokenURI(tokenURI);

      // Image is a SVG
      expect(parsedTokenURI.image).to.be.equal(ipfsGateway + _images[0].value);
    });
  });
});
