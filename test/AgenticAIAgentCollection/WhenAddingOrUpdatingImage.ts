import { expect } from "chai";
import { ethers } from "hardhat";
import { AgenticAIAgentCollection } from "../../typechain-types";
import { loadFixture, reset } from "@nomicfoundation/hardhat-network-helpers";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import {
  generateRandomAddress,
  generateRandomNonce,
  signCreateMintProposalRequest,
} from "../common";

describe("WhenAddingOrUpdatingImage", function () {
  const ipfsGateway = "https://ipfs.io/ipfs/";

  let _agenticAIAgentCollection: AgenticAIAgentCollection;
  let _owner: HardhatEthersSigner;
  let _signer: HardhatEthersSigner;
  let _moderator: HardhatEthersSigner;
  let _otherAccount: HardhatEthersSigner;

  async function deployAgenticAIAgentCollection() {
    await reset();

    const [owner, signer, moderator, otherAccount] = await ethers.getSigners();

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
      moderator.address,
      await collectionsManager.getAddress(),
      await collectionsDescriptor.getAddress()
    );

    const signerRole = await collectionsManager.SIGNER_ROLE();
    await collectionsManager.grantRole(signerRole, signer.address);

    return { collection, owner, signer, moderator, otherAccount };
  }

  beforeEach(async function () {
    const { collection, owner, signer, moderator, otherAccount } =
      await loadFixture(deployAgenticAIAgentCollection);

    _agenticAIAgentCollection = collection;
    _owner = owner;
    _signer = signer;
    _moderator = moderator;
    _otherAccount = otherAccount;
  });

  async function proposeAndMint(to: string) {
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

    const signature = await signCreateMintProposalRequest(
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
      .connect(_moderator)
      .mintFromProposal(mintProposalsLength - BigInt(1));

    return tokenId;
  }

  describe("Given caller is not moderator", function () {
    it("Should revert with 'AccessControlUnauthorizedAccount' error", async function () {
      const tokenId = await proposeAndMint(await _owner.getAddress());

      await _agenticAIAgentCollection.createAddOrUpdateImageProposal(tokenId, {
        key: "profile",
        value: "cid1",
      });

      await expect(
        _agenticAIAgentCollection.connect(_owner).addOrUpdateImage(0)
      ).to.be.revertedWithCustomError(
        _agenticAIAgentCollection,
        "AccessControlUnauthorizedAccount"
      );
    });
  });

  describe("Given caller is moderator", function () {
    describe("And proposal does not exist", function () {
      it("Should revert", async function () {
        await proposeAndMint(await _owner.getAddress());

        return expect(
          _agenticAIAgentCollection.connect(_moderator).addOrUpdateImage(0)
        ).to.be.reverted;
      });
    });

    describe("And image key does not exist", function () {
      it("Should add the image", async function () {
        const tokenId = await proposeAndMint(await _owner.getAddress());

        await _agenticAIAgentCollection.createAddOrUpdateImageProposal(
          tokenId,
          {
            key: "profile",
            value: "cid1",
          }
        );

        await _agenticAIAgentCollection.connect(_moderator).addOrUpdateImage(0);

        const images = await _agenticAIAgentCollection.imagesOf(tokenId);
        expect(images.length).to.equal(2);
        expect(images[1][0]).to.equal("profile");
        expect(images[1][1]).to.equal("cid1");
      });

      it("Should emit 'AgentImageUpdated' event", async function () {
        const tokenId = await proposeAndMint(await _owner.getAddress());

        await _agenticAIAgentCollection.createAddOrUpdateImageProposal(
          tokenId,
          {
            key: "profile",
            value: "cid1",
          }
        );

        await expect(
          _agenticAIAgentCollection.connect(_moderator).addOrUpdateImage(0)
        )
          .to.emit(_agenticAIAgentCollection, "AgentImageUpdated")
          .withArgs(tokenId, "profile", "", "cid1");
      });

      it("Should emit 'AgentImageProposalRemoved' event", async function () {
        const tokenId = await proposeAndMint(await _owner.getAddress());

        await _agenticAIAgentCollection.createAddOrUpdateImageProposal(
          tokenId,
          {
            key: "profile",
            value: "cid1",
          }
        );

        await expect(
          _agenticAIAgentCollection.connect(_moderator).addOrUpdateImage(0)
        )
          .to.emit(_agenticAIAgentCollection, "AgentImageProposalRemoved")
          .withArgs(tokenId, "profile", 0n);
      });
    });

    describe("And image key exists", function () {
      it("Should update the image value", async function () {
        const tokenId = await proposeAndMint(await _owner.getAddress());

        await _agenticAIAgentCollection.createAddOrUpdateImageProposal(
          tokenId,
          {
            key: "profile",
            value: "cid1",
          }
        );
        await _agenticAIAgentCollection.connect(_moderator).addOrUpdateImage(0);

        await _agenticAIAgentCollection.createAddOrUpdateImageProposal(
          tokenId,
          {
            key: "profile",
            value: "cid2",
          }
        );

        const proposalIndex =
          (await _agenticAIAgentCollection.addOrUpdateProposalsLength()) -
          BigInt(1);

        await _agenticAIAgentCollection
          .connect(_moderator)
          .addOrUpdateImage(proposalIndex);

        const images = await _agenticAIAgentCollection.imagesOf(tokenId);
        expect(images.length).to.equal(2);
        expect(images[1][0]).to.equal("profile");
        expect(images[1][1]).to.equal("cid2");
      });

      it("Should emit 'AgentImageUpdated' event", async function () {
        const tokenId = await proposeAndMint(await _owner.getAddress());

        await _agenticAIAgentCollection.createAddOrUpdateImageProposal(
          tokenId,
          {
            key: "profile",
            value: "cid1",
          }
        );
        await _agenticAIAgentCollection.connect(_moderator).addOrUpdateImage(0);

        await _agenticAIAgentCollection.createAddOrUpdateImageProposal(
          tokenId,
          {
            key: "profile",
            value: "cid2",
          }
        );

        const proposalIndex =
          (await _agenticAIAgentCollection.addOrUpdateProposalsLength()) -
          BigInt(1);

        await expect(
          _agenticAIAgentCollection
            .connect(_moderator)
            .addOrUpdateImage(proposalIndex)
        )
          .to.emit(_agenticAIAgentCollection, "AgentImageUpdated")
          .withArgs(tokenId, "profile", "cid1", "cid2");
      });

      it("Should emit 'AgentImageProposalRemoved' event", async function () {
        const tokenId = await proposeAndMint(await _owner.getAddress());

        await _agenticAIAgentCollection.createAddOrUpdateImageProposal(
          tokenId,
          {
            key: "profile",
            value: "cid1",
          }
        );
        await _agenticAIAgentCollection.connect(_moderator).addOrUpdateImage(0);

        await _agenticAIAgentCollection.createAddOrUpdateImageProposal(
          tokenId,
          {
            key: "profile",
            value: "cid2",
          }
        );

        const proposalIndex =
          (await _agenticAIAgentCollection.addOrUpdateProposalsLength()) -
          BigInt(1);

        await expect(
          _agenticAIAgentCollection
            .connect(_moderator)
            .addOrUpdateImage(proposalIndex)
        )
          .to.emit(_agenticAIAgentCollection, "AgentImageProposalRemoved")
          .withArgs(tokenId, "profile", proposalIndex);
      });
    });

    describe("And proposal is executed", function () {
      it("Should not be executable twice", async function () {
        const tokenId = await proposeAndMint(await _owner.getAddress());

        await _agenticAIAgentCollection.createAddOrUpdateImageProposal(
          tokenId,
          {
            key: "profile",
            value: "cid1",
          }
        );

        const proposalIndex =
          (await _agenticAIAgentCollection.addOrUpdateProposalsLength()) -
          BigInt(1);

        await _agenticAIAgentCollection
          .connect(_moderator)
          .addOrUpdateImage(proposalIndex);

        expect(
          await _agenticAIAgentCollection.addOrUpdateProposalsLength()
        ).to.eq(0n);

        await expect(
          _agenticAIAgentCollection
            .connect(_moderator)
            .addOrUpdateImage(proposalIndex)
        ).to.be.reverted;
      });

      it("Should reorder remaining proposals", async function () {
        const tokenId = await proposeAndMint(await _owner.getAddress());

        await _agenticAIAgentCollection.createAddOrUpdateImageProposal(
          tokenId,
          {
            key: "profile1",
            value: "cid1",
          }
        );

        await _agenticAIAgentCollection.createAddOrUpdateImageProposal(
          tokenId,
          {
            key: "profile2",
            value: "cid2",
          }
        );

        expect(
          await _agenticAIAgentCollection.addOrUpdateProposalsLength()
        ).to.eq(2n);

        await _agenticAIAgentCollection.connect(_moderator).addOrUpdateImage(0);

        expect(
          await _agenticAIAgentCollection.addOrUpdateProposalsLength()
        ).to.eq(1n);

        const proposal = await _agenticAIAgentCollection.addOrUpdateProposal(0);
        expect(proposal.image.key).to.equal("profile2");
        expect(proposal.image.value).to.equal("cid2");

        const images = await _agenticAIAgentCollection.imagesOf(tokenId);
        expect(images.length).to.equal(2);
        expect(images[1][0]).to.equal("profile1");
      });
    });
  });
});
