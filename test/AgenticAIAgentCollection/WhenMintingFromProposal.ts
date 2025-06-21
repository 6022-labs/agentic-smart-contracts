import { expect } from "chai";
import { ethers } from "hardhat";
import { AgenticAIAgentCollection } from "../../typechain-types";
import { loadFixture, reset } from "@nomicfoundation/hardhat-network-helpers";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { generateRandomAddress, signMintRequest } from "../common";

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

  let _agenticAIAgentCollection: AgenticAIAgentCollection;
  let _owner: HardhatEthersSigner;
  let _signer: HardhatEthersSigner;
  let _otherAccount: HardhatEthersSigner;

  async function deployAgenticAIAgentCollection() {
    await reset();

    const [owner, signer, otherAccount] = await ethers.getSigners();

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
    const collection = await Collection.deploy(
      "AgenticAI",
      "AIA",
      "description",
      owner.address,
      owner.address,
      await collectionsManager.getAddress(),
      await collectionsDescriptor.getAddress()
    );

    const signerRole = await collectionsManager.SIGNER_ROLE();
    await collectionsManager.grantRole(signerRole, signer.address);

    return { collection, owner, signer, otherAccount };
  }

  beforeEach(async function () {
    const { collection, owner, signer, otherAccount } = await loadFixture(
      deployAgenticAIAgentCollection
    );

    _agenticAIAgentCollection = collection;
    _owner = owner;
    _signer = signer;
    _otherAccount = otherAccount;
  });

  async function proposeAndMint(
    to: string,
    agentAddresses: string[],
    role: string,
    name: string,
    images: { key: string; value: string }[],
    mission: string,
    nonce: string
  ) {
    const signature = await signMintRequest(
      _signer,
      _agenticAIAgentCollection,
      {
        to,
        agentAddresses,
        signer: _signer.address,
        role,
        name,
        images,
        mission,
        nonce,
      }
    );

    await _agenticAIAgentCollection.createMintProposal(
      to,
      agentAddresses,
      _signer.address,
      role,
      name,
      mission,
      images,
      ethers.id(nonce),
      signature
    );

    const mintProposalsLength =
      await _agenticAIAgentCollection.mintProposalsLength();

    const tokenId = await _agenticAIAgentCollection.nextTokenId();

    await _agenticAIAgentCollection
      .connect(_owner)
      .mintFromProposal(mintProposalsLength - BigInt(1));

    return tokenId;
  }

  describe("Given signer is not moderator", function () {
    it("Should revert with 'AccessControlUnauthorizedAccount' error", async function () {
      const agentAddresses = [generateRandomAddress()];

      const signature = await signMintRequest(
        _signer,
        _agenticAIAgentCollection,
        {
          to: _otherAccount.address,
          agentAddresses,
          signer: _signer.address,
          role: DEFAULT_ROLE,
          name: DEFAULT_NAME,
          images: DEFAULT_IMAGES,
          mission: DEFAULT_MISSION,
          nonce: NONCE_1,
        }
      );

      await _agenticAIAgentCollection.createMintProposal(
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

      const mintProposalsLength =
        await _agenticAIAgentCollection.mintProposalsLength();

      await expect(
        _agenticAIAgentCollection
          .connect(_otherAccount)
          .mintFromProposal(mintProposalsLength - BigInt(1))
      ).to.be.revertedWithCustomError(
        _agenticAIAgentCollection,
        "AccessControlUnauthorizedAccount"
      );
    });
  });

  describe("Given proposal does not exist", function () {
    it("Should revert", async function () {
      const mintProposalsLength =
        await _agenticAIAgentCollection.mintProposalsLength();

      await expect(
        _agenticAIAgentCollection
          .connect(_owner)
          .mintFromProposal(mintProposalsLength + BigInt(1))
      ).to.be.reverted;
    });
  });

  describe("Given multiple minting proposals share the same name", function () {
    it("Should revert minting the second proposal with 'UsedName' error", async function () {
      const agentAddresses = [generateRandomAddress()];

      const sig1 = await signMintRequest(_signer, _agenticAIAgentCollection, {
        to: _otherAccount.address,
        agentAddresses,
        signer: _signer.address,
        role: DEFAULT_ROLE,
        name: DEFAULT_NAME,
        images: DEFAULT_IMAGES,
        mission: DEFAULT_MISSION,
        nonce: NONCE_1,
      });

      await _agenticAIAgentCollection.createMintProposal(
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

      const sig2 = await signMintRequest(_signer, _agenticAIAgentCollection, {
        to: _otherAccount.address,
        agentAddresses,
        signer: _signer.address,
        role: DEFAULT_ROLE,
        name: DEFAULT_NAME,
        images: DEFAULT_IMAGES,
        mission: DEFAULT_MISSION,
        nonce: NONCE_2,
      });

      await _agenticAIAgentCollection.createMintProposal(
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

      await _agenticAIAgentCollection.connect(_owner).mintFromProposal(0);

      await expect(
        _agenticAIAgentCollection.connect(_owner).mintFromProposal(0)
      )
        .to.be.revertedWithCustomError(_agenticAIAgentCollection, "UsedName")
        .withArgs(DEFAULT_NAME);
    });
  });

  describe("Given a valid minting proposal", function () {
    it("Should assign the owner of the token", async function () {
      const agentAddresses = [generateRandomAddress()];
      const tokenId = await proposeAndMint(
        _otherAccount.address,
        agentAddresses,
        DEFAULT_ROLE,
        DEFAULT_NAME,
        DEFAULT_IMAGES,
        DEFAULT_MISSION,
        NONCE_1
      );

      expect(await _agenticAIAgentCollection.ownerOf(tokenId)).to.equal(
        _otherAccount.address
      );
    });

    it("Should mint the NFT with the expected token ID", async function () {
      const agentAddresses1 = [generateRandomAddress()];

      const nextTokenId = await _agenticAIAgentCollection.nextTokenId();

      await expect(_agenticAIAgentCollection.ownerOf(nextTokenId)).to.be
        .reverted;

      await proposeAndMint(
        _otherAccount.address,
        agentAddresses1,
        DEFAULT_ROLE,
        DEFAULT_NAME_1,
        DEFAULT_IMAGES,
        DEFAULT_MISSION,
        NONCE_1
      );

      expect(await _agenticAIAgentCollection.ownerOf(nextTokenId)).to.equal(
        _otherAccount.address
      );
    });

    it("Should increment next token ID", async function () {
      const agentAddresses1 = [generateRandomAddress()];

      const nextTokenIdBefore = await _agenticAIAgentCollection.nextTokenId();

      await proposeAndMint(
        _otherAccount.address,
        agentAddresses1,
        DEFAULT_ROLE,
        DEFAULT_NAME_1,
        DEFAULT_IMAGES,
        DEFAULT_MISSION,
        NONCE_1
      );

      const nextTokenIdAfter = await _agenticAIAgentCollection.nextTokenId();
      expect(nextTokenIdAfter).to.equal(nextTokenIdBefore + BigInt(1));
    });

    it("Should mark the nonce as used", async function () {
      const agentAddresses = [generateRandomAddress()];

      expect(await _agenticAIAgentCollection.isNonceUsed(ethers.id(NONCE_1))).to
        .be.false;

      await proposeAndMint(
        _otherAccount.address,
        agentAddresses,
        DEFAULT_ROLE,
        DEFAULT_NAME,
        DEFAULT_IMAGES,
        DEFAULT_MISSION,
        NONCE_1
      );

      expect(await _agenticAIAgentCollection.isNonceUsed(ethers.id(NONCE_1))).to
        .be.true;
    });

    it("Should assign signer of the token", async function () {
      const agentAddresses = [generateRandomAddress()];

      const tokenId = await proposeAndMint(
        _otherAccount.address,
        agentAddresses,
        DEFAULT_ROLE,
        DEFAULT_NAME,
        DEFAULT_IMAGES,
        DEFAULT_MISSION,
        NONCE_1
      );

      expect(await _agenticAIAgentCollection.signerOf(tokenId)).to.equal(
        _signer.address
      );
    });

    it("Should assign agent addresses to the token", async function () {
      const agentAddresses = [generateRandomAddress()];

      const tokenId = await proposeAndMint(
        _otherAccount.address,
        agentAddresses,
        DEFAULT_ROLE,
        DEFAULT_NAME,
        DEFAULT_IMAGES,
        DEFAULT_MISSION,
        NONCE_1
      );

      const walletsOf = await _agenticAIAgentCollection.walletsOf(tokenId);

      expect(walletsOf.length).to.equal(agentAddresses.length);
      for (let i = 0; i < agentAddresses.length; i++) {
        expect(agentAddresses).to.include(walletsOf[i]);
      }
    });

    it("Should assign name to the token", async function () {
      const agentAddresses = [generateRandomAddress()];

      const tokenId = await proposeAndMint(
        _otherAccount.address,
        agentAddresses,
        DEFAULT_ROLE,
        DEFAULT_NAME,
        DEFAULT_IMAGES,
        DEFAULT_MISSION,
        NONCE_1
      );

      expect(await _agenticAIAgentCollection.nameOf(tokenId)).to.equal(
        DEFAULT_NAME
      );
    });

    it("Should assign images to the token", async function () {
      const agentAddresses = [generateRandomAddress()];

      const tokenId = await proposeAndMint(
        _otherAccount.address,
        agentAddresses,
        DEFAULT_ROLE,
        DEFAULT_NAME,
        DEFAULT_IMAGES,
        DEFAULT_MISSION,
        NONCE_1
      );

      const imagesOf = await _agenticAIAgentCollection.imagesOf(tokenId);

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

      const tokenId = await proposeAndMint(
        _otherAccount.address,
        agentAddresses,
        DEFAULT_ROLE,
        DEFAULT_NAME,
        DEFAULT_IMAGES,
        DEFAULT_MISSION,
        NONCE_1
      );

      expect(await _agenticAIAgentCollection.creatorOf(tokenId)).to.equal(
        _owner.address
      );
    });

    it("Should assign role to the token", async function () {
      const agentAddresses = [generateRandomAddress()];

      const tokenId = await proposeAndMint(
        _otherAccount.address,
        agentAddresses,
        DEFAULT_ROLE,
        DEFAULT_NAME,
        DEFAULT_IMAGES,
        DEFAULT_MISSION,
        NONCE_1
      );

      expect(await _agenticAIAgentCollection.roleOf(tokenId)).to.equal(
        DEFAULT_ROLE
      );
    });

    it("Should assign token id to name", async function () {
      const agentAddresses = [generateRandomAddress()];

      const tokenId = await proposeAndMint(
        _otherAccount.address,
        agentAddresses,
        DEFAULT_ROLE,
        DEFAULT_NAME,
        DEFAULT_IMAGES,
        DEFAULT_MISSION,
        NONCE_1
      );

      expect(
        await _agenticAIAgentCollection.tokenIdOf(DEFAULT_NAME)
      ).to.be.equal(tokenId);
    });

    it("Should emit 'Minted' event", async function () {
      const agentAddresses = [generateRandomAddress()];

      const tokenId = await _agenticAIAgentCollection.nextTokenId();

      const signature = await signMintRequest(
        _signer,
        _agenticAIAgentCollection,
        {
          to: _otherAccount.address,
          agentAddresses,
          signer: _signer.address,
          role: DEFAULT_ROLE,
          name: DEFAULT_NAME,
          images: DEFAULT_IMAGES,
          mission: DEFAULT_MISSION,
          nonce: NONCE_1,
        }
      );

      await _agenticAIAgentCollection.createMintProposal(
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

      const mintProposalsLength =
        await _agenticAIAgentCollection.mintProposalsLength();

      await expect(
        _agenticAIAgentCollection
          .connect(_owner)
          .mintFromProposal(mintProposalsLength - BigInt(1))
      )
        .to.emit(_agenticAIAgentCollection, "Minted")
        .withArgs(_otherAccount.address, _signer.address, tokenId);
    });

    it("Should emit 'AgentSignerUpdated' event", async function () {
      const agentAddresses = [generateRandomAddress()];

      const tokenId = await _agenticAIAgentCollection.nextTokenId();

      const signature = await signMintRequest(
        _signer,
        _agenticAIAgentCollection,
        {
          to: _otherAccount.address,
          agentAddresses,
          signer: _signer.address,
          role: DEFAULT_ROLE,
          name: DEFAULT_NAME,
          images: DEFAULT_IMAGES,
          mission: DEFAULT_MISSION,
          nonce: NONCE_1,
        }
      );

      await _agenticAIAgentCollection.createMintProposal(
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

      const mintProposalsLength =
        await _agenticAIAgentCollection.mintProposalsLength();

      await expect(
        _agenticAIAgentCollection
          .connect(_owner)
          .mintFromProposal(mintProposalsLength - BigInt(1))
      )
        .to.emit(_agenticAIAgentCollection, "AgentSignerUpdated")
        .withArgs(tokenId, ethers.ZeroAddress, _signer.address);
    });

    it("Should emit 'MintProposalRemoved' event", async function () {
      const agentAddresses = [generateRandomAddress()];

      const signature = await signMintRequest(
        _signer,
        _agenticAIAgentCollection,
        {
          to: _otherAccount.address,
          agentAddresses,
          signer: _signer.address,
          role: DEFAULT_ROLE,
          name: DEFAULT_NAME,
          images: DEFAULT_IMAGES,
          mission: DEFAULT_MISSION,
          nonce: NONCE_1,
        }
      );

      await _agenticAIAgentCollection.createMintProposal(
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

      const mintProposalsLength =
        await _agenticAIAgentCollection.mintProposalsLength();

      await expect(
        _agenticAIAgentCollection
          .connect(_owner)
          .mintFromProposal(mintProposalsLength - BigInt(1))
      )
        .to.emit(_agenticAIAgentCollection, "MintProposalRemoved")
        .withArgs(
          _otherAccount.address,
          _signer.address,
          mintProposalsLength - BigInt(1)
        );
    });

    it("Should decrease proposals length", async function () {
      const agentAddresses = [generateRandomAddress()];

      const signature = await signMintRequest(
        _signer,
        _agenticAIAgentCollection,
        {
          to: _otherAccount.address,
          agentAddresses,
          signer: _signer.address,
          role: DEFAULT_ROLE,
          name: DEFAULT_NAME,
          images: DEFAULT_IMAGES,
          mission: DEFAULT_MISSION,
          nonce: NONCE_1,
        }
      );

      await _agenticAIAgentCollection.createMintProposal(
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

      const lengthBefore =
        await _agenticAIAgentCollection.mintProposalsLength();

      await _agenticAIAgentCollection
        .connect(_owner)
        .mintFromProposal(lengthBefore - BigInt(1));

      expect(await _agenticAIAgentCollection.mintProposalsLength()).to.eq(
        lengthBefore - BigInt(1)
      );
    });

    it("Should reorder remaining proposals", async function () {
      const agentAddresses = [generateRandomAddress()];

      const sig1 = await signMintRequest(_signer, _agenticAIAgentCollection, {
        to: _otherAccount.address,
        agentAddresses,
        signer: _signer.address,
        role: DEFAULT_ROLE,
        name: DEFAULT_NAME_1,
        images: DEFAULT_IMAGES,
        mission: DEFAULT_MISSION,
        nonce: NONCE_1,
      });

      await _agenticAIAgentCollection.createMintProposal(
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

      const sig2 = await signMintRequest(_signer, _agenticAIAgentCollection, {
        to: _otherAccount.address,
        agentAddresses,
        signer: _signer.address,
        role: DEFAULT_ROLE,
        name: DEFAULT_NAME_2,
        images: DEFAULT_IMAGES,
        mission: DEFAULT_MISSION,
        nonce: NONCE_2,
      });

      await _agenticAIAgentCollection.createMintProposal(
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

      expect(await _agenticAIAgentCollection.mintProposalsLength()).to.eq(2n);

      await _agenticAIAgentCollection.connect(_owner).mintFromProposal(0);

      expect(await _agenticAIAgentCollection.mintProposalsLength()).to.eq(1n);

      const proposal = await _agenticAIAgentCollection.mintProposal(0);
      expect(proposal.name).to.equal(DEFAULT_NAME_2);
    });
  });
});
