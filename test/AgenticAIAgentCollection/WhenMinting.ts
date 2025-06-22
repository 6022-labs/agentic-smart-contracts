import { expect } from "chai";
import { ethers } from "hardhat";
import { AgenticAIAgentCollection } from "../../typechain-types";
import { loadFixture, reset } from "@nomicfoundation/hardhat-network-helpers";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { generateRandomAddress, signMintRequest } from "../common";

describe("WhenMinting", function () {
  const ipfsGateway = "https://ipfs.io/ipfs/";

  const DEFAULT_ROLE = "facilitator";
  const DEFAULT_MISSION = "";
  const DEFAULT_IMAGES = [
    {
      key: "default",
      value: "bafybeibsulc7sgpck3w7ur7eqa6fwaazcsswn3dg3rfl65zka3knajx43i",
    },
  ];
  const DEFAULT_NAME = "test-agent";
  const INVALID_NAME = "Invalid_Name";
  const NONCE_1 = "1";
  const NONCE_2 = "2";

  let _agenticAIAgentCollection: AgenticAIAgentCollection;
  let _owner: HardhatEthersSigner;
  let _signer1: HardhatEthersSigner;
  let _signer2: HardhatEthersSigner;
  let _otherAccount: HardhatEthersSigner;

  async function deployCollection() {
    await reset();

    const [owner, signer1, signer2, otherAccount] = await ethers.getSigners();

    const CollectionsManager = await ethers.getContractFactory(
      "AgenticAIAgentCollectionsManager"
    );
    const collectionsManager = await CollectionsManager.deploy();

    const CollectionsDescriptor = await ethers.getContractFactory(
      "AgenticAIAgentCollectionsDescriptor"
    );
    const collectionsDescriptor = await CollectionsDescriptor.deploy(
      ipfsGateway
    );

    const Collection = await ethers.getContractFactory(
      "AgenticAIAgentCollection"
    );
    const collectionImplementation = await Collection.deploy();

    const TestErc20 = await ethers.getContractFactory("TestERC20");
    const testErc20 = await TestErc20.deploy();

    const CollectionCreator = await ethers.getContractFactory(
      "AgenticAIAgentCollectionCreator"
    );
    const collectionCreator = await CollectionCreator.deploy(
      await collectionsManager.getAddress(),
      await collectionsDescriptor.getAddress(),
      await collectionImplementation.getAddress()
    );

    await collectionCreator.addAuthorizedTokenForCreation(
      await testErc20.getAddress(),
      0n // No minimum balance required
    );
    await collectionsManager.grantRole(
      await collectionsManager.CREATOR_ROLE(),
      await collectionCreator.getAddress()
    );

    await collectionCreator.createCollection(
      "AgenticAI",
      "AIA",
      "description",
      owner.address,
      owner.address
    );

    const collectionAddress = await collectionsManager.collections(
      (await collectionsManager.nextCollectionId()) - BigInt(1)
    );
    const agenticAIAgentCollection = Collection.attach(
      collectionAddress
    ) as AgenticAIAgentCollection;

    const signerRole = await collectionsManager.SIGNER_ROLE();
    await collectionsManager.grantRole(signerRole, signer1.address);
    await collectionsManager.grantRole(signerRole, signer2.address);

    return { agenticAIAgentCollection, owner, signer1, signer2, otherAccount };
  }

  beforeEach(async function () {
    const { agenticAIAgentCollection, owner, signer1, signer2, otherAccount } =
      await loadFixture(deployCollection);

    _agenticAIAgentCollection = agenticAIAgentCollection;
    _owner = owner;
    _signer1 = signer1;
    _signer2 = signer2;
    _otherAccount = otherAccount;
  });

  async function revokeModerator() {
    return await _agenticAIAgentCollection
      .connect(_owner)
      .revokeRole(
        await _agenticAIAgentCollection.MODERATOR_ROLE(),
        _owner.address
      );
  }

  describe("Given a moderator exists", function () {
    describe("And caller is not a moderator", function () {
      it("Should revert with 'NotModerator' error", async function () {
        const agentAddresses = [generateRandomAddress()];
        const signature = await signMintRequest(
          _signer1,
          _agenticAIAgentCollection,
          {
            to: _otherAccount.address,
            agentAddresses,
            signer: _signer1.address,
            role: DEFAULT_ROLE,
            name: DEFAULT_NAME,
            images: DEFAULT_IMAGES,
            mission: DEFAULT_MISSION,
            nonce: NONCE_1,
          }
        );

        await expect(
          _agenticAIAgentCollection
            .connect(_otherAccount)
            .mint(
              _otherAccount.address,
              agentAddresses,
              _signer1.address,
              DEFAULT_ROLE,
              DEFAULT_NAME,
              DEFAULT_MISSION,
              DEFAULT_IMAGES,
              ethers.id(NONCE_1),
              signature
            )
        ).to.be.revertedWithCustomError(
          _agenticAIAgentCollection,
          "NotModerator"
        );
      });
    });

    describe("And caller is a moderator", function () {
      it("Should allow a moderator to mint directly", async function () {
        const agentAddresses = [generateRandomAddress()];
        const signature = await signMintRequest(
          _signer1,
          _agenticAIAgentCollection,
          {
            to: _otherAccount.address,
            agentAddresses,
            signer: _signer1.address,
            role: DEFAULT_ROLE,
            name: DEFAULT_NAME,
            images: DEFAULT_IMAGES,
            mission: DEFAULT_MISSION,
            nonce: NONCE_1,
          }
        );

        const nextTokenId = await _agenticAIAgentCollection.nextTokenId();

        await _agenticAIAgentCollection.mint(
          _otherAccount.address,
          agentAddresses,
          _signer1.address,
          DEFAULT_ROLE,
          DEFAULT_NAME,
          DEFAULT_MISSION,
          DEFAULT_IMAGES,
          ethers.id(NONCE_1),
          signature
        );

        expect(await _agenticAIAgentCollection.ownerOf(nextTokenId)).to.equal(
          _otherAccount.address
        );
      });
    });
  });

  describe("Given no moderators are set", function () {
    beforeEach(async function () {
      await revokeModerator();
    });

    describe("When name is invalid ens", function () {
      it("Should revert with 'InvalidName'", async function () {
        const agentAddresses = [generateRandomAddress()];
        const signature = await signMintRequest(
          _signer1,
          _agenticAIAgentCollection,
          {
            to: _otherAccount.address,
            agentAddresses,
            signer: _signer1.address,
            role: DEFAULT_ROLE,
            name: INVALID_NAME,
            images: DEFAULT_IMAGES,
            mission: DEFAULT_MISSION,
            nonce: NONCE_1,
          }
        );

        await expect(
          _agenticAIAgentCollection.mint(
            _otherAccount.address,
            agentAddresses,
            _signer1.address,
            DEFAULT_ROLE,
            INVALID_NAME,
            DEFAULT_MISSION,
            DEFAULT_IMAGES,
            ethers.id(NONCE_1),
            signature
          )
        )
          .to.be.revertedWithCustomError(
            _agenticAIAgentCollection,
            "InvalidName"
          )
          .withArgs(INVALID_NAME);
      });
    });

    describe("Given nonce is already used", function () {
      it("Should revert with 'UsedNonce'", async function () {
        const agentAddresses = [generateRandomAddress()];
        const sig1 = await signMintRequest(
          _signer1,
          _agenticAIAgentCollection,
          {
            to: _otherAccount.address,
            agentAddresses,
            signer: _signer1.address,
            role: DEFAULT_ROLE,
            name: DEFAULT_NAME,
            images: DEFAULT_IMAGES,
            mission: DEFAULT_MISSION,
            nonce: NONCE_1,
          }
        );

        await _agenticAIAgentCollection.mint(
          _otherAccount.address,
          agentAddresses,
          _signer1.address,
          DEFAULT_ROLE,
          DEFAULT_NAME,
          DEFAULT_MISSION,
          DEFAULT_IMAGES,
          ethers.id(NONCE_1),
          sig1
        );

        const sig2 = await signMintRequest(
          _signer1,
          _agenticAIAgentCollection,
          {
            to: _otherAccount.address,
            agentAddresses,
            signer: _signer1.address,
            role: DEFAULT_ROLE,
            name: DEFAULT_NAME + "2",
            images: DEFAULT_IMAGES,
            mission: DEFAULT_MISSION,
            nonce: NONCE_1,
          }
        );

        await expect(
          _agenticAIAgentCollection.mint(
            _otherAccount.address,
            agentAddresses,
            _signer1.address,
            DEFAULT_ROLE,
            DEFAULT_NAME + "2",
            DEFAULT_MISSION,
            DEFAULT_IMAGES,
            ethers.id(NONCE_1),
            sig2
          )
        )
          .to.be.revertedWithCustomError(_agenticAIAgentCollection, "UsedNonce")
          .withArgs(ethers.id(NONCE_1));
      });
    });

    describe("Given name is already taken", function () {
      it("Should revert with 'UsedName'", async function () {
        const agentAddresses = [generateRandomAddress()];
        const sig1 = await signMintRequest(
          _signer1,
          _agenticAIAgentCollection,
          {
            to: _otherAccount.address,
            agentAddresses,
            signer: _signer1.address,
            role: DEFAULT_ROLE,
            name: DEFAULT_NAME,
            images: DEFAULT_IMAGES,
            mission: DEFAULT_MISSION,
            nonce: NONCE_1,
          }
        );

        await _agenticAIAgentCollection.mint(
          _otherAccount.address,
          agentAddresses,
          _signer1.address,
          DEFAULT_ROLE,
          DEFAULT_NAME,
          DEFAULT_MISSION,
          DEFAULT_IMAGES,
          ethers.id(NONCE_1),
          sig1
        );

        const sig2 = await signMintRequest(
          _signer1,
          _agenticAIAgentCollection,
          {
            to: _otherAccount.address,
            agentAddresses,
            signer: _signer1.address,
            role: DEFAULT_ROLE,
            name: DEFAULT_NAME,
            images: DEFAULT_IMAGES,
            mission: DEFAULT_MISSION,
            nonce: NONCE_2,
          }
        );

        await expect(
          _agenticAIAgentCollection.mint(
            _otherAccount.address,
            agentAddresses,
            _signer1.address,
            DEFAULT_ROLE,
            DEFAULT_NAME,
            DEFAULT_MISSION,
            DEFAULT_IMAGES,
            ethers.id(NONCE_2),
            sig2
          )
        )
          .to.be.revertedWithCustomError(_agenticAIAgentCollection, "UsedName")
          .withArgs(DEFAULT_NAME);
      });
    });

    describe("Given recovered signer is not the signer in parameters", function () {
      it("Should revert with 'InvalidSigner'", async function () {
        const agentAddresses = [generateRandomAddress()];
        const signature = await signMintRequest(
          _signer1,
          _agenticAIAgentCollection,
          {
            to: _otherAccount.address,
            agentAddresses,
            signer: _signer2.address,
            role: DEFAULT_ROLE,
            name: DEFAULT_NAME,
            images: DEFAULT_IMAGES,
            mission: DEFAULT_MISSION,
            nonce: NONCE_1,
          }
        );

        await expect(
          _agenticAIAgentCollection.mint(
            _otherAccount.address,
            agentAddresses,
            _signer2.address,
            DEFAULT_ROLE,
            DEFAULT_NAME,
            DEFAULT_MISSION,
            DEFAULT_IMAGES,
            ethers.id(NONCE_1),
            signature
          )
        )
          .to.be.revertedWithCustomError(
            _agenticAIAgentCollection,
            "InvalidSigner"
          )
          .withArgs(await _signer1.getAddress(), _signer2.address);
      });
    });

    describe("Given recovered signer is not signer", function () {
      it("Should revert with 'NotSigner'", async function () {
        const agentAddresses = [generateRandomAddress()];
        const signature = await signMintRequest(
          _otherAccount,
          _agenticAIAgentCollection,
          {
            to: _otherAccount.address,
            agentAddresses,
            signer: _otherAccount.address,
            role: DEFAULT_ROLE,
            name: DEFAULT_NAME,
            images: DEFAULT_IMAGES,
            mission: DEFAULT_MISSION,
            nonce: NONCE_1,
          }
        );

        await expect(
          _agenticAIAgentCollection.mint(
            _otherAccount.address,
            agentAddresses,
            _otherAccount.address,
            DEFAULT_ROLE,
            DEFAULT_NAME,
            DEFAULT_MISSION,
            DEFAULT_IMAGES,
            ethers.id(NONCE_1),
            signature
          )
        ).to.be.revertedWithCustomError(_agenticAIAgentCollection, "NotSigner");
      });
    });

    describe("Given valid mint parameters", function () {
      it("Should assign the owner of the token", async function () {
        const agentAddresses = [generateRandomAddress()];
        const signature = await signMintRequest(
          _signer1,
          _agenticAIAgentCollection,
          {
            to: _otherAccount.address,
            agentAddresses,
            signer: _signer1.address,
            role: DEFAULT_ROLE,
            name: DEFAULT_NAME,
            images: DEFAULT_IMAGES,
            mission: DEFAULT_MISSION,
            nonce: NONCE_1,
          }
        );

        const nextTokenId = await _agenticAIAgentCollection.nextTokenId();

        await _agenticAIAgentCollection.mint(
          _otherAccount.address,
          agentAddresses,
          _signer1.address,
          DEFAULT_ROLE,
          DEFAULT_NAME,
          DEFAULT_MISSION,
          DEFAULT_IMAGES,
          ethers.id(NONCE_1),
          signature
        );

        expect(await _agenticAIAgentCollection.ownerOf(nextTokenId)).to.equal(
          _otherAccount.address
        );
      });

      it("Should mint the NFT with the expected token ID", async function () {
        const agentAddresses = [generateRandomAddress()];
        const signature = await signMintRequest(
          _signer1,
          _agenticAIAgentCollection,
          {
            to: _otherAccount.address,
            agentAddresses,
            signer: _signer1.address,
            role: DEFAULT_ROLE,
            name: DEFAULT_NAME,
            images: DEFAULT_IMAGES,
            mission: DEFAULT_MISSION,
            nonce: NONCE_1,
          }
        );

        const nextTokenId = await _agenticAIAgentCollection.nextTokenId();

        await expect(_agenticAIAgentCollection.ownerOf(nextTokenId)).to.be
          .reverted;

        await _agenticAIAgentCollection.mint(
          _otherAccount.address,
          agentAddresses,
          _signer1.address,
          DEFAULT_ROLE,
          DEFAULT_NAME,
          DEFAULT_MISSION,
          DEFAULT_IMAGES,
          ethers.id(NONCE_1),
          signature
        );

        expect(await _agenticAIAgentCollection.ownerOf(nextTokenId)).to.equal(
          _otherAccount.address
        );
      });

      it("Should increment next token ID", async function () {
        const agentAddresses = [generateRandomAddress()];
        const signature = await signMintRequest(
          _signer1,
          _agenticAIAgentCollection,
          {
            to: _otherAccount.address,
            agentAddresses,
            signer: _signer1.address,
            role: DEFAULT_ROLE,
            name: DEFAULT_NAME,
            images: DEFAULT_IMAGES,
            mission: DEFAULT_MISSION,
            nonce: NONCE_1,
          }
        );

        const nextTokenIdBefore = await _agenticAIAgentCollection.nextTokenId();

        await _agenticAIAgentCollection.mint(
          _otherAccount.address,
          agentAddresses,
          _signer1.address,
          DEFAULT_ROLE,
          DEFAULT_NAME,
          DEFAULT_MISSION,
          DEFAULT_IMAGES,
          ethers.id(NONCE_1),
          signature
        );

        const nextTokenIdAfter = await _agenticAIAgentCollection.nextTokenId();
        expect(nextTokenIdAfter).to.equal(nextTokenIdBefore + BigInt(1));
      });

      it("Should mark the nonce as used", async function () {
        const agentAddresses = [generateRandomAddress()];
        const signature = await signMintRequest(
          _signer1,
          _agenticAIAgentCollection,
          {
            to: _otherAccount.address,
            agentAddresses,
            signer: _signer1.address,
            role: DEFAULT_ROLE,
            name: DEFAULT_NAME,
            images: DEFAULT_IMAGES,
            mission: DEFAULT_MISSION,
            nonce: NONCE_1,
          }
        );

        expect(await _agenticAIAgentCollection.isNonceUsed(ethers.id(NONCE_1)))
          .to.be.false;

        await _agenticAIAgentCollection.mint(
          _otherAccount.address,
          agentAddresses,
          _signer1.address,
          DEFAULT_ROLE,
          DEFAULT_NAME,
          DEFAULT_MISSION,
          DEFAULT_IMAGES,
          ethers.id(NONCE_1),
          signature
        );

        expect(await _agenticAIAgentCollection.isNonceUsed(ethers.id(NONCE_1)))
          .to.be.true;
      });

      it("Should assign signer of the token", async function () {
        const agentAddresses = [generateRandomAddress()];
        const signature = await signMintRequest(
          _signer1,
          _agenticAIAgentCollection,
          {
            to: _otherAccount.address,
            agentAddresses,
            signer: _signer1.address,
            role: DEFAULT_ROLE,
            name: DEFAULT_NAME,
            images: DEFAULT_IMAGES,
            mission: DEFAULT_MISSION,
            nonce: NONCE_1,
          }
        );

        const nextTokenId = await _agenticAIAgentCollection.nextTokenId();

        await _agenticAIAgentCollection.mint(
          _otherAccount.address,
          agentAddresses,
          _signer1.address,
          DEFAULT_ROLE,
          DEFAULT_NAME,
          DEFAULT_MISSION,
          DEFAULT_IMAGES,
          ethers.id(NONCE_1),
          signature
        );

        expect(await _agenticAIAgentCollection.signerOf(nextTokenId)).to.equal(
          _signer1.address
        );
      });

      it("Should assign agent addresses to the token", async function () {
        const agentAddresses = [generateRandomAddress()];
        const signature = await signMintRequest(
          _signer1,
          _agenticAIAgentCollection,
          {
            to: _otherAccount.address,
            agentAddresses,
            signer: _signer1.address,
            role: DEFAULT_ROLE,
            name: DEFAULT_NAME,
            images: DEFAULT_IMAGES,
            mission: DEFAULT_MISSION,
            nonce: NONCE_1,
          }
        );

        const nextTokenId = await _agenticAIAgentCollection.nextTokenId();

        await _agenticAIAgentCollection.mint(
          _otherAccount.address,
          agentAddresses,
          _signer1.address,
          DEFAULT_ROLE,
          DEFAULT_NAME,
          DEFAULT_MISSION,
          DEFAULT_IMAGES,
          ethers.id(NONCE_1),
          signature
        );

        const walletsOf = await _agenticAIAgentCollection.walletsOf(
          nextTokenId
        );

        expect(walletsOf.length).to.equal(agentAddresses.length);
        for (let i = 0; i < agentAddresses.length; i++) {
          expect(agentAddresses).to.include(walletsOf[i]);
        }
      });

      it("Should assign name to the token", async function () {
        const agentAddresses = [generateRandomAddress()];
        const signature = await signMintRequest(
          _signer1,
          _agenticAIAgentCollection,
          {
            to: _otherAccount.address,
            agentAddresses,
            signer: _signer1.address,
            role: DEFAULT_ROLE,
            name: DEFAULT_NAME,
            images: DEFAULT_IMAGES,
            mission: DEFAULT_MISSION,
            nonce: NONCE_1,
          }
        );

        const nextTokenId = await _agenticAIAgentCollection.nextTokenId();

        await _agenticAIAgentCollection.mint(
          _otherAccount.address,
          agentAddresses,
          _signer1.address,
          DEFAULT_ROLE,
          DEFAULT_NAME,
          DEFAULT_MISSION,
          DEFAULT_IMAGES,
          ethers.id(NONCE_1),
          signature
        );

        expect(await _agenticAIAgentCollection.nameOf(nextTokenId)).to.equal(
          DEFAULT_NAME
        );
      });

      it("Should assign images to the token", async function () {
        const agentAddresses = [generateRandomAddress()];
        const signature = await signMintRequest(
          _signer1,
          _agenticAIAgentCollection,
          {
            to: _otherAccount.address,
            agentAddresses,
            signer: _signer1.address,
            role: DEFAULT_ROLE,
            name: DEFAULT_NAME,
            images: DEFAULT_IMAGES,
            mission: DEFAULT_MISSION,
            nonce: NONCE_1,
          }
        );

        const nextTokenId = await _agenticAIAgentCollection.nextTokenId();

        await _agenticAIAgentCollection.mint(
          _otherAccount.address,
          agentAddresses,
          _signer1.address,
          DEFAULT_ROLE,
          DEFAULT_NAME,
          DEFAULT_MISSION,
          DEFAULT_IMAGES,
          ethers.id(NONCE_1),
          signature
        );

        const imagesOf = await _agenticAIAgentCollection.imagesOf(nextTokenId);

        for (
          let imagesOfIndex = 0;
          imagesOfIndex < imagesOf.length;
          imagesOfIndex++
        ) {
          expect(imagesOf[imagesOfIndex][0]).to.be.equal(
            DEFAULT_IMAGES[imagesOfIndex].key
          );
          expect(imagesOf[imagesOfIndex][1]).to.be.equal(
            DEFAULT_IMAGES[imagesOfIndex].value
          );
        }
      });

      it("Should assign creator to the token", async function () {
        const agentAddresses = [generateRandomAddress()];
        const signature = await signMintRequest(
          _signer1,
          _agenticAIAgentCollection,
          {
            to: _otherAccount.address,
            agentAddresses,
            signer: _signer1.address,
            role: DEFAULT_ROLE,
            name: DEFAULT_NAME,
            images: DEFAULT_IMAGES,
            mission: DEFAULT_MISSION,
            nonce: NONCE_1,
          }
        );

        const nextTokenId = await _agenticAIAgentCollection.nextTokenId();

        await _agenticAIAgentCollection.mint(
          _otherAccount.address,
          agentAddresses,
          _signer1.address,
          DEFAULT_ROLE,
          DEFAULT_NAME,
          DEFAULT_MISSION,
          DEFAULT_IMAGES,
          ethers.id(NONCE_1),
          signature
        );

        expect(await _agenticAIAgentCollection.creatorOf(nextTokenId)).to.equal(
          _owner.address
        );
      });

      it("Should assign role to the token", async function () {
        const agentAddresses = [generateRandomAddress()];
        const signature = await signMintRequest(
          _signer1,
          _agenticAIAgentCollection,
          {
            to: _otherAccount.address,
            agentAddresses,
            signer: _signer1.address,
            role: DEFAULT_ROLE,
            name: DEFAULT_NAME,
            images: DEFAULT_IMAGES,
            mission: DEFAULT_MISSION,
            nonce: NONCE_1,
          }
        );

        const nextTokenId = await _agenticAIAgentCollection.nextTokenId();

        await _agenticAIAgentCollection.mint(
          _otherAccount.address,
          agentAddresses,
          _signer1.address,
          DEFAULT_ROLE,
          DEFAULT_NAME,
          DEFAULT_MISSION,
          DEFAULT_IMAGES,
          ethers.id(NONCE_1),
          signature
        );

        expect(await _agenticAIAgentCollection.roleOf(nextTokenId)).to.equal(
          DEFAULT_ROLE
        );
      });

      it("Should assign token id to name", async function () {
        const agentAddresses = [generateRandomAddress()];
        const signature = await signMintRequest(
          _signer1,
          _agenticAIAgentCollection,
          {
            to: _otherAccount.address,
            agentAddresses,
            signer: _signer1.address,
            role: DEFAULT_ROLE,
            name: DEFAULT_NAME,
            images: DEFAULT_IMAGES,
            mission: DEFAULT_MISSION,
            nonce: NONCE_1,
          }
        );

        const nextTokenId = await _agenticAIAgentCollection.nextTokenId();

        await _agenticAIAgentCollection.mint(
          _otherAccount.address,
          agentAddresses,
          _signer1.address,
          DEFAULT_ROLE,
          DEFAULT_NAME,
          DEFAULT_MISSION,
          DEFAULT_IMAGES,
          ethers.id(NONCE_1),
          signature
        );

        expect(
          await _agenticAIAgentCollection.tokenIdOf(DEFAULT_NAME)
        ).to.be.equal(nextTokenId);
      });

      it("Should emit 'Minted' event", async function () {
        const agentAddresses = [generateRandomAddress()];
        const signature = await signMintRequest(
          _signer1,
          _agenticAIAgentCollection,
          {
            to: _otherAccount.address,
            agentAddresses,
            signer: _signer1.address,
            role: DEFAULT_ROLE,
            name: DEFAULT_NAME,
            images: DEFAULT_IMAGES,
            mission: DEFAULT_MISSION,
            nonce: NONCE_1,
          }
        );

        const nextTokenId = await _agenticAIAgentCollection.nextTokenId();

        await expect(
          _agenticAIAgentCollection.mint(
            _otherAccount.address,
            agentAddresses,
            _signer1.address,
            DEFAULT_ROLE,
            DEFAULT_NAME,
            DEFAULT_MISSION,
            DEFAULT_IMAGES,
            ethers.id(NONCE_1),
            signature
          )
        )
          .to.emit(_agenticAIAgentCollection, "Minted")
          .withArgs(_otherAccount.address, _signer1.address, nextTokenId);
      });

      it("Should emit 'AgentSignerUpdated' event", async function () {
        const agentAddresses = [generateRandomAddress()];
        const signature = await signMintRequest(
          _signer1,
          _agenticAIAgentCollection,
          {
            to: _otherAccount.address,
            agentAddresses,
            signer: _signer1.address,
            role: DEFAULT_ROLE,
            name: DEFAULT_NAME,
            images: DEFAULT_IMAGES,
            mission: DEFAULT_MISSION,
            nonce: NONCE_1,
          }
        );

        const nextTokenId = await _agenticAIAgentCollection.nextTokenId();

        await expect(
          _agenticAIAgentCollection.mint(
            _otherAccount.address,
            agentAddresses,
            _signer1.address,
            DEFAULT_ROLE,
            DEFAULT_NAME,
            DEFAULT_MISSION,
            DEFAULT_IMAGES,
            ethers.id(NONCE_1),
            signature
          )
        )
          .to.emit(_agenticAIAgentCollection, "AgentSignerUpdated")
          .withArgs(nextTokenId, ethers.ZeroAddress, _signer1.address);
      });
    });
  });
});
