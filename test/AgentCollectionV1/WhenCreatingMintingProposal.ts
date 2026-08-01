import { expect } from "chai";
import { ethers } from "hardhat";
import { AgentCollectionV1 } from "../../typechain-types";
import { loadFixture, reset } from "@nomicfoundation/hardhat-network-helpers";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import {
  AgentAddressStruct,
  NullableUint256Struct,
} from "../../typechain-types/contracts/AgentCollectionV1";
import {
  generateRandomAddress,
  evmAddresses,
  btcAddresses,
  deployCollectionWithCreator,
} from "../common";

describe("WhenCreatingMintingProposal", function () {
  const ipfsGateway = "https://ipfs.io/ipfs/";

  const DEFAULT_ROLE = "facilitator";
  const DEFAULT_CLONE_OF: NullableUint256Struct = { isSet: false, value: 0n };
  const DEFAULT_IMAGES = [
    {
      key: "default",
      value: "bafybeibsulc7sgpck3w7ur7eqa6fwaazcsswn3dg3rfl65zka3knajx43i",
    },
  ];
  const DEFAULT_ATTRIBUTES = [
    { key: "role", value: DEFAULT_ROLE },
    { key: "mission", value: "random mission" },
  ];
  const DEFAULT_NAME = "test-agent";
  const INVALID_NAME = "Invalid_Name";

  let _collection: AgentCollectionV1;

  let _owner: HardhatEthersSigner;
  let _moderator: HardhatEthersSigner;
  let _otherAccount: HardhatEthersSigner;

  function createMintProposal(
    args: {
      to: string;
      name?: string;
      addresses: AgentAddressStruct[];
      images?: { key: string; value: string }[];
      attributes?: { key: string; value: string }[];
      cloneOf?: NullableUint256Struct;
    },
    caller?: HardhatEthersSigner,
  ) {
    const collection = caller ? _collection.connect(caller) : _collection;
    return collection.createMintProposal(
      args.to,
      args.name ?? DEFAULT_NAME,
      args.addresses,
      args.images ?? DEFAULT_IMAGES,
      args.attributes ?? DEFAULT_ATTRIBUTES,
      args.cloneOf ?? DEFAULT_CLONE_OF,
    );
  }

  async function deployAgentCollection() {
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
      deployAgentCollection,
    );

    _owner = owner;
    _moderator = moderator;
    _otherAccount = otherAccount;
    _collection = collection;
  });

  describe("Given no moderators are set", function () {
    it("Should revert with 'NoModerators' error", async function () {
      const MODERATOR_ROLE = await _collection.MODERATOR_ROLE();
      await _collection
        .connect(_owner)
        .revokeRole(MODERATOR_ROLE, _moderator.address);

      await expect(
        createMintProposal({
          to: _owner.address,
          name: INVALID_NAME,
          addresses: evmAddresses(generateRandomAddress()),
        }),
      ).to.be.revertedWithCustomError(_collection, "NoModerators");
    });
  });

  describe("Given a moderator exists", function () {
    describe("Given an invalid name", function () {
      it("Should revert with 'InvalidName' error", async function () {
        await expect(
          createMintProposal({
            to: _owner.address,
            name: INVALID_NAME,
            addresses: evmAddresses(generateRandomAddress()),
          }),
        )
          .to.be.revertedWithCustomError(_collection, "InvalidName")
          .withArgs(INVALID_NAME);
      });
    });

    describe("Given the recipient is the zero address", function () {
      it("Should revert with 'ZeroAddress' error", async function () {
        await expect(
          createMintProposal({
            to: ethers.ZeroAddress,
            addresses: evmAddresses(generateRandomAddress()),
          }),
        )
          .to.be.revertedWithCustomError(_collection, "ZeroAddress")
          .withArgs("to");
      });
    });

    describe("Given a name already taken", function () {
      it("Should revert with 'UsedName' error", async function () {
        await createMintProposal({
          to: _owner.address,
          addresses: evmAddresses(generateRandomAddress()),
        });

        const index = (await _collection.mintProposalsLength()) - BigInt(1);
        const { id: proposalId } = await _collection.mintProposal(index);
        const tokenId = await _collection.nextTokenId();
        await _collection.connect(_moderator).mintFromProposal(proposalId);

        await expect(
          createMintProposal({
            to: _owner.address,
            addresses: evmAddresses(generateRandomAddress()),
          }),
        )
          .to.be.revertedWithCustomError(_collection, "UsedName")
          .withArgs(DEFAULT_NAME, tokenId);
      });
    });

    describe("Given an evm address already taken", function () {
      it("Should revert with 'UsedAgentAddress' error", async function () {
        const wallet = generateRandomAddress();
        await createMintProposal({
          to: _owner.address,
          name: DEFAULT_NAME + "-1",
          addresses: evmAddresses(wallet),
        });

        const index = (await _collection.mintProposalsLength()) - BigInt(1);
        const { id: proposalId } = await _collection.mintProposal(index);
        const tokenId = await _collection.nextTokenId();
        await _collection.connect(_moderator).mintFromProposal(proposalId);

        await expect(
          createMintProposal({
            to: _owner.address,
            name: DEFAULT_NAME + "-2",
            addresses: evmAddresses(wallet),
          }),
        )
          .to.be.revertedWithCustomError(_collection, "UsedAgentAddress")
          .withArgs("evm", wallet.toLowerCase(), tokenId);
      });
    });

    describe("Given the address list repeats an entry", function () {
      it("Should revert with 'UsedAgentAddress' and tokenId 0", async function () {
        const wallet = generateRandomAddress();
        await expect(
          createMintProposal({
            to: _owner.address,
            addresses: evmAddresses(wallet, wallet),
          }),
        )
          .to.be.revertedWithCustomError(_collection, "UsedAgentAddress")
          .withArgs("evm", wallet.toLowerCase(), 0n);
      });
    });

    describe("Given no evm address", function () {
      it("Should revert with 'MissingEvmAddress' error", async function () {
        await expect(
          createMintProposal({
            to: _owner.address,
            addresses: btcAddresses("bc1qexampleonly"),
          }),
        ).to.be.revertedWithCustomError(_collection, "MissingEvmAddress");
      });
    });

    describe("Given an evm address value is the zero address", function () {
      it("Should revert with 'InvalidEvmAddressValue' error", async function () {
        await expect(
          createMintProposal({
            to: _owner.address,
            addresses: evmAddresses(ethers.ZeroAddress),
          }),
        )
          .to.be.revertedWithCustomError(_collection, "InvalidEvmAddressValue")
          .withArgs(ethers.ZeroAddress);
      });
    });

    describe("Given cloneOf is set but value is 0", function () {
      it("Should revert with 'InvalidCloneOf' error", async function () {
        await expect(
          createMintProposal({
            to: _owner.address,
            addresses: evmAddresses(generateRandomAddress()),
            cloneOf: { isSet: true, value: 0n },
          }),
        )
          .to.be.revertedWithCustomError(_collection, "InvalidCloneOf")
          .withArgs(0n);
      });
    });

    describe("Given cloneOf is set but related token (agent) does not exist", function () {
      it("Should revert with 'InvalidCloneOf' error", async function () {
        await expect(
          createMintProposal({
            to: _owner.address,
            addresses: evmAddresses(generateRandomAddress()),
            cloneOf: { isSet: true, value: 9999n },
          }),
        )
          .to.be.revertedWithCustomError(_collection, "InvalidCloneOf")
          .withArgs(9999n);
      });
    });

    describe("Given the role attribute is missing", function () {
      it("Should revert with 'MissingRequiredKey'", async function () {
        await expect(
          createMintProposal({
            to: _owner.address,
            addresses: evmAddresses(generateRandomAddress()),
            attributes: [{ key: "mission", value: "random mission" }],
          }),
        )
          .to.be.revertedWithCustomError(_collection, "MissingRequiredKey")
          .withArgs("role");
      });
    });

    describe("Given the role attribute is empty", function () {
      it("Should revert with 'MissingRequiredKey'", async function () {
        await expect(
          createMintProposal({
            to: _owner.address,
            addresses: evmAddresses(generateRandomAddress()),
            attributes: [{ key: "role", value: "" }],
          }),
        )
          .to.be.revertedWithCustomError(_collection, "MissingRequiredKey")
          .withArgs("role");
      });
    });

    describe("Given the attributes list repeats a key", function () {
      it("Should revert with 'DuplicateKey'", async function () {
        await expect(
          createMintProposal({
            to: _owner.address,
            addresses: evmAddresses(generateRandomAddress()),
            attributes: [
              { key: "role", value: DEFAULT_ROLE },
              { key: "mission", value: "a" },
              { key: "mission", value: "b" },
            ],
          }),
        )
          .to.be.revertedWithCustomError(_collection, "DuplicateKey")
          .withArgs("mission");
      });
    });

    describe("Given the attributes list repeats the mandatory key", function () {
      it("Should revert with 'DuplicateKey'", async function () {
        await expect(
          createMintProposal({
            to: _owner.address,
            addresses: evmAddresses(generateRandomAddress()),
            attributes: [
              { key: "role", value: "" },
              { key: "role", value: DEFAULT_ROLE },
            ],
          }),
        )
          .to.be.revertedWithCustomError(_collection, "DuplicateKey")
          .withArgs("role");
      });
    });

    describe("Given valid parameters", function () {
      it("Should create the proposal (cloneOf set)", async function () {
        await createMintProposal({
          to: _owner.address,
          addresses: evmAddresses(generateRandomAddress()),
        });

        const index = (await _collection.mintProposalsLength()) - BigInt(1);
        const { id: proposalId } = await _collection.mintProposal(index);
        await _collection.connect(_moderator).mintFromProposal(proposalId);

        const cloneOf: NullableUint256Struct = {
          isSet: true,
          value: (await _collection.nextTokenId()) - BigInt(1),
        };

        const before = await _collection.mintProposalsLength();
        await createMintProposal({
          to: _owner.address,
          name: "cloned-agent",
          addresses: evmAddresses(generateRandomAddress()),
          cloneOf,
        });
        expect(await _collection.mintProposalsLength()).to.be.equal(
          before + BigInt(1),
        );
      });

      it("Should create the proposal (cloneOf not set)", async function () {
        const before = await _collection.mintProposalsLength();
        await createMintProposal({
          to: _owner.address,
          addresses: evmAddresses(generateRandomAddress()),
        });
        expect(await _collection.mintProposalsLength()).to.be.equal(
          before + BigInt(1),
        );
      });

      it("Should store canonicalized addresses in the proposal (evm lowercased, non-evm verbatim)", async function () {
        const wallet = generateRandomAddress();
        const btcValue = "bc1QVerbatimValue";
        await createMintProposal({
          to: _owner.address,
          addresses: [...evmAddresses(wallet), ...btcAddresses(btcValue)],
        });

        const index = (await _collection.mintProposalsLength()) - BigInt(1);
        const proposal = await _collection.mintProposal(index);
        expect(
          proposal.addresses.map((entry) => [entry.addressType, entry.value]),
        ).to.deep.equal([
          ["evm", wallet.toLowerCase()],
          ["btc", btcValue],
        ]);
      });

      it("Should store attributes verbatim in the proposal", async function () {
        await createMintProposal({
          to: _owner.address,
          addresses: evmAddresses(generateRandomAddress()),
        });

        const index = (await _collection.mintProposalsLength()) - BigInt(1);
        const proposal = await _collection.mintProposal(index);
        expect(
          proposal.attributes.map((entry) => [entry.key, entry.value]),
        ).to.deep.equal(
          DEFAULT_ATTRIBUTES.map((entry) => [entry.key, entry.value]),
        );
      });

      it("Should allow anybody to create a proposal", async function () {
        const before = await _collection.mintProposalsLength();
        await createMintProposal(
          {
            to: _owner.address,
            addresses: evmAddresses(generateRandomAddress()),
          },
          _otherAccount,
        );
        expect(await _collection.mintProposalsLength()).to.be.equal(
          before + BigInt(1),
        );
      });

      it("Should emit a MintProposalCreated event", async function () {
        // The event's first arg is the proposal recipient (`to`), not the caller.
        await expect(
          createMintProposal(
            {
              to: _owner.address,
              addresses: evmAddresses(generateRandomAddress()),
            },
            _otherAccount,
          ),
        )
          .to.emit(_collection, "MintProposalCreated")
          .withArgs(_owner.address, 1n);
      });
    });
  });
});
