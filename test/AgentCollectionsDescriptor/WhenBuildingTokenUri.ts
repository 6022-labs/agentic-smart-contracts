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

  // Mint an agent (optionally overriding description / default image) and return
  // its decoded token URI. decodeTokenURI runs JSON.parse, so invalid JSON throws.
  async function mintAndDecodeTokenUri(
    overrides: { description?: string; imageValue?: string } = {},
  ) {
    if (overrides.description !== undefined) {
      await _collection.connect(_owner).updateDescription(overrides.description);
    }

    const tokenId = await _collection.nextTokenId();
    await proposeAndMint(_collection, _owner, {
      to: _owner.address,
      name: "agent",
      ...(overrides.imageValue !== undefined
        ? { images: [{ key: "default", value: overrides.imageValue }] }
        : {}),
    });

    return decodeTokenURI(
      await _collectionDescriptor.buildTokenURI(
        await _collection.getAddress(),
        tokenId,
      ),
    );
  }

  describe("Given invalid collection address", function () {
    it("Should revert", async function () {
      await expect(_collectionDescriptor.buildTokenURI(ethers.ZeroAddress, 0)).to
        .be.rejected;
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
      const parsedTokenURI = decodeTokenURI(
        await _collectionDescriptor.buildTokenURI(
          await _collection.getAddress(),
          _tokenId,
        ),
      );

      expect(parsedTokenURI).to.be.an("object");
      expect(parsedTokenURI).to.have.property("name");
      expect(parsedTokenURI).to.have.property("description");
      expect(parsedTokenURI).to.have.property("image");
    });

    it("Should contain 'name' field in token URI", async function () {
      const parsedTokenURI = decodeTokenURI(
        await _collectionDescriptor.buildTokenURI(
          await _collection.getAddress(),
          _tokenId,
        ),
      );

      expect(parsedTokenURI.name).to.equal(_name);
    });

    it("Should contain 'description' field in token URI", async function () {
      const parsedTokenURI = decodeTokenURI(
        await _collectionDescriptor.buildTokenURI(
          await _collection.getAddress(),
          _tokenId,
        ),
      );

      expect(parsedTokenURI.description).to.equal(
        await _collection.description(),
      );
    });

    it("Should contain 'image' field in token URI", async function () {
      const parsedTokenURI = decodeTokenURI(
        await _collectionDescriptor.buildTokenURI(
          await _collection.getAddress(),
          _tokenId,
        ),
      );

      expect(parsedTokenURI.image).to.contain(ipfsGateway);
      expect(parsedTokenURI.image).to.contain(_images[0].value);
    });
  });

  describe("Given the default image already carries a URI scheme", function () {
    it("Should keep the image untouched instead of prepending the gateway", async function () {
      const uriImage =
        "ipfs://bafybeibsulc7sgpck3w7ur7eqa6fwaazcsswn3dg3rfl65zka3knajx43i";

      const parsedTokenURI = await mintAndDecodeTokenUri({
        imageValue: uriImage,
      });

      expect(parsedTokenURI.image).to.equal(uriImage);
    });
  });

  describe("Given a value tries to break out of the metadata JSON", function () {
    it("Should neutralize a breakout attempt in the description", async function () {
      const breakout = 'pwned","image":"x\\y"';

      const parsedTokenURI = await mintAndDecodeTokenUri({
        description: breakout,
      });

      expect(parsedTokenURI.description).to.equal(breakout);
      expect(parsedTokenURI.name).to.equal("agent");
    });

    it("Should neutralize a breakout attempt in the image value", async function () {
      const breakout = 'cid","name":"pwned';

      const parsedTokenURI = await mintAndDecodeTokenUri({
        imageValue: breakout,
      });

      expect(parsedTokenURI.image).to.equal(ipfsGateway + breakout);
      expect(parsedTokenURI.name).to.equal("agent");
    });
  });

  describe("Given a value contains control characters", function () {
    it("Should keep the JSON valid for every control char 0x00-0x1F plus quote and backslash", async function () {
      const tricky =
        Array.from({ length: 0x20 }, (_, i) => String.fromCharCode(i)).join(
          "",
        ) + '"\\';

      const parsedTokenURI = await mintAndDecodeTokenUri({
        description: tricky,
      });

      expect(parsedTokenURI.description).to.equal(tricky);
    });

    it("Should keep the JSON valid for a control char in the image value", async function () {
      const valueWithNewline = "cid\nline";

      const parsedTokenURI = await mintAndDecodeTokenUri({
        imageValue: valueWithNewline,
      });

      expect(parsedTokenURI.image).to.equal(ipfsGateway + valueWithNewline);
    });
  });
});
