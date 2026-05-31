import { expect } from "chai";
import { ethers } from "hardhat";
import { AgentCollectionV1 } from "../../typechain-types";
import { loadFixture, reset } from "@nomicfoundation/hardhat-network-helpers";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { proposeAndMint, deployCollectionWithCreator } from "../common";

describe("WhenAddingAgentWallet", function () {
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

  const callers = [
    { label: "the NFT owner", getSigner: () => _owner },
    { label: "a registered agent wallet", getSigner: () => _agentWallet },
  ];

  for (const { label, getSigner } of callers) {
    describe(`Given the caller is ${label}`, function () {
      it("Should append the wallet and map it to the token", async function () {
        await _collection
          .connect(getSigner())
          .addAgentWallet(_tokenId, _newWallet.address);

        expect(await _collection.walletsCountOf(_tokenId)).to.equal(2n);
        expect(await _collection.walletToTokenId(_newWallet.address)).to.equal(
          _tokenId
        );
      });

      it("Should emit 'AgentWalletAdded'", async function () {
        await expect(
          _collection
            .connect(getSigner())
            .addAgentWallet(_tokenId, _newWallet.address)
        )
          .to.emit(_collection, "AgentWalletAdded")
          .withArgs(_tokenId, _newWallet.address);
      });
    });
  }

  describe("Given the wallet is the zero address", function () {
    it("Should revert with 'ZeroAddress'", async function () {
      await expect(
        _collection.connect(_owner).addAgentWallet(_tokenId, ethers.ZeroAddress)
      )
        .to.be.revertedWithCustomError(_collection, "ZeroAddress")
        .withArgs("wallet");
    });
  });

  describe("Given the wallet already belongs to an agent", function () {
    it("Should revert with 'UsedWallet'", async function () {
      await expect(
        _collection
          .connect(_owner)
          .addAgentWallet(_tokenId, _agentWallet.address)
      )
        .to.be.revertedWithCustomError(_collection, "UsedWallet")
        .withArgs(_agentWallet.address, _tokenId);
    });
  });

  describe("Given the caller is not an agent controller", function () {
    it("Should revert with 'OwnableUnauthorizedAccount'", async function () {
      await expect(
        _collection
          .connect(_otherAccount)
          .addAgentWallet(_tokenId, _newWallet.address)
      )
        .to.be.revertedWithCustomError(
          _collection,
          "OwnableUnauthorizedAccount"
        )
        .withArgs(_otherAccount.address, _tokenId);
    });
  });
});
