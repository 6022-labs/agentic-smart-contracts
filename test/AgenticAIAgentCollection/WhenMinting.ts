import { expect } from "chai";
import { ethers } from "hardhat";
import { AgenticAIAgentCollection } from "../../typechain-types";
import { loadFixture, reset } from "@nomicfoundation/hardhat-network-helpers";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import {
  generateRandomAddress,
  signCreateMintProposalRequest,
} from "../common";

describe("WhenMinting", function () {
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

  let _agenticAIAAgentCollection: AgenticAIAgentCollection;
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
      owner.address,
      await collectionsManager.getAddress(),
      await collectionsDescriptor.getAddress()
    );

    await collectionsManager.addSigner(signer.address);

    return { collection, owner, signer, otherAccount };
  }

  beforeEach(async function () {
    const { collection, owner, signer, otherAccount } = await loadFixture(
      deployAgenticAIAgentCollection
    );

    _agenticAIAAgentCollection = collection;
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
    const signature = await signCreateMintProposalRequest(
      _signer,
      _agenticAIAAgentCollection,
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

    await _agenticAIAAgentCollection.createMintProposal(
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
      await _agenticAIAAgentCollection.mintProposalsLength();

    const tokenId = await _agenticAIAAgentCollection.nextTokenId();

    await _agenticAIAAgentCollection
      .connect(_owner)
      .mint(mintProposalsLength - BigInt(1));

    return tokenId;
  }

  describe("Given signer is not moderator", function () {
    it("Should revert with 'AccessControlUnauthorizedAccount' error", async function () {
      const agentAddresses = [generateRandomAddress()];

      const signature = await signCreateMintProposalRequest(
        _signer,
        _agenticAIAAgentCollection,
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

      await _agenticAIAAgentCollection.createMintProposal(
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
        await _agenticAIAAgentCollection.mintProposalsLength();

      await expect(
        _agenticAIAAgentCollection
          .connect(_otherAccount)
          .mint(mintProposalsLength - BigInt(1))
      ).to.be.revertedWithCustomError(
        _agenticAIAAgentCollection,
        "AccessControlUnauthorizedAccount"
      );
    });
  });

  describe("Given proposal does not exist", function () {
    it("Should revert", async function () {
      const mintProposalsLength =
        await _agenticAIAAgentCollection.mintProposalsLength();

      await expect(
        _agenticAIAAgentCollection
          .connect(_owner)
          .mint(mintProposalsLength + BigInt(1))
      ).to.be.reverted;
    });
  });

  describe("Given multiple minting proposals share the same name", function () {
    it("Should revert minting the second proposal with 'UsedName' error", async function () {
      const agentAddresses = [generateRandomAddress()];

      const sig1 = await signCreateMintProposalRequest(
        _signer,
        _agenticAIAAgentCollection,
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

      await _agenticAIAAgentCollection.createMintProposal(
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

      const sig2 = await signCreateMintProposalRequest(
        _signer,
        _agenticAIAAgentCollection,
        {
          to: _otherAccount.address,
          agentAddresses,
          signer: _signer.address,
          role: DEFAULT_ROLE,
          name: DEFAULT_NAME,
          images: DEFAULT_IMAGES,
          mission: DEFAULT_MISSION,
          nonce: NONCE_2,
        }
      );

      await _agenticAIAAgentCollection.createMintProposal(
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

      await _agenticAIAAgentCollection.connect(_owner).mint(0);

      await expect(_agenticAIAAgentCollection.connect(_owner).mint(1))
        .to.be.revertedWithCustomError(_agenticAIAAgentCollection, "UsedName")
        .withArgs(DEFAULT_NAME);
    });
  });

  describe("Given a valid minting proposal", function () {
    it("Should mint the token", async function () {
      const agentAddresses = [generateRandomAddress()];
      const tokenId = await _agenticAIAAgentCollection.nextTokenId();

      const signature = await signCreateMintProposalRequest(
        _signer,
        _agenticAIAAgentCollection,
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

      await _agenticAIAAgentCollection.createMintProposal(
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
        await _agenticAIAAgentCollection.mintProposalsLength();

      await expect(
        _agenticAIAAgentCollection
          .connect(_owner)
          .mint(mintProposalsLength - BigInt(1))
      )
        .to.emit(_agenticAIAAgentCollection, "Transfer")
        .withArgs(ethers.ZeroAddress, _otherAccount.address, tokenId);
    });

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

      expect(await _agenticAIAAgentCollection.ownerOf(tokenId)).to.equal(
        _otherAccount.address
      );
    });

    it("Should mint the NFT with the expected token ID", async function () {
      const agentAddresses1 = [generateRandomAddress()];
      const agentAddresses2 = [generateRandomAddress()];

      const baseTokenId = await _agenticAIAAgentCollection.nextTokenId();

      await proposeAndMint(
        _otherAccount.address,
        agentAddresses1,
        DEFAULT_ROLE,
        DEFAULT_NAME_1,
        DEFAULT_IMAGES,
        DEFAULT_MISSION,
        NONCE_1
      );

      await proposeAndMint(
        _otherAccount.address,
        agentAddresses2,
        DEFAULT_ROLE,
        DEFAULT_NAME_2,
        DEFAULT_IMAGES,
        DEFAULT_MISSION,
        NONCE_2
      );

      expect(await _agenticAIAAgentCollection.ownerOf(baseTokenId)).to.equal(
        _otherAccount.address
      );
      expect(
        await _agenticAIAAgentCollection.ownerOf(baseTokenId + BigInt(1))
      ).to.equal(_otherAccount.address);
    });

    it("Should increment next token ID", async function () {
      const agentAddresses1 = [generateRandomAddress()];
      const agentAddresses2 = [generateRandomAddress()];

      const baseTokenId = await _agenticAIAAgentCollection.nextTokenId();

      await proposeAndMint(
        _otherAccount.address,
        agentAddresses1,
        DEFAULT_ROLE,
        DEFAULT_NAME_1,
        DEFAULT_IMAGES,
        DEFAULT_MISSION,
        NONCE_1
      );

      expect(await _agenticAIAAgentCollection.nextTokenId()).to.equal(
        baseTokenId + BigInt(1)
      );

      await proposeAndMint(
        _otherAccount.address,
        agentAddresses2,
        DEFAULT_ROLE,
        DEFAULT_NAME_2,
        DEFAULT_IMAGES,
        DEFAULT_MISSION,
        NONCE_2
      );

      expect(await _agenticAIAAgentCollection.nextTokenId()).to.equal(
        baseTokenId + BigInt(2)
      );
    });

    it("Should mark the nonce as used", async function () {
      const agentAddresses = [generateRandomAddress()];

      await proposeAndMint(
        _otherAccount.address,
        agentAddresses,
        DEFAULT_ROLE,
        DEFAULT_NAME,
        DEFAULT_IMAGES,
        DEFAULT_MISSION,
        NONCE_1
      );

      expect(await _agenticAIAAgentCollection.isNonceUsed(ethers.id(NONCE_1)))
        .to.be.true;
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

      expect(await _agenticAIAAgentCollection.signerOf(tokenId)).to.equal(
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

      const walletsOf = await _agenticAIAAgentCollection.walletsOf(tokenId);

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

      expect(await _agenticAIAAgentCollection.nameOf(tokenId)).to.equal(
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

      const imagesOf = await _agenticAIAAgentCollection.imagesOf(tokenId);

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

      expect(await _agenticAIAAgentCollection.creatorOf(tokenId)).to.equal(
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

      expect(await _agenticAIAAgentCollection.roleOf(tokenId)).to.equal(
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
        await _agenticAIAAgentCollection.tokenIdOf(DEFAULT_NAME)
      ).to.be.equal(tokenId);
    });

    it("Should emit a Minted event", async function () {
      const agentAddresses = [generateRandomAddress()];

      const tokenId = await _agenticAIAAgentCollection.nextTokenId();

      const signature = await signCreateMintProposalRequest(
        _signer,
        _agenticAIAAgentCollection,
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

      await _agenticAIAAgentCollection.createMintProposal(
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
        await _agenticAIAAgentCollection.mintProposalsLength();

      await expect(
        _agenticAIAAgentCollection
          .connect(_owner)
          .mint(mintProposalsLength - BigInt(1))
      )
        .to.emit(_agenticAIAAgentCollection, "Minted")
        .withArgs(_otherAccount.address, _signer.address, tokenId);
    });

    it("Should emit a AgentSignerUpdated event", async function () {
      const agentAddresses = [generateRandomAddress()];

      const tokenId = await _agenticAIAAgentCollection.nextTokenId();

      const signature = await signCreateMintProposalRequest(
        _signer,
        _agenticAIAAgentCollection,
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

      await _agenticAIAAgentCollection.createMintProposal(
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
        await _agenticAIAAgentCollection.mintProposalsLength();

      await expect(
        _agenticAIAAgentCollection
          .connect(_owner)
          .mint(mintProposalsLength - BigInt(1))
      )
        .to.emit(_agenticAIAAgentCollection, "AgentSignerUpdated")
        .withArgs(tokenId, ethers.ZeroAddress, _signer.address);
    });
  });
});
