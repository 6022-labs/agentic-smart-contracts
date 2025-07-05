import { expect } from "chai";
import { ethers } from "hardhat";
import { AgentCollectionV1 } from "../../typechain-types";
import { proposeAndMint, deployCollectionWithCreator } from "../common";
import { loadFixture, reset } from "@nomicfoundation/hardhat-network-helpers";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";

describe("WhenRefusingAddOrUpdateImageProposals", function () {
  const ipfsGateway = "https://ipfs.io/ipfs/";

  let _collection: AgentCollectionV1;
  let _owner: HardhatEthersSigner;
  let _signer: HardhatEthersSigner;
  let _moderator: HardhatEthersSigner;
  let _otherAccount: HardhatEthersSigner;

  async function deployCollection() {
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
      await loadFixture(deployCollection);

    _collection = collection;
    _owner = owner;
    _signer = signer;
    _moderator = moderator;
    _otherAccount = otherAccount;
  });

  describe("refuseAddOrUpdateImageProposal", function () {
    it("Should revert with 'AccessControlUnauthorizedAccount' when caller is not moderator", async function () {
      const tokenId = await proposeAndMint(_signer, _collection, _moderator, {
        to: await _owner.getAddress(),
      });

      await _collection.createAddOrUpdateImageProposal(tokenId, {
        key: "profile",
        value: "cid1",
      });

      const { id: proposalId } = await _collection.addOrUpdateImageProposal(0);

      await expect(
        _collection.refuseAddOrUpdateImageProposal(proposalId)
      ).to.be.revertedWithCustomError(
        _collection,
        "AccessControlUnauthorizedAccount"
      );
    });

    it("Should revert when proposal does not exist", async function () {
      await proposeAndMint(_signer, _collection, _moderator, {
        to: await _owner.getAddress(),
      });

      await expect(
        _collection.connect(_moderator).refuseAddOrUpdateImageProposal(0)
      ).to.be.reverted;
    });

    it("Should remove and reorder proposals", async function () {
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

      expect(await _collection.addOrUpdateImageProposalsLength()).to.eq(2n);

      const { id: proposalId } = await _collection.addOrUpdateImageProposal(0);

      await _collection
        .connect(_moderator)
        .refuseAddOrUpdateImageProposal(proposalId);

      expect(await _collection.addOrUpdateImageProposalsLength()).to.eq(1n);

      const proposal = await _collection.addOrUpdateImageProposal(0);
      expect(proposal.image.key).to.equal("profile2");
    });

    it("Should emit 'AgentImageProposalRemoved' event", async function () {
      const tokenId = await proposeAndMint(_signer, _collection, _moderator, {
        to: await _owner.getAddress(),
      });

      await _collection.createAddOrUpdateImageProposal(tokenId, {
        key: "profile",
        value: "cid1",
      });

      const { id: proposalId } = await _collection.addOrUpdateImageProposal(0);

      await expect(
        _collection
          .connect(_moderator)
          .refuseAddOrUpdateImageProposal(proposalId)
      )
        .to.emit(_collection, "AgentImageProposalRemoved")
        .withArgs(tokenId, "profile", 0n);
    });
  });
});
