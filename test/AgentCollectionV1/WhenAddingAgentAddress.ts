import { expect } from "chai";
import { ethers } from "hardhat";
import { AgentCollectionV1 } from "../../typechain-types";
import { loadFixture, reset } from "@nomicfoundation/hardhat-network-helpers";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import {
  proposeAndMint,
  evmAddresses,
  deployCollectionWithCreator,
} from "../common";

describe("WhenAddingAgentAddress", function () {
  const ipfsGateway = "https://ipfs.io/ipfs/";

  const BTC_VALUE = "bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4";
  const SOLANA_VALUE = "4Nd1mYbVrCkoYPYmVAknW5pKaCTM2m7Y1cPwWkVpS3so";

  let _collection: AgentCollectionV1;
  let _owner: HardhatEthersSigner;
  let _agentWallet: HardhatEthersSigner;
  let _otherAccount: HardhatEthersSigner;
  let _newWallet: HardhatEthersSigner;
  let _tokenId: bigint;

  async function deployWithAgent() {
    await reset();

    const [owner, agentWallet, otherAccount, newWallet] =
      await ethers.getSigners();

    const { collection } = await deployCollectionWithCreator({
      owner,
      moderator: owner,
      ipfsGateway,
    });

    const tokenId = await proposeAndMint(collection, owner, {
      to: owner.address,
      name: "test-agent",
      addresses: evmAddresses(agentWallet.address),
    });

    return { collection, owner, agentWallet, otherAccount, newWallet, tokenId };
  }

  beforeEach(async function () {
    const { collection, owner, agentWallet, otherAccount, newWallet, tokenId } =
      await loadFixture(deployWithAgent);

    _collection = collection;
    _owner = owner;
    _agentWallet = agentWallet;
    _otherAccount = otherAccount;
    _newWallet = newWallet;
    _tokenId = tokenId;
  });

  const callers = [
    { label: "the NFT owner", getSigner: () => _owner },
    { label: "a registered agent wallet", getSigner: () => _agentWallet },
  ];

  for (const { label, getSigner } of callers) {
    describe(`Given the caller is ${label}`, function () {
      it("Should append evm, btc and solana entries and map them to the token", async function () {
        await _collection
          .connect(getSigner())
          .addAgentAddress(_tokenId, "evm", _newWallet.address);
        await _collection
          .connect(getSigner())
          .addAgentAddress(_tokenId, "btc", BTC_VALUE);
        await _collection
          .connect(getSigner())
          .addAgentAddress(_tokenId, "solana", SOLANA_VALUE);

        expect(await _collection.addressesCountOf(_tokenId)).to.equal(4n);
        expect(await _collection.addressToTokenId("btc", BTC_VALUE)).to.equal(
          _tokenId
        );
        expect(
          await _collection.addressToTokenId("solana", SOLANA_VALUE)
        ).to.equal(_tokenId);
        expect(
          await _collection.addressToTokenId("evm", _newWallet.address)
        ).to.equal(_tokenId);
      });

      it("Should emit 'AgentAddressAdded' with the canonical value", async function () {
        await expect(
          _collection
            .connect(getSigner())
            .addAgentAddress(_tokenId, "evm", _newWallet.address)
        )
          .to.emit(_collection, "AgentAddressAdded")
          .withArgs(_tokenId, "evm", _newWallet.address.toLowerCase());
      });
    });
  }

  describe("Given a checksummed evm value", function () {
    it("Should store the canonicalized value and resolve checksummed queries", async function () {
      await _collection
        .connect(_owner)
        .addAgentAddress(_tokenId, "evm", _newWallet.address);

      const stored = await _collection.addressOfByIndex(_tokenId, 1);
      expect(stored.addressType).to.equal("evm");
      expect(stored.value).to.equal(_newWallet.address.toLowerCase());
      expect(
        await _collection.addressToTokenId("evm", _newWallet.address)
      ).to.equal(_tokenId);
    });
  });

  describe("Given the address already belongs to the same agent", function () {
    it("Should revert with 'UsedAgentAddress' carrying the canonicalized evm value", async function () {
      await expect(
        _collection
          .connect(_owner)
          .addAgentAddress(_tokenId, "evm", _agentWallet.address)
      )
        .to.be.revertedWithCustomError(_collection, "UsedAgentAddress")
        .withArgs("evm", _agentWallet.address.toLowerCase(), _tokenId);
    });

    it("Should revert with 'UsedAgentAddress' carrying a non-evm value verbatim", async function () {
      await _collection
        .connect(_owner)
        .addAgentAddress(_tokenId, "btc", BTC_VALUE);

      await expect(
        _collection.connect(_owner).addAgentAddress(_tokenId, "btc", BTC_VALUE)
      )
        .to.be.revertedWithCustomError(_collection, "UsedAgentAddress")
        .withArgs("btc", BTC_VALUE, _tokenId);
    });
  });

  describe("Given the address already belongs to another agent", function () {
    it("Should revert with 'UsedAgentAddress' naming the other token", async function () {
      const otherTokenId = await proposeAndMint(_collection, _owner, {
        to: _owner.address,
        name: "other-agent",
        addresses: evmAddresses(_newWallet.address),
      });

      await expect(
        _collection
          .connect(_owner)
          .addAgentAddress(_tokenId, "evm", _newWallet.address)
      )
        .to.be.revertedWithCustomError(_collection, "UsedAgentAddress")
        .withArgs("evm", _newWallet.address.toLowerCase(), otherTokenId);
    });
  });

  describe("Given an invalid address type", function () {
    for (const addressType of ["", "EVM"]) {
      it(`Should revert with 'InvalidAddressType' for '${addressType}'`, async function () {
        await expect(
          _collection
            .connect(_owner)
            .addAgentAddress(_tokenId, addressType, _newWallet.address)
        )
          .to.be.revertedWithCustomError(_collection, "InvalidAddressType")
          .withArgs(addressType, _newWallet.address);
      });
    }
  });

  describe("Given an empty address value", function () {
    it("Should revert with 'EmptyAddressValue'", async function () {
      await expect(
        _collection.connect(_owner).addAgentAddress(_tokenId, "btc", "")
      )
        .to.be.revertedWithCustomError(_collection, "EmptyAddressValue")
        .withArgs("btc");
    });
  });

  describe("Given an invalid evm value", function () {
    it("Should revert with 'InvalidEvmAddressValue' for malformed hex", async function () {
      await expect(
        _collection.connect(_owner).addAgentAddress(_tokenId, "evm", "not-hex")
      )
        .to.be.revertedWithCustomError(_collection, "InvalidEvmAddressValue")
        .withArgs("not-hex");
    });

    it("Should revert with 'InvalidEvmAddressValue' for the zero address", async function () {
      await expect(
        _collection
          .connect(_owner)
          .addAgentAddress(_tokenId, "evm", ethers.ZeroAddress)
      )
        .to.be.revertedWithCustomError(_collection, "InvalidEvmAddressValue")
        .withArgs(ethers.ZeroAddress);
    });
  });

  describe("Given the caller is not an agent controller", function () {
    it("Should revert with 'OwnableUnauthorizedAccount'", async function () {
      await expect(
        _collection
          .connect(_otherAccount)
          .addAgentAddress(_tokenId, "evm", _newWallet.address)
      )
        .to.be.revertedWithCustomError(
          _collection,
          "OwnableUnauthorizedAccount"
        )
        .withArgs(_otherAccount.address, _tokenId);
    });
  });

  describe("Given controller rights over the agent", function () {
    it("Should allow the NFT owner to update an attribute", async function () {
      await expect(
        _collection
          .connect(_owner)
          .addOrUpdateAgentAttribute(_tokenId, "key", "value")
      )
        .to.emit(_collection, "AgentAttributeUpdated")
        .withArgs(_tokenId, "key", "", "value");
    });

    it("Should allow a registered evm wallet to update an attribute", async function () {
      await expect(
        _collection
          .connect(_agentWallet)
          .addOrUpdateAgentAttribute(_tokenId, "key", "value")
      )
        .to.emit(_collection, "AgentAttributeUpdated")
        .withArgs(_tokenId, "key", "", "value");
    });

    it("Should reject an unrelated signer", async function () {
      await expect(
        _collection
          .connect(_otherAccount)
          .addOrUpdateAgentAttribute(_tokenId, "key", "value")
      )
        .to.be.revertedWithCustomError(
          _collection,
          "OwnableUnauthorizedAccount"
        )
        .withArgs(_otherAccount.address, _tokenId);
    });

    it("Should grant nothing through a non-evm entry", async function () {
      // The agent's only extra entry is btc; "holding" it grants no control.
      await _collection
        .connect(_owner)
        .addAgentAddress(_tokenId, "btc", BTC_VALUE);

      await expect(
        _collection
          .connect(_otherAccount)
          .addOrUpdateAgentAttribute(_tokenId, "key", "value")
      )
        .to.be.revertedWithCustomError(
          _collection,
          "OwnableUnauthorizedAccount"
        )
        .withArgs(_otherAccount.address, _tokenId);
    });
  });
});
