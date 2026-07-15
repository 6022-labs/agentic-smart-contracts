import { expect } from "chai";
import { ethers } from "hardhat";
import { AgentCollectionV1 } from "../../typechain-types";
import { loadFixture, reset } from "@nomicfoundation/hardhat-network-helpers";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { NullableUint256Struct } from "../../typechain-types/contracts/AgentCollectionV1";
import {
  generateRandomAddress,
  evmAddresses,
  deployCollectionWithCreator,
} from "../common";

describe("WhenRefusingMintProposals", function () {
  const ipfsGateway = "https://ipfs.io/ipfs/";

  const DEFAULT_ROLE = "facilitator";
  const DEFAULT_CLONE_OF: NullableUint256Struct = { isSet: false, value: 0n };
  const DEFAULT_IMAGES = [
    {
      key: "default",
      value: "bafybeibsulc7sgpck3w7ur7eqa6fwaazcsswn3dg3rfl65zka3knajx43i",
    },
  ];
  const DEFAULT_ATTRIBUTES = [{ key: "mission", value: "random mission" }];

  let _collection: AgentCollectionV1;
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

    return { collection, moderator, otherAccount };
  }

  beforeEach(async function () {
    const { collection, moderator, otherAccount } = await loadFixture(
      deployCollection,
    );

    _collection = collection;
    _moderator = moderator;
    _otherAccount = otherAccount;
  });

  async function createMintProposal(name: string) {
    await _collection.createMintProposal(
      _otherAccount.address,
      DEFAULT_ROLE,
      name,
      evmAddresses(generateRandomAddress()),
      DEFAULT_IMAGES,
      DEFAULT_ATTRIBUTES,
      DEFAULT_CLONE_OF,
    );
  }

  it("Should revert with 'AccessControlUnauthorizedAccount' when caller is not moderator", async function () {
    await createMintProposal("agent1");

    const { id: proposalId } = await _collection.mintProposal(0);

    await expect(
      _collection.refuseMintProposal(proposalId),
    ).to.be.revertedWithCustomError(
      _collection,
      "AccessControlUnauthorizedAccount",
    );
  });

  it("Should revert with 'ProposalNotFound' when no proposals exist", async function () {
    await expect(_collection.connect(_moderator).refuseMintProposal(0))
      .to.be.revertedWithCustomError(_collection, "ProposalNotFound")
      .withArgs(0);
  });

  it("Should revert with 'ProposalNotFound' for a bogus id while a live proposal exists (not refuse index 0)", async function () {
    await createMintProposal("agent1");

    await expect(_collection.connect(_moderator).refuseMintProposal(9999))
      .to.be.revertedWithCustomError(_collection, "ProposalNotFound")
      .withArgs(9999);

    // The live proposal must still be pending.
    expect(await _collection.mintProposalsLength()).to.eq(1n);
    expect((await _collection.mintProposal(0)).name).to.equal("agent1");
  });

  it("Should remove and reorder proposals", async function () {
    await createMintProposal("agent1");
    await createMintProposal("agent2");

    expect(await _collection.mintProposalsLength()).to.eq(2n);

    const { id: proposalId } = await _collection.mintProposal(0);

    await _collection.connect(_moderator).refuseMintProposal(proposalId);

    expect(await _collection.mintProposalsLength()).to.eq(1n);

    const proposal = await _collection.mintProposal(0);
    expect(proposal.name).to.equal("agent2");
  });

  it("Should emit a MintProposalRemoved event", async function () {
    await createMintProposal("agent1");

    const { id: proposalId } = await _collection.mintProposal(0);

    await expect(_collection.connect(_moderator).refuseMintProposal(proposalId))
      .to.emit(_collection, "MintProposalRemoved")
      .withArgs(_otherAccount.address, 1n);
  });
});
