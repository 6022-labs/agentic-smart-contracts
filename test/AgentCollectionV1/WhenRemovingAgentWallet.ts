import { expect } from "chai";
import { ethers } from "hardhat";
import { AgentCollectionV1 } from "../../typechain-types";
import { loadFixture, reset } from "@nomicfoundation/hardhat-network-helpers";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { proposeAndMint, deployCollectionWithCreator } from "../common";

describe("WhenRemovingAgentWallet", function () {
  const ipfsGateway = "https://ipfs.io/ipfs/";

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
      wallets: [agentWallet.address],
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

  describe("Given the caller is the NFT owner", function () {
    it("Should remove the wallet and clear its mapping", async function () {
      await _collection
        .connect(_owner)
        .removeAgentWallet(_tokenId, _agentWallet.address);

      expect(await _collection.walletsCountOf(_tokenId)).to.equal(0n);
      expect(await _collection.walletToTokenId(_agentWallet.address)).to.equal(
        0n
      );
    });

    it("Should emit 'AgentWalletRemoved'", async function () {
      await expect(
        _collection
          .connect(_owner)
          .removeAgentWallet(_tokenId, _agentWallet.address)
      )
        .to.emit(_collection, "AgentWalletRemoved")
        .withArgs(_tokenId, _agentWallet.address);
    });
  });

  describe("Given the caller is a registered agent wallet", function () {
    it("Should allow a wallet to remove itself", async function () {
      await _collection
        .connect(_agentWallet)
        .removeAgentWallet(_tokenId, _agentWallet.address);

      expect(await _collection.walletsCountOf(_tokenId)).to.equal(0n);
    });
  });

  describe("Given the wallet is not registered to the agent", function () {
    it("Should revert with 'WalletNotFound'", async function () {
      await expect(
        _collection
          .connect(_owner)
          .removeAgentWallet(_tokenId, _newWallet.address)
      )
        .to.be.revertedWithCustomError(_collection, "WalletNotFound")
        .withArgs(_newWallet.address);
    });
  });

  describe("Given the caller is not an agent controller", function () {
    it("Should revert with 'OwnableUnauthorizedAccount'", async function () {
      await expect(
        _collection
          .connect(_otherAccount)
          .removeAgentWallet(_tokenId, _agentWallet.address)
      )
        .to.be.revertedWithCustomError(
          _collection,
          "OwnableUnauthorizedAccount"
        )
        .withArgs(_otherAccount.address, _tokenId);
    });
  });
});
