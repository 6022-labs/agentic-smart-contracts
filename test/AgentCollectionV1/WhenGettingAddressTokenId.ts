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

describe("WhenGettingAddressTokenId", function () {
  const ipfsGateway = "https://ipfs.io/ipfs/";

  let _collection: AgentCollectionV1;
  let _agentWallet: HardhatEthersSigner;
  let _tokenId: bigint;

  async function deployWithAgent() {
    await reset();

    const [owner, agentWallet] = await ethers.getSigners();

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

    return { collection, agentWallet, tokenId };
  }

  beforeEach(async function () {
    const { collection, agentWallet, tokenId } =
      await loadFixture(deployWithAgent);

    _collection = collection;
    _agentWallet = agentWallet;
    _tokenId = tokenId;
  });

  describe("Given a registered evm address", function () {
    it("Should return the token id regardless of casing", async function () {
      expect(
        await _collection.addressToTokenId("evm", _agentWallet.address)
      ).to.equal(_tokenId);
      expect(
        await _collection.addressToTokenId(
          "evm",
          _agentWallet.address.toLowerCase()
        )
      ).to.equal(_tokenId);
    });
  });

  describe("Given an unregistered address", function () {
    it("Should return 0", async function () {
      expect(
        await _collection.addressToTokenId(
          "evm",
          ethers.Wallet.createRandom().address
        )
      ).to.equal(0n);
    });
  });

  describe("Given an unparseable evm value", function () {
    it("Should return 0", async function () {
      expect(
        await _collection.addressToTokenId("evm", "not-an-address")
      ).to.equal(0n);
    });
  });
});
