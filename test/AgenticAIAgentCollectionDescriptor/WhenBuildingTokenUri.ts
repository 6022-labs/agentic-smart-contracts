import { expect } from "chai";
import { ethers } from "hardhat";
import { loadFixture, reset } from "@nomicfoundation/hardhat-network-helpers";
import {
  AgenticAIAgentCollection,
  AgenticAIAgentCollectionDescriptor,
} from "../../typechain-types";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";

describe("WhenBuildingTokenUri", function () {
  const ipfsGateway = "https://ipfs.io/ipfs/";

  let _agenticAIAgentCollection: AgenticAIAgentCollection;
  let _agenticAIAgentCollectionDescriptor: AgenticAIAgentCollectionDescriptor;

  let _owner: HardhatEthersSigner;
  let _signer: HardhatEthersSigner;

  async function deployAgenticAIAgentCollectionDescription() {
    await reset();

    const [owner, signer] = await ethers.getSigners();

    const AgenticAIAgentCollectionDescriptor = await ethers.getContractFactory(
      "AgenticAIAgentCollectionDescriptor"
    );
    const agenticAIAgentCollectionDescriptor =
      await AgenticAIAgentCollectionDescriptor.deploy(ipfsGateway);

    const AgenticAIAgentCollection = await ethers.getContractFactory(
      "AgenticAIAgentCollection"
    );
    const agenticAIAgentCollection = await AgenticAIAgentCollection.deploy(
      await agenticAIAgentCollectionDescriptor.getAddress()
    );

    await agenticAIAgentCollection.addSigner(signer.address);

    return {
      owner,
      signer,
      agenticAIAgentCollection,
      agenticAIAgentCollectionDescriptor,
    };
  }

  beforeEach(async function () {
    const {
      owner,
      signer,
      agenticAIAgentCollection,
      agenticAIAgentCollectionDescriptor,
    } = await loadFixture(deployAgenticAIAgentCollectionDescription);

    _owner = owner;
    _signer = signer;
    _agenticAIAgentCollection = agenticAIAgentCollection;
    _agenticAIAgentCollectionDescriptor = agenticAIAgentCollectionDescriptor;
  });

  function generateRandomAddress() {
    return ethers.Wallet.createRandom().address;
  }

  async function signMintRequest(
    signer: HardhatEthersSigner,
    to: string,
    agentAddresses: string[],
    name: string,
    image: string,
    nonce: string
  ) {
    const domain = {
      name: "AgenticAIAgentCollection",
      version: "1",
      chainId: (await ethers.provider.getNetwork()).chainId,
      verifyingContract: await _agenticAIAgentCollection.getAddress(),
    };

    const types = {
      MintRequest: [
        { name: "to", type: "address" },
        { name: "agentAddressesHash", type: "bytes32" }, // Change this from address[] to bytes32
        { name: "signer", type: "address" },
        { name: "nameHash", type: "bytes32" },
        { name: "imageHash", type: "bytes32" },
        { name: "nonce", type: "bytes32" },
      ],
    };

    const agentAddressesHash = ethers.keccak256(
      ethers.solidityPacked(["address[]"], [agentAddresses])
    );
    const nameHash = ethers.keccak256(ethers.toUtf8Bytes(name));
    const imageHash = ethers.keccak256(ethers.toUtf8Bytes(image));

    const message = {
      to,
      agentAddressesHash,
      signer: signer.address,
      nameHash,
      imageHash,
      nonce: ethers.keccak256(ethers.toUtf8Bytes(nonce)),
    };

    return await signer.signTypedData(domain, types, message);
  }

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
    let _tokenId: number = 0;
    let _name: string = "Test Agent";
    let _baseImageCid: string =
      "bafybeibsulc7sgpck3w7ur7eqa6fwaazcsswn3dg3rfl65zka3knajx43i";
    let _agentAddresses: string[] = [generateRandomAddress()];

    beforeEach(async function () {
      const nonce = "1";

      const signature = await signMintRequest(
        _signer,
        _owner.address,
        _agentAddresses,
        _name,
        _baseImageCid,
        nonce
      );

      await _agenticAIAgentCollection.mint(
        _owner.address,
        _agentAddresses,
        _signer.address,
        _name,
        _baseImageCid,
        ethers.id(nonce),
        signature
      );
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

    it("Should contains 'name' field in token URI", async function () {
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

    it("Should contains 'description' field in token URI", async function () {
      const tokenURI = await _agenticAIAgentCollectionDescriptor.buildTokenURI(
        await _agenticAIAgentCollection.getAddress(),
        _tokenId
      );

      const decodedTokenURI = Buffer.from(
        tokenURI.replace("data:application/json;base64,", ""),
        "base64"
      ).toString("utf-8");
      const parsedTokenURI = JSON.parse(decodedTokenURI);

      expect(parsedTokenURI.description).to.contain(
        "This NFT represent an Agentic AI Agent"
      );
      expect(parsedTokenURI.description).to.contain(_name);
      expect(parsedTokenURI.description).to.contain(_tokenId);
    });

    it("Should contains 'image' field in token URI", async function () {
      const tokenURI = await _agenticAIAgentCollectionDescriptor.buildTokenURI(
        await _agenticAIAgentCollection.getAddress(),
        _tokenId
      );

      const decodedTokenURI = Buffer.from(
        tokenURI.replace("data:application/json;base64,", ""),
        "base64"
      ).toString("utf-8");
      const parsedTokenURI = JSON.parse(decodedTokenURI);

      const parsedImage = Buffer.from(
        parsedTokenURI.image.replace("data:image/svg+xml;base64,", ""),
        "base64"
      ).toString("utf-8");

      // Image is a SVG
      expect(parsedImage).to.contain(ipfsGateway + _baseImageCid);
      expect(parsedImage).to.contain(_tokenId);
      expect(parsedImage).to.contain(_name);
      expect(parsedImage).to.contain(
        (await _signer.getAddress()).toLowerCase()
      );
      expect(parsedImage).to.contain(_agentAddresses[0].toLowerCase());
    });
  });
});
