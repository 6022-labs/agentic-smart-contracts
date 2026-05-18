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

describe("WhenReadingAddr", function () {
  let _node: string;
  let _agentWallet: HardhatEthersSigner;
  let _agentControlledWallet: HardhatEthersSigner;
  let _collection: AgentCollectionV1;
  let _collectionAddress: string;
  let _ensRegistry: AgentEnsRegistry;
  let _tokenId: bigint;

  beforeEach(async function () {
    const fixture = await loadFixture(deployAgentEnsRegistryWithAgent);
    _agentWallet = fixture.agentWallet;
    _agentControlledWallet = fixture.agentControlledWallet;
    _collection = fixture.collection;
    _collectionAddress = await _collection.getAddress();
    _ensRegistry = fixture.ensRegistry;
    _tokenId = fixture.tokenId;
    _node = await agentNode();
  });

  it("Should return the zero address for an unprovisioned node", async function () {
    expect(await _ensRegistry.addr(_node)).to.equal(ethers.ZeroAddress);
  });

  it("Should return the agent's first registered wallet once provisioned", async function () {
    await _ensRegistry
      .connect(_agentWallet)
      .initAgentTexts(_collectionAddress, _tokenId, runtimeRecords());

    const firstWallet = await _collection.walletOfByIndex(_tokenId, 0);
    expect(firstWallet).to.equal(_agentControlledWallet.address);
    expect(await _ensRegistry.addr(_node)).to.equal(firstWallet);
  });

  it("Should return the zero address for a node that was never provisioned through this registry", async function () {
    const unrelatedNode = ethers.namehash("never-provisioned.6022.eth");
    expect(await _ensRegistry.addr(unrelatedNode)).to.equal(ethers.ZeroAddress);
  });
});
