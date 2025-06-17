import { expect } from "chai";
import { ethers } from "hardhat";
import { AgenticAIAgentCollection } from "../../typechain-types";
import { loadFixture, reset } from "@nomicfoundation/hardhat-network-helpers";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import {
  generateRandomAddress,
  signCreateMintProposalRequest,
} from "../common";

describe("WhenCreatingMintingProposal", function () {
  const ipfsGateway = "https://ipfs.io/ipfs/";

  // Common constants to avoid repetition
  const DEFAULT_ROLE = "facilitator";
  const DEFAULT_MISSION = "";
  const DEFAULT_IMAGES = [
    {
      key: "default",
      value: "bafybeibsulc7sgpck3w7ur7eqa6fwaazcsswn3dg3rfl65zka3knajx43i",
    },
  ];
  const DEFAULT_NAME = "test-agent";
  const INVALID_NAME = "Invalid_Name";
  const NONCE_1 = "1";
  const NONCE_2 = "2";

  let _agenticAIAgentCollection: AgenticAIAgentCollection;

  let _owner: HardhatEthersSigner;
  let _signer1: HardhatEthersSigner;
  let _signer2: HardhatEthersSigner;
  let _otherAccount: HardhatEthersSigner;

  async function deployAgenticAIAgentCollection() {
    await reset();

    const [owner, signer1, signer2, otherAccount] = await ethers.getSigners();

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
      owner.address,
      owner.address,
      await collectionsManager.getAddress(),
      await collectionsDescriptor.getAddress()
    );

    const signerRole = await collectionsManager.SIGNER_ROLE();
    await collectionsManager.grantRole(signerRole, signer1.address);
    await collectionsManager.grantRole(signerRole, signer2.address);

    return { collection, owner, signer1, signer2, otherAccount };
  }

  beforeEach(async function () {
    const { collection, owner, signer1, signer2, otherAccount } =
      await loadFixture(deployAgenticAIAgentCollection);

    _owner = owner;
    _signer1 = signer1;
    _signer2 = signer2;
    _otherAccount = otherAccount;
    _agenticAIAgentCollection = collection;
  });

  describe("Given a signature from signer", function () {
    describe("Given an invalid name", function () {
      it("Should revert with 'InvalidName' error", async function () {
        const agentAddresses = [generateRandomAddress()];
        const signature = await signCreateMintProposalRequest(
          _signer1,
          _agenticAIAgentCollection,
          {
            to: _owner.address,
            agentAddresses,
            signer: _signer1.address,
            role: DEFAULT_ROLE,
            name: INVALID_NAME,
            images: DEFAULT_IMAGES,
            mission: DEFAULT_MISSION,
            nonce: NONCE_1,
          }
        );

        await expect(
          _agenticAIAgentCollection.createMintProposal(
            _owner.address,
            agentAddresses,
            _signer1.address,
            DEFAULT_ROLE,
            INVALID_NAME,
            DEFAULT_MISSION,
            DEFAULT_IMAGES,
            ethers.id(NONCE_1),
            signature
          )
        )
          .to.be.revertedWithCustomError(
            _agenticAIAgentCollection,
            "InvalidName"
          )
          .withArgs(INVALID_NAME);
      });
    });

    describe("Given a valid nonce used twice", function () {
      it("Should revert with 'UsedNonce' error on second attempt", async function () {
        const agentAddresses = [generateRandomAddress()];
        const signature = await signCreateMintProposalRequest(
          _signer1,
          _agenticAIAgentCollection,
          {
            to: _owner.address,
            agentAddresses,
            signer: _signer1.address,
            role: DEFAULT_ROLE,
            name: DEFAULT_NAME,
            images: DEFAULT_IMAGES,
            mission: DEFAULT_MISSION,
            nonce: NONCE_1,
          }
        );

        await _agenticAIAgentCollection.createMintProposal(
          _owner.address,
          agentAddresses,
          _signer1.address,
          DEFAULT_ROLE,
          DEFAULT_NAME,
          DEFAULT_MISSION,
          DEFAULT_IMAGES,
          ethers.id(NONCE_1),
          signature
        );

        await expect(
          _agenticAIAgentCollection.createMintProposal(
            _owner.address,
            agentAddresses,
            _signer1.address,
            DEFAULT_ROLE,
            DEFAULT_NAME,
            DEFAULT_MISSION,
            DEFAULT_IMAGES,
            ethers.id(NONCE_1),
            signature
          )
        )
          .to.be.revertedWithCustomError(_agenticAIAgentCollection, "UsedNonce")
          .withArgs(ethers.id(NONCE_1));
      });
    });

    describe("Given a name already taken", function () {
      it("Should revert with 'UsedName' error", async function () {
        const agentAddresses = [generateRandomAddress()];

        const sig1 = await signCreateMintProposalRequest(
          _signer1,
          _agenticAIAgentCollection,
          {
            to: _owner.address,
            agentAddresses,
            signer: _signer1.address,
            role: DEFAULT_ROLE,
            name: DEFAULT_NAME,
            images: DEFAULT_IMAGES,
            mission: DEFAULT_MISSION,
            nonce: NONCE_1,
          }
        );

        await _agenticAIAgentCollection.createMintProposal(
          _owner.address,
          agentAddresses,
          _signer1.address,
          DEFAULT_ROLE,
          DEFAULT_NAME,
          DEFAULT_MISSION,
          DEFAULT_IMAGES,
          ethers.id(NONCE_1),
          sig1
        );

        let mintProposalsLength =
          await _agenticAIAgentCollection.mintProposalsLength();

        await _agenticAIAgentCollection
          .connect(_owner)
          .mint(mintProposalsLength - BigInt(1));

        const sig2 = await signCreateMintProposalRequest(
          _signer1,
          _agenticAIAgentCollection,
          {
            to: _owner.address,
            agentAddresses,
            signer: _signer1.address,
            role: DEFAULT_ROLE,
            name: DEFAULT_NAME,
            images: DEFAULT_IMAGES,
            mission: DEFAULT_MISSION,
            nonce: NONCE_2,
          }
        );

        await expect(
          _agenticAIAgentCollection.createMintProposal(
            _owner.address,
            agentAddresses,
            _signer1.address,
            DEFAULT_ROLE,
            DEFAULT_NAME,
            DEFAULT_MISSION,
            DEFAULT_IMAGES,
            ethers.id(NONCE_2),
            sig2
          )
        )
          .to.be.revertedWithCustomError(_agenticAIAgentCollection, "UsedName")
          .withArgs(DEFAULT_NAME);
      });
    });

    describe("Given a signature that does not match signer parameter", function () {
      it("Should revert with 'InvalidSigner' error", async function () {
        const agentAddresses = [generateRandomAddress()];
        const signature = await signCreateMintProposalRequest(
          _signer1,
          _agenticAIAgentCollection,
          {
            to: _owner.address,
            agentAddresses,
            signer: _signer2.address,
            role: DEFAULT_ROLE,
            name: DEFAULT_NAME,
            images: DEFAULT_IMAGES,
            mission: DEFAULT_MISSION,
            nonce: NONCE_1,
          }
        );

        await expect(
          _agenticAIAgentCollection.createMintProposal(
            _owner.address,
            agentAddresses,
            _signer2.address,
            DEFAULT_ROLE,
            DEFAULT_NAME,
            DEFAULT_MISSION,
            DEFAULT_IMAGES,
            ethers.id(NONCE_1),
            signature
          )
        )
          .to.be.revertedWithCustomError(
            _agenticAIAgentCollection,
            "InvalidSigner"
          )
          .withArgs(await _signer1.getAddress(), _signer2.address);
      });
    });

    describe("Given a valid signature", function () {
      it("Should create the proposal", async function () {
        const agentAddresses = [generateRandomAddress()];
        const signature = await signCreateMintProposalRequest(
          _signer1,
          _agenticAIAgentCollection,
          {
            to: _owner.address,
            agentAddresses,
            signer: _signer1.address,
            role: DEFAULT_ROLE,
            name: DEFAULT_NAME,
            images: DEFAULT_IMAGES,
            mission: DEFAULT_MISSION,
            nonce: NONCE_1,
          }
        );

        const mintProposalLengthBefore =
          await _agenticAIAgentCollection.mintProposalsLength();

        await _agenticAIAgentCollection.createMintProposal(
          _owner.address,
          agentAddresses,
          _signer1.address,
          DEFAULT_ROLE,
          DEFAULT_NAME,
          DEFAULT_MISSION,
          DEFAULT_IMAGES,
          ethers.id(NONCE_1),
          signature
        );

        const mintProposalLengthAfter =
          await _agenticAIAgentCollection.mintProposalsLength();

        expect(mintProposalLengthAfter).to.be.equal(
          mintProposalLengthBefore + BigInt(1)
        );
      });

      it("Should emit a MintProposalCreated event", async function () {
        const agentAddresses = [generateRandomAddress()];
        const signature = await signCreateMintProposalRequest(
          _signer1,
          _agenticAIAgentCollection,
          {
            to: _owner.address,
            agentAddresses,
            signer: _signer1.address,
            role: DEFAULT_ROLE,
            name: DEFAULT_NAME,
            images: DEFAULT_IMAGES,
            mission: DEFAULT_MISSION,
            nonce: NONCE_1,
          }
        );

        await expect(
          _agenticAIAgentCollection.createMintProposal(
            _owner.address,
            agentAddresses,
            _signer1.address,
            DEFAULT_ROLE,
            DEFAULT_NAME,
            DEFAULT_MISSION,
            DEFAULT_IMAGES,
            ethers.id(NONCE_1),
            signature
          )
        )
          .to.emit(_agenticAIAgentCollection, "MintProposalCreated")
          .withArgs(_owner.address, _signer1.address);
      });
    });
  });

  describe("Given a signature from a non-signer", function () {
    it("Should revert with 'NotSigner' error", async function () {
      const agentAddresses = [generateRandomAddress()];

      const signature = await signCreateMintProposalRequest(
        _otherAccount,
        _agenticAIAgentCollection,
        {
          to: _owner.address,
          agentAddresses,
          signer: _otherAccount.address,
          role: DEFAULT_ROLE,
          name: DEFAULT_NAME,
          images: DEFAULT_IMAGES,
          mission: DEFAULT_MISSION,
          nonce: NONCE_1,
        }
      );

      await expect(
        _agenticAIAgentCollection.createMintProposal(
          _owner.address,
          agentAddresses,
          _otherAccount.address,
          DEFAULT_ROLE,
          DEFAULT_NAME,
          DEFAULT_MISSION,
          DEFAULT_IMAGES,
          ethers.id(NONCE_1),
          signature
        )
      ).to.be.revertedWithCustomError(_agenticAIAgentCollection, "NotSigner");
    });
  });
});
