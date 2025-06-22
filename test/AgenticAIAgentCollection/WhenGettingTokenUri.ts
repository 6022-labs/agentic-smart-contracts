import { expect } from "chai";
import { ethers } from "hardhat";
import { AgenticAIAgentCollection } from "../../typechain-types";
import { loadFixture, reset } from "@nomicfoundation/hardhat-network-helpers";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import {
  generateRandomAddress,
  signMintRequest,
  decodeTokenURI,
} from "../common";

describe("WhenGettingTokenUri", function () {
  const ipfsGateway = "https://ipfs.io/ipfs/";

  let _agenticAIAgentCollection: AgenticAIAgentCollection;

  let _owner: HardhatEthersSigner;
  let _signer: HardhatEthersSigner;

  async function deployAgenticAIAgentCollectionDescription() {
    await reset();

    const [owner, signer] = await ethers.getSigners();

    const CollectionsManager = await ethers.getContractFactory(
      "AgenticAIAgentCollectionsManager"
    );
    const collectionsManager = await CollectionsManager.deploy();

    const CollectionsDescriptor = await ethers.getContractFactory(
      "AgenticAIAgentCollectionsDescriptor"
    );
    const collectionsDescriptor = await CollectionsDescriptor.deploy(
      ipfsGateway
    );

    const Collection = await ethers.getContractFactory(
      "AgenticAIAgentCollection"
    );
    const collectionImplementation = await Collection.deploy();

    const TestErc20 = await ethers.getContractFactory("TestERC20");
    const testErc20 = await TestErc20.deploy();

    const CollectionCreator = await ethers.getContractFactory(
      "AgenticAIAgentCollectionCreator"
    );
    const collectionCreator = await CollectionCreator.deploy(
      await collectionsManager.getAddress(),
      await collectionsDescriptor.getAddress(),
      await collectionImplementation.getAddress()
    );

    await collectionCreator.addAuthorizedTokenForCreation(
      await testErc20.getAddress(),
      0n // No minimum balance required
    );
    await collectionsManager.grantRole(
      await collectionsManager.CREATOR_ROLE(),
      await collectionCreator.getAddress()
    );

    await collectionCreator.createCollection(
      "AgenticAI",
      "AIA",
      "description",
      owner.address,
      owner.address
    );

    const collectionAddress = await collectionsManager.collections(
      (await collectionsManager.nextCollectionId()) - BigInt(1)
    );
    const collection = Collection.attach(
      collectionAddress
    ) as AgenticAIAgentCollection;

    const signerRole = await collectionsManager.SIGNER_ROLE();
    await collectionsManager.grantRole(signerRole, signer.address);

    return {
      owner,
      signer,
      agenticAIAgentCollection: collection,
    };
  }

  beforeEach(async function () {
    const { owner, signer, agenticAIAgentCollection } = await loadFixture(
      deployAgenticAIAgentCollectionDescription
    );

    _owner = owner;
    _signer = signer;
    _agenticAIAgentCollection = agenticAIAgentCollection;
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
      _tokenId = await _agenticAIAgentCollection.nextTokenId();
      const mission = "";

      const signature = await signMintRequest(
        _signer,
        _agenticAIAgentCollection,
        {
          to: _owner.address,
          agentAddresses: _agentAddresses,
          signer: _signer.address,
          role: _role,
          name: _name,
          images: _images,
          mission,
          nonce,
        }
      );

      await _agenticAIAgentCollection.createMintProposal(
        _owner.address,
        _agentAddresses,
        _signer.address,
        _role,
        _name,
        mission,
        _images,
        ethers.id(nonce),
        signature
      );

      const mintProposalsLength =
        await _agenticAIAgentCollection.mintProposalsLength();

      await _agenticAIAgentCollection
        .connect(_owner)
        .mintFromProposal(mintProposalsLength - BigInt(1));
    });

    it("Should return token URI as base 64 encoded JSON", async function () {
      const tokenURI = await _agenticAIAgentCollection.tokenURI(_tokenId);

      const parsedTokenURI = decodeTokenURI(tokenURI);
      expect(parsedTokenURI).to.be.an("object");
      expect(parsedTokenURI).to.have.property("name");
      expect(parsedTokenURI).to.have.property("description");
      expect(parsedTokenURI).to.have.property("image");
    });

    it("Should contain 'name' field in token URI", async function () {
      const tokenURI = await _agenticAIAgentCollection.tokenURI(_tokenId);

      const parsedTokenURI = decodeTokenURI(tokenURI);
      expect(parsedTokenURI.name).to.equal(_name);
    });

    it("Should contain 'description' field in token URI", async function () {
      const tokenURI = await _agenticAIAgentCollection.tokenURI(_tokenId);

      const parsedTokenURI = decodeTokenURI(tokenURI);
      const expectedDescription = await _agenticAIAgentCollection.description();

      expect(parsedTokenURI.description).to.be.equal(expectedDescription);
    });

    it("Should contain 'image' field in token URI", async function () {
      const tokenURI = await _agenticAIAgentCollection.tokenURI(_tokenId);

      const parsedTokenURI = decodeTokenURI(tokenURI);

      // Image is a SVG
      expect(parsedTokenURI.image).to.be.equal(ipfsGateway + _images[0].value);
    });
  });
});
