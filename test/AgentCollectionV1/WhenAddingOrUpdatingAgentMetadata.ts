import { expect } from "chai";
import { ethers } from "hardhat";
import { AgentCollectionV1 } from "../../typechain-types";
import { loadFixture, reset } from "@nomicfoundation/hardhat-network-helpers";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { NullableUint256Struct } from "../../typechain-types/contracts/AgentCollectionV1";
import {
  signMintRequest,
  generateRandomNonce,
  generateRandomAddress,
  deployCollectionWithCreator,
} from "../common";

describe("WhenAddingOrUpdatingAgentMetadata", function () {
  const ipfsGateway = "https://ipfs.io/ipfs/";

  let _collection: AgentCollectionV1;

  let _owner: HardhatEthersSigner;
  let _signer: HardhatEthersSigner;
  let _otherAccount: HardhatEthersSigner;

  async function deployAgentCollection() {
    await reset();

    const [owner, signer, otherAccount] = await ethers.getSigners();

    const { collection, collectionsManager } =
      await deployCollectionWithCreator({
        owner,
        moderator: owner,
        ipfsGateway,
      });

    const signerRole = await collectionsManager.SIGNER_ROLE();
    await collectionsManager.grantRole(signerRole, signer.address);

    return { collection, owner, signer, otherAccount };
  }

  beforeEach(async function () {
    const { collection, owner, signer, otherAccount } = await loadFixture(
      deployAgentCollection
    );

    _collection = collection;
    _owner = owner;
    _signer = signer;
    _otherAccount = otherAccount;
  });

  async function mintWithSignature(to: string) {
    const name = "test-agent";
    const images = [
      {
        key: "default",
        value: "bafybeibsulc7sgpck3w7ur7eqa6fwaazcsswn3dg3rfl65zka3knajx43i",
      },
    ];
    const role = "facilitator";

    const nonce = generateRandomNonce();
    const agentAddresses = [generateRandomAddress()];

    const cloneOf: NullableUint256Struct = { isSet: false, value: 0n };

    const signature = await signMintRequest(_signer, _collection, {
      to,
      agentAddresses,
      signer: _signer.address,
      role,
      name,
      images,
      cloneOf,
      nonce,
    });

    await _collection.createMintProposal(
      to,
      agentAddresses,
      _signer.address,
      role,
      name,
      images,
      cloneOf,
      ethers.id(nonce),
      signature
    );

    const mintProposalsLength = await _collection.mintProposalsLength();

    await _collection
      .connect(_owner)
      .mintFromProposal(mintProposalsLength - BigInt(1));

    return (await _collection.nextTokenId()) - BigInt(1);
  }

  describe("Given token id does not exist", function () {
    it("Should revert with 'ERC721NonexistentToken' error", async function () {
      const tokenId = 1;

      await expect(
        _collection
          .connect(_owner)
          .addOrUpdateAgentMetadata(tokenId, "key", "value")
      )
        .to.be.revertedWithCustomError(_collection, "ERC721NonexistentToken")
        .withArgs(tokenId);
    });
  });

  describe("Given sender is not the owner of the token", function () {
    it("Should revert with 'OwnableUnauthorizedAccount' error", async function () {
      const tokenId = await mintWithSignature(await _owner.getAddress());

      await expect(
        _collection
          .connect(_otherAccount)
          .addOrUpdateAgentMetadata(tokenId, "key", "value")
      )
        .to.be.revertedWithCustomError(
          _collection,
          "OwnableUnauthorizedAccount"
        )
        .withArgs(await _otherAccount.getAddress(), tokenId);
    });
  });

  describe("Given metadata key is not yet defined", function () {
    const METADATA_KEY = "initial-key";
    const METADATA_VALUE = "initial-value";

    it("Should add the metadata", async function () {
      const tokenId = await mintWithSignature(await _owner.getAddress());

      await _collection
        .connect(_owner)
        .addOrUpdateAgentMetadata(tokenId, METADATA_KEY, METADATA_VALUE);

      const information = await _collection.informationOf(tokenId);

      for (const metadata of information.metadata) {
        if (metadata.key === METADATA_KEY) {
          expect(metadata.value).to.equal(METADATA_VALUE);
          return;
        }
      }

      throw new Error("Metadata key not found");
    });

    it("Should emit 'AgentMetadataUpdated' event", async function () {
      const tokenId = await mintWithSignature(await _owner.getAddress());

      await expect(
        _collection
          .connect(_owner)
          .addOrUpdateAgentMetadata(tokenId, METADATA_KEY, METADATA_VALUE)
      )
        .to.emit(_collection, "AgentMetadataUpdated")
        .withArgs(tokenId, METADATA_KEY, "", METADATA_VALUE);
    });
  });

  describe("Given metadata key is already defined", function () {
    const METADATA_KEY = "existing-key";
    const EXISTING_METADATA_VALUE = "existing-value";
    const NEW_METADATA_VALUE = "new-value";

    it("Should update the metadata", async function () {
      const tokenId = await mintWithSignature(await _owner.getAddress());

      await _collection
        .connect(_owner)
        .addOrUpdateAgentMetadata(
          tokenId,
          METADATA_KEY,
          EXISTING_METADATA_VALUE
        );

      await _collection
        .connect(_owner)
        .addOrUpdateAgentMetadata(tokenId, METADATA_KEY, NEW_METADATA_VALUE);

      const information = await _collection.informationOf(tokenId);

      for (const metadata of information.metadata) {
        if (metadata.key === METADATA_KEY) {
          expect(metadata.value).to.equal(NEW_METADATA_VALUE);
          return;
        }
      }

      throw new Error("Metadata key not found");
    });

    it("Should emit 'AgentMetadataUpdated' event", async function () {
      const tokenId = await mintWithSignature(await _owner.getAddress());

      await _collection
        .connect(_owner)
        .addOrUpdateAgentMetadata(
          tokenId,
          METADATA_KEY,
          EXISTING_METADATA_VALUE
        );

      await expect(
        _collection
          .connect(_owner)
          .addOrUpdateAgentMetadata(tokenId, METADATA_KEY, NEW_METADATA_VALUE)
      )
        .to.emit(_collection, "AgentMetadataUpdated")
        .withArgs(
          tokenId,
          METADATA_KEY,
          EXISTING_METADATA_VALUE,
          NEW_METADATA_VALUE
        );
    });
  });
});
