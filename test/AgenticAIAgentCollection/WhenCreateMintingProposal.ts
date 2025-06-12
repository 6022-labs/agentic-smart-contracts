import { expect } from "chai";
import { ethers } from "hardhat";
import { AgenticAIAgentCollection } from "../../typechain-types";
import { generateRandomAddress, signMintProposalRequest } from "../common";
import { loadFixture, reset } from "@nomicfoundation/hardhat-network-helpers";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";

describe("WhenCreateMintingProposal", function () {
  const ipfsGateway = "https://ipfs.io/ipfs/";

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
      await collectionsManager.getAddress(),
      await collectionsDescriptor.getAddress()
    );

    await collectionsManager.addSigner(signer1.address);
    await collectionsManager.addSigner(signer2.address);

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
        const nonce = "1";
        const invalidName = "Invalid_Name";
        const role = "facilitator";
        const mission = "";
        const baseImageCid =
          "bafybeibsulc7sgpck3w7ur7eqa6fwaazcsswn3dg3rfl65zka3knajx43i";
        const agentAddresses = [generateRandomAddress()];
        const signature = await signMintProposalRequest(
          _signer1,
          _agenticAIAgentCollection,
          {
            to: _owner.address,
            agentAddresses,
            signer: _signer1.address,
            role,
            name: invalidName,
            image: baseImageCid,
            mission,
            nonce,
          }
        );

        await expect(
          _agenticAIAgentCollection.mintProposal(
            _owner.address,
            agentAddresses,
            _signer1.address,
            role,
            invalidName,
            baseImageCid,
            mission,
            ethers.id(nonce),
            signature
          )
        )
          .to.be.revertedWithCustomError(
            _agenticAIAgentCollection,
            "InvalidName"
          )
          .withArgs(invalidName);
      });
    });

    describe("Given a valid nonce used twice", function () {
      it("Should revert with 'UsedNonce' error on second attempt", async function () {
        const nonce = "1";
        const name = "test-agent";
        const role = "facilitator";
        const mission = "";
        const baseImageCid =
          "bafybeibsulc7sgpck3w7ur7eqa6fwaazcsswn3dg3rfl65zka3knajx43i";
        const agentAddresses = [generateRandomAddress()];
        const signature = await signMintProposalRequest(
          _signer1,
          _agenticAIAgentCollection,
          {
            to: _owner.address,
            agentAddresses,
            signer: _signer1.address,
            role,
            name,
            image: baseImageCid,
            mission,
            nonce,
          }
        );

        await _agenticAIAgentCollection.mintProposal(
          _owner.address,
          agentAddresses,
          _signer1.address,
          role,
          name,
          baseImageCid,
          mission,
          ethers.id(nonce),
          signature
        );

        await expect(
          _agenticAIAgentCollection.mintProposal(
            _owner.address,
            agentAddresses,
            _signer1.address,
            role,
            name,
            baseImageCid,
            mission,
            ethers.id(nonce),
            signature
          )
        )
          .to.be.revertedWithCustomError(_agenticAIAgentCollection, "UsedNonce")
          .withArgs(ethers.id(nonce));
      });
    });

    describe("Given a name already taken", function () {
      it("Should revert with 'UsedName' error", async function () {
        const nonce1 = "1";
        const nonce2 = "2";
        const name = "test-agent";
        const role = "facilitator";
        const mission = "";
        const baseImageCid =
          "bafybeibsulc7sgpck3w7ur7eqa6fwaazcsswn3dg3rfl65zka3knajx43i";
        const agentAddresses = [generateRandomAddress()];
        const sig1 = await signMintProposalRequest(
          _signer1,
          _agenticAIAgentCollection,
          {
            to: _owner.address,
            agentAddresses,
            signer: _signer1.address,
            role,
            name,
            image: baseImageCid,
            mission,
            nonce: nonce1,
          }
        );

        await _agenticAIAgentCollection.mintProposal(
          _owner.address,
          agentAddresses,
          _signer1.address,
          role,
          name,
          baseImageCid,
          mission,
          ethers.id(nonce1),
          sig1
        );

        await _agenticAIAgentCollection.connect(_owner).mint(1);

        const sig2 = await signMintProposalRequest(
          _signer1,
          _agenticAIAgentCollection,
          {
            to: _owner.address,
            agentAddresses,
            signer: _signer1.address,
            role,
            name,
            image: baseImageCid,
            mission,
            nonce: nonce2,
          }
        );

        await expect(
          _agenticAIAgentCollection.mintProposal(
            _owner.address,
            agentAddresses,
            _signer1.address,
            role,
            name,
            baseImageCid,
            mission,
            ethers.id(nonce2),
            sig2
          )
        )
          .to.be.revertedWithCustomError(_agenticAIAgentCollection, "UsedName")
          .withArgs(name);
      });
    });

    describe("Given a signature that does not match signer parameter", function () {
      it("Should revert with 'InvalidSigner' error", async function () {
        const nonce = "1";
        const name = "test-agent";
        const role = "facilitator";
        const mission = "";
        const baseImageCid =
          "bafybeibsulc7sgpck3w7ur7eqa6fwaazcsswn3dg3rfl65zka3knajx43i";
        const agentAddresses = [generateRandomAddress()];
        const signature = await signMintProposalRequest(
          _signer1,
          _agenticAIAgentCollection,
          {
            to: _owner.address,
            agentAddresses,
            signer: _signer2.address,
            role,
            name,
            image: baseImageCid,
            mission,
            nonce,
          }
        );

        await expect(
          _agenticAIAgentCollection.mintProposal(
            _owner.address,
            agentAddresses,
            _signer2.address,
            role,
            name,
            baseImageCid,
            mission,
            ethers.id(nonce),
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
      it("Should create the proposal and allow minting", async function () {
        const nonce = "1";
        const name = "test-agent";
        const role = "facilitator";
        const mission = "";
        const baseImageCid =
          "bafybeibsulc7sgpck3w7ur7eqa6fwaazcsswn3dg3rfl65zka3knajx43i";
        const agentAddresses = [generateRandomAddress()];
        const signature = await signMintProposalRequest(
          _signer1,
          _agenticAIAgentCollection,
          {
            to: _owner.address,
            agentAddresses,
            signer: _signer1.address,
            role,
            name,
            image: baseImageCid,
            mission,
            nonce,
          }
        );

        await _agenticAIAgentCollection.mintProposal(
          _owner.address,
          agentAddresses,
          _signer1.address,
          role,
          name,
          baseImageCid,
          mission,
          ethers.id(nonce),
          signature
        );

        expect(await _agenticAIAgentCollection.tokenIdOf(name)).to.equal(0n);

        const nextTokenId = await _agenticAIAgentCollection.nextTokenId();

        await _agenticAIAgentCollection.connect(_owner).mint(1);

        expect(await _agenticAIAgentCollection.ownerOf(nextTokenId)).to.equal(
          _owner.address
        );
      });

      it("Should emit a MintProposal event", async function () {
        const nonce = "1";
        const name = "test-agent";
        const role = "facilitator";
        const mission = "";
        const baseImageCid =
          "bafybeibsulc7sgpck3w7ur7eqa6fwaazcsswn3dg3rfl65zka3knajx43i";
        const agentAddresses = [generateRandomAddress()];
        const signature = await signMintProposalRequest(
          _signer1,
          _agenticAIAgentCollection,
          {
            to: _owner.address,
            agentAddresses,
            signer: _signer1.address,
            role,
            name,
            image: baseImageCid,
            mission,
            nonce,
          }
        );

        const nextProposalId = await _agenticAIAgentCollection.nextProposalId();

        await expect(
          _agenticAIAgentCollection.mintProposal(
            _owner.address,
            agentAddresses,
            _signer1.address,
            role,
            name,
            baseImageCid,
            mission,
            ethers.id(nonce),
            signature
          )
        )
          .to.emit(_agenticAIAgentCollection, "MintProposal")
          .withArgs(_owner.address, _signer1.address, nextProposalId);
      });

      it("Should increment the next proposal ID", async function () {
        const nonce = "1";
        const name = "test-agent";
        const role = "facilitator";
        const mission = "";
        const baseImageCid =
          "bafybeibsulc7sgpck3w7ur7eqa6fwaazcsswn3dg3rfl65zka3knajx43i";
        const agentAddresses = [generateRandomAddress()];
        const signature = await signMintProposalRequest(
          _signer1,
          _agenticAIAgentCollection,
          {
            to: _owner.address,
            agentAddresses,
            signer: _signer1.address,
            role,
            name,
            image: baseImageCid,
            mission,
            nonce,
          }
        );

        const initialProposalId =
          await _agenticAIAgentCollection.nextProposalId();

        await _agenticAIAgentCollection.mintProposal(
          _owner.address,
          agentAddresses,
          _signer1.address,
          role,
          name,
          baseImageCid,
          mission,
          ethers.id(nonce),
          signature
        );

        expect(await _agenticAIAgentCollection.nextProposalId()).to.equal(
          initialProposalId + 1n
        );
      });
    });
  });

  describe("Given a signature from a non-signer", function () {
    it("Should revert with 'NotSigner' error", async function () {
      const nonce = "1";
      const name = "test-agent";
      const role = "facilitator";
      const mission = "";
      const baseImageCid =
        "bafybeibsulc7sgpck3w7ur7eqa6fwaazcsswn3dg3rfl65zka3knajx43i";
      const agentAddresses = [generateRandomAddress()];

      const signature = await signMintProposalRequest(
        _otherAccount,
        _agenticAIAgentCollection,
        {
          to: _owner.address,
          agentAddresses,
          signer: _otherAccount.address,
          role,
          name,
          image: baseImageCid,
          mission,
          nonce,
        }
      );

      await expect(
        _agenticAIAgentCollection.mintProposal(
          _owner.address,
          agentAddresses,
          _otherAccount.address,
          role,
          name,
          baseImageCid,
          mission,
          ethers.id(nonce),
          signature
        )
      ).to.be.revertedWithCustomError(_agenticAIAgentCollection, "NotSigner");
    });
  });
});
