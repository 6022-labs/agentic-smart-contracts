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

describe("WhenRefusingAddOrUpdateImageProposals", function () {
  const ipfsGateway = "https://ipfs.io/ipfs/";

  const DEFAULT_ROLE = "facilitator";
  const DEFAULT_MISSION = "";
  const DEFAULT_IMAGES = [
    {
      key: "default",
      value: "bafybeibsulc7sgpck3w7ur7eqa6fwaazcsswn3dg3rfl65zka3knajx43i",
    },
  ];

  let _collection: AgenticAIAgentCollection;
  let _owner: HardhatEthersSigner;
  let _signer: HardhatEthersSigner;
  let _moderator: HardhatEthersSigner;
  let _otherAccount: HardhatEthersSigner;

  async function deployCollection() {
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
      await loadFixture(deployCollection);

    _collection = collection;
    _owner = owner;
    _signer = signer;
    _moderator = moderator;
    _otherAccount = otherAccount;
  });

  async function proposeAndMint(to: string) {
    const name = "test-agent";
    const nonce = generateRandomNonce();
    const agentAddresses = [generateRandomAddress()];

    const signature = await signCreateMintProposalRequest(
      _signer,
      _collection,
      {
        to,
        agentAddresses,
        signer: _signer.address,
        role: DEFAULT_ROLE,
        name,
        images: DEFAULT_IMAGES,
        mission: DEFAULT_MISSION,
        nonce,
      }
    );

    await _collection.createMintProposal(
      to,
      agentAddresses,
      _signer.address,
      DEFAULT_ROLE,
      name,
      DEFAULT_MISSION,
      DEFAULT_IMAGES,
      ethers.id(nonce),
      signature
    );

    const proposalIndex = (await _collection.mintProposalsLength()) - BigInt(1);
    const tokenId = await _collection.nextTokenId();

    await _collection.connect(_moderator).mint(proposalIndex);

    return tokenId;
  }

  describe("refuseAddOrUpdateImageProposal", function () {
    it("Should revert with 'AccessControlUnauthorizedAccount' when caller is not moderator", async function () {
      const tokenId = await proposeAndMint(await _owner.getAddress());

      await _collection.createAddOrUpdateImageProposal(tokenId, {
        key: "profile",
        value: "cid1",
      });

      await expect(
        _collection.refuseAddOrUpdateImageProposal(0)
      ).to.be.revertedWithCustomError(
        _collection,
        "AccessControlUnauthorizedAccount"
      );
    });

    it("Should revert when proposal does not exist", async function () {
      await proposeAndMint(await _owner.getAddress());

      await expect(
        _collection.connect(_moderator).refuseAddOrUpdateImageProposal(0)
      ).to.be.reverted;
    });

    it("Should remove and reorder proposals", async function () {
      const tokenId = await proposeAndMint(await _owner.getAddress());

      await _collection.createAddOrUpdateImageProposal(tokenId, {
        key: "profile1",
        value: "cid1",
      });

      await _collection.createAddOrUpdateImageProposal(tokenId, {
        key: "profile2",
        value: "cid2",
      });

      expect(await _collection.addOrUpdateProposalsLength()).to.eq(2n);

      await _collection.connect(_moderator).refuseAddOrUpdateImageProposal(0);

      expect(await _collection.addOrUpdateProposalsLength()).to.eq(1n);

      const proposal = await _collection.addOrUpdateProposal(0);
      expect(proposal.image.key).to.equal("profile2");
    });

    it("Should emit 'AgentImageProposalRemoved' event", async function () {
      const tokenId = await proposeAndMint(await _owner.getAddress());

      await _collection.createAddOrUpdateImageProposal(tokenId, {
        key: "profile",
        value: "cid1",
      });

      await expect(
        _collection.connect(_moderator).refuseAddOrUpdateImageProposal(0)
      )
        .to.emit(_collection, "AgentImageProposalRemoved")
        .withArgs(tokenId, "profile", 0n);
    });
  });
});
