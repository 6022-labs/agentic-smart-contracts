import { expect } from "chai";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { AgentCollectionV1, AgentEnsRegistry } from "../../typechain-types";
import {
  deployAgentEnsRegistryWithAgent,
  agentNode,
  runtimeRecords,
  RUNTIME_URL_KEY,
} from "./common";

describe("WhenReadingText", function () {
  let _node: string;
  let _agentWallet: HardhatEthersSigner;
  let _collection: AgentCollectionV1;
  let _collectionAddress: string;
  let _ensRegistry: AgentEnsRegistry;
  let _tokenId: bigint;

  beforeEach(async function () {
    const fixture = await loadFixture(deployAgentEnsRegistryWithAgent);
    _agentWallet = fixture.agentWallet;
    _collection = fixture.collection;
    _collectionAddress = await _collection.getAddress();
    _ensRegistry = fixture.ensRegistry;
    _tokenId = fixture.tokenId;
    _node = await agentNode();
  });

  it("Should return the empty string for an unprovisioned node", async function () {
    expect(await _ensRegistry.text(_node, RUNTIME_URL_KEY)).to.equal("");
  });

  it("Should return the empty string for a key that was never written", async function () {
    await _ensRegistry
      .connect(_agentWallet)
      .initAgentTexts(_collectionAddress, _tokenId, runtimeRecords());

    expect(await _ensRegistry.text(_node, "avatar")).to.equal("");
  });

  it("Should return the stored value after initialization", async function () {
    await _ensRegistry
      .connect(_agentWallet)
      .initAgentTexts(_collectionAddress, _tokenId, runtimeRecords());

    expect(await _ensRegistry.text(_node, RUNTIME_URL_KEY)).to.equal(
      "https://agent.example/"
    );
  });
});
