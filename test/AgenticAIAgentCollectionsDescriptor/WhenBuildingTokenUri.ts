import { expect } from "chai";
import { ethers } from "hardhat";
import { loadFixture, reset } from "@nomicfoundation/hardhat-network-helpers";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import {
  generateRandomAddress,
  signCreateMintProposalRequest,
} from "../common";
import {
  AgenticAIAgentCollection,
  AgenticAIAgentCollectionsManager,
  AgenticAIAgentCollectionsDescriptor,
} from "../../typechain-types";

describe("WhenBuildingTokenUri", function () {
  const ipfsGateway = "https://ipfs.io/ipfs/";

  let _agenticAIAgentCollection: AgenticAIAgentCollection;
  let _agenticAIAgentCollectionDescriptor: AgenticAIAgentCollectionsDescriptor;
  let _agenticAIAgentCollectionsManager: AgenticAIAgentCollectionsManager;

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
    const collection = await Collection.deploy(
      "AgenticAI",
      "AIA",
      owner.address,
      await collectionsManager.getAddress(),
      await collectionsDescriptor.getAddress()
    );

    await collectionsManager.addSigner(signer.address);

    return {
      owner,
      signer,
      agenticAIAgentCollection: collection,
      agenticAIAgentCollectionDescriptor: collectionsDescriptor,
      agenticAIAgentCollectionsManager: collectionsManager,
    };
  }

  beforeEach(async function () {
    const {
      owner,
      signer,
      agenticAIAgentCollection,
      agenticAIAgentCollectionDescriptor,
      agenticAIAgentCollectionsManager,
    } = await loadFixture(deployAgenticAIAgentCollectionDescription);

    _owner = owner;
    _signer = signer;
    _agenticAIAgentCollection = agenticAIAgentCollection;
    _agenticAIAgentCollectionDescriptor = agenticAIAgentCollectionDescriptor;
    _agenticAIAgentCollectionsManager = agenticAIAgentCollectionsManager;
  });

  describe("Given invalid collection address", function () {
    it("Should revert", async function () {
      await expect(
        _agenticAIAgentCollectionDescriptor.buildTokenURI(ethers.ZeroAddress, 0)
      ).to.be.rejected;
    });
  });

  describe("Given token id does not exist", function () {
    it("Should revert", async function () {
      await expect(
        _agenticAIAgentCollectionDescriptor.buildTokenURI(
          await _agenticAIAgentCollection.getAddress(),
          0
        )
      ).to.be.reverted;
    });
  });

  describe("Given token id exists", function () {
    let _tokenId: bigint;
    let _name = "agent";
    let _images = [
      {
        key: "default",
        value: "bafybeibsulc7sgpck3w7ur7eqa6fwaazcsswn3dg3rfl65zka3knajx43i",
      },
    ];

    const _role = "facilitator";

    beforeEach(async function () {
      const nonce = "1";
      const agentAddresses = [generateRandomAddress()];
      const mission = "";

      _tokenId = await _agenticAIAgentCollection.nextTokenId();

      const signature = await signCreateMintProposalRequest(
        _signer,
        _agenticAIAgentCollection,
        {
          to: _owner.address,
          agentAddresses,
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
        agentAddresses,
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
        .mint(mintProposalsLength - BigInt(1));
    });

    it("Should return token URI as base 64 encoded JSON", async function () {
      const tokenURI = await _agenticAIAgentCollectionDescriptor.buildTokenURI(
        await _agenticAIAgentCollection.getAddress(),
        _tokenId
      );

      const decodedTokenURI = Buffer.from(
        tokenURI.replace("data:application/json;base64,", ""),
        "base64"
      ).toString("utf-8");
      const parsedTokenURI = JSON.parse(decodedTokenURI);
      expect(parsedTokenURI).to.be.an("object");
      expect(parsedTokenURI).to.have.property("name");
      expect(parsedTokenURI).to.have.property("description");
      expect(parsedTokenURI).to.have.property("image");
    });

    it("Should contain 'name' field in token URI", async function () {
      const tokenURI = await _agenticAIAgentCollectionDescriptor.buildTokenURI(
        await _agenticAIAgentCollection.getAddress(),
        _tokenId
      );

      const decodedTokenURI = Buffer.from(
        tokenURI.replace("data:application/json;base64,", ""),
        "base64"
      ).toString("utf-8");
      const parsedTokenURI = JSON.parse(decodedTokenURI);
      expect(parsedTokenURI.name).to.equal(_name);
    });

    it("Should contain 'description' field in token URI", async function () {
      const tokenURI = await _agenticAIAgentCollectionDescriptor.buildTokenURI(
        await _agenticAIAgentCollection.getAddress(),
        _tokenId
      );

      const decodedTokenURI = Buffer.from(
        tokenURI.replace("data:application/json;base64,", ""),
        "base64"
      ).toString("utf-8");
      const parsedTokenURI = JSON.parse(decodedTokenURI);

      expect(parsedTokenURI.description).to.be.equal("6022 AI Agent");
    });

    it("Should contain 'image' field in token URI", async function () {
      const tokenURI = await _agenticAIAgentCollectionDescriptor.buildTokenURI(
        await _agenticAIAgentCollection.getAddress(),
        _tokenId
      );

      const decodedTokenURI = Buffer.from(
        tokenURI.replace("data:application/json;base64,", ""),
        "base64"
      ).toString("utf-8");
      const parsedTokenURI = JSON.parse(decodedTokenURI);

      expect(parsedTokenURI.image).to.contain(ipfsGateway);
      expect(parsedTokenURI.image).to.contain(_images[0].value);
    });
  });
});
