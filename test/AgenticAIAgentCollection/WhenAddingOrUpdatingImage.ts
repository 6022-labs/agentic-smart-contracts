import { expect } from "chai";
import { ethers } from "hardhat";
import { AgenticAIAgentCollection } from "../../typechain-types";
import { loadFixture, reset } from "@nomicfoundation/hardhat-network-helpers";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import {
  generateRandomAddress,
  generateRandomNonce,
  signMintRequest,
} from "../common";

describe("WhenAddingOrUpdatingImage", function () {
  const ipfsGateway = "https://ipfs.io/ipfs/";

  let _agenticAIAgentCollection: AgenticAIAgentCollection;
  let _owner: HardhatEthersSigner;
  let _signer: HardhatEthersSigner;
  let _moderator: HardhatEthersSigner;
  let _otherAccount: HardhatEthersSigner;

  async function deployAgenticAIAgentCollection() {
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
      await loadFixture(deployAgenticAIAgentCollection);

    _agenticAIAgentCollection = collection;
    _owner = owner;
    _signer = signer;
    _moderator = moderator;
    _otherAccount = otherAccount;
  });

  async function proposeAndMint(to: string) {
    const name = "test-agent";
    const images = [
      {
        key: "default",
        value: "bafybeibsulc7sgpck3w7ur7eqa6fwaazcsswn3dg3rfl65zka3knajx43i",
      },
    ];
    const role = "facilitator";
    const mission = "";

    const nonce = generateRandomNonce();
    const agentAddresses = [generateRandomAddress()];

    const signature = await signMintRequest(
      _signer,
      _agenticAIAgentCollection,
      {
        to,
        agentAddresses,
        signer: _signer.address,
        role,
        name,
        images,
        mission,
        nonce,
      }
    );

    await _agenticAIAgentCollection.createMintProposal(
      to,
      agentAddresses,
      _signer.address,
      role,
      name,
      mission,
      images,
      ethers.id(nonce),
      signature
    );

    const mintProposalsLength =
      await _agenticAIAgentCollection.mintProposalsLength();
    const tokenId = await _agenticAIAgentCollection.nextTokenId();

    await _agenticAIAgentCollection
      .connect(_moderator)
      .mintFromProposal(mintProposalsLength - BigInt(1));

    return tokenId;
  }

  async function revokeModerator() {
    await _agenticAIAgentCollection
      .connect(_owner)
      .revokeRole(
        await _agenticAIAgentCollection.MODERATOR_ROLE(),
        _moderator.address
      );
  }

  describe("Given a moderator exists", function () {
    describe("And caller is not a moderator", function () {
      it("Should revert with 'NotModerator' error", async function () {
        await expect(
          _agenticAIAgentCollection.addOrUpdateImage(1n, {
            key: "profile",
            value: "cid1",
          })
        ).to.be.revertedWithCustomError(
          _agenticAIAgentCollection,
          "NotModerator"
        );
      });
    });

    describe("And caller is a moderator", function () {
      it("Should allow a moderator to update an image directly", async function () {
        const tokenId = await proposeAndMint(await _owner.getAddress());

        await expect(
          _agenticAIAgentCollection
            .connect(_moderator)
            .addOrUpdateImage(tokenId, {
              key: "profile",
              value: "cid1",
            })
        ).to.emit(_agenticAIAgentCollection, "AgentImageUpdated");
      });
    });
  });

  describe("Given no moderators are set", function () {
    describe("And token does not exist", function () {
      beforeEach(async function () {
        await revokeModerator();
      });

      it("Should revert with 'ERC721NonexistentToken' error", async function () {
        const tokenId = 1n;

        await expect(
          _agenticAIAgentCollection.addOrUpdateImage(tokenId, {
            key: "profile",
            value: "cid1",
          })
        )
          .to.be.revertedWithCustomError(
            _agenticAIAgentCollection,
            "ERC721NonexistentToken"
          )
          .withArgs(tokenId);
      });
    });

    describe("And caller is not the owner of the token", function () {
      let tokenId: bigint;
      beforeEach(async function () {
        tokenId = await proposeAndMint(await _owner.getAddress());
        await revokeModerator();
      });

      it("Should revert with 'OwnableUnauthorizedAccount' error", async function () {
        await expect(
          _agenticAIAgentCollection
            .connect(_otherAccount)
            .addOrUpdateImage(tokenId, { key: "profile", value: "cid1" })
        )
          .to.be.revertedWithCustomError(
            _agenticAIAgentCollection,
            "OwnableUnauthorizedAccount"
          )
          .withArgs(await _otherAccount.getAddress(), tokenId);
      });
    });

    describe("And image key does not exist", function () {
      let tokenId: bigint;
      beforeEach(async function () {
        tokenId = await proposeAndMint(await _owner.getAddress());
        await revokeModerator();
      });

      it("Should add the image", async function () {
        await _agenticAIAgentCollection.addOrUpdateImage(tokenId, {
          key: "profile",
          value: "cid1",
        });

        const images = await _agenticAIAgentCollection.imagesOf(tokenId);
        expect(images.length).to.equal(2);
        expect(images[1][0]).to.equal("profile");
        expect(images[1][1]).to.equal("cid1");
      });

      it("Should emit 'AgentImageUpdated' event", async function () {
        await expect(
          _agenticAIAgentCollection.addOrUpdateImage(tokenId, {
            key: "profile",
            value: "cid1",
          })
        )
          .to.emit(_agenticAIAgentCollection, "AgentImageUpdated")
          .withArgs(tokenId, "profile", "", "cid1");
      });
    });

    describe("And image key exists", function () {
      let tokenId: bigint;
      beforeEach(async function () {
        tokenId = await proposeAndMint(await _owner.getAddress());
        await revokeModerator();
        await _agenticAIAgentCollection.addOrUpdateImage(tokenId, {
          key: "profile",
          value: "cid1",
        });
      });

      it("Should update the image value", async function () {
        await _agenticAIAgentCollection.addOrUpdateImage(tokenId, {
          key: "profile",
          value: "cid2",
        });

        const images = await _agenticAIAgentCollection.imagesOf(tokenId);
        expect(images.length).to.equal(2);
        expect(images[1][0]).to.equal("profile");
        expect(images[1][1]).to.equal("cid2");
      });

      it("Should emit 'AgentImageUpdated' event", async function () {
        await expect(
          _agenticAIAgentCollection.addOrUpdateImage(tokenId, {
            key: "profile",
            value: "cid2",
          })
        )
          .to.emit(_agenticAIAgentCollection, "AgentImageUpdated")
          .withArgs(tokenId, "profile", "cid1", "cid2");
      });
    });
  });
});
