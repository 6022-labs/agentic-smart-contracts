import { expect } from "chai";
import { ethers } from "hardhat";
import { AgentCollectionV1 } from "../../typechain-types";
import { loadFixture, reset } from "@nomicfoundation/hardhat-network-helpers";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { NullableUint256Struct } from "../../typechain-types/contracts/AgentCollectionV1";
import {
  signMintRequest,
  generateRandomAddress,
  deployCollectionWithCreator,
} from "../common";

describe("WhenCreatingMintingProposal", function () {
  const ipfsGateway = "https://ipfs.io/ipfs/";

  // Common constants to avoid repetition
  const DEFAULT_ROLE = "facilitator";
  const DEFAULT_CLONE_OF: NullableUint256Struct = { isSet: false, value: 0n };
  const DEFAULT_IMAGES = [
    {
      key: "default",
      value: "bafybeibsulc7sgpck3w7ur7eqa6fwaazcsswn3dg3rfl65zka3knajx43i",
    },
  ];
  const DEFAULT_ATTRIBUTES = [{ key: "mission", value: "random mission" }];
  const DEFAULT_NAME = "test-agent";
  const INVALID_NAME = "Invalid_Name";
  const NONCE_1 = "1";
  const NONCE_2 = "2";

  let _collection: AgentCollectionV1;

  let _owner: HardhatEthersSigner;
  let _signer1: HardhatEthersSigner;
  let _signer2: HardhatEthersSigner;
  let _moderator: HardhatEthersSigner;
  let _otherAccount: HardhatEthersSigner;

  async function deployAgentCollection() {
    await reset();

    const [owner, signer1, signer2, moderator, otherAccount] =
      await ethers.getSigners();

    const { collection, collectionsManager } =
      await deployCollectionWithCreator({
        owner,
        moderator,
        ipfsGateway,
      });

    const signerRole = await collectionsManager.SIGNER_ROLE();
    await collectionsManager.grantRole(signerRole, signer1.address);
    await collectionsManager.grantRole(signerRole, signer2.address);

    return { collection, owner, signer1, signer2, moderator, otherAccount };
  }

  beforeEach(async function () {
    const { collection, owner, signer1, signer2, moderator, otherAccount } =
      await loadFixture(deployAgentCollection);

    _owner = owner;
    _signer1 = signer1;
    _signer2 = signer2;
    _moderator = moderator;
    _otherAccount = otherAccount;
    _collection = collection;
  });

  describe("Given no moderators are set", function () {
    it("Should revert with 'NoModerators' error", async function () {
      // Remove all moderators
      const MODERATOR_ROLE = await _collection.MODERATOR_ROLE();

      await _collection
        .connect(_owner)
        .revokeRole(MODERATOR_ROLE, _moderator.address);

      const wallets = [generateRandomAddress()];
      const signature = await signMintRequest(_signer1, _collection, {
        to: _owner.address,
        signer: _signer1.address,
        name: INVALID_NAME,
        role: DEFAULT_ROLE,
        wallets,
        images: DEFAULT_IMAGES,
        attributes: DEFAULT_ATTRIBUTES,
        cloneOf: DEFAULT_CLONE_OF,
        nonce: NONCE_1,
      });

      await expect(
        _collection.createMintProposal(
          _owner.address,
          _signer1.address,
          DEFAULT_ROLE,
          INVALID_NAME,
          wallets,
          DEFAULT_IMAGES,
          DEFAULT_ATTRIBUTES,
          DEFAULT_CLONE_OF,
          ethers.id(NONCE_1),
          signature
        )
      ).to.be.revertedWithCustomError(_collection, "NoModerators");
    });
  });

  describe("Given a signature from signer", function () {
    describe("Given an invalid name", function () {
      it("Should revert with 'InvalidName' error", async function () {
        const wallets = [generateRandomAddress()];
        const signature = await signMintRequest(_signer1, _collection, {
          to: _owner.address,
          signer: _signer1.address,
          name: INVALID_NAME,
          role: DEFAULT_ROLE,
          wallets,
          images: DEFAULT_IMAGES,
          attributes: DEFAULT_ATTRIBUTES,
          cloneOf: DEFAULT_CLONE_OF,
          nonce: NONCE_1,
        });

        await expect(
          _collection.createMintProposal(
            _owner.address,
            _signer1.address,
            DEFAULT_ROLE,
            INVALID_NAME,
            wallets,
            DEFAULT_IMAGES,
            DEFAULT_ATTRIBUTES,
            DEFAULT_CLONE_OF,
            ethers.id(NONCE_1),
            signature
          )
        )
          .to.be.revertedWithCustomError(_collection, "InvalidName")
          .withArgs(INVALID_NAME);
      });
    });

    describe("Given a valid nonce used twice", function () {
      it("Should revert with 'UsedNonce' error on second attempt", async function () {
        const wallets = [generateRandomAddress()];
        const signature = await signMintRequest(_signer1, _collection, {
          to: _owner.address,
          signer: _signer1.address,
          role: DEFAULT_ROLE,
          name: DEFAULT_NAME,
          wallets,
          images: DEFAULT_IMAGES,
          attributes: DEFAULT_ATTRIBUTES,
          cloneOf: DEFAULT_CLONE_OF,
          nonce: NONCE_1,
        });

        await _collection.createMintProposal(
          _owner.address,
          _signer1.address,
          DEFAULT_ROLE,
          DEFAULT_NAME,
          wallets,
          DEFAULT_IMAGES,
          DEFAULT_ATTRIBUTES,
          DEFAULT_CLONE_OF,
          ethers.id(NONCE_1),
          signature
        );

        await expect(
          _collection.createMintProposal(
            _owner.address,
            _signer1.address,
            DEFAULT_ROLE,
            DEFAULT_NAME,
            wallets,
            DEFAULT_IMAGES,
            DEFAULT_ATTRIBUTES,
            DEFAULT_CLONE_OF,
            ethers.id(NONCE_1),
            signature
          )
        )
          .to.be.revertedWithCustomError(_collection, "UsedNonce")
          .withArgs(ethers.id(NONCE_1));
      });
    });

    describe("Given a name already taken", function () {
      it("Should revert with 'UsedName' error", async function () {
        const wallets = [generateRandomAddress()];

        const sig1 = await signMintRequest(_signer1, _collection, {
          to: _owner.address,
          signer: _signer1.address,
          role: DEFAULT_ROLE,
          name: DEFAULT_NAME,
          wallets,
          images: DEFAULT_IMAGES,
          attributes: DEFAULT_ATTRIBUTES,
          cloneOf: DEFAULT_CLONE_OF,
          nonce: NONCE_1,
        });

        await _collection.createMintProposal(
          _owner.address,
          _signer1.address,
          DEFAULT_ROLE,
          DEFAULT_NAME,
          wallets,
          DEFAULT_IMAGES,
          DEFAULT_ATTRIBUTES,
          DEFAULT_CLONE_OF,
          ethers.id(NONCE_1),
          sig1
        );

        let mintProposalsLength = await _collection.mintProposalsLength();

        await _collection
          .connect(_moderator)
          .mintFromProposal(mintProposalsLength - BigInt(1));

        const sig2 = await signMintRequest(_signer1, _collection, {
          to: _owner.address,
          signer: _signer1.address,
          role: DEFAULT_ROLE,
          name: DEFAULT_NAME,
          wallets,
          images: DEFAULT_IMAGES,
          attributes: DEFAULT_ATTRIBUTES,
          cloneOf: DEFAULT_CLONE_OF,
          nonce: NONCE_2,
        });

        await expect(
          _collection.createMintProposal(
            _owner.address,
            _signer1.address,
            DEFAULT_ROLE,
            DEFAULT_NAME,
            wallets,
            DEFAULT_IMAGES,
            DEFAULT_ATTRIBUTES,
            DEFAULT_CLONE_OF,
            ethers.id(NONCE_2),
            sig2
          )
        )
          .to.be.revertedWithCustomError(_collection, "UsedName")
          .withArgs(DEFAULT_NAME);
      });
    });

    describe("Given cloneOf is set but value is 0", function () {
      it("Should revert with 'InvalidCloneOf' error", async function () {
        const wallets = [generateRandomAddress()];
        const invalidCloneOf: NullableUint256Struct = {
          isSet: true,
          value: 0n,
        };
        const signature = await signMintRequest(_signer1, _collection, {
          to: _owner.address,
          role: DEFAULT_ROLE,
          signer: _signer1.address,
          name: DEFAULT_NAME,
          wallets,
          images: DEFAULT_IMAGES,
          attributes: DEFAULT_ATTRIBUTES,
          cloneOf: invalidCloneOf,
          nonce: NONCE_1,
        });

        await expect(
          _collection.createMintProposal(
            _owner.address,
            _signer1.address,
            DEFAULT_ROLE,
            DEFAULT_NAME,
            wallets,
            DEFAULT_IMAGES,
            DEFAULT_ATTRIBUTES,
            invalidCloneOf,
            ethers.id(NONCE_1),
            signature
          )
        )
          .to.be.revertedWithCustomError(_collection, "InvalidCloneOf")
          .withArgs(0n);
      });
    });

    describe("Given cloneOf is set but related token (agent) does not exist", function () {
      it("Should revert with 'InvalidCloneOf' error", async function () {
        const wallets = [generateRandomAddress()];
        const invalidCloneOf: NullableUint256Struct = {
          isSet: true,
          value: 9999n,
        };
        const signature = await signMintRequest(_signer1, _collection, {
          to: _owner.address,
          signer: _signer1.address,
          role: DEFAULT_ROLE,
          name: DEFAULT_NAME,
          wallets,
          images: DEFAULT_IMAGES,
          attributes: DEFAULT_ATTRIBUTES,
          cloneOf: invalidCloneOf,
          nonce: NONCE_1,
        });

        await expect(
          _collection.createMintProposal(
            _owner.address,
            _signer1.address,
            DEFAULT_ROLE,
            DEFAULT_NAME,
            wallets,
            DEFAULT_IMAGES,
            DEFAULT_ATTRIBUTES,
            invalidCloneOf,
            ethers.id(NONCE_1),
            signature
          )
        )
          .to.be.revertedWithCustomError(_collection, "InvalidCloneOf")
          .withArgs(9999n);
      });
    });

    describe("Given a signature that does not match signer parameter", function () {
      it("Should revert with 'InvalidSigner' error", async function () {
        const wallets = [generateRandomAddress()];
        const signature = await signMintRequest(_signer1, _collection, {
          to: _owner.address,
          signer: _signer2.address,
          role: DEFAULT_ROLE,
          name: DEFAULT_NAME,
          wallets,
          images: DEFAULT_IMAGES,
          attributes: DEFAULT_ATTRIBUTES,
          cloneOf: DEFAULT_CLONE_OF,
          nonce: NONCE_1,
        });

        await expect(
          _collection.createMintProposal(
            _owner.address,
            _signer2.address,
            DEFAULT_ROLE,
            DEFAULT_NAME,
            wallets,
            DEFAULT_IMAGES,
            DEFAULT_ATTRIBUTES,
            DEFAULT_CLONE_OF,
            ethers.id(NONCE_1),
            signature
          )
        )
          .to.be.revertedWithCustomError(_collection, "InvalidSigner")
          .withArgs(await _signer1.getAddress(), _signer2.address);
      });
    });

    describe("Given a valid signature", function () {
      describe("With cloneOf set", function () {
        it("Should create the proposal", async function () {
          const wallets = [generateRandomAddress()];

          // First, mint an agent to clone
          const signature1 = await signMintRequest(_signer1, _collection, {
            to: _owner.address,
            signer: _signer1.address,
            role: DEFAULT_ROLE,
            name: DEFAULT_NAME,
            wallets,
            images: DEFAULT_IMAGES,
            attributes: DEFAULT_ATTRIBUTES,
            cloneOf: DEFAULT_CLONE_OF,
            nonce: NONCE_1,
          });

          await _collection.createMintProposal(
            _owner.address,
            _signer1.address,
            DEFAULT_ROLE,
            DEFAULT_NAME,
            wallets,
            DEFAULT_IMAGES,
            DEFAULT_ATTRIBUTES,
            DEFAULT_CLONE_OF,
            ethers.id(NONCE_1),
            signature1
          );

          let mintProposalsLength = await _collection.mintProposalsLength();

          await _collection
            .connect(_moderator)
            .mintFromProposal(mintProposalsLength - BigInt(1));

          const cloneOf: NullableUint256Struct = {
            isSet: true,
            value: (await _collection.nextTokenId()) - BigInt(1),
          };

          const signature2 = await signMintRequest(_signer1, _collection, {
            to: _owner.address,
            signer: _signer1.address,
            role: DEFAULT_ROLE,
            name: "cloned-agent",
            wallets,
            images: DEFAULT_IMAGES,
            attributes: DEFAULT_ATTRIBUTES,
            cloneOf,
            nonce: NONCE_2,
          });

          const mintProposalLengthBefore =
            await _collection.mintProposalsLength();

          await _collection.createMintProposal(
            _owner.address,
            _signer1.address,
            DEFAULT_ROLE,
            "cloned-agent",
            wallets,
            DEFAULT_IMAGES,
            DEFAULT_ATTRIBUTES,
            cloneOf,
            ethers.id(NONCE_2),
            signature2
          );

          const mintProposalLengthAfter =
            await _collection.mintProposalsLength();

          expect(mintProposalLengthAfter).to.be.equal(
            mintProposalLengthBefore + BigInt(1)
          );
        });
      });

      describe("With cloneOf not set", function () {
        it("Should create the proposal", async function () {
          const wallets = [generateRandomAddress()];
          const signature = await signMintRequest(_signer1, _collection, {
            to: _owner.address,
            signer: _signer1.address,
            role: DEFAULT_ROLE,
            name: DEFAULT_NAME,
            wallets,
            images: DEFAULT_IMAGES,
            attributes: DEFAULT_ATTRIBUTES,
            cloneOf: DEFAULT_CLONE_OF,
            nonce: NONCE_1,
          });

          const mintProposalLengthBefore =
            await _collection.mintProposalsLength();

          await _collection.createMintProposal(
            _owner.address,
            _signer1.address,
            DEFAULT_ROLE,
            DEFAULT_NAME,
            wallets,
            DEFAULT_IMAGES,
            DEFAULT_ATTRIBUTES,
            DEFAULT_CLONE_OF,
            ethers.id(NONCE_1),
            signature
          );

          const mintProposalLengthAfter =
            await _collection.mintProposalsLength();

          expect(mintProposalLengthAfter).to.be.equal(
            mintProposalLengthBefore + BigInt(1)
          );
        });
      });

      it("Should emit a MintProposalCreated event", async function () {
        const wallets = [generateRandomAddress()];
        const signature = await signMintRequest(_signer1, _collection, {
          to: _owner.address,
          signer: _signer1.address,
          role: DEFAULT_ROLE,
          name: DEFAULT_NAME,
          wallets,
          images: DEFAULT_IMAGES,
          attributes: DEFAULT_ATTRIBUTES,
          cloneOf: DEFAULT_CLONE_OF,
          nonce: NONCE_1,
        });

        await expect(
          _collection.createMintProposal(
            _owner.address,
            _signer1.address,
            DEFAULT_ROLE,
            DEFAULT_NAME,
            wallets,
            DEFAULT_IMAGES,
            DEFAULT_ATTRIBUTES,
            DEFAULT_CLONE_OF,
            ethers.id(NONCE_1),
            signature
          )
        )
          .to.emit(_collection, "MintProposalCreated")
          .withArgs(_owner.address, _signer1.address, 1n);
      });
    });
  });

  describe("Given a signature from a non-signer", function () {
    it("Should revert with 'NotSigner' error", async function () {
      const wallets = [generateRandomAddress()];

      const signature = await signMintRequest(_otherAccount, _collection, {
        to: _owner.address,
        signer: _otherAccount.address,
        role: DEFAULT_ROLE,
        name: DEFAULT_NAME,
        wallets,
        images: DEFAULT_IMAGES,
        attributes: DEFAULT_ATTRIBUTES,
        cloneOf: DEFAULT_CLONE_OF,
        nonce: NONCE_1,
      });

      await expect(
        _collection.createMintProposal(
          _owner.address,
          _otherAccount.address,
          DEFAULT_ROLE,
          DEFAULT_NAME,
          wallets,
          DEFAULT_IMAGES,
          DEFAULT_ATTRIBUTES,
          DEFAULT_CLONE_OF,
          ethers.id(NONCE_1),
          signature
        )
      ).to.be.revertedWithCustomError(_collection, "NotSigner");
    });
  });
});
