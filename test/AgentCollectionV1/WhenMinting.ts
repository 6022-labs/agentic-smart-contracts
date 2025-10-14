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

describe("WhenMinting", function () {
  const ipfsGateway = "https://ipfs.io/ipfs/";

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
  let _otherAccount: HardhatEthersSigner;

  async function deployCollection() {
    await reset();

    const [owner, signer1, signer2, otherAccount] = await ethers.getSigners();

    const { collection, collectionsManager } =
      await deployCollectionWithCreator({
        owner,
        moderator: owner,
        ipfsGateway,
      });

    const signerRole = await collectionsManager.SIGNER_ROLE();
    await collectionsManager.grantRole(signerRole, signer1.address);
    await collectionsManager.grantRole(signerRole, signer2.address);

    return { collection, owner, signer1, signer2, otherAccount };
  }

  beforeEach(async function () {
    const { collection, owner, signer1, signer2, otherAccount } =
      await loadFixture(deployCollection);

    _owner = owner;
    _signer1 = signer1;
    _signer2 = signer2;
    _collection = collection;
    _otherAccount = otherAccount;
  });

  async function revokeModerator() {
    return await _collection
      .connect(_owner)
      .revokeRole(await _collection.MODERATOR_ROLE(), _owner.address);
  }

  describe("Given a moderator exists", function () {
    describe("And caller is not a moderator", function () {
      it("Should revert with 'NotModerator' error", async function () {
        const wallets = [generateRandomAddress()];
        const signature = await signMintRequest(_signer1, _collection, {
          to: _otherAccount.address,
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
          _collection
            .connect(_otherAccount)
            .mint(
              _otherAccount.address,
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
        ).to.be.revertedWithCustomError(_collection, "NotModerator");
      });
    });

    describe("And caller is a moderator", function () {
      describe("With cloneOf set", function () {
        it("Should allow a moderator to mint directly", async function () {
          const wallets1 = [generateRandomAddress()];
          const signature1 = await signMintRequest(_signer1, _collection, {
            to: _otherAccount.address,
            signer: _signer1.address,
            role: DEFAULT_ROLE,
            name: DEFAULT_NAME,
            wallets: wallets1,
            images: DEFAULT_IMAGES,
            attributes: DEFAULT_ATTRIBUTES,
            cloneOf: DEFAULT_CLONE_OF,
            nonce: NONCE_1,
          });

          let nextTokenId = await _collection.nextTokenId();

          await _collection.mint(
            _otherAccount.address,
            _signer1.address,
            DEFAULT_ROLE,
            DEFAULT_NAME,
            wallets1,
            DEFAULT_IMAGES,
            DEFAULT_ATTRIBUTES,
            DEFAULT_CLONE_OF,
            ethers.id(NONCE_1),
            signature1
          );

          const cloneOf: NullableUint256Struct = {
            isSet: true,
            value: nextTokenId,
          };

          const wallets2 = [generateRandomAddress()];
          const signature2 = await signMintRequest(_signer1, _collection, {
            to: _otherAccount.address,
            signer: _signer1.address,
            role: DEFAULT_ROLE,
            name: "cloned-agent",
            wallets: wallets2,
            images: DEFAULT_IMAGES,
            attributes: DEFAULT_ATTRIBUTES,
            cloneOf: cloneOf,
            nonce: NONCE_2,
          });

          nextTokenId = await _collection.nextTokenId();

          await _collection.mint(
            _otherAccount.address,
            _signer1.address,
            DEFAULT_ROLE,
            "cloned-agent",
            wallets2,
            DEFAULT_IMAGES,
            DEFAULT_ATTRIBUTES,
            cloneOf,
            ethers.id(NONCE_2),
            signature2
          );

          expect(await _collection.ownerOf(nextTokenId)).to.equal(
            _otherAccount.address
          );
        });
      });

      describe("With cloneOf not set", function () {
        it("Should allow a moderator to mint directly", async function () {
          const wallets = [generateRandomAddress()];
          const signature = await signMintRequest(_signer1, _collection, {
            to: _otherAccount.address,
            signer: _signer1.address,
            role: DEFAULT_ROLE,
            name: DEFAULT_NAME,
            wallets,
            images: DEFAULT_IMAGES,
            attributes: DEFAULT_ATTRIBUTES,
            cloneOf: DEFAULT_CLONE_OF,
            nonce: NONCE_1,
          });

          const nextTokenId = await _collection.nextTokenId();

          await _collection.mint(
            _otherAccount.address,
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

          expect(await _collection.ownerOf(nextTokenId)).to.equal(
            _otherAccount.address
          );
        });
      });
    });
  });

  describe("Given no moderators are set", function () {
    beforeEach(async function () {
      await revokeModerator();
    });

    describe("When name is invalid ens", function () {
      it("Should revert with 'InvalidName'", async function () {
        const wallets = [generateRandomAddress()];
        const signature = await signMintRequest(_signer1, _collection, {
          to: _otherAccount.address,
          signer: _signer1.address,
          role: DEFAULT_ROLE,
          name: INVALID_NAME,
          wallets,
          images: DEFAULT_IMAGES,
          attributes: DEFAULT_ATTRIBUTES,
          cloneOf: DEFAULT_CLONE_OF,
          nonce: NONCE_1,
        });

        await expect(
          _collection.mint(
            _otherAccount.address,
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

    describe("Given nonce is already used", function () {
      it("Should revert with 'UsedNonce'", async function () {
        const wallets = [generateRandomAddress()];
        const sig1 = await signMintRequest(_signer1, _collection, {
          to: _otherAccount.address,
          signer: _signer1.address,
          role: DEFAULT_ROLE,
          name: DEFAULT_NAME,
          wallets,
          images: DEFAULT_IMAGES,
          attributes: DEFAULT_ATTRIBUTES,
          cloneOf: DEFAULT_CLONE_OF,
          nonce: NONCE_1,
        });

        await _collection.mint(
          _otherAccount.address,
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

        const sig2 = await signMintRequest(_signer1, _collection, {
          to: _otherAccount.address,
          signer: _signer1.address,
          role: DEFAULT_ROLE,
          name: DEFAULT_NAME + "2",
          wallets,
          images: DEFAULT_IMAGES,
          attributes: DEFAULT_ATTRIBUTES,
          cloneOf: DEFAULT_CLONE_OF,
          nonce: NONCE_1,
        });

        await expect(
          _collection.mint(
            _otherAccount.address,
            _signer1.address,
            DEFAULT_ROLE,
            DEFAULT_NAME + "2",
            wallets,
            DEFAULT_IMAGES,
            DEFAULT_ATTRIBUTES,
            DEFAULT_CLONE_OF,
            ethers.id(NONCE_1),
            sig2
          )
        )
          .to.be.revertedWithCustomError(_collection, "UsedNonce")
          .withArgs(ethers.id(NONCE_1));
      });
    });

    describe("Given name is already taken", function () {
      it("Should revert with 'UsedName'", async function () {
        const wallets = [generateRandomAddress()];
        const sig1 = await signMintRequest(_signer1, _collection, {
          to: _otherAccount.address,
          signer: _signer1.address,
          role: DEFAULT_ROLE,
          name: DEFAULT_NAME,
          wallets,
          images: DEFAULT_IMAGES,
          attributes: DEFAULT_ATTRIBUTES,
          cloneOf: DEFAULT_CLONE_OF,
          nonce: NONCE_1,
        });

        const tokenId = await _collection.nextTokenId();

        await _collection.mint(
          _otherAccount.address,
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

        const sig2 = await signMintRequest(_signer1, _collection, {
          to: _otherAccount.address,
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
          _collection.mint(
            _otherAccount.address,
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
          .withArgs(DEFAULT_NAME, tokenId);
      });
    });

    describe("Given wallet is already taken", function () {
      it("Should revert with 'UsedWallet'", async function () {
        const wallets = [generateRandomAddress()];

        const name1 = DEFAULT_NAME + "-1";
        const name2 = DEFAULT_NAME + "-2";

        const sig1 = await signMintRequest(_signer1, _collection, {
          to: _otherAccount.address,
          signer: _signer1.address,
          role: DEFAULT_ROLE,
          name: name1,
          wallets,
          images: DEFAULT_IMAGES,
          attributes: DEFAULT_ATTRIBUTES,
          cloneOf: DEFAULT_CLONE_OF,
          nonce: NONCE_1,
        });

        const tokenId = await _collection.nextTokenId();

        await _collection.mint(
          _otherAccount.address,
          _signer1.address,
          DEFAULT_ROLE,
          name1,
          wallets,
          DEFAULT_IMAGES,
          DEFAULT_ATTRIBUTES,
          DEFAULT_CLONE_OF,
          ethers.id(NONCE_1),
          sig1
        );

        const sig2 = await signMintRequest(_signer1, _collection, {
          to: _otherAccount.address,
          signer: _signer1.address,
          role: DEFAULT_ROLE,
          name: name2,
          wallets,
          images: DEFAULT_IMAGES,
          attributes: DEFAULT_ATTRIBUTES,
          cloneOf: DEFAULT_CLONE_OF,
          nonce: NONCE_2,
        });

        await expect(
          _collection.mint(
            _otherAccount.address,
            _signer1.address,
            DEFAULT_ROLE,
            name2,
            wallets,
            DEFAULT_IMAGES,
            DEFAULT_ATTRIBUTES,
            DEFAULT_CLONE_OF,
            ethers.id(NONCE_2),
            sig2
          )
        )
          .to.be.revertedWithCustomError(_collection, "UsedWallet")
          .withArgs(wallets[0], tokenId);
      });
    });

    describe("Given cloneOf is set but value is 0", function () {
      it("Should revert with 'InvalidCloneOf'", async function () {
        const wallets = [generateRandomAddress()];
        const signature = await signMintRequest(_signer1, _collection, {
          to: _otherAccount.address,
          signer: _signer1.address,
          role: DEFAULT_ROLE,
          name: DEFAULT_NAME,
          wallets,
          images: DEFAULT_IMAGES,
          attributes: DEFAULT_ATTRIBUTES,
          cloneOf: { isSet: true, value: 0n },
          nonce: NONCE_1,
        });

        await expect(
          _collection.mint(
            _otherAccount.address,
            _signer1.address,
            DEFAULT_ROLE,
            DEFAULT_NAME,
            wallets,
            DEFAULT_IMAGES,
            DEFAULT_ATTRIBUTES,
            { isSet: true, value: 0n },
            ethers.id(NONCE_1),
            signature
          )
        )
          .to.be.revertedWithCustomError(_collection, "InvalidCloneOf")
          .withArgs(0);
      });
    });

    describe("Given cloneOf is set but related token (agent) does not exist", function () {
      it("Should revert with 'InvalidCloneOf'", async function () {
        const wallets = [generateRandomAddress()];
        const signature = await signMintRequest(_signer1, _collection, {
          to: _otherAccount.address,
          signer: _signer1.address,
          role: DEFAULT_ROLE,
          name: DEFAULT_NAME,
          wallets,
          images: DEFAULT_IMAGES,
          attributes: DEFAULT_ATTRIBUTES,
          cloneOf: { isSet: true, value: 9999n },
          nonce: NONCE_1,
        });

        await expect(
          _collection.mint(
            _otherAccount.address,
            _signer1.address,
            DEFAULT_ROLE,
            DEFAULT_NAME,
            wallets,
            DEFAULT_IMAGES,
            DEFAULT_ATTRIBUTES,
            { isSet: true, value: 9999n },
            ethers.id(NONCE_1),
            signature
          )
        )
          .to.be.revertedWithCustomError(_collection, "InvalidCloneOf")
          .withArgs(9999);
      });
    });

    describe("Given recovered signer is not the signer in parameters", function () {
      it("Should revert with 'InvalidSigner'", async function () {
        const wallets = [generateRandomAddress()];
        const signature = await signMintRequest(_signer1, _collection, {
          to: _otherAccount.address,
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
          _collection.mint(
            _otherAccount.address,
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

    describe("Given recovered signer is not signer", function () {
      it("Should revert with 'NotSigner'", async function () {
        const wallets = [generateRandomAddress()];
        const signature = await signMintRequest(_otherAccount, _collection, {
          to: _otherAccount.address,
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
          _collection.mint(
            _otherAccount.address,
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

    describe("Given valid mint parameters", function () {
      describe("With cloneOf set", function () {
        it("Should mint the NFT with the expected token ID", async function () {
          const wallets1 = [generateRandomAddress()];
          const signature1 = await signMintRequest(_signer1, _collection, {
            to: _otherAccount.address,
            signer: _signer1.address,
            role: DEFAULT_ROLE,
            name: DEFAULT_NAME,
            wallets: wallets1,
            images: DEFAULT_IMAGES,
            attributes: DEFAULT_ATTRIBUTES,
            cloneOf: DEFAULT_CLONE_OF,
            nonce: NONCE_1,
          });

          let nextTokenId = await _collection.nextTokenId();

          await expect(_collection.ownerOf(nextTokenId)).to.be.reverted;

          await _collection.mint(
            _otherAccount.address,
            _signer1.address,
            DEFAULT_ROLE,
            DEFAULT_NAME,
            wallets1,
            DEFAULT_IMAGES,
            DEFAULT_ATTRIBUTES,
            DEFAULT_CLONE_OF,
            ethers.id(NONCE_1),
            signature1
          );

          const cloneOf: NullableUint256Struct = {
            isSet: true,
            value: nextTokenId,
          };

          const wallets2 = [generateRandomAddress()];

          const signature2 = await signMintRequest(_signer1, _collection, {
            to: _otherAccount.address,
            signer: _signer1.address,
            role: DEFAULT_ROLE,
            name: "cloned-agent",
            wallets: wallets2,
            images: DEFAULT_IMAGES,
            attributes: DEFAULT_ATTRIBUTES,
            cloneOf,
            nonce: NONCE_2,
          });

          nextTokenId = await _collection.nextTokenId();

          await _collection.mint(
            _otherAccount.address,
            _signer1.address,
            DEFAULT_ROLE,
            "cloned-agent",
            wallets2,
            DEFAULT_IMAGES,
            DEFAULT_ATTRIBUTES,
            cloneOf,
            ethers.id(NONCE_2),
            signature2
          );

          expect(await _collection.ownerOf(nextTokenId)).to.equal(
            _otherAccount.address
          );
        });
      });

      describe("With cloneOf not set", function () {
        it("Should mint the NFT with the expected token ID", async function () {
          const wallets = [generateRandomAddress()];
          const signature = await signMintRequest(_signer1, _collection, {
            to: _otherAccount.address,
            signer: _signer1.address,
            role: DEFAULT_ROLE,
            name: DEFAULT_NAME,
            wallets,
            images: DEFAULT_IMAGES,
            attributes: DEFAULT_ATTRIBUTES,
            cloneOf: DEFAULT_CLONE_OF,
            nonce: NONCE_1,
          });

          const nextTokenId = await _collection.nextTokenId();

          await expect(_collection.ownerOf(nextTokenId)).to.be.reverted;

          await _collection.mint(
            _otherAccount.address,
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

          expect(await _collection.ownerOf(nextTokenId)).to.equal(
            _otherAccount.address
          );
        });
      });

      it("Should assign the owner of the token", async function () {
        const wallets = [generateRandomAddress()];
        const signature = await signMintRequest(_signer1, _collection, {
          to: _otherAccount.address,
          signer: _signer1.address,
          role: DEFAULT_ROLE,
          name: DEFAULT_NAME,
          wallets,
          images: DEFAULT_IMAGES,
          attributes: DEFAULT_ATTRIBUTES,
          cloneOf: DEFAULT_CLONE_OF,
          nonce: NONCE_1,
        });

        const nextTokenId = await _collection.nextTokenId();

        await _collection.mint(
          _otherAccount.address,
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

        expect(await _collection.ownerOf(nextTokenId)).to.equal(
          _otherAccount.address
        );
      });

      it("Should increment next token ID", async function () {
        const wallets = [generateRandomAddress()];
        const signature = await signMintRequest(_signer1, _collection, {
          to: _otherAccount.address,
          signer: _signer1.address,
          role: DEFAULT_ROLE,
          name: DEFAULT_NAME,
          wallets,
          images: DEFAULT_IMAGES,
          attributes: DEFAULT_ATTRIBUTES,
          cloneOf: DEFAULT_CLONE_OF,
          nonce: NONCE_1,
        });

        const nextTokenIdBefore = await _collection.nextTokenId();

        await _collection.mint(
          _otherAccount.address,
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

        const nextTokenIdAfter = await _collection.nextTokenId();
        expect(nextTokenIdAfter).to.equal(nextTokenIdBefore + BigInt(1));
      });

      it("Should mark the nonce as used", async function () {
        const wallets = [generateRandomAddress()];
        const signature = await signMintRequest(_signer1, _collection, {
          to: _otherAccount.address,
          signer: _signer1.address,
          role: DEFAULT_ROLE,
          name: DEFAULT_NAME,
          wallets,
          images: DEFAULT_IMAGES,
          attributes: DEFAULT_ATTRIBUTES,
          cloneOf: DEFAULT_CLONE_OF,
          nonce: NONCE_1,
        });

        expect(await _collection.isNonceUsed(ethers.id(NONCE_1))).to.be.false;

        await _collection.mint(
          _otherAccount.address,
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

        expect(await _collection.isNonceUsed(ethers.id(NONCE_1))).to.be.true;
      });

      it("Should assign signer of the token", async function () {
        const wallets = [generateRandomAddress()];
        const signature = await signMintRequest(_signer1, _collection, {
          to: _otherAccount.address,
          signer: _signer1.address,
          role: DEFAULT_ROLE,
          name: DEFAULT_NAME,
          wallets,
          images: DEFAULT_IMAGES,
          attributes: DEFAULT_ATTRIBUTES,
          cloneOf: DEFAULT_CLONE_OF,
          nonce: NONCE_1,
        });

        const nextTokenId = await _collection.nextTokenId();

        await _collection.mint(
          _otherAccount.address,
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

        expect(await _collection.signerOf(nextTokenId)).to.equal(
          _signer1.address
        );
      });

      it("Should assign agent addresses to the token", async function () {
        const wallets = [generateRandomAddress()];
        const signature = await signMintRequest(_signer1, _collection, {
          to: _otherAccount.address,
          signer: _signer1.address,
          role: DEFAULT_ROLE,
          name: DEFAULT_NAME,
          wallets,
          images: DEFAULT_IMAGES,
          attributes: DEFAULT_ATTRIBUTES,
          cloneOf: DEFAULT_CLONE_OF,
          nonce: NONCE_1,
        });

        const nextTokenId = await _collection.nextTokenId();

        await _collection.mint(
          _otherAccount.address,
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

        const walletCount = await _collection.walletsCountOf(nextTokenId);
        expect(walletCount).to.equal(wallets.length);

        for (let i = 0; i < walletCount; i++) {
          const walletsOf = await _collection.walletOfByIndex(nextTokenId, i);
          expect(wallets).to.include(walletsOf);
        }
      });

      it("Should assign name to the token", async function () {
        const wallets = [generateRandomAddress()];
        const signature = await signMintRequest(_signer1, _collection, {
          to: _otherAccount.address,
          signer: _signer1.address,
          role: DEFAULT_ROLE,
          name: DEFAULT_NAME,
          wallets,
          images: DEFAULT_IMAGES,
          attributes: DEFAULT_ATTRIBUTES,
          cloneOf: DEFAULT_CLONE_OF,
          nonce: NONCE_1,
        });

        const nextTokenId = await _collection.nextTokenId();

        await _collection.mint(
          _otherAccount.address,
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

        expect(await _collection.nameOf(nextTokenId)).to.equal(DEFAULT_NAME);
      });

      it("Should assign images to the token", async function () {
        const wallets = [generateRandomAddress()];
        const signature = await signMintRequest(_signer1, _collection, {
          to: _otherAccount.address,
          signer: _signer1.address,
          role: DEFAULT_ROLE,
          name: DEFAULT_NAME,
          wallets,
          images: DEFAULT_IMAGES,
          attributes: DEFAULT_ATTRIBUTES,
          cloneOf: DEFAULT_CLONE_OF,
          nonce: NONCE_1,
        });

        const nextTokenId = await _collection.nextTokenId();

        await _collection.mint(
          _otherAccount.address,
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

        const imageCount = await _collection.imagesCountOf(nextTokenId);
        expect(imageCount).to.equal(DEFAULT_IMAGES.length);

        for (
          let imagesOfIndex = 0;
          imagesOfIndex < imageCount;
          imagesOfIndex++
        ) {
          const imagesOf = await _collection.imageOfByIndex(
            nextTokenId,
            imagesOfIndex
          );

          expect(imagesOf[0]).to.be.equal(DEFAULT_IMAGES[imagesOfIndex].key);
          expect(imagesOf[1]).to.be.equal(DEFAULT_IMAGES[imagesOfIndex].value);
        }
      });

      it("Should assign creator to the token", async function () {
        const wallets = [generateRandomAddress()];
        const signature = await signMintRequest(_signer1, _collection, {
          to: _otherAccount.address,
          signer: _signer1.address,
          role: DEFAULT_ROLE,
          name: DEFAULT_NAME,
          wallets,
          images: DEFAULT_IMAGES,
          attributes: DEFAULT_ATTRIBUTES,
          cloneOf: DEFAULT_CLONE_OF,
          nonce: NONCE_1,
        });

        const nextTokenId = await _collection.nextTokenId();

        await _collection.mint(
          _otherAccount.address,
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

        expect(await _collection.creatorOf(nextTokenId)).to.equal(
          _owner.address
        );
      });

      it("Should assign role to the token", async function () {
        const wallets = [generateRandomAddress()];
        const signature = await signMintRequest(_signer1, _collection, {
          to: _otherAccount.address,
          signer: _signer1.address,
          role: DEFAULT_ROLE,
          name: DEFAULT_NAME,
          wallets,
          images: DEFAULT_IMAGES,
          attributes: DEFAULT_ATTRIBUTES,
          cloneOf: DEFAULT_CLONE_OF,
          nonce: NONCE_1,
        });

        const nextTokenId = await _collection.nextTokenId();

        await _collection.mint(
          _otherAccount.address,
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

        expect(await _collection.roleOf(nextTokenId)).to.equal(DEFAULT_ROLE);
      });

      it("Should assign token id to name", async function () {
        const wallets = [generateRandomAddress()];
        const signature = await signMintRequest(_signer1, _collection, {
          to: _otherAccount.address,
          signer: _signer1.address,
          role: DEFAULT_ROLE,
          name: DEFAULT_NAME,
          wallets,
          images: DEFAULT_IMAGES,
          attributes: DEFAULT_ATTRIBUTES,
          cloneOf: DEFAULT_CLONE_OF,
          nonce: NONCE_1,
        });

        const nextTokenId = await _collection.nextTokenId();

        await _collection.mint(
          _otherAccount.address,
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

        expect(await _collection.nameToTokenId(DEFAULT_NAME)).to.be.equal(
          nextTokenId
        );
      });

      it("Should assign token id to wallet", async function () {
        const wallets = [generateRandomAddress()];
        const signature = await signMintRequest(_signer1, _collection, {
          to: _otherAccount.address,
          signer: _signer1.address,
          role: DEFAULT_ROLE,
          name: DEFAULT_NAME,
          wallets,
          images: DEFAULT_IMAGES,
          attributes: DEFAULT_ATTRIBUTES,
          cloneOf: DEFAULT_CLONE_OF,
          nonce: NONCE_1,
        });

        const nextTokenId = await _collection.nextTokenId();

        await _collection.mint(
          _otherAccount.address,
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

        expect(await _collection.walletToTokenId(wallets[0])).to.be.equal(
          nextTokenId
        );
      });

      it("Should emit 'Minted' event", async function () {
        const wallets = [generateRandomAddress()];
        const signature = await signMintRequest(_signer1, _collection, {
          to: _otherAccount.address,
          signer: _signer1.address,
          role: DEFAULT_ROLE,
          name: DEFAULT_NAME,
          wallets,
          images: DEFAULT_IMAGES,
          attributes: DEFAULT_ATTRIBUTES,
          cloneOf: DEFAULT_CLONE_OF,
          nonce: NONCE_1,
        });

        const nextTokenId = await _collection.nextTokenId();

        await expect(
          _collection.mint(
            _otherAccount.address,
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
          .to.emit(_collection, "Minted")
          .withArgs(_otherAccount.address, _signer1.address, nextTokenId);
      });

      it("Should emit 'AgentSignerUpdated' event", async function () {
        const wallets = [generateRandomAddress()];
        const signature = await signMintRequest(_signer1, _collection, {
          to: _otherAccount.address,
          signer: _signer1.address,
          role: DEFAULT_ROLE,
          name: DEFAULT_NAME,
          wallets,
          images: DEFAULT_IMAGES,
          attributes: DEFAULT_ATTRIBUTES,
          cloneOf: DEFAULT_CLONE_OF,
          nonce: NONCE_1,
        });

        const nextTokenId = await _collection.nextTokenId();

        await expect(
          _collection.mint(
            _otherAccount.address,
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
          .to.emit(_collection, "AgentSignerUpdated")
          .withArgs(nextTokenId, ethers.ZeroAddress, _signer1.address);
      });
    });
  });
});
