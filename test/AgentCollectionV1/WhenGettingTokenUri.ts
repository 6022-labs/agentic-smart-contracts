import { expect } from "chai";
import { ethers } from "hardhat";
import { AgentCollectionV1 } from "../../typechain-types";
import { loadFixture, reset } from "@nomicfoundation/hardhat-network-helpers";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import {
  decodeTokenURI,
  signMintRequest,
  generateRandomAddress,
  deployCollectionWithCreator,
} from "../common";
import { NullableUint256Struct } from "../../typechain-types/contracts/AgentCollectionV1";

describe("WhenGettingTokenUri", function () {
  const ipfsGateway = "https://ipfs.io/ipfs/";

  let _collection: AgentCollectionV1;

  let _owner: HardhatEthersSigner;
  let _signer: HardhatEthersSigner;

  async function deployAgentCollectionDescription() {
    await reset();

    const [owner, signer] = await ethers.getSigners();

    const { collection, collectionsManager } =
      await deployCollectionWithCreator({
        owner,
        moderator: owner,
        ipfsGateway,
      });

    const signerRole = await collectionsManager.SIGNER_ROLE();
    await collectionsManager.grantRole(signerRole, signer.address);

    return {
      owner,
      signer,
      AgentCollection: collection,
    };
  }

  beforeEach(async function () {
    const { owner, signer, AgentCollection } = await loadFixture(
      deployAgentCollectionDescription
    );

    _owner = owner;
    _signer = signer;
    _collection = AgentCollection;
  });

  describe("Given token id exists", function () {
    let _tokenId: bigint;
    let _name: string = "test-agent";
    let _role: string = "facilitator";
    let _images = [
      {
        key: "default",
        value: "bafybeibsulc7sgpck3w7ur7eqa6fwaazcsswn3dg3rfl65zka3knajx43i",
      },
    ];
    let _agentAddresses: string[] = [generateRandomAddress()];

    beforeEach(async function () {
      const nonce = "1";
      _tokenId = await _collection.nextTokenId();
      const cloneOf: NullableUint256Struct = { isSet: false, value: 0n };

      const signature = await signMintRequest(_signer, _collection, {
        to: _owner.address,
        agentAddresses: _agentAddresses,
        signer: _signer.address,
        role: _role,
        name: _name,
        images: _images,
        cloneOf,
        nonce,
      });

      await _collection.createMintProposal(
        _owner.address,
        _agentAddresses,
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
