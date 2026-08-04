import { expect } from "chai";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { ethers } from "hardhat";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { AgentCollectionV1, AgentEnsRegistry } from "../../typechain-types";
import {
  deployAgentEnsRegistryWithAgent,
  agentNode,
  runtimeRecords,
} from "./common";
import {
  proposeAndMint,
  generateRandomAddress,
  evmAddresses,
  btcAddresses,
} from "../common";

describe("WhenReadingAddr", function () {
  let _node: string;
  let _moderator: HardhatEthersSigner;
  let _agentWallet: HardhatEthersSigner;
  let _agentControlledWallet: HardhatEthersSigner;
  let _collection: AgentCollectionV1;
  let _collectionAddress: string;
  let _ensRegistry: AgentEnsRegistry;
  let _tokenId: bigint;

  beforeEach(async function () {
    const fixture = await loadFixture(deployAgentEnsRegistryWithAgent);
    _moderator = fixture.moderator;
    _agentWallet = fixture.agentWallet;
    _agentControlledWallet = fixture.agentControlledWallet;
    _collection = fixture.collection;
    _collectionAddress = await _collection.getAddress();
    _ensRegistry = fixture.ensRegistry;
    _tokenId = fixture.tokenId;
    _node = await agentNode();
  });

  describe("Given the node is not provisioned", function () {
    it("Should return the zero address", async function () {
      expect(await _ensRegistry.addr(_node)).to.equal(ethers.ZeroAddress);
    });

    it("Should return the zero address for a node from outside this registry", async function () {
      const unrelatedNode = ethers.namehash("never-provisioned.6022.eth");
      expect(await _ensRegistry.addr(unrelatedNode)).to.equal(
        ethers.ZeroAddress
      );
    });
  });

  describe("Given the node is provisioned", function () {
    beforeEach(async function () {
      await _ensRegistry
        .connect(_agentWallet)
        .initAgentTexts(_collectionAddress, _tokenId, runtimeRecords());
    });

    it("Should return the agent's first registered wallet", async function () {
      expect(await _ensRegistry.addr(_node)).to.equal(
        _agentControlledWallet.address
      );
    });

    describe("Given the agent rotated its evm entry", function () {
      let _rotatedWallet: string;

      beforeEach(async function () {
        _rotatedWallet = generateRandomAddress();
        await _collection
          .connect(_agentWallet)
          .addAgentAddress(_tokenId, "evm", _rotatedWallet);
        await _collection
          .connect(_agentWallet)
          .removeAgentAddress(_tokenId, "evm", _agentControlledWallet.address);
      });

      it("Should return the remaining evm entry", async function () {
        expect(await _ensRegistry.addr(_node)).to.equal(_rotatedWallet);
      });

      it("Should revert when removing the last evm entry", async function () {
        await expect(
          _collection
            .connect(_agentWallet)
            .removeAgentAddress(_tokenId, "evm", _rotatedWallet)
        ).to.be.revertedWithCustomError(_collection, "MissingEvmAddress");
      });
    });
  });

  describe("Given the agent was minted with a btc entry before the evm one", function () {
    it("Should return the evm entry", async function () {
      const wallet = generateRandomAddress();
      const tokenId = await proposeAndMint(_collection, _moderator, {
        to: _agentWallet.address,
        name: "btc-first-agent",
        addresses: [
          ...btcAddresses("bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4"),
          ...evmAddresses(wallet),
        ],
      });
      await _ensRegistry
        .connect(_agentWallet)
        .initAgentTexts(_collectionAddress, tokenId, runtimeRecords());

      const node = await agentNode("btc-first-agent");
      expect(await _ensRegistry.addr(node)).to.equal(wallet);
    });
  });
});
