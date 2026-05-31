import { expect } from "chai";
import { ethers } from "hardhat";
import { AgentCollectionV1 } from "../../typechain-types";
import { proposeAndMint, deployCollectionWithCreator } from "../common";
import { loadFixture, reset } from "@nomicfoundation/hardhat-network-helpers";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";

describe("WhenCreatingAddOrUpdateAgentImageProposal", function () {
  const ipfsGateway = "https://ipfs.io/ipfs/";

  let _collection: AgentCollectionV1;
  let _owner: HardhatEthersSigner;
  let _moderator: HardhatEthersSigner;
  let _otherAccount: HardhatEthersSigner;

  async function deployAgentCollection() {
    await reset();

    const [owner, moderator, otherAccount] = await ethers.getSigners();

    const { collection } = await deployCollectionWithCreator({
      owner,
      moderator,
      ipfsGateway,
    });

    return { collection, owner, moderator, otherAccount };
  }

  beforeEach(async function () {
    const { collection, owner, moderator, otherAccount } = await loadFixture(
      deployAgentCollection
    );

    _collection = collection;
    _owner = owner;
    _moderator = moderator;
    _otherAccount = otherAccount;
  });

  describe("Given no moderators are set", function () {
    it("Should revert with 'NoModerators' error", async function () {
      // Remove all moderators
      const MODERATOR_ROLE = await _collection.MODERATOR_ROLE();

      await _collection
        .connect(_owner)
        .revokeRole(MODERATOR_ROLE, _moderator.address);

      await expect(
        _collection.createAddOrUpdateAgentImageProposal(1n, {
          key: "profile",
          value: "cid1",
        })
      ).to.be.revertedWithCustomError(_collection, "NoModerators");
    });
  });

  describe("Given token does not exist", function () {
    it("Should revert with 'ERC721NonexistentToken' error", async function () {
      await expect(
        _collection.createAddOrUpdateAgentImageProposal(1n, {
          key: "profile",
          value: "cid1",
        })
      )
        .to.be.revertedWithCustomError(_collection, "ERC721NonexistentToken")
        .withArgs(1n);
    });
  });

  describe("Given sender is not owner or moderator", function () {
    it("Should revert with 'OwnableUnauthorizedAccount' error", async function () {
      const tokenId = await proposeAndMint(_collection, _moderator, {
        to: await _owner.getAddress(),
      });

      await expect(
        _collection
          .connect(_otherAccount)
          .createAddOrUpdateAgentImageProposal(tokenId, {
            key: "profile",
            value: "cid1",
          })
      )
        .to.be.revertedWithCustomError(
          _collection,
          "OwnableUnauthorizedAccount"
        )
        .withArgs(await _otherAccount.getAddress(), tokenId);
    });
  });

  describe("Given sender is owner", function () {
    describe("And proposal key does not exist", function () {
      it("Should add the proposal", async function () {
        const tokenId = await proposeAndMint(_collection, _moderator, {
          to: await _owner.getAddress(),
        });

        expect(await _collection.addOrUpdateAgentImageProposalsLength()).to.eq(
          0n
        );

        await _collection.createAddOrUpdateAgentImageProposal(tokenId, {
          key: "profile",
          value: "cid1",
        });

        expect(await _collection.addOrUpdateAgentImageProposalsLength()).to.eq(
          1n
        );

        const proposal = await _collection.addOrUpdateAgentImageProposal(0);
        expect(proposal.tokenId).to.equal(tokenId);
        expect(proposal.image.key).to.equal("profile");
        expect(proposal.image.value).to.equal("cid1");
      });

      it("Should emit 'AgentImageProposalCreated' event", async function () {
        const tokenId = await proposeAndMint(_collection, _moderator, {
          to: await _owner.getAddress(),
        });

        await expect(
          _collection.createAddOrUpdateAgentImageProposal(tokenId, {
            key: "profile",
            value: "cid1",
          })
        )
          .to.emit(_collection, "AgentImageProposalCreated")
          .withArgs(tokenId, "profile", 2n);
      });
    });

    describe("And proposal key exists", function () {
      it("Should update existing proposal for same key", async function () {
        const tokenId = await proposeAndMint(_collection, _moderator, {
          to: await _owner.getAddress(),
        });

        await _collection.createAddOrUpdateAgentImageProposal(tokenId, {
          key: "profile",
          value: "cid1",
        });

        expect(await _collection.addOrUpdateAgentImageProposalsLength()).to.eq(
          1n
        );

        await _collection.createAddOrUpdateAgentImageProposal(tokenId, {
          key: "profile",
          value: "cid2",
        });

        expect(await _collection.addOrUpdateAgentImageProposalsLength()).to.eq(
          1n
        );

        const proposal = await _collection.addOrUpdateAgentImageProposal(0);
        expect(proposal.tokenId).to.equal(tokenId);
        expect(proposal.image.value).to.equal("cid2");
      });
    });
  });

  describe("Given sender is one of the agent's wallets", function () {
    it("Should add the proposal", async function () {
      // owner holds the NFT; _otherAccount is registered as an agent wallet.
      const tokenId = await proposeAndMint(_collection, _moderator, {
        to: await _owner.getAddress(),
        wallets: [_otherAccount.address],
      });

      await _collection
        .connect(_otherAccount)
        .createAddOrUpdateAgentImageProposal(tokenId, {
          key: "profile",
          value: "cid1",
        });

      expect(await _collection.addOrUpdateAgentImageProposalsLength()).to.eq(1n);
      const proposal = await _collection.addOrUpdateAgentImageProposal(0);
      expect(proposal.tokenId).to.equal(tokenId);
      expect(proposal.image.key).to.equal("profile");
    });
  });

  describe("Given caller is moderator but not owner", function () {
    describe("And proposal key does not exist", function () {
      it("Should add the proposal", async function () {
        const tokenId = await proposeAndMint(_collection, _moderator, {
          to: await _owner.getAddress(),
        });

        expect(await _collection.addOrUpdateAgentImageProposalsLength()).to.eq(
          0n
        );

        await _collection
          .connect(_moderator)
          .createAddOrUpdateAgentImageProposal(tokenId, {
            key: "profile",
            value: "cid1",
          });

        expect(await _collection.addOrUpdateAgentImageProposalsLength()).to.eq(
          1n
        );

        const proposal = await _collection.addOrUpdateAgentImageProposal(0);
        expect(proposal.tokenId).to.equal(tokenId);
        expect(proposal.image.key).to.equal("profile");
        expect(proposal.image.value).to.equal("cid1");
      });

      it("Should emit 'AgentImageProposalCreated' event", async function () {
        const tokenId = await proposeAndMint(_collection, _moderator, {
          to: await _owner.getAddress(),
        });

        await expect(
          _collection
            .connect(_moderator)
            .createAddOrUpdateAgentImageProposal(tokenId, {
              key: "profile",
              value: "cid1",
            })
        )
          .to.emit(_collection, "AgentImageProposalCreated")
          .withArgs(tokenId, "profile", 2n);
      });
    });

    describe("And proposal key exists", function () {
      it("Should update existing proposal for same key", async function () {
        const tokenId = await proposeAndMint(_collection, _moderator, {
          to: await _owner.getAddress(),
        });

        expect(await _collection.addOrUpdateAgentImageProposalsLength()).to.eq(
          0n
        );

        await _collection
          .connect(_moderator)
          .createAddOrUpdateAgentImageProposal(tokenId, {
            key: "profile",
            value: "cid1",
          });

        expect(await _collection.addOrUpdateAgentImageProposalsLength()).to.eq(
          1n
        );

        const proposal = await _collection.addOrUpdateAgentImageProposal(0);
        expect(proposal.tokenId).to.equal(tokenId);
        expect(proposal.image.key).to.equal("profile");
        expect(proposal.image.value).to.equal("cid1");
      });
    });
  });
});
