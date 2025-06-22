import { expect } from "chai";
import { ethers } from "hardhat";
import { AgenticAIAgentCollection } from "../../typechain-types";
import { loadFixture, reset } from "@nomicfoundation/hardhat-network-helpers";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import {
  signMintRequest,
  generateRandomNonce,
  generateRandomAddress,
  deployCollectionWithCreator,
  signUpdateAgentSignerRequest,
} from "../common";

describe("WhenUpdatingAgentSigner", function () {
  const ipfsGateway = "https://ipfs.io/ipfs/";

  let _agenticAIAgentCollection: AgenticAIAgentCollection;

  let _owner: HardhatEthersSigner;
  let _otherAccount: HardhatEthersSigner;

  let _signer: HardhatEthersSigner;
  let _otherSigner: HardhatEthersSigner;

  async function deployAgenticAIAgentCollection() {
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
      agenticAIAgentCollection: collection,
      owner,
      otherAccount,
      signer,
      otherSigner,
    };
  }

  beforeEach(async function () {
    const {
      agenticAIAgentCollection,
      owner,
      otherAccount,
      signer,
      otherSigner,
    } = await loadFixture(deployAgenticAIAgentCollection);

    _owner = owner;
    _signer = signer;
    _otherSigner = otherSigner;
    _otherAccount = otherAccount;
    _agenticAIAgentCollection = agenticAIAgentCollection;
  });

  async function mintWithSignature(signer: HardhatEthersSigner, to: string) {
    const name = "test-agent";
    const images = [
      {
        key: "default",
        value: "bafybeibsulc7sgpck3w7ur7eqa6fwaazcsswn3dg3rfl65zka3knajx43i",
      },
    ];
    const role = "facilitator";
    const mission = "";

    const nonce = generateRandomNonce();
    const agentAddresses = [generateRandomAddress()];

    const signature = await signMintRequest(signer, _agenticAIAgentCollection, {
      to,
      agentAddresses,
      signer: signer.address,
      role,
      name,
      images,
      mission,
      nonce,
    });

    await _agenticAIAgentCollection.createMintProposal(
      to,
      agentAddresses,
      signer.address,
      role,
      name,
      mission,
      images,
      ethers.id(nonce),
      signature
    );

    const mintProposalsLength =
      await _agenticAIAgentCollection.mintProposalsLength();

    await _agenticAIAgentCollection
      .connect(_owner)
      .mintFromProposal(mintProposalsLength - BigInt(1));
  }

  describe("Given nonce has already been used", function () {
    it("Should revert with 'UsedNonce' error", async function () {
      const nextTokenId = await _agenticAIAgentCollection.nextTokenId();

      await mintWithSignature(_signer, await _owner.getAddress());

      const nonce = generateRandomNonce();
      const signature = await signUpdateAgentSignerRequest(
        _signer,
        _agenticAIAgentCollection,
        {
          tokenId: nextTokenId.toString(),
          newSigner: await _otherSigner.getAddress(),
          nonce,
        }
      );

      await _agenticAIAgentCollection
        .connect(_owner)
        .updateAgentSigner(
          nextTokenId,
          await _otherSigner.getAddress(),
          ethers.id(nonce),
          signature
        );

      await expect(
        _agenticAIAgentCollection
          .connect(_owner)
          .updateAgentSigner(
            nextTokenId,
            await _otherAccount.getAddress(),
            ethers.id(nonce),
            signature
          )
      )
        .to.be.revertedWithCustomError(_agenticAIAgentCollection, "UsedNonce")
        .withArgs(ethers.id(nonce));
    });
  });

  describe("Given sender is not the owner of the token", function () {
    it("Should revert with 'OwnableUnauthorizedAccount' error", async function () {
      const nextTokenId = await _agenticAIAgentCollection.nextTokenId();

      await mintWithSignature(_signer, await _owner.getAddress());

      const nonce = generateRandomNonce();
      const signature = await signUpdateAgentSignerRequest(
        _signer,
        _agenticAIAgentCollection,
        {
          tokenId: nextTokenId.toString(),
          newSigner: await _otherAccount.getAddress(),
          nonce,
        }
      );

      await expect(
        _agenticAIAgentCollection
          .connect(_otherAccount)
          .updateAgentSigner(
            nextTokenId,
            await _otherAccount.getAddress(),
            ethers.id(nonce),
            signature
          )
      )
        .to.be.revertedWithCustomError(
          _agenticAIAgentCollection,
          "OwnableUnauthorizedAccount"
        )
        .withArgs(await _otherAccount.getAddress(), nextTokenId);
    });
  });

  describe("Given new signer is not a valid signer", function () {
    it("Should revert with 'NotSigner' error", async function () {
      const nextTokenId = await _agenticAIAgentCollection.nextTokenId();

      await mintWithSignature(_signer, await _owner.getAddress());

      const nonce = generateRandomNonce();
      const signature = await signUpdateAgentSignerRequest(
        _signer,
        _agenticAIAgentCollection,
        {
          tokenId: nextTokenId.toString(),
          newSigner: await _otherAccount.getAddress(),
          nonce,
        }
      );

      await expect(
        _agenticAIAgentCollection
          .connect(_owner)
          .updateAgentSigner(
            nextTokenId,
            await _otherAccount.getAddress(),
            ethers.id(nonce),
            signature
          )
      ).to.be.revertedWithCustomError(_agenticAIAgentCollection, "NotSigner");
    });
  });

  describe("Given new signer is current signer", function () {
    it("Should revert with 'SignerUnchanged' error", async function () {
      const nextTokenId = await _agenticAIAgentCollection.nextTokenId();

      const signerAddress = await _signer.getAddress();

      await mintWithSignature(_signer, await _owner.getAddress());

      const nonce = generateRandomNonce();
      const signature = await signUpdateAgentSignerRequest(
        _signer,
        _agenticAIAgentCollection,
        {
          tokenId: nextTokenId.toString(),
          newSigner: await _signer.getAddress(),
          nonce,
        }
      );

      await expect(
        _agenticAIAgentCollection
          .connect(_owner)
          .updateAgentSigner(
            nextTokenId,
            await _signer.getAddress(),
            ethers.id(nonce),
            signature
          )
      )
        .to.be.revertedWithCustomError(
          _agenticAIAgentCollection,
          "SignerUnchanged"
        )
        .withArgs(signerAddress);
    });
  });

  describe("Given signature is invalid", function () {
    it("Should revert with 'NotSigner' error", async function () {
      const nextTokenId = await _agenticAIAgentCollection.nextTokenId();

      await mintWithSignature(_signer, await _owner.getAddress());

      const firstNonce = generateRandomNonce();
      const secondNonce = generateRandomNonce();
      const invalidSignature = await signUpdateAgentSignerRequest(
        _signer,
        _agenticAIAgentCollection,
        {
          tokenId: nextTokenId.toString(),
          newSigner: await _otherSigner.getAddress(),
          nonce: firstNonce,
        }
      );

      await expect(
        _agenticAIAgentCollection
          .connect(_owner)
          .updateAgentSigner(
            nextTokenId,
            await _otherSigner.getAddress(),
            ethers.id(secondNonce),
            invalidSignature
          )
      ).to.be.revertedWithCustomError(_agenticAIAgentCollection, "NotSigner");
    });
  });

  describe("Given new signer is a valid signer", function () {
    it("Should update the signer of the token", async function () {
      const nextTokenId = await _agenticAIAgentCollection.nextTokenId();

      await mintWithSignature(_signer, await _owner.getAddress());

      const nonce = generateRandomNonce();
      const signature = await signUpdateAgentSignerRequest(
        _signer,
        _agenticAIAgentCollection,
        {
          tokenId: nextTokenId.toString(),
          newSigner: await _otherSigner.getAddress(),
          nonce,
        }
      );

      await _agenticAIAgentCollection
        .connect(_owner)
        .updateAgentSigner(
          nextTokenId,
          await _otherSigner.getAddress(),
          ethers.id(nonce),
          signature
        );

      expect(await _agenticAIAgentCollection.signerOf(nextTokenId)).to.equal(
        await _otherSigner.getAddress()
      );
    });

    it("Should emit 'AgentSignerUpdated' event", async function () {
      const nextTokenId = await _agenticAIAgentCollection.nextTokenId();

      await mintWithSignature(_signer, await _owner.getAddress());

      const nonce = generateRandomNonce();
      const signature = await signUpdateAgentSignerRequest(
        _signer,
        _agenticAIAgentCollection,
        {
          tokenId: nextTokenId.toString(),
          newSigner: await _otherSigner.getAddress(),
          nonce,
        }
      );

      await expect(
        _agenticAIAgentCollection
          .connect(_owner)
          .updateAgentSigner(
            nextTokenId,
            await _otherSigner.getAddress(),
            ethers.id(nonce),
            signature
          )
      )
        .to.emit(_agenticAIAgentCollection, "AgentSignerUpdated")
        .withArgs(
          nextTokenId,
          await _signer.getAddress(),
          await _otherSigner.getAddress()
        );
    });
  });
});
