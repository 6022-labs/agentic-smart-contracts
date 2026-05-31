import { expect } from "chai";
import { AgentCollectionV1 } from "../../typechain-types";
import { loadFixture, reset } from "@nomicfoundation/hardhat-network-helpers";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { NullableUint256Struct } from "../../typechain-types/contracts/AgentCollectionV1";
import { ethers } from "hardhat";
import {
  proposeAndMint,
  generateRandomAddress,
  deployCollectionWithCreator,
} from "../common";

describe("WhenMintingFromProposal", function () {
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
  const DEFAULT_NAME = "test-agent";
  const DEFAULT_NAME_1 = "test-agent-1";
  const DEFAULT_NAME_2 = "test-agent-2";

  let _collection: AgentCollectionV1;
  let _owner: HardhatEthersSigner;
  let _otherAccount: HardhatEthersSigner;

  function createMintProposal(
    name: string,
    wallets: string[],
    to: string
  ) {
    return _collection.createMintProposal(
      to,
      DEFAULT_ROLE,
      name,
      wallets,
      DEFAULT_IMAGES,
      DEFAULT_ATTRIBUTES,
      DEFAULT_CLONE_OF
    );
  }

  async function deployAgentCollection() {
    await reset();

    const [owner, otherAccount] = await ethers.getSigners();

    const { collection } = await deployCollectionWithCreator({
      owner,
      moderator: owner,
      ipfsGateway,
    });

    return { collection, owner, otherAccount };
  }

  beforeEach(async function () {
    const { collection, owner, otherAccount } = await loadFixture(
      deployAgentCollection
    );

    _collection = collection;
    _owner = owner;
    _otherAccount = otherAccount;
  });

  describe("Given caller is not a moderator", function () {
    it("Should revert with 'AccessControlUnauthorizedAccount' error", async function () {
      await createMintProposal(
        DEFAULT_NAME,
        [generateRandomAddress()],
        _otherAccount.address
      );

      const length = await _collection.mintProposalsLength();
      const { id: proposalId } = await _collection.mintProposal(
        length - BigInt(1)
      );

      await expect(
        _collection.connect(_otherAccount).mintFromProposal(proposalId)
      ).to.be.revertedWithCustomError(
        _collection,
        "AccessControlUnauthorizedAccount"
      );
    });
  });

  describe("Given proposal does not exist", function () {
    it("Should revert", async function () {
      const length = await _collection.mintProposalsLength();
      await expect(
        _collection.connect(_owner).mintFromProposal(length + BigInt(1))
      ).to.be.reverted;
    });
  });

  describe("Given multiple minting proposals share the same name", function () {
    it("Should revert minting the second proposal with 'UsedName' error", async function () {
      const wallets = [generateRandomAddress()];

      await createMintProposal(DEFAULT_NAME, wallets, _otherAccount.address);
      await createMintProposal(
        DEFAULT_NAME,
        [generateRandomAddress()],
        _otherAccount.address
      );

      const { id: proposalId } = await _collection.mintProposal(0);
      const tokenId = await _collection.nextTokenId();

      await _collection.connect(_owner).mintFromProposal(proposalId);

      await expect(_collection.connect(_owner).mintFromProposal(proposalId))
        .to.be.revertedWithCustomError(_collection, "UsedName")
        .withArgs(DEFAULT_NAME, tokenId);
    });
  });

  describe("Given multiple minting proposals share the same wallet", function () {
    it("Should revert minting the second proposal with 'UsedWallet' error", async function () {
      const wallets = [generateRandomAddress()];

      await createMintProposal(
        DEFAULT_NAME + "-1",
        wallets,
        _otherAccount.address
      );
      await createMintProposal(
        DEFAULT_NAME + "-2",
        wallets,
        _otherAccount.address
      );

      const { id: proposalId } = await _collection.mintProposal(0);
      const tokenId = await _collection.nextTokenId();

      await _collection.connect(_owner).mintFromProposal(proposalId);

      await expect(_collection.connect(_owner).mintFromProposal(proposalId))
        .to.be.revertedWithCustomError(_collection, "UsedWallet")
        .withArgs(wallets[0], tokenId);
    });
  });

  describe("Given a valid minting proposal", function () {
    it("Should assign the owner of the token", async function () {
      const tokenId = await proposeAndMint(_collection, _owner, {
        to: _otherAccount.address,
        wallets: [generateRandomAddress()],
        name: DEFAULT_NAME,
      });

      expect(await _collection.ownerOf(tokenId)).to.equal(
        _otherAccount.address
      );
    });

    it("Should mint the NFT with the expected token ID", async function () {
      const nextTokenId = await _collection.nextTokenId();
      await expect(_collection.ownerOf(nextTokenId)).to.be.reverted;

      await proposeAndMint(_collection, _owner, {
        to: _otherAccount.address,
        wallets: [generateRandomAddress()],
        name: DEFAULT_NAME_1,
      });

      expect(await _collection.ownerOf(nextTokenId)).to.equal(
        _otherAccount.address
      );
    });

    it("Should increment next token ID", async function () {
      const before = await _collection.nextTokenId();
      await proposeAndMint(_collection, _owner, {
        to: _otherAccount.address,
        wallets: [generateRandomAddress()],
        name: DEFAULT_NAME_1,
      });
      expect(await _collection.nextTokenId()).to.equal(before + BigInt(1));
    });

    it("Should assign agent addresses to the token", async function () {
      const wallets = [generateRandomAddress()];
      const tokenId = await proposeAndMint(_collection, _owner, {
        to: _otherAccount.address,
        wallets,
        name: DEFAULT_NAME,
      });

      const walletCount = await _collection.walletsCountOf(tokenId);
      expect(walletCount).to.equal(wallets.length);
      for (let i = 0; i < walletCount; i++) {
        expect(wallets).to.include(
          await _collection.walletOfByIndex(tokenId, i)
        );
      }
    });

    it("Should assign name to the token", async function () {
      const tokenId = await proposeAndMint(_collection, _owner, {
        to: _otherAccount.address,
        wallets: [generateRandomAddress()],
        name: DEFAULT_NAME,
      });
      expect(await _collection.nameOf(tokenId)).to.equal(DEFAULT_NAME);
    });

    it("Should assign images to the token", async function () {
      const tokenId = await proposeAndMint(_collection, _owner, {
        to: _otherAccount.address,
        wallets: [generateRandomAddress()],
        name: DEFAULT_NAME,
      });

      const imageCount = await _collection.imagesCountOf(tokenId);
      expect(imageCount).to.equal(DEFAULT_IMAGES.length);
      for (let i = 0; i < imageCount; i++) {
        const imagesOf = await _collection.imageOfByIndex(tokenId, i);
        expect(imagesOf[0]).to.be.equal(DEFAULT_IMAGES[i].key);
        expect(imagesOf[1]).to.be.equal(DEFAULT_IMAGES[i].value);
      }
    });

    it("Should assign creator (the proposal creator) to the token", async function () {
      await createMintProposal(
        DEFAULT_NAME,
        [generateRandomAddress()],
        _otherAccount.address
      );
      const length = await _collection.mintProposalsLength();
      const { id: proposalId } = await _collection.mintProposal(
        length - BigInt(1)
      );
      const tokenId = await _collection.nextTokenId();
      await _collection.connect(_owner).mintFromProposal(proposalId);

      // createMintProposal was called by the default signer (_owner).
      expect(await _collection.creatorOf(tokenId)).to.equal(_owner.address);
    });

    it("Should assign role to the token", async function () {
      const tokenId = await proposeAndMint(_collection, _owner, {
        to: _otherAccount.address,
        wallets: [generateRandomAddress()],
        name: DEFAULT_NAME,
      });
      expect(await _collection.roleOf(tokenId)).to.equal(DEFAULT_ROLE);
    });

    it("Should assign token id to name", async function () {
      const tokenId = await proposeAndMint(_collection, _owner, {
        to: _otherAccount.address,
        wallets: [generateRandomAddress()],
        name: DEFAULT_NAME,
      });
      expect(await _collection.nameToTokenId(DEFAULT_NAME)).to.be.equal(tokenId);
    });

    it("Should assign token id to wallet", async function () {
      const wallets = [generateRandomAddress()];
      const tokenId = await proposeAndMint(_collection, _owner, {
        to: _otherAccount.address,
        wallets,
        name: DEFAULT_NAME,
      });
      expect(await _collection.walletToTokenId(wallets[0])).to.be.equal(tokenId);
    });

    it("Should emit 'Minted' event", async function () {
      const tokenId = await _collection.nextTokenId();
      await createMintProposal(
        DEFAULT_NAME,
        [generateRandomAddress()],
        _otherAccount.address
      );
      const length = await _collection.mintProposalsLength();
      const { id: proposalId } = await _collection.mintProposal(
        length - BigInt(1)
      );

      await expect(_collection.connect(_owner).mintFromProposal(proposalId))
        .to.emit(_collection, "Minted")
        .withArgs(_otherAccount.address, tokenId);
    });

    it("Should emit 'MintProposalRemoved' event", async function () {
      await createMintProposal(
        DEFAULT_NAME,
        [generateRandomAddress()],
        _otherAccount.address
      );
      const index = (await _collection.mintProposalsLength()) - BigInt(1);
      const { id: proposalId } = await _collection.mintProposal(index);

      // The event's owner arg is the proposal recipient; the second arg is the
      // swapped-removal index, not the proposal id.
      await expect(_collection.connect(_owner).mintFromProposal(proposalId))
        .to.emit(_collection, "MintProposalRemoved")
        .withArgs(_otherAccount.address, index);
    });

    it("Should decrease proposals length", async function () {
      await createMintProposal(
        DEFAULT_NAME,
        [generateRandomAddress()],
        _otherAccount.address
      );
      const lengthBefore = await _collection.mintProposalsLength();
      const { id: proposalId } = await _collection.mintProposal(
        lengthBefore - BigInt(1)
      );

      await _collection.connect(_owner).mintFromProposal(proposalId);

      expect(await _collection.mintProposalsLength()).to.eq(
        lengthBefore - BigInt(1)
      );
    });

    it("Should reorder remaining proposals", async function () {
      const wallets = [generateRandomAddress()];

      await createMintProposal(DEFAULT_NAME_1, wallets, _otherAccount.address);
      await createMintProposal(
        DEFAULT_NAME_2,
        [generateRandomAddress()],
        _otherAccount.address
      );

      expect(await _collection.mintProposalsLength()).to.eq(2n);

      const { id: proposalId } = await _collection.mintProposal(0);
      await _collection.connect(_owner).mintFromProposal(proposalId);

      expect(await _collection.mintProposalsLength()).to.eq(1n);

      const proposal = await _collection.mintProposal(0);
      expect(proposal.name).to.equal(DEFAULT_NAME_2);
    });
  });
});
