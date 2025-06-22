import { expect } from "chai";
import { ethers } from "hardhat";
import { AgenticAIAgentCollection } from "../../typechain-types";
import { proposeAndMint, deployCollectionWithCreator } from "../common";
import { loadFixture, reset } from "@nomicfoundation/hardhat-network-helpers";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";

describe("WhenCreatingAddOrUpdateImageProposal", function () {
  const ipfsGateway = "https://ipfs.io/ipfs/";

  let _agenticAIAgentCollection: AgenticAIAgentCollection;
  let _owner: HardhatEthersSigner;
  let _signer: HardhatEthersSigner;
  let _moderator: HardhatEthersSigner;
  let _otherAccount: HardhatEthersSigner;

  async function deployAgenticAIAgentCollection() {
    await reset();

    const [owner, signer, moderator, otherAccount] = await ethers.getSigners();

    const { collection, collectionsManager } =
      await deployCollectionWithCreator({
        owner,
        moderator,
        ipfsGateway,
      });

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

  describe("Given no moderators are set", function () {
    it("Should revert with 'NoModerators' error", async function () {
      // Remove all moderators
      const MODERATOR_ROLE = await _agenticAIAgentCollection.MODERATOR_ROLE();

      await _agenticAIAgentCollection
        .connect(_owner)
        .revokeRole(MODERATOR_ROLE, _moderator.address);

      await expect(
        _agenticAIAgentCollection.createAddOrUpdateImageProposal(1n, {
          key: "profile",
          value: "cid1",
        })
      ).to.be.revertedWithCustomError(
        _agenticAIAgentCollection,
        "NoModerators"
      );
    });
  });

  describe("Given token does not exist", function () {
    it("Should revert with 'ERC721NonexistentToken' error", async function () {
      await expect(
        _agenticAIAgentCollection.createAddOrUpdateImageProposal(1n, {
          key: "profile",
          value: "cid1",
        })
      )
        .to.be.revertedWithCustomError(
          _agenticAIAgentCollection,
          "ERC721NonexistentToken"
        )
        .withArgs(1n);
    });
  });

  describe("Given sender is not owner or moderator", function () {
    it("Should revert with 'OwnableUnauthorizedAccount' error", async function () {
      const tokenId = await proposeAndMint(
        _signer,
        _agenticAIAgentCollection,
        _moderator,
        { to: await _owner.getAddress() }
      );

      await expect(
        _agenticAIAgentCollection
          .connect(_otherAccount)
          .createAddOrUpdateImageProposal(tokenId, {
            key: "profile",
            value: "cid1",
          })
      )
        .to.be.revertedWithCustomError(
          _agenticAIAgentCollection,
          "OwnableUnauthorizedAccount"
        )
        .withArgs(await _otherAccount.getAddress(), tokenId);
    });
  });

  describe("Given sender is owner", function () {
    describe("And proposal key does not exist", function () {
      it("Should add the proposal", async function () {
        const tokenId = await proposeAndMint(
          _signer,
          _agenticAIAgentCollection,
          _moderator,
          { to: await _owner.getAddress() }
        );

        expect(
          await _agenticAIAgentCollection.addOrUpdateProposalsLength()
        ).to.eq(0n);

        await _agenticAIAgentCollection.createAddOrUpdateImageProposal(
          tokenId,
          {
            key: "profile",
            value: "cid1",
          }
        );

        expect(
          await _agenticAIAgentCollection.addOrUpdateProposalsLength()
        ).to.eq(1n);

        const proposal = await _agenticAIAgentCollection.addOrUpdateProposal(0);
        expect(proposal.tokenId).to.equal(tokenId);
        expect(proposal.image.key).to.equal("profile");
        expect(proposal.image.value).to.equal("cid1");
      });

      it("Should emit 'AgentImageProposalCreated' event", async function () {
        const tokenId = await proposeAndMint(
          _signer,
          _agenticAIAgentCollection,
          _moderator,
          { to: await _owner.getAddress() }
        );

        await expect(
          _agenticAIAgentCollection.createAddOrUpdateImageProposal(tokenId, {
            key: "profile",
            value: "cid1",
          })
        )
          .to.emit(_agenticAIAgentCollection, "AgentImageProposalCreated")
          .withArgs(tokenId, "profile", 0n);
      });
    });

    describe("And proposal key exists", function () {
      it("Should update existing proposal for same key", async function () {
        const tokenId = await proposeAndMint(
          _signer,
          _agenticAIAgentCollection,
          _moderator,
          { to: await _owner.getAddress() }
        );

        await _agenticAIAgentCollection.createAddOrUpdateImageProposal(
          tokenId,
          {
            key: "profile",
            value: "cid1",
          }
        );

        expect(
          await _agenticAIAgentCollection.addOrUpdateProposalsLength()
        ).to.eq(1n);

        await _agenticAIAgentCollection.createAddOrUpdateImageProposal(
          tokenId,
          {
            key: "profile",
            value: "cid2",
          }
        );

        expect(
          await _agenticAIAgentCollection.addOrUpdateProposalsLength()
        ).to.eq(1n);

        const proposal = await _agenticAIAgentCollection.addOrUpdateProposal(0);
        expect(proposal.tokenId).to.equal(tokenId);
        expect(proposal.image.value).to.equal("cid2");
      });
    });
  });

  describe("Given caller is moderator but not owner", function () {
    describe("And proposal key does not exist", function () {
      it("Should add the proposal", async function () {
        const tokenId = await proposeAndMint(
          _signer,
          _agenticAIAgentCollection,
          _moderator,
          { to: await _owner.getAddress() }
        );

        expect(
          await _agenticAIAgentCollection.addOrUpdateProposalsLength()
        ).to.eq(0n);

        await _agenticAIAgentCollection
          .connect(_moderator)
          .createAddOrUpdateImageProposal(tokenId, {
            key: "profile",
            value: "cid1",
          });

        expect(
          await _agenticAIAgentCollection.addOrUpdateProposalsLength()
        ).to.eq(1n);

        const proposal = await _agenticAIAgentCollection.addOrUpdateProposal(0);
        expect(proposal.tokenId).to.equal(tokenId);
        expect(proposal.image.key).to.equal("profile");
        expect(proposal.image.value).to.equal("cid1");
      });

      it("Should emit 'AgentImageProposalCreated' event", async function () {
        const tokenId = await proposeAndMint(
          _signer,
          _agenticAIAgentCollection,
          _moderator,
          { to: await _owner.getAddress() }
        );

        await expect(
          _agenticAIAgentCollection
            .connect(_moderator)
            .createAddOrUpdateImageProposal(tokenId, {
              key: "profile",
              value: "cid1",
            })
        )
          .to.emit(_agenticAIAgentCollection, "AgentImageProposalCreated")
          .withArgs(tokenId, "profile", 0n);
      });
    });

    describe("And proposal key exists", function () {
      it("Should update existing proposal for same key", async function () {
        const tokenId = await proposeAndMint(
          _signer,
          _agenticAIAgentCollection,
          _moderator,
          { to: await _owner.getAddress() }
        );

        expect(
          await _agenticAIAgentCollection.addOrUpdateProposalsLength()
        ).to.eq(0n);

        await _agenticAIAgentCollection
          .connect(_moderator)
          .createAddOrUpdateImageProposal(tokenId, {
            key: "profile",
            value: "cid1",
          });

        expect(
          await _agenticAIAgentCollection.addOrUpdateProposalsLength()
        ).to.eq(1n);

        const proposal = await _agenticAIAgentCollection.addOrUpdateProposal(0);
        expect(proposal.tokenId).to.equal(tokenId);
        expect(proposal.image.key).to.equal("profile");
        expect(proposal.image.value).to.equal("cid1");
      });
    });
  });
});
