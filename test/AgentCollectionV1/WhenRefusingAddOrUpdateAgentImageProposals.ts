import { expect } from "chai";
import { ethers } from "hardhat";
import { AgentCollectionV1 } from "../../typechain-types";
import { proposeAndMint, deployCollectionWithCreator } from "../common";
import { loadFixture, reset } from "@nomicfoundation/hardhat-network-helpers";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";

describe("WhenRefusingAddOrUpdateAgentImageProposals", function () {
  const ipfsGateway = "https://ipfs.io/ipfs/";

  let _collection: AgentCollectionV1;
  let _owner: HardhatEthersSigner;
  let _moderator: HardhatEthersSigner;
  let _otherAccount: HardhatEthersSigner;

  async function deployCollection() {
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
      deployCollection
    );

    _collection = collection;
    _owner = owner;
    _moderator = moderator;
    _otherAccount = otherAccount;
  });

  it("Should revert with 'AccessControlUnauthorizedAccount' when caller is not moderator", async function () {
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
      _collection.refuseAddOrUpdateAgentImageProposal(proposalId)
    ).to.be.revertedWithCustomError(
      _collection,
      "AccessControlUnauthorizedAccount"
    );
  });

  it("Should revert when proposal does not exist", async function () {
    await proposeAndMint(_collection, _moderator, {
      to: await _owner.getAddress(),
    });

    await expect(
      _collection.connect(_moderator).refuseAddOrUpdateAgentImageProposal(0)
    ).to.be.reverted;
  });

  it("Should remove and reorder proposals", async function () {
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

    const { id: proposalId } =
      await _collection.addOrUpdateAgentImageProposal(0);

    await _collection
      .connect(_moderator)
      .refuseAddOrUpdateAgentImageProposal(proposalId);

    expect(await _collection.addOrUpdateAgentImageProposalsLength()).to.eq(
      1n
    );

    const proposal = await _collection.addOrUpdateAgentImageProposal(0);
    expect(proposal.image.key).to.equal("profile2");
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
        .refuseAddOrUpdateAgentImageProposal(proposalId)
    )
      .to.emit(_collection, "AgentImageProposalRemoved")
      .withArgs(tokenId, "profile", 2n);
  });

  it("Should allow re-proposing the same key after a refusal", async function () {
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
      .refuseAddOrUpdateAgentImageProposal(proposalId);

    // The (tokenId, key) dedup entry must be cleared on refusal so the key can
    // be proposed again (otherwise the stale entry points at a popped slot).
    await _collection.createAddOrUpdateAgentImageProposal(tokenId, {
      key: "profile",
      value: "cid2",
    });

    expect(await _collection.addOrUpdateAgentImageProposalsLength()).to.eq(1n);
    const proposal = await _collection.addOrUpdateAgentImageProposal(0);
    expect(proposal.image.key).to.equal("profile");
    expect(proposal.image.value).to.equal("cid2");
  });
});
