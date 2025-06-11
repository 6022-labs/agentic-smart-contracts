import { expect } from "chai";
import { ethers } from "hardhat";
import { loadFixture, reset } from "@nomicfoundation/hardhat-network-helpers";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { AgenticAIAgentCollection } from "../../typechain-types";

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
    const collectionsDescriptor = await CollectionsDescriptor.deploy(ipfsGateway);

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

  function generateRandomAddress() {
    return ethers.Wallet.createRandom().address;
  }

  async function signMintRequest(
    signer: HardhatEthersSigner,
    to: string,
    agentAddresses: string[],
    role: string,
    name: string,
    image: string,
    mission: string,
    nonce: string
  ) {
    const domain = {
      name: "AgenticAIAgentCollection",
      version: "1",
      chainId: (await ethers.provider.getNetwork()).chainId,
      verifyingContract: await _agenticAIAgentCollection.getAddress(),
    };

    const types = {
      MintProposalRequest: [
        { name: "to", type: "address" },
        { name: "agentAddressesHash", type: "bytes32" }, // Change this from address[] to bytes32
        { name: "signer", type: "address" },
        { name: "roleHash", type: "bytes32" },
        { name: "nameHash", type: "bytes32" },
        { name: "imageHash", type: "bytes32" },
        { name: "missionHash", type: "bytes32" },
        { name: "nonce", type: "bytes32" },
      ],
    };

    const agentAddressesHash = ethers.keccak256(
      ethers.solidityPacked(["address[]"], [agentAddresses])
    );

    const roleHash = ethers.keccak256(ethers.toUtf8Bytes(role));
    const nameHash = ethers.keccak256(ethers.toUtf8Bytes(name));
    const imageHash = ethers.keccak256(ethers.toUtf8Bytes(image));
    const missionHash = ethers.keccak256(ethers.toUtf8Bytes(mission));

    const message = {
      to,
      agentAddressesHash,
      signer: signer.address,
      roleHash,
      nameHash,
      imageHash,
      missionHash,
      nonce: ethers.keccak256(ethers.toUtf8Bytes(nonce)),
    };

    return await signer.signTypedData(domain, types, message);
  }

  describe("Given token id exists", function () {
    let _tokenId: bigint;
    let _name: string = "test-agent";
    let _role: string = "facilitator";
    let _baseImageCid: string =
      "bafybeibsulc7sgpck3w7ur7eqa6fwaazcsswn3dg3rfl65zka3knajx43i";
    let _agentAddresses: string[] = [generateRandomAddress()];

    beforeEach(async function () {
      const nonce = "1";
      _tokenId = await _agenticAIAgentCollection.nextTokenId();
      const mission = "";

      const signature = await signMintRequest(
        _signer,
        _owner.address,
        _agentAddresses,
        _role,
        _name,
        _baseImageCid,
        mission,
        nonce
      );

      await _agenticAIAgentCollection.mintProposal(
        _owner.address,
        _agentAddresses,
        _signer.address,
        _role,
        _name,
        _baseImageCid,
        mission,
        ethers.id(nonce),
        signature
      );

      await _agenticAIAgentCollection.connect(_owner).mint(1);
    });

    it("Should return token URI as base 64 encoded JSON", async function () {
      const tokenURI = await _agenticAIAgentCollection.tokenURI(_tokenId);

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
      const tokenURI = await _agenticAIAgentCollection.tokenURI(_tokenId);

      const decodedTokenURI = Buffer.from(
        tokenURI.replace("data:application/json;base64,", ""),
        "base64"
      ).toString("utf-8");
      const parsedTokenURI = JSON.parse(decodedTokenURI);
      expect(parsedTokenURI.name).to.equal(_name);
    });

    it("Should contain 'description' field in token URI", async function () {
      const tokenURI = await _agenticAIAgentCollection.tokenURI(_tokenId);

      const decodedTokenURI = Buffer.from(
        tokenURI.replace("data:application/json;base64,", ""),
        "base64"
      ).toString("utf-8");
      const parsedTokenURI = JSON.parse(decodedTokenURI);

      expect(parsedTokenURI.description).to.be.equal("6022 AI Agent");
    });

    it("Should contain 'image' field in token URI", async function () {
      const tokenURI = await _agenticAIAgentCollection.tokenURI(_tokenId);

      const decodedTokenURI = Buffer.from(
        tokenURI.replace("data:application/json;base64,", ""),
        "base64"
      ).toString("utf-8");
      const parsedTokenURI = JSON.parse(decodedTokenURI);

      // Image is a SVG
      expect(parsedTokenURI.image).to.be.equal(ipfsGateway + _baseImageCid);
    });
  });
});
