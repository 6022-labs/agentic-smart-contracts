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
  let _moderator: HardhatEthersSigner;
  let _otherAccount: HardhatEthersSigner;

  async function deployAgentCollection() {
    await reset();

    const [owner, otherAccount, moderator] = await ethers.getSigners();

    const { collection } = await deployCollectionWithCreator({
      owner,
      moderator,
      ipfsGateway,
    });

    return { collection, owner, moderator, otherAccount };
  }

  beforeEach(async function () {
    const { collection, owner, moderator, otherAccount } = await loadFixture(
      deployAgentCollection
    );

    _collection = collection;

    _owner = owner;
    _moderator = moderator;
    _otherAccount = otherAccount;
  });

  async function mint(to: string, wallets?: string[]) {
    const tokenId = await _collection.nextTokenId();

    await proposeAndMint(_collection, _moderator, {
      to,
      ...(wallets ? { wallets } : {}),
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

  describe("Given sender is neither the owner nor a wallet of the token", function () {
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

  describe("Given sender is one of the agent's wallets", function () {
    it("Should allow the wallet to add the attribute", async function () {
      // owner holds the NFT; _otherAccount is registered as an agent wallet.
      const tokenId = await mint(await _owner.getAddress(), [
        _otherAccount.address,
      ]);

      await expect(
        _collection
          .connect(_otherAccount)
          .addOrUpdateAgentAttribute(tokenId, "key", "value")
      )
        .to.emit(_collection, "AgentAttributeUpdated")
        .withArgs(tokenId, "key", "", "value");
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
