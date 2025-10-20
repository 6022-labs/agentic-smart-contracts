import { expect } from "chai";
import { ethers } from "hardhat";
import { AgentCollectionV1 } from "../../typechain-types";
import { loadFixture, reset } from "@nomicfoundation/hardhat-network-helpers";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { proposeAndMint, deployCollectionWithCreator } from "../common";

describe("WhenAddingOrUpdatingAgentAttribute", function () {
  const ipfsGateway = "https://ipfs.io/ipfs/";

  let _collection: AgentCollectionV1;

  let _owner: HardhatEthersSigner;
  let _signer: HardhatEthersSigner;
  let _moderator: HardhatEthersSigner;
  let _otherAccount: HardhatEthersSigner;

  async function deployAgentCollection() {
    await reset();

    const [owner, signer, otherAccount, moderator] = await ethers.getSigners();

    const { collection, collectionsManager } =
      await deployCollectionWithCreator({
        owner,
        moderator,
        ipfsGateway,
      });

    const signerRole = await collectionsManager.SIGNER_ROLE();
    await collectionsManager.grantRole(signerRole, signer.address);

    return { collection, owner, signer, moderator, otherAccount };
  }

  beforeEach(async function () {
    const { collection, owner, signer, moderator, otherAccount } =
      await loadFixture(deployAgentCollection);

    _collection = collection;

    _owner = owner;
    _signer = signer;
    _moderator = moderator;
    _otherAccount = otherAccount;
  });

  async function mint(to: string) {
    const tokenId = await _collection.nextTokenId();

    await proposeAndMint(_signer, _collection, _moderator, {
      to,
    });

    return tokenId;
  }

  describe("Given token id does not exist", function () {
    it("Should revert with 'ERC721NonexistentToken' error", async function () {
      const tokenId = 1;

      await expect(
        _collection
          .connect(_owner)
          .addOrUpdateAgentAttribute(tokenId, "key", "value")
      )
        .to.be.revertedWithCustomError(_collection, "ERC721NonexistentToken")
        .withArgs(tokenId);
    });
  });

  describe("Given sender is not the owner of the token", function () {
    it("Should revert with 'OwnableUnauthorizedAccount' error", async function () {
      const tokenId = await mint(await _owner.getAddress());

      await expect(
        _collection
          .connect(_otherAccount)
          .addOrUpdateAgentAttribute(tokenId, "key", "value")
      )
        .to.be.revertedWithCustomError(
          _collection,
          "OwnableUnauthorizedAccount"
        )
        .withArgs(await _otherAccount.getAddress(), tokenId);
    });
  });

  describe("Given attribute key is not yet defined", function () {
    const ATTRIBUTE_KEY = "initial-key";
    const ATTRIBUTE_VALUE = "initial-value";

    it("Should add the attribute", async function () {
      const tokenId = await mint(await _owner.getAddress());

      await _collection
        .connect(_owner)
        .addOrUpdateAgentAttribute(tokenId, ATTRIBUTE_KEY, ATTRIBUTE_VALUE);

      const information = await _collection.informationOf(tokenId);

      for (const attribute of information.attributes) {
        if (attribute.key === ATTRIBUTE_KEY) {
          expect(attribute.value).to.equal(ATTRIBUTE_VALUE);
          return;
        }
      }

      throw new Error("Attribute key not found");
    });

    it("Should emit 'AgentAttributeUpdated' event", async function () {
      const tokenId = await mint(await _owner.getAddress());

      await expect(
        _collection
          .connect(_owner)
          .addOrUpdateAgentAttribute(tokenId, ATTRIBUTE_KEY, ATTRIBUTE_VALUE)
      )
        .to.emit(_collection, "AgentAttributeUpdated")
        .withArgs(tokenId, ATTRIBUTE_KEY, "", ATTRIBUTE_VALUE);
    });
  });

  describe("Given attribute key is already defined", function () {
    const ATTRIBUTE_KEY = "existing-key";
    const EXISTING_ATTRIBUTE_VALUE = "existing-value";
    const NEW_ATTRIBUTE_VALUE = "new-value";

    it("Should update the attribute", async function () {
      const tokenId = await mint(await _owner.getAddress());

      await _collection
        .connect(_owner)
        .addOrUpdateAgentAttribute(
          tokenId,
          ATTRIBUTE_KEY,
          EXISTING_ATTRIBUTE_VALUE
        );

      await _collection
        .connect(_owner)
        .addOrUpdateAgentAttribute(tokenId, ATTRIBUTE_KEY, NEW_ATTRIBUTE_VALUE);

      const information = await _collection.informationOf(tokenId);

      for (const attribute of information.attributes) {
        if (attribute.key === ATTRIBUTE_KEY) {
          expect(attribute.value).to.equal(NEW_ATTRIBUTE_VALUE);
          return;
        }
      }

      throw new Error("Attribute key not found");
    });

    it("Should emit 'AgentAttributeUpdated' event", async function () {
      const tokenId = await mint(await _owner.getAddress());

      await _collection
        .connect(_owner)
        .addOrUpdateAgentAttribute(
          tokenId,
          ATTRIBUTE_KEY,
          EXISTING_ATTRIBUTE_VALUE
        );

      await expect(
        _collection
          .connect(_owner)
          .addOrUpdateAgentAttribute(
            tokenId,
            ATTRIBUTE_KEY,
            NEW_ATTRIBUTE_VALUE
          )
      )
        .to.emit(_collection, "AgentAttributeUpdated")
        .withArgs(
          tokenId,
          ATTRIBUTE_KEY,
          EXISTING_ATTRIBUTE_VALUE,
          NEW_ATTRIBUTE_VALUE
        );
    });
  });
});
