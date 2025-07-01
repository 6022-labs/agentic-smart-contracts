import { expect } from "chai";
import { ethers } from "hardhat";
import { AgentCollectionV1 } from "../../typechain-types";
import { loadFixture, reset } from "@nomicfoundation/hardhat-network-helpers";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import {
  proposeAndMint,
  signMintRequest,
  generateRandomAddress,
  deployCollectionWithCreator,
} from "../common";

describe("WhenMintingFromProposal", function () {
  const ipfsGateway = "https://ipfs.io/ipfs/";

  // Common constants to avoid repetition
  const DEFAULT_ROLE = "facilitator";
  const DEFAULT_MISSION = "";
  const DEFAULT_IMAGES = [
    {
      key: "default",
      value: "bafybeibsulc7sgpck3w7ur7eqa6fwaazcsswn3dg3rfl65zka3knajx43i",
    },
  ];
  const DEFAULT_NAME = "test-agent";
  const DEFAULT_NAME_1 = "test-agent-1";
  const DEFAULT_NAME_2 = "test-agent-2";
  const NONCE_1 = "1";
  const NONCE_2 = "2";

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

  describe("Given signer is not moderator", function () {
    it("Should revert with 'AccessControlUnauthorizedAccount' error", async function () {
      const agentAddresses = [generateRandomAddress()];

      const signature = await signMintRequest(_signer, _collection, {
        to: _otherAccount.address,
        agentAddresses,
        signer: _signer.address,
        role: DEFAULT_ROLE,
        name: DEFAULT_NAME,
        images: DEFAULT_IMAGES,
        mission: DEFAULT_MISSION,
        nonce: NONCE_1,
      });

      await _collection.createMintProposal(
        _otherAccount.address,
        agentAddresses,
        _signer.address,
        DEFAULT_ROLE,
        DEFAULT_NAME,
        DEFAULT_MISSION,
        DEFAULT_IMAGES,
        ethers.id(NONCE_1),
        signature
      );

      const mintProposalsLength = await _collection.mintProposalsLength();
      const { id: proposalId } = await _collection.mintProposal(
        mintProposalsLength - BigInt(1)
      );

      await expect(
        _collection.connect(_otherAccount).mintFromProposal(proposalId)
      ).to.be.revertedWithCustomError(
        _collection,
        "AccessControlUnauthorizedAccount"
      );
    });
  });

  describe("Given proposal does not exist", function () {
    it("Should revert", async function () {
      const mintProposalsLength = await _collection.mintProposalsLength();

      await expect(
        _collection
          .connect(_owner)
          .mintFromProposal(mintProposalsLength + BigInt(1))
      ).to.be.reverted;
    });
  });

  describe("Given multiple minting proposals share the same name", function () {
    it("Should revert minting the second proposal with 'UsedName' error", async function () {
      const agentAddresses = [generateRandomAddress()];

      const sig1 = await signMintRequest(_signer, _collection, {
        to: _otherAccount.address,
        agentAddresses,
        signer: _signer.address,
        role: DEFAULT_ROLE,
        name: DEFAULT_NAME,
        images: DEFAULT_IMAGES,
        mission: DEFAULT_MISSION,
        nonce: NONCE_1,
      });

      await _collection.createMintProposal(
        _otherAccount.address,
        agentAddresses,
        _signer.address,
        DEFAULT_ROLE,
        DEFAULT_NAME,
        DEFAULT_MISSION,
        DEFAULT_IMAGES,
        ethers.id(NONCE_1),
        sig1
      );

      const sig2 = await signMintRequest(_signer, _collection, {
        to: _otherAccount.address,
        agentAddresses,
        signer: _signer.address,
        role: DEFAULT_ROLE,
        name: DEFAULT_NAME,
        images: DEFAULT_IMAGES,
        mission: DEFAULT_MISSION,
        nonce: NONCE_2,
      });

      await _collection.createMintProposal(
        _otherAccount.address,
        agentAddresses,
        _signer.address,
        DEFAULT_ROLE,
        DEFAULT_NAME,
        DEFAULT_MISSION,
        DEFAULT_IMAGES,
        ethers.id(NONCE_2),
        sig2
      );

      const { id: proposalId } = await _collection.mintProposal(0);

      await _collection.connect(_owner).mintFromProposal(proposalId);

      await expect(_collection.connect(_owner).mintFromProposal(proposalId))
        .to.be.revertedWithCustomError(_collection, "UsedName")
        .withArgs(DEFAULT_NAME);
    });
  });

  describe("Given a valid minting proposal", function () {
    it("Should assign the owner of the token", async function () {
      const agentAddresses = [generateRandomAddress()];
      const tokenId = await proposeAndMint(_signer, _collection, _owner, {
        to: _otherAccount.address,
        agentAddresses,
        role: DEFAULT_ROLE,
        name: DEFAULT_NAME,
        images: DEFAULT_IMAGES,
        mission: DEFAULT_MISSION,
        nonce: NONCE_1,
      });

      expect(await _collection.ownerOf(tokenId)).to.equal(
        _otherAccount.address
      );
    });

    it("Should mint the NFT with the expected token ID", async function () {
      const agentAddresses1 = [generateRandomAddress()];

      const nextTokenId = await _collection.nextTokenId();

      await expect(_collection.ownerOf(nextTokenId)).to.be.reverted;

      await proposeAndMint(_signer, _collection, _owner, {
        to: _otherAccount.address,
        agentAddresses: agentAddresses1,
        role: DEFAULT_ROLE,
        name: DEFAULT_NAME_1,
        images: DEFAULT_IMAGES,
        mission: DEFAULT_MISSION,
        nonce: NONCE_1,
      });

      expect(await _collection.ownerOf(nextTokenId)).to.equal(
        _otherAccount.address
      );
    });

    it("Should increment next token ID", async function () {
      const agentAddresses1 = [generateRandomAddress()];

      const nextTokenIdBefore = await _collection.nextTokenId();

      await proposeAndMint(_signer, _collection, _owner, {
        to: _otherAccount.address,
        agentAddresses: agentAddresses1,
        role: DEFAULT_ROLE,
        name: DEFAULT_NAME_1,
        images: DEFAULT_IMAGES,
        mission: DEFAULT_MISSION,
        nonce: NONCE_1,
      });

      const nextTokenIdAfter = await _collection.nextTokenId();
      expect(nextTokenIdAfter).to.equal(nextTokenIdBefore + BigInt(1));
    });

    it("Should mark the nonce as used", async function () {
      const agentAddresses = [generateRandomAddress()];

      expect(await _collection.isNonceUsed(ethers.id(NONCE_1))).to.be.false;

      await proposeAndMint(_signer, _collection, _owner, {
        to: _otherAccount.address,
        agentAddresses,
        role: DEFAULT_ROLE,
        name: DEFAULT_NAME,
        images: DEFAULT_IMAGES,
        mission: DEFAULT_MISSION,
        nonce: NONCE_1,
      });

      expect(await _collection.isNonceUsed(ethers.id(NONCE_1))).to.be.true;
    });

    it("Should assign signer of the token", async function () {
      const agentAddresses = [generateRandomAddress()];

      const tokenId = await proposeAndMint(_signer, _collection, _owner, {
        to: _otherAccount.address,
        agentAddresses,
        role: DEFAULT_ROLE,
        name: DEFAULT_NAME,
        images: DEFAULT_IMAGES,
        mission: DEFAULT_MISSION,
        nonce: NONCE_1,
      });

      expect(await _collection.signerOf(tokenId)).to.equal(_signer.address);
    });

    it("Should assign agent addresses to the token", async function () {
      const agentAddresses = [generateRandomAddress()];

      const tokenId = await proposeAndMint(_signer, _collection, _owner, {
        to: _otherAccount.address,
        agentAddresses,
        role: DEFAULT_ROLE,
        name: DEFAULT_NAME,
        images: DEFAULT_IMAGES,
        mission: DEFAULT_MISSION,
        nonce: NONCE_1,
      });

      const walletsOf = await _collection.walletsOf(tokenId);

      expect(walletsOf.length).to.equal(agentAddresses.length);
      for (let i = 0; i < agentAddresses.length; i++) {
        expect(agentAddresses).to.include(walletsOf[i]);
      }
    });

    it("Should assign name to the token", async function () {
      const agentAddresses = [generateRandomAddress()];

      const tokenId = await proposeAndMint(_signer, _collection, _owner, {
        to: _otherAccount.address,
        agentAddresses,
        role: DEFAULT_ROLE,
        name: DEFAULT_NAME,
        images: DEFAULT_IMAGES,
        mission: DEFAULT_MISSION,
        nonce: NONCE_1,
      });

      expect(await _collection.nameOf(tokenId)).to.equal(DEFAULT_NAME);
    });

    it("Should assign images to the token", async function () {
      const agentAddresses = [generateRandomAddress()];

      const tokenId = await proposeAndMint(_signer, _collection, _owner, {
        to: _otherAccount.address,
        agentAddresses,
        role: DEFAULT_ROLE,
        name: DEFAULT_NAME,
        images: DEFAULT_IMAGES,
        mission: DEFAULT_MISSION,
        nonce: NONCE_1,
      });

      const imagesOf = await _collection.imagesOf(tokenId);

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

      const tokenId = await proposeAndMint(_signer, _collection, _owner, {
        to: _otherAccount.address,
        agentAddresses,
        role: DEFAULT_ROLE,
        name: DEFAULT_NAME,
        images: DEFAULT_IMAGES,
        mission: DEFAULT_MISSION,
        nonce: NONCE_1,
      });

      expect(await _collection.creatorOf(tokenId)).to.equal(_owner.address);
    });

    it("Should assign role to the token", async function () {
      const agentAddresses = [generateRandomAddress()];

      const tokenId = await proposeAndMint(_signer, _collection, _owner, {
        to: _otherAccount.address,
        agentAddresses,
        role: DEFAULT_ROLE,
        name: DEFAULT_NAME,
        images: DEFAULT_IMAGES,
        mission: DEFAULT_MISSION,
        nonce: NONCE_1,
      });

      expect(await _collection.roleOf(tokenId)).to.equal(DEFAULT_ROLE);
    });

    it("Should assign token id to name", async function () {
      const agentAddresses = [generateRandomAddress()];

      const tokenId = await proposeAndMint(_signer, _collection, _owner, {
        to: _otherAccount.address,
        agentAddresses,
        role: DEFAULT_ROLE,
        name: DEFAULT_NAME,
        images: DEFAULT_IMAGES,
        mission: DEFAULT_MISSION,
        nonce: NONCE_1,
      });

      expect(await _collection.tokenIdOf(DEFAULT_NAME)).to.be.equal(tokenId);
    });

    it("Should emit 'Minted' event", async function () {
      const agentAddresses = [generateRandomAddress()];

      const tokenId = await _collection.nextTokenId();

      const signature = await signMintRequest(_signer, _collection, {
        to: _otherAccount.address,
        agentAddresses,
        signer: _signer.address,
        role: DEFAULT_ROLE,
        name: DEFAULT_NAME,
        images: DEFAULT_IMAGES,
        mission: DEFAULT_MISSION,
        nonce: NONCE_1,
      });

      await _collection.createMintProposal(
        _otherAccount.address,
        agentAddresses,
        _signer.address,
        DEFAULT_ROLE,
        DEFAULT_NAME,
        DEFAULT_MISSION,
        DEFAULT_IMAGES,
        ethers.id(NONCE_1),
        signature
      );

      const mintProposalsLength = await _collection.mintProposalsLength();
      const { id: proposalId } = await _collection.mintProposal(
        mintProposalsLength - BigInt(1)
      );

      await expect(
        _collection.connect(_owner).mintFromProposal(proposalId)
      )
        .to.emit(_collection, "Minted")
        .withArgs(_otherAccount.address, _signer.address, tokenId);
    });

    it("Should emit 'AgentSignerUpdated' event", async function () {
      const agentAddresses = [generateRandomAddress()];

      const tokenId = await _collection.nextTokenId();

      const signature = await signMintRequest(_signer, _collection, {
        to: _otherAccount.address,
        agentAddresses,
        signer: _signer.address,
        role: DEFAULT_ROLE,
        name: DEFAULT_NAME,
        images: DEFAULT_IMAGES,
        mission: DEFAULT_MISSION,
        nonce: NONCE_1,
      });

      await _collection.createMintProposal(
        _otherAccount.address,
        agentAddresses,
        _signer.address,
        DEFAULT_ROLE,
        DEFAULT_NAME,
        DEFAULT_MISSION,
        DEFAULT_IMAGES,
        ethers.id(NONCE_1),
        signature
      );

      const mintProposalsLength = await _collection.mintProposalsLength();
      const { id: proposalId } = await _collection.mintProposal(
        mintProposalsLength - BigInt(1)
      );

      await expect(
        _collection.connect(_owner).mintFromProposal(proposalId)
      )
        .to.emit(_collection, "AgentSignerUpdated")
        .withArgs(tokenId, ethers.ZeroAddress, _signer.address);
    });

    it("Should emit 'MintProposalRemoved' event", async function () {
      const agentAddresses = [generateRandomAddress()];

      const signature = await signMintRequest(_signer, _collection, {
        to: _otherAccount.address,
        agentAddresses,
        signer: _signer.address,
        role: DEFAULT_ROLE,
        name: DEFAULT_NAME,
        images: DEFAULT_IMAGES,
        mission: DEFAULT_MISSION,
        nonce: NONCE_1,
      });

      await _collection.createMintProposal(
        _otherAccount.address,
        agentAddresses,
        _signer.address,
        DEFAULT_ROLE,
        DEFAULT_NAME,
        DEFAULT_MISSION,
        DEFAULT_IMAGES,
        ethers.id(NONCE_1),
        signature
      );

      const mintProposalsLength = await _collection.mintProposalsLength();
      const { id: proposalId } = await _collection.mintProposal(
        mintProposalsLength - BigInt(1)
      );

      await expect(
        _collection.connect(_owner).mintFromProposal(proposalId)
      )
        .to.emit(_collection, "MintProposalRemoved")
        .withArgs(
          _otherAccount.address,
          _signer.address,
          mintProposalsLength - BigInt(1)
        );
    });

    it("Should decrease proposals length", async function () {
      const agentAddresses = [generateRandomAddress()];

      const signature = await signMintRequest(_signer, _collection, {
        to: _otherAccount.address,
        agentAddresses,
        signer: _signer.address,
        role: DEFAULT_ROLE,
        name: DEFAULT_NAME,
        images: DEFAULT_IMAGES,
        mission: DEFAULT_MISSION,
        nonce: NONCE_1,
      });

      await _collection.createMintProposal(
        _otherAccount.address,
        agentAddresses,
        _signer.address,
        DEFAULT_ROLE,
        DEFAULT_NAME,
        DEFAULT_MISSION,
        DEFAULT_IMAGES,
        ethers.id(NONCE_1),
        signature
      );

      const lengthBefore = await _collection.mintProposalsLength();
      const { id: proposalId } = await _collection.mintProposal(
        lengthBefore - BigInt(1)
      );

      await _collection.connect(_owner).mintFromProposal(proposalId);

      expect(await _collection.mintProposalsLength()).to.eq(
        lengthBefore - BigInt(1)
      );
    });

    it("Should reorder remaining proposals", async function () {
      const agentAddresses = [generateRandomAddress()];

      const sig1 = await signMintRequest(_signer, _collection, {
        to: _otherAccount.address,
        agentAddresses,
        signer: _signer.address,
        role: DEFAULT_ROLE,
        name: DEFAULT_NAME_1,
        images: DEFAULT_IMAGES,
        mission: DEFAULT_MISSION,
        nonce: NONCE_1,
      });

      await _collection.createMintProposal(
        _otherAccount.address,
        agentAddresses,
        _signer.address,
        DEFAULT_ROLE,
        DEFAULT_NAME_1,
        DEFAULT_MISSION,
        DEFAULT_IMAGES,
        ethers.id(NONCE_1),
        sig1
      );

      const sig2 = await signMintRequest(_signer, _collection, {
        to: _otherAccount.address,
        agentAddresses,
        signer: _signer.address,
        role: DEFAULT_ROLE,
        name: DEFAULT_NAME_2,
        images: DEFAULT_IMAGES,
        mission: DEFAULT_MISSION,
        nonce: NONCE_2,
      });

      await _collection.createMintProposal(
        _otherAccount.address,
        agentAddresses,
        _signer.address,
        DEFAULT_ROLE,
        DEFAULT_NAME_2,
        DEFAULT_MISSION,
        DEFAULT_IMAGES,
        ethers.id(NONCE_2),
        sig2
      );

      expect(await _collection.mintProposalsLength()).to.eq(2n);

      const { id: proposalId } = await _collection.mintProposal(0);

      await _collection.connect(_owner).mintFromProposal(proposalId);

      expect(await _collection.mintProposalsLength()).to.eq(1n);

      const proposal = await _collection.mintProposal(0);
      expect(proposal.name).to.equal(DEFAULT_NAME_2);
    });
  });
});
