import { expect } from "chai";
import { ethers } from "hardhat";
import { AgentCollectionV1 } from "../../typechain-types";
import { proposeAndMint, deployCollectionWithCreator } from "../common";
import { loadFixture, reset } from "@nomicfoundation/hardhat-network-helpers";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";

describe("WhenAddingOrUpdatingAgentImageFromProposal", function () {
  const ipfsGateway = "https://ipfs.io/ipfs/";

  let _collection: AgentCollectionV1;
  let _owner: HardhatEthersSigner;
  let _moderator: HardhatEthersSigner;

  async function deployAgentCollection() {
    await reset();

    const [owner, moderator] = await ethers.getSigners();

    const { collection } = await deployCollectionWithCreator({
      owner,
      moderator,
      ipfsGateway,
    });

    return { collection, owner, moderator };
  }

  beforeEach(async function () {
    const { collection, owner, moderator } = await loadFixture(
      deployAgentCollection
    );

    _collection = collection;
    _owner = owner;
    _moderator = moderator;
  });

  describe("Given caller is not moderator", function () {
    it("Should revert with 'AccessControlUnauthorizedAccount' error", async function () {
      const tokenId = await proposeAndMint(_collection, _moderator, {
        to: await _owner.getAddress(),
      });

      await _collection.createAddOrUpdateAgentImageProposal(tokenId, {
        key: "profile",
        value: "cid1",
      });

      const { id: proposalId } =
        await _collection.addOrUpdateAgentImageProposal(0);

      await expect(
        _collection
          .connect(_owner)
          .addOrUpdateAgentImageFromProposal(proposalId)
      ).to.be.revertedWithCustomError(
        _collection,
        "AccessControlUnauthorizedAccount"
      );
    });
  });

  describe("Given caller is moderator", function () {
    describe("And proposal does not exist", function () {
      it("Should revert with 'ProposalNotFound' when no image proposals exist", async function () {
        await proposeAndMint(_collection, _moderator, {
          to: await _owner.getAddress(),
        });

        await expect(
          _collection.connect(_moderator).addOrUpdateAgentImageFromProposal(0)
        )
          .to.be.revertedWithCustomError(_collection, "ProposalNotFound")
          .withArgs(0);
      });

      it("Should revert with 'ProposalNotFound' for a bogus id while a live proposal exists (not apply index 0)", async function () {
        const tokenId = await proposeAndMint(_collection, _moderator, {
          to: await _owner.getAddress(),
        });

        await _collection.createAddOrUpdateAgentImageProposal(tokenId, {
          key: "profile",
          value: "cid1",
        });

        await expect(
          _collection
            .connect(_moderator)
            .addOrUpdateAgentImageFromProposal(9999)
        )
          .to.be.revertedWithCustomError(_collection, "ProposalNotFound")
          .withArgs(9999);

        // The live proposal must be untouched and the image not applied.
        expect(await _collection.addOrUpdateAgentImageProposalsLength()).to.eq(
          1n
        );
        expect(await _collection.imagesCountOf(tokenId)).to.equal(1);
      });
    });

    describe("And image key does not exist", function () {
      it("Should add the image", async function () {
        const tokenId = await proposeAndMint(_collection, _moderator, {
          to: await _owner.getAddress(),
        });

        await _collection.createAddOrUpdateAgentImageProposal(tokenId, {
          key: "profile",
          value: "cid1",
        });

        const { id: proposalId } =
          await _collection.addOrUpdateAgentImageProposal(0);

        await _collection
          .connect(_moderator)
          .addOrUpdateAgentImageFromProposal(proposalId);

        const imagesCount = await _collection.imagesCountOf(tokenId);
        expect(imagesCount).to.equal(2);

        const images: [string, string][] = [];
        for (let i = 0; i < imagesCount; i++) {
          const image = await _collection.imageOfByIndex(tokenId, i);
          images.push([image.key, image.value]);
        }

        expect(images[1][0]).to.equal("profile");
        expect(images[1][1]).to.equal("cid1");
      });

      it("Should emit 'AgentImageUpdated' event", async function () {
        const tokenId = await proposeAndMint(_collection, _moderator, {
          to: await _owner.getAddress(),
        });

        await _collection.createAddOrUpdateAgentImageProposal(tokenId, {
          key: "profile",
          value: "cid1",
        });

        const { id: proposalId } =
          await _collection.addOrUpdateAgentImageProposal(0);

        await expect(
          _collection
            .connect(_moderator)
            .addOrUpdateAgentImageFromProposal(proposalId)
        )
          .to.emit(_collection, "AgentImageUpdated")
          .withArgs(tokenId, "profile", "", "cid1");
      });

      it("Should emit 'AgentImageProposalRemoved' event", async function () {
        const tokenId = await proposeAndMint(_collection, _moderator, {
          to: await _owner.getAddress(),
        });

        await _collection.createAddOrUpdateAgentImageProposal(tokenId, {
          key: "profile",
          value: "cid1",
        });

        const { id: proposalId } =
          await _collection.addOrUpdateAgentImageProposal(0);

        await expect(
          _collection
            .connect(_moderator)
            .addOrUpdateAgentImageFromProposal(proposalId)
        )
          .to.emit(_collection, "AgentImageProposalRemoved")
          .withArgs(tokenId, "profile", proposalId);
      });
    });

    describe("And image key exists", function () {
      it("Should update the image value", async function () {
        const tokenId = await proposeAndMint(_collection, _moderator, {
          to: await _owner.getAddress(),
        });

        await _collection.createAddOrUpdateAgentImageProposal(tokenId, {
          key: "profile",
          value: "cid1",
        });
        const { id: firstProposalId } =
          await _collection.addOrUpdateAgentImageProposal(0);
        await _collection
          .connect(_moderator)
          .addOrUpdateAgentImageFromProposal(firstProposalId);

        await _collection.createAddOrUpdateAgentImageProposal(tokenId, {
          key: "profile",
          value: "cid2",
        });

        const proposalIndex =
          (await _collection.addOrUpdateAgentImageProposalsLength()) -
          BigInt(1);
        const { id: proposalId } =
          await _collection.addOrUpdateAgentImageProposal(proposalIndex);

        await _collection
          .connect(_moderator)
          .addOrUpdateAgentImageFromProposal(proposalId);

        const imagesCount = await _collection.imagesCountOf(tokenId);
        expect(imagesCount).to.equal(2);

        const images: [string, string][] = [];
        for (let i = 0; i < imagesCount; i++) {
          const image = await _collection.imageOfByIndex(tokenId, i);
          images.push([image.key, image.value]);
        }

        expect(images[1][0]).to.equal("profile");
        expect(images[1][1]).to.equal("cid2");
      });

      it("Should emit 'AgentImageUpdated' event", async function () {
        const tokenId = await proposeAndMint(_collection, _moderator, {
          to: await _owner.getAddress(),
        });

        await _collection.createAddOrUpdateAgentImageProposal(tokenId, {
          key: "profile",
          value: "cid1",
        });
        const { id: firstProposalId } =
          await _collection.addOrUpdateAgentImageProposal(0);
        await _collection
          .connect(_moderator)
          .addOrUpdateAgentImageFromProposal(firstProposalId);

        await _collection.createAddOrUpdateAgentImageProposal(tokenId, {
          key: "profile",
          value: "cid2",
        });

        const proposalIndex =
          (await _collection.addOrUpdateAgentImageProposalsLength()) -
          BigInt(1);
        const { id: proposalId } =
          await _collection.addOrUpdateAgentImageProposal(proposalIndex);

        await expect(
          _collection
            .connect(_moderator)
            .addOrUpdateAgentImageFromProposal(proposalId)
        )
          .to.emit(_collection, "AgentImageUpdated")
          .withArgs(tokenId, "profile", "cid1", "cid2");
      });

      it("Should emit 'AgentImageProposalRemoved' event", async function () {
        const tokenId = await proposeAndMint(_collection, _moderator, {
          to: await _owner.getAddress(),
        });

        await _collection.createAddOrUpdateAgentImageProposal(tokenId, {
          key: "profile",
          value: "cid1",
        });
        const { id: firstProposalId } =
          await _collection.addOrUpdateAgentImageProposal(0);
        await _collection
          .connect(_moderator)
          .addOrUpdateAgentImageFromProposal(firstProposalId);

        await _collection.createAddOrUpdateAgentImageProposal(tokenId, {
          key: "profile",
          value: "cid2",
        });

        const proposalIndex =
          (await _collection.addOrUpdateAgentImageProposalsLength()) -
          BigInt(1);
        const { id: proposalId } =
          await _collection.addOrUpdateAgentImageProposal(proposalIndex);

        await expect(
          _collection
            .connect(_moderator)
            .addOrUpdateAgentImageFromProposal(proposalId)
        )
          .to.emit(_collection, "AgentImageProposalRemoved")
          .withArgs(tokenId, "profile", proposalId);
      });
    });

    describe("And proposal is executed", function () {
      it("Should not be executable twice", async function () {
        const tokenId = await proposeAndMint(_collection, _moderator, {
          to: await _owner.getAddress(),
        });

        await _collection.createAddOrUpdateAgentImageProposal(tokenId, {
          key: "profile",
          value: "cid1",
        });

        const proposalIndex =
          (await _collection.addOrUpdateAgentImageProposalsLength()) -
          BigInt(1);
        const { id: proposalId } =
          await _collection.addOrUpdateAgentImageProposal(proposalIndex);

        await _collection
          .connect(_moderator)
          .addOrUpdateAgentImageFromProposal(proposalId);

        expect(await _collection.addOrUpdateAgentImageProposalsLength()).to.eq(
          0n
        );

        await expect(
          _collection
            .connect(_moderator)
            .addOrUpdateAgentImageFromProposal(proposalId)
        ).to.be.reverted;
      });

      it("Should reorder remaining proposals", async function () {
        const tokenId = await proposeAndMint(_collection, _moderator, {
          to: await _owner.getAddress(),
        });

        await _collection.createAddOrUpdateAgentImageProposal(tokenId, {
          key: "profile1",
          value: "cid1",
        });

        await _collection.createAddOrUpdateAgentImageProposal(tokenId, {
          key: "profile2",
          value: "cid2",
        });

        expect(await _collection.addOrUpdateAgentImageProposalsLength()).to.eq(
          2n
        );

        const { id: firstProposalId } =
          await _collection.addOrUpdateAgentImageProposal(0);

        await _collection
          .connect(_moderator)
          .addOrUpdateAgentImageFromProposal(firstProposalId);

        expect(await _collection.addOrUpdateAgentImageProposalsLength()).to.eq(
          1n
        );

        const proposal = await _collection.addOrUpdateAgentImageProposal(0);
        expect(proposal.image.key).to.equal("profile2");
        expect(proposal.image.value).to.equal("cid2");

        const imagesCount = await _collection.imagesCountOf(tokenId);
        expect(imagesCount).to.equal(2);

        const images: [string, string][] = [];
        for (let i = 0; i < imagesCount; i++) {
          const image = await _collection.imageOfByIndex(tokenId, i);
          images.push([image.key, image.value]);
        }

        expect(images[1][0]).to.equal("profile1");
      });

      it("Should remove only the applied proposal when applying out of order", async function () {
        const tokenId = await proposeAndMint(_collection, _moderator, {
          to: await _owner.getAddress(),
        });

        await _collection.createAddOrUpdateAgentImageProposal(tokenId, {
          key: "profile1",
          value: "cid1",
        });
        await _collection.createAddOrUpdateAgentImageProposal(tokenId, {
          key: "profile2",
          value: "cid2",
        });

        // Apply the SECOND proposal (id at index 1), not the first.
        const { id: secondProposalId } =
          await _collection.addOrUpdateAgentImageProposal(1);

        await _collection
          .connect(_moderator)
          .addOrUpdateAgentImageFromProposal(secondProposalId);

        // The untouched profile1 proposal must survive intact.
        expect(await _collection.addOrUpdateAgentImageProposalsLength()).to.eq(
          1n
        );
        const remaining = await _collection.addOrUpdateAgentImageProposal(0);
        expect(remaining.image.key).to.equal("profile1");
        expect(remaining.image.value).to.equal("cid1");
      });
    });
  });
});
