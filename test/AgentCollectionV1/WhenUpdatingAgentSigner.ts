import { expect } from "chai";
import { ethers } from "hardhat";
import { AgentCollectionV1 } from "../../typechain-types";
import { loadFixture, reset } from "@nomicfoundation/hardhat-network-helpers";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import {
  proposeAndMint,
  generateRandomNonce,
  deployCollectionWithCreator,
  signUpdateAgentSignerRequest,
} from "../common";

describe("WhenUpdatingAgentSigner", function () {
  const ipfsGateway = "https://ipfs.io/ipfs/";

  let _collection: AgentCollectionV1;

  let _owner: HardhatEthersSigner;
  let _otherAccount: HardhatEthersSigner;

  let _signer: HardhatEthersSigner;
  let _otherSigner: HardhatEthersSigner;

  async function deployAgentCollection() {
    await reset();

    const [owner, otherAccount, signer, otherSigner] =
      await ethers.getSigners();

    const { collection, collectionsManager } =
      await deployCollectionWithCreator({
        owner,
        moderator: owner,
        ipfsGateway,
      });

    const signerRole = await collectionsManager.SIGNER_ROLE();
    await collectionsManager.grantRole(signerRole, signer.address);
    await collectionsManager.grantRole(signerRole, otherSigner.address);

    return {
      AgentCollection: collection,
      owner,
      otherAccount,
      signer,
      otherSigner,
    };
  }

  beforeEach(async function () {
    const { AgentCollection, owner, otherAccount, signer, otherSigner } =
      await loadFixture(deployAgentCollection);

    _owner = owner;
    _signer = signer;
    _otherSigner = otherSigner;
    _otherAccount = otherAccount;
    _collection = AgentCollection;
  });

  async function mint(signer: HardhatEthersSigner, to: string) {
    await proposeAndMint(signer, _collection, _owner, {
      to,
    });
  }

  describe("Given nonce has already been used", function () {
    it("Should revert with 'UsedNonce' error", async function () {
      const nextTokenId = await _collection.nextTokenId();

      await mint(_signer, await _owner.getAddress());

      const nonce = generateRandomNonce();
      const signature = await signUpdateAgentSignerRequest(
        _signer,
        _collection,
        {
          tokenId: nextTokenId.toString(),
          newSigner: await _otherSigner.getAddress(),
          nonce,
        }
      );

      await _collection
        .connect(_owner)
        .updateAgentSigner(
          nextTokenId,
          await _otherSigner.getAddress(),
          ethers.id(nonce),
          signature
        );

      await expect(
        _collection
          .connect(_owner)
          .updateAgentSigner(
            nextTokenId,
            await _otherAccount.getAddress(),
            ethers.id(nonce),
            signature
          )
      )
        .to.be.revertedWithCustomError(_collection, "UsedNonce")
        .withArgs(ethers.id(nonce));
    });
  });

  describe("Given sender is not the owner of the token", function () {
    it("Should revert with 'OwnableUnauthorizedAccount' error", async function () {
      const nextTokenId = await _collection.nextTokenId();

      await mint(_signer, await _owner.getAddress());

      const nonce = generateRandomNonce();
      const signature = await signUpdateAgentSignerRequest(
        _signer,
        _collection,
        {
          tokenId: nextTokenId.toString(),
          newSigner: await _otherAccount.getAddress(),
          nonce,
        }
      );

      await expect(
        _collection
          .connect(_otherAccount)
          .updateAgentSigner(
            nextTokenId,
            await _otherAccount.getAddress(),
            ethers.id(nonce),
            signature
          )
      )
        .to.be.revertedWithCustomError(
          _collection,
          "OwnableUnauthorizedAccount"
        )
        .withArgs(await _otherAccount.getAddress(), nextTokenId);
    });
  });

  describe("Given new signer is not a valid signer", function () {
    it("Should revert with 'NotSigner' error", async function () {
      const nextTokenId = await _collection.nextTokenId();

      await mint(_signer, await _owner.getAddress());

      const nonce = generateRandomNonce();
      const signature = await signUpdateAgentSignerRequest(
        _signer,
        _collection,
        {
          tokenId: nextTokenId.toString(),
          newSigner: await _otherAccount.getAddress(),
          nonce,
        }
      );

      await expect(
        _collection
          .connect(_owner)
          .updateAgentSigner(
            nextTokenId,
            await _otherAccount.getAddress(),
            ethers.id(nonce),
            signature
          )
      ).to.be.revertedWithCustomError(_collection, "NotSigner");
    });
  });

  describe("Given new signer is current signer", function () {
    it("Should revert with 'SignerUnchanged' error", async function () {
      const nextTokenId = await _collection.nextTokenId();

      const signerAddress = await _signer.getAddress();

      await mint(_signer, await _owner.getAddress());

      const nonce = generateRandomNonce();
      const signature = await signUpdateAgentSignerRequest(
        _signer,
        _collection,
        {
          tokenId: nextTokenId.toString(),
          newSigner: await _signer.getAddress(),
          nonce,
        }
      );

      await expect(
        _collection
          .connect(_owner)
          .updateAgentSigner(
            nextTokenId,
            await _signer.getAddress(),
            ethers.id(nonce),
            signature
          )
      )
        .to.be.revertedWithCustomError(_collection, "SignerUnchanged")
        .withArgs(signerAddress);
    });
  });

  describe("Given signature is invalid", function () {
    it("Should revert with 'NotSigner' error", async function () {
      const nextTokenId = await _collection.nextTokenId();

      await mint(_signer, await _owner.getAddress());

      const firstNonce = generateRandomNonce();
      const secondNonce = generateRandomNonce();
      const invalidSignature = await signUpdateAgentSignerRequest(
        _signer,
        _collection,
        {
          tokenId: nextTokenId.toString(),
          newSigner: await _otherSigner.getAddress(),
          nonce: firstNonce,
        }
      );

      await expect(
        _collection
          .connect(_owner)
          .updateAgentSigner(
            nextTokenId,
            await _otherSigner.getAddress(),
            ethers.id(secondNonce),
            invalidSignature
          )
      ).to.be.revertedWithCustomError(_collection, "NotSigner");
    });
  });

  describe("Given new signer is a valid signer", function () {
    it("Should update the signer of the token", async function () {
      const nextTokenId = await _collection.nextTokenId();

      await mint(_signer, await _owner.getAddress());

      const nonce = generateRandomNonce();
      const signature = await signUpdateAgentSignerRequest(
        _signer,
        _collection,
        {
          tokenId: nextTokenId.toString(),
          newSigner: await _otherSigner.getAddress(),
          nonce,
        }
      );

      await _collection
        .connect(_owner)
        .updateAgentSigner(
          nextTokenId,
          await _otherSigner.getAddress(),
          ethers.id(nonce),
          signature
        );

      expect(await _collection.signerOf(nextTokenId)).to.equal(
        await _otherSigner.getAddress()
      );
    });

    it("Should emit 'AgentSignerUpdated' event", async function () {
      const nextTokenId = await _collection.nextTokenId();

      await mint(_signer, await _owner.getAddress());

      const nonce = generateRandomNonce();
      const signature = await signUpdateAgentSignerRequest(
        _signer,
        _collection,
        {
          tokenId: nextTokenId.toString(),
          newSigner: await _otherSigner.getAddress(),
          nonce,
        }
      );

      await expect(
        _collection
          .connect(_owner)
          .updateAgentSigner(
            nextTokenId,
            await _otherSigner.getAddress(),
            ethers.id(nonce),
            signature
          )
      )
        .to.emit(_collection, "AgentSignerUpdated")
        .withArgs(
          nextTokenId,
          await _signer.getAddress(),
          await _otherSigner.getAddress()
        );
    });
  });
});
