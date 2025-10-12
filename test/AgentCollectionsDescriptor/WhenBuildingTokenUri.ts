import { expect } from "chai";
import { ethers } from "hardhat";
import { loadFixture, reset } from "@nomicfoundation/hardhat-network-helpers";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { NullableUint256Struct } from "../../typechain-types/contracts/AgentCollectionV1";
import {
  decodeTokenURI,
  signMintRequest,
  generateRandomAddress,
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
  let _signer: HardhatEthersSigner;

  async function deployAgentCollectionDescription() {
    await reset();

    const [owner, signer] = await ethers.getSigners();

    const { collection, collectionsDescriptor, collectionsManager } =
      await deployCollectionWithCreator({
        ipfsGateway,
        owner,
        moderator: owner,
      });

    const signerRole = await collectionsManager.SIGNER_ROLE();
    await collectionsManager.grantRole(signerRole, signer.address);

    return {
      owner,
      signer,
      collection,
      collectionsManager,
      collectionsDescriptor,
    };
  }

  beforeEach(async function () {
    const {
      owner,
      signer,
      collection,
      collectionsManager,
      collectionsDescriptor,
    } = await loadFixture(deployAgentCollectionDescription);

    _owner = owner;
    _signer = signer;
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
      const nonce = "1";
      const agentAddresses = [generateRandomAddress()];
      const cloneOf: NullableUint256Struct = { isSet: false, value: 0n };

      _tokenId = await _collection.nextTokenId();

      const signature = await signMintRequest(_signer, _collection, {
        to: _owner.address,
        agentAddresses,
        signer: _signer.address,
        role: _role,
        name: _name,
        images: _images,
        cloneOf,
        nonce,
      });

      await _collection.createMintProposal(
        _owner.address,
        agentAddresses,
        _signer.address,
        _role,
        _name,
        _images,
        cloneOf,
        ethers.id(nonce),
        signature
      );

      const mintProposalsLength = await _collection.mintProposalsLength();

      await _collection
        .connect(_owner)
        .mintFromProposal(mintProposalsLength - BigInt(1));
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
