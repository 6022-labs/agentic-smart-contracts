import { expect } from "chai";
import { ethers } from "hardhat";
import { AgentCollectionV1 } from "../../typechain-types";
import { proposeAndMint, deployCollectionWithCreator } from "../common";
import { loadFixture, reset } from "@nomicfoundation/hardhat-network-helpers";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";

describe("WhenAddingOrUpdatingImage", function () {
  const ipfsGateway = "https://ipfs.io/ipfs/";

  let _collection: AgentCollectionV1;
  let _owner: HardhatEthersSigner;
  let _signer: HardhatEthersSigner;
  let _moderator: HardhatEthersSigner;
  let _otherAccount: HardhatEthersSigner;

  async function deployAgentCollection() {
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
      await loadFixture(deployAgentCollection);

    _collection = collection;
    _owner = owner;
    _signer = signer;
    _moderator = moderator;
    _otherAccount = otherAccount;
  });

  describe("Given caller is not moderator", function () {
    it("Should revert with 'AccessControlUnauthorizedAccount' error", async function () {
      const tokenId = await proposeAndMint(_signer, _collection, _moderator, {
        to: await _owner.getAddress(),
      });

      await _collection.createAddOrUpdateImageProposal(tokenId, {
        key: "profile",
        value: "cid1",
      });

      await expect(
        _collection.connect(_owner).addOrUpdateImageFromProposal(0)
      ).to.be.revertedWithCustomError(
        _collection,
        "AccessControlUnauthorizedAccount"
      );
    });
  });

  describe("Given caller is moderator", function () {
    describe("And proposal does not exist", function () {
      it("Should revert", async function () {
        await proposeAndMint(_signer, _collection, _moderator, {
          to: await _owner.getAddress(),
        });

        return expect(
          _collection.connect(_moderator).addOrUpdateImageFromProposal(0)
        ).to.be.reverted;
      });
    });

    describe("And image key does not exist", function () {
      it("Should add the image", async function () {
        const tokenId = await proposeAndMint(_signer, _collection, _moderator, {
          to: await _owner.getAddress(),
        });

        await _collection.createAddOrUpdateImageProposal(tokenId, {
          key: "profile",
          value: "cid1",
        });

        await _collection.connect(_moderator).addOrUpdateImageFromProposal(0);

        const images = await _collection.imagesOf(tokenId);
        expect(images.length).to.equal(2);
        expect(images[1][0]).to.equal("profile");
        expect(images[1][1]).to.equal("cid1");
      });

      it("Should emit 'AgentImageUpdated' event", async function () {
        const tokenId = await proposeAndMint(_signer, _collection, _moderator, {
          to: await _owner.getAddress(),
        });

        await _collection.createAddOrUpdateImageProposal(tokenId, {
          key: "profile",
          value: "cid1",
        });

        await expect(
          _collection.connect(_moderator).addOrUpdateImageFromProposal(0)
        )
          .to.emit(_collection, "AgentImageUpdated")
          .withArgs(tokenId, "profile", "", "cid1");
      });

      it("Should emit 'AgentImageProposalRemoved' event", async function () {
        const tokenId = await proposeAndMint(_signer, _collection, _moderator, {
          to: await _owner.getAddress(),
        });

        await _collection.createAddOrUpdateImageProposal(tokenId, {
          key: "profile",
          value: "cid1",
        });

        await expect(
          _collection.connect(_moderator).addOrUpdateImageFromProposal(0)
        )
          .to.emit(_collection, "AgentImageProposalRemoved")
          .withArgs(tokenId, "profile", 0n);
      });
    });

    describe("And image key exists", function () {
      it("Should update the image value", async function () {
        const tokenId = await proposeAndMint(_signer, _collection, _moderator, {
          to: await _owner.getAddress(),
        });

        await _collection.createAddOrUpdateImageProposal(tokenId, {
          key: "profile",
          value: "cid1",
        });
        await _collection.connect(_moderator).addOrUpdateImageFromProposal(0);

        await _collection.createAddOrUpdateImageProposal(tokenId, {
          key: "profile",
          value: "cid2",
        });

        const proposalIndex =
          (await _collection.addOrUpdateProposalsLength()) - BigInt(1);

        await _collection
          .connect(_moderator)
          .addOrUpdateImageFromProposal(proposalIndex);

        const images = await _collection.imagesOf(tokenId);
        expect(images.length).to.equal(2);
        expect(images[1][0]).to.equal("profile");
        expect(images[1][1]).to.equal("cid2");
      });

      it("Should emit 'AgentImageUpdated' event", async function () {
        const tokenId = await proposeAndMint(_signer, _collection, _moderator, {
          to: await _owner.getAddress(),
        });

        await _collection.createAddOrUpdateImageProposal(tokenId, {
          key: "profile",
          value: "cid1",
        });
        await _collection.connect(_moderator).addOrUpdateImageFromProposal(0);

        await _collection.createAddOrUpdateImageProposal(tokenId, {
          key: "profile",
          value: "cid2",
        });

        const proposalIndex =
          (await _collection.addOrUpdateProposalsLength()) - BigInt(1);

        await expect(
          _collection
            .connect(_moderator)
            .addOrUpdateImageFromProposal(proposalIndex)
        )
          .to.emit(_collection, "AgentImageUpdated")
          .withArgs(tokenId, "profile", "cid1", "cid2");
      });

      it("Should emit 'AgentImageProposalRemoved' event", async function () {
        const tokenId = await proposeAndMint(_signer, _collection, _moderator, {
          to: await _owner.getAddress(),
        });

        await _collection.createAddOrUpdateImageProposal(tokenId, {
          key: "profile",
          value: "cid1",
        });
        await _collection.connect(_moderator).addOrUpdateImageFromProposal(0);

        await _collection.createAddOrUpdateImageProposal(tokenId, {
          key: "profile",
          value: "cid2",
        });

        const proposalIndex =
          (await _collection.addOrUpdateProposalsLength()) - BigInt(1);

        await expect(
          _collection
            .connect(_moderator)
            .addOrUpdateImageFromProposal(proposalIndex)
        )
          .to.emit(_collection, "AgentImageProposalRemoved")
          .withArgs(tokenId, "profile", proposalIndex);
      });
    });

    describe("And proposal is executed", function () {
      it("Should not be executable twice", async function () {
        const tokenId = await proposeAndMint(_signer, _collection, _moderator, {
          to: await _owner.getAddress(),
        });

        await _collection.createAddOrUpdateImageProposal(tokenId, {
          key: "profile",
          value: "cid1",
        });

        const proposalIndex =
          (await _collection.addOrUpdateProposalsLength()) - BigInt(1);

        await _collection
          .connect(_moderator)
          .addOrUpdateImageFromProposal(proposalIndex);

        expect(await _collection.addOrUpdateProposalsLength()).to.eq(0n);

        await expect(
          _collection
            .connect(_moderator)
            .addOrUpdateImageFromProposal(proposalIndex)
        ).to.be.reverted;
      });

      it("Should reorder remaining proposals", async function () {
        const tokenId = await proposeAndMint(_signer, _collection, _moderator, {
          to: await _owner.getAddress(),
        });

        await _collection.createAddOrUpdateImageProposal(tokenId, {
          key: "profile1",
          value: "cid1",
        });

        await _collection.createAddOrUpdateImageProposal(tokenId, {
          key: "profile2",
          value: "cid2",
        });

        expect(await _collection.addOrUpdateProposalsLength()).to.eq(2n);

        await _collection.connect(_moderator).addOrUpdateImageFromProposal(0);

        expect(await _collection.addOrUpdateProposalsLength()).to.eq(1n);

        const proposal = await _collection.addOrUpdateProposal(0);
        expect(proposal.image.key).to.equal("profile2");
        expect(proposal.image.value).to.equal("cid2");

        const images = await _collection.imagesOf(tokenId);
        expect(images.length).to.equal(2);
        expect(images[1][0]).to.equal("profile1");
      });
    });
  });
});
