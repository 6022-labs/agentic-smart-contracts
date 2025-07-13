import { expect } from "chai";
import { ethers } from "hardhat";
import { AgentCollectionV1 } from "../../typechain-types";
import { loadFixture, reset } from "@nomicfoundation/hardhat-network-helpers";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import {
  signMintRequest,
  generateRandomAddress,
  deployCollectionWithCreator,
} from "../common";

describe("WhenRefusingMintProposals", function () {
  const ipfsGateway = "https://ipfs.io/ipfs/";

  const DEFAULT_ROLE = "facilitator";
  const DEFAULT_MISSION = "";
  const DEFAULT_IMAGES = [
    {
      key: "default",
      value: "bafybeibsulc7sgpck3w7ur7eqa6fwaazcsswn3dg3rfl65zka3knajx43i",
    },
  ];

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

  async function createMintProposal(name: string, nonce: string) {
    const agentAddresses = [generateRandomAddress()];
    const signature = await signMintRequest(_signer, _collection, {
      to: _otherAccount.address,
      agentAddresses,
      signer: _signer.address,
      role: DEFAULT_ROLE,
      name,
      images: DEFAULT_IMAGES,
      mission: DEFAULT_MISSION,
      nonce,
    });

    await _collection.createMintProposal(
      _otherAccount.address,
      agentAddresses,
      _signer.address,
      DEFAULT_ROLE,
      name,
      DEFAULT_MISSION,
      DEFAULT_IMAGES,
      ethers.id(nonce),
      signature
    );
  }

  describe("refuseMintProposal", function () {
    it("Should revert with 'AccessControlUnauthorizedAccount' when caller is not moderator", async function () {
      await createMintProposal("agent1", "1");

      const { id: proposalId } = await _collection.mintProposal(0);

      await expect(
        _collection.refuseMintProposal(proposalId)
      ).to.be.revertedWithCustomError(
        _collection,
        "AccessControlUnauthorizedAccount"
      );
    });

    it("Should revert when proposal does not exist", async function () {
      await expect(_collection.connect(_moderator).refuseMintProposal(0)).to.be
        .reverted;
    });

    it("Should remove and reorder proposals", async function () {
      await createMintProposal("agent1", "1");
      await createMintProposal("agent2", "2");

      expect(await _collection.mintProposalsLength()).to.eq(2n);

      const { id: proposalId } = await _collection.mintProposal(0);

      await _collection.connect(_moderator).refuseMintProposal(proposalId);

      expect(await _collection.mintProposalsLength()).to.eq(1n);

      const proposal = await _collection.mintProposal(0);
      expect(proposal.name).to.equal("agent2");
    });

    it("Should emit a MintProposalRemoved event", async function () {
      await createMintProposal("agent1", "1");

      const { id: proposalId } = await _collection.mintProposal(0);

      await expect(
        _collection.connect(_moderator).refuseMintProposal(proposalId)
      )
        .to.emit(_collection, "MintProposalRemoved")
        .withArgs(_otherAccount.address, _signer.address, 1n);
    });
  });
});
