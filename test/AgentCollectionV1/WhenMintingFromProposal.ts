import { expect } from "chai";
import { AgentCollectionV1 } from "../../typechain-types";
import { loadFixture, reset } from "@nomicfoundation/hardhat-network-helpers";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import {
  AgentAddressStruct,
  NullableUint256Struct,
} from "../../typechain-types/contracts/AgentCollectionV1";
import { ethers } from "hardhat";
import {
  proposeAndMint,
  generateRandomAddress,
  evmAddresses,
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
    addresses: AgentAddressStruct[],
    to: string,
  ) {
    return _collection.createMintProposal(
      to,
      DEFAULT_ROLE,
      name,
      addresses,
      DEFAULT_IMAGES,
      DEFAULT_ATTRIBUTES,
      DEFAULT_CLONE_OF,
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
      deployAgentCollection,
    );

    _collection = collection;
    _owner = owner;
    _otherAccount = otherAccount;
  });

  describe("Given caller is not a moderator", function () {
    it("Should revert with 'AccessControlUnauthorizedAccount' error", async function () {
      await createMintProposal(
        DEFAULT_NAME,
        evmAddresses(generateRandomAddress()),
        _otherAccount.address,
      );

      const length = await _collection.mintProposalsLength();
      const { id: proposalId } = await _collection.mintProposal(
        length - BigInt(1),
      );

      await expect(
        _collection.connect(_otherAccount).mintFromProposal(proposalId),
      ).to.be.revertedWithCustomError(
        _collection,
        "AccessControlUnauthorizedAccount",
      );
    });
  });

  describe("Given proposal does not exist", function () {
    it("Should revert with 'ProposalNotFound' when no proposals exist", async function () {
      await expect(_collection.connect(_owner).mintFromProposal(1))
        .to.be.revertedWithCustomError(_collection, "ProposalNotFound")
        .withArgs(1);
    });

    it("Should revert with 'ProposalNotFound' for a bogus id while a live proposal exists (not mint index 0)", async function () {
      await createMintProposal(
        DEFAULT_NAME,
        evmAddresses(generateRandomAddress()),
        _otherAccount.address,
      );

      const lengthBefore = await _collection.mintProposalsLength();

      // Bogus id must revert, NOT silently mint the proposal at index 0.
      await expect(_collection.connect(_owner).mintFromProposal(9999))
        .to.be.revertedWithCustomError(_collection, "ProposalNotFound")
        .withArgs(9999);
      // Id 0 is never a valid proposal id (ids start at 1).
      await expect(_collection.connect(_owner).mintFromProposal(0))
        .to.be.revertedWithCustomError(_collection, "ProposalNotFound")
        .withArgs(0);

      // The live proposal is untouched.
      expect(await _collection.mintProposalsLength()).to.eq(lengthBefore);
    });

    it("Should revert with 'ProposalNotFound' when re-applying an already-consumed id", async function () {
      await createMintProposal(
        DEFAULT_NAME_1,
        evmAddresses(generateRandomAddress()),
        _otherAccount.address,
      );
      await createMintProposal(
        DEFAULT_NAME_2,
        evmAddresses(generateRandomAddress()),
        _otherAccount.address,
      );

      // Consume the first proposal; its swap-and-pop moves NAME_2 into index 0.
      const { id: firstProposalId } = await _collection.mintProposal(0);
      await _collection.connect(_owner).mintFromProposal(firstProposalId);

      // Re-applying the consumed id must revert, NOT mint whatever now sits at index 0.
      await expect(
        _collection.connect(_owner).mintFromProposal(firstProposalId),
      )
        .to.be.revertedWithCustomError(_collection, "ProposalNotFound")
        .withArgs(firstProposalId);

      // The surviving NAME_2 proposal is still pending and still applicable by its own id.
      expect(await _collection.mintProposalsLength()).to.eq(1n);
      expect((await _collection.mintProposal(0)).name).to.equal(DEFAULT_NAME_2);
    });
  });

  describe("Given multiple minting proposals share the same name", function () {
    it("Should revert minting the second proposal with 'UsedName' error", async function () {
      await createMintProposal(
        DEFAULT_NAME,
        evmAddresses(generateRandomAddress()),
        _otherAccount.address,
      );
      await createMintProposal(
        DEFAULT_NAME,
        evmAddresses(generateRandomAddress()),
        _otherAccount.address,
      );

      const { id: firstProposalId } = await _collection.mintProposal(0);
      const { id: secondProposalId } = await _collection.mintProposal(1);
      const tokenId = await _collection.nextTokenId();

      await _collection.connect(_owner).mintFromProposal(firstProposalId);

      await expect(
        _collection.connect(_owner).mintFromProposal(secondProposalId),
      )
        .to.be.revertedWithCustomError(_collection, "UsedName")
        .withArgs(DEFAULT_NAME, tokenId);
    });
  });

  describe("Given multiple minting proposals share the same evm address", function () {
    it("Should revert minting the second proposal with 'UsedAgentAddress' error", async function () {
      const wallet = generateRandomAddress();

      await createMintProposal(
        DEFAULT_NAME + "-1",
        evmAddresses(wallet),
        _otherAccount.address,
      );
      await createMintProposal(
        DEFAULT_NAME + "-2",
        evmAddresses(wallet),
        _otherAccount.address,
      );

      const { id: firstProposalId } = await _collection.mintProposal(0);
      const { id: secondProposalId } = await _collection.mintProposal(1);
      const tokenId = await _collection.nextTokenId();

      await _collection.connect(_owner).mintFromProposal(firstProposalId);

      await expect(
        _collection.connect(_owner).mintFromProposal(secondProposalId),
      )
        .to.be.revertedWithCustomError(_collection, "UsedAgentAddress")
        .withArgs("evm", wallet.toLowerCase(), tokenId);
    });
  });

  describe("Given a valid minting proposal", function () {
    it("Should assign the owner of the token", async function () {
      const tokenId = await proposeAndMint(_collection, _owner, {
        to: _otherAccount.address,
        addresses: evmAddresses(generateRandomAddress()),
        name: DEFAULT_NAME,
      });

      expect(await _collection.ownerOf(tokenId)).to.equal(
        _otherAccount.address,
      );
    });

    it("Should mint the NFT with the expected token ID", async function () {
      const nextTokenId = await _collection.nextTokenId();
      await expect(_collection.ownerOf(nextTokenId)).to.be.reverted;

      await proposeAndMint(_collection, _owner, {
        to: _otherAccount.address,
        addresses: evmAddresses(generateRandomAddress()),
        name: DEFAULT_NAME_1,
      });

      expect(await _collection.ownerOf(nextTokenId)).to.equal(
        _otherAccount.address,
      );
    });

    it("Should increment next token ID", async function () {
      const before = await _collection.nextTokenId();
      await proposeAndMint(_collection, _owner, {
        to: _otherAccount.address,
        addresses: evmAddresses(generateRandomAddress()),
        name: DEFAULT_NAME_1,
      });
      expect(await _collection.nextTokenId()).to.equal(before + BigInt(1));
    });

    it("Should assign agent addresses to the token", async function () {
      const wallet = generateRandomAddress();
      const tokenId = await proposeAndMint(_collection, _owner, {
        to: _otherAccount.address,
        addresses: evmAddresses(wallet),
        name: DEFAULT_NAME,
      });

      expect(await _collection.addressesCountOf(tokenId)).to.equal(1n);
      expect(await _collection.addressToTokenId("evm", wallet)).to.equal(
        tokenId,
      );
    });

    it("Should assign name to the token", async function () {
      const tokenId = await proposeAndMint(_collection, _owner, {
        to: _otherAccount.address,
        addresses: evmAddresses(generateRandomAddress()),
        name: DEFAULT_NAME,
      });
      expect(await _collection.nameOf(tokenId)).to.equal(DEFAULT_NAME);
    });

    it("Should assign images to the token", async function () {
      const tokenId = await proposeAndMint(_collection, _owner, {
        to: _otherAccount.address,
        addresses: evmAddresses(generateRandomAddress()),
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
        evmAddresses(generateRandomAddress()),
        _otherAccount.address,
      );
      const length = await _collection.mintProposalsLength();
      const { id: proposalId } = await _collection.mintProposal(
        length - BigInt(1),
      );
      const tokenId = await _collection.nextTokenId();
      await _collection.connect(_owner).mintFromProposal(proposalId);

      // createMintProposal was called by the default signer (_owner).
      expect(await _collection.creatorOf(tokenId)).to.equal(_owner.address);
    });

    it("Should assign role to the token", async function () {
      const tokenId = await proposeAndMint(_collection, _owner, {
        to: _otherAccount.address,
        addresses: evmAddresses(generateRandomAddress()),
        name: DEFAULT_NAME,
      });
      expect(await _collection.roleOf(tokenId)).to.equal(DEFAULT_ROLE);
    });

    it("Should assign token id to name", async function () {
      const tokenId = await proposeAndMint(_collection, _owner, {
        to: _otherAccount.address,
        addresses: evmAddresses(generateRandomAddress()),
        name: DEFAULT_NAME,
      });
      expect(await _collection.nameToTokenId(DEFAULT_NAME)).to.be.equal(
        tokenId,
      );
    });

    it("Should assign token id to evm address", async function () {
      const wallet = generateRandomAddress();
      const tokenId = await proposeAndMint(_collection, _owner, {
        to: _otherAccount.address,
        addresses: evmAddresses(wallet),
        name: DEFAULT_NAME,
      });
      expect(await _collection.addressToTokenId("evm", wallet)).to.be.equal(
        tokenId,
      );
    });

    it("Should emit 'Minted' event", async function () {
      const tokenId = await _collection.nextTokenId();
      await createMintProposal(
        DEFAULT_NAME,
        evmAddresses(generateRandomAddress()),
        _otherAccount.address,
      );
      const length = await _collection.mintProposalsLength();
      const { id: proposalId } = await _collection.mintProposal(
        length - BigInt(1),
      );

      await expect(_collection.connect(_owner).mintFromProposal(proposalId))
        .to.emit(_collection, "Minted")
        .withArgs(_otherAccount.address, tokenId);
    });

    it("Should emit 'MintProposalRemoved' event", async function () {
      await createMintProposal(
        DEFAULT_NAME,
        evmAddresses(generateRandomAddress()),
        _otherAccount.address,
      );
      const index = (await _collection.mintProposalsLength()) - BigInt(1);
      const { id: proposalId } = await _collection.mintProposal(index);

      await expect(_collection.connect(_owner).mintFromProposal(proposalId))
        .to.emit(_collection, "MintProposalRemoved")
        .withArgs(_otherAccount.address, proposalId);
    });

    it("Should decrease proposals length", async function () {
      await createMintProposal(
        DEFAULT_NAME,
        evmAddresses(generateRandomAddress()),
        _otherAccount.address,
      );
      const lengthBefore = await _collection.mintProposalsLength();
      const { id: proposalId } = await _collection.mintProposal(
        lengthBefore - BigInt(1),
      );

      await _collection.connect(_owner).mintFromProposal(proposalId);

      expect(await _collection.mintProposalsLength()).to.eq(
        lengthBefore - BigInt(1),
      );
    });

    it("Should reorder remaining proposals", async function () {
      await createMintProposal(
        DEFAULT_NAME_1,
        evmAddresses(generateRandomAddress()),
        _otherAccount.address,
      );
      await createMintProposal(
        DEFAULT_NAME_2,
        evmAddresses(generateRandomAddress()),
        _otherAccount.address,
      );

      expect(await _collection.mintProposalsLength()).to.eq(2n);

      const { id: proposalId } = await _collection.mintProposal(0);
      await _collection.connect(_owner).mintFromProposal(proposalId);

      expect(await _collection.mintProposalsLength()).to.eq(1n);

      const proposal = await _collection.mintProposal(0);
      expect(proposal.name).to.equal(DEFAULT_NAME_2);
    });

    it("Should remove only the applied proposal when applying out of order", async function () {
      await createMintProposal(
        DEFAULT_NAME_1,
        evmAddresses(generateRandomAddress()),
        _otherAccount.address,
      );
      await createMintProposal(
        DEFAULT_NAME_2,
        evmAddresses(generateRandomAddress()),
        _otherAccount.address,
      );

      // Apply the SECOND proposal (id at index 1), not the first.
      const { id: secondProposalId } = await _collection.mintProposal(1);
      const tokenId = await _collection.nextTokenId();

      await _collection.connect(_owner).mintFromProposal(secondProposalId);

      // The minted token is NAME_2; the untouched NAME_1 proposal must survive.
      expect(await _collection.nameOf(tokenId)).to.equal(DEFAULT_NAME_2);
      expect(await _collection.mintProposalsLength()).to.eq(1n);
      expect((await _collection.mintProposal(0)).name).to.equal(DEFAULT_NAME_1);
    });
  });
});
