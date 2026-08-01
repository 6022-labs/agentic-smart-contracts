import { expect } from "chai";
import { ethers } from "hardhat";
import { AgentCollectionV1 } from "../../typechain-types";
import { loadFixture, reset } from "@nomicfoundation/hardhat-network-helpers";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import {
  proposeAndMint,
  evmAddresses,
  btcAddresses,
  deployCollectionWithCreator,
} from "../common";

describe("WhenRemovingAgentAddress", function () {
  const ipfsGateway = "https://ipfs.io/ipfs/";

  const BTC_VALUE = "bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4";

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
      addresses: [
        ...evmAddresses(agentWallet.address),
        ...btcAddresses(BTC_VALUE),
      ],
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
      it("Should remove an evm entry and clear its mapping", async function () {
        await _collection
          .connect(getSigner())
          .removeAgentAddress(_tokenId, "evm", _agentWallet.address);

        expect(await _collection.addressesCountOf(_tokenId)).to.equal(1n);
        expect(
          await _collection.addressToTokenId("evm", _agentWallet.address)
        ).to.equal(0n);
      });

      it("Should accept a checksummed evm value", async function () {
        // _agentWallet.address is checksummed while the stored value is lowercase.
        expect(_agentWallet.address).to.not.equal(
          _agentWallet.address.toLowerCase()
        );

        await _collection
          .connect(getSigner())
          .removeAgentAddress(_tokenId, "evm", _agentWallet.address);

        expect(
          await _collection.addressToTokenId("evm", _agentWallet.address)
        ).to.equal(0n);
      });

      it("Should emit 'AgentAddressRemoved' with the canonical value", async function () {
        await expect(
          _collection
            .connect(getSigner())
            .removeAgentAddress(_tokenId, "evm", _agentWallet.address)
        )
          .to.emit(_collection, "AgentAddressRemoved")
          .withArgs(_tokenId, "evm", _agentWallet.address.toLowerCase());
      });

      it("Should leave the evm entry intact when removing the btc entry", async function () {
        await _collection
          .connect(getSigner())
          .removeAgentAddress(_tokenId, "btc", BTC_VALUE);

        expect(await _collection.addressesCountOf(_tokenId)).to.equal(1n);
        expect(await _collection.addressToTokenId("btc", BTC_VALUE)).to.equal(
          0n
        );
        expect(
          await _collection.addressToTokenId("evm", _agentWallet.address)
        ).to.equal(_tokenId);
      });

      it("Should allow removing the last evm entry and keep the owner as controller", async function () {
        await _collection
          .connect(getSigner())
          .removeAgentAddress(_tokenId, "evm", _agentWallet.address);

        expect(await _collection.addressesCountOf(_tokenId)).to.equal(1n);

        await expect(
          _collection
            .connect(_owner)
            .addAgentAddress(_tokenId, "evm", _newWallet.address)
        ).to.emit(_collection, "AgentAddressAdded");
      });
    });
  }

  describe("Given the address is not registered to the agent", function () {
    it("Should revert with 'AgentAddressNotFound' carrying the canonicalized evm value", async function () {
      await expect(
        _collection
          .connect(_owner)
          .removeAgentAddress(_tokenId, "evm", _newWallet.address)
      )
        .to.be.revertedWithCustomError(_collection, "AgentAddressNotFound")
        .withArgs("evm", _newWallet.address.toLowerCase());
    });

    it("Should revert with 'AgentAddressNotFound' carrying a non-evm value verbatim", async function () {
      await expect(
        _collection
          .connect(_owner)
          .removeAgentAddress(_tokenId, "solana", "unknown-value")
      )
        .to.be.revertedWithCustomError(_collection, "AgentAddressNotFound")
        .withArgs("solana", "unknown-value");
    });
  });

  describe("Given the caller is not an agent controller", function () {
    it("Should revert with 'OwnableUnauthorizedAccount'", async function () {
      await expect(
        _collection
          .connect(_otherAccount)
          .removeAgentAddress(_tokenId, "evm", _agentWallet.address)
      )
        .to.be.revertedWithCustomError(
          _collection,
          "OwnableUnauthorizedAccount"
        )
        .withArgs(_otherAccount.address, _tokenId);
    });
  });
});
