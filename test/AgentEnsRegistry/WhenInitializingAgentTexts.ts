import { expect } from "chai";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { AgentCollectionV1, AgentEnsRegistry } from "../../typechain-types";
import { deployCollectionWithCreator, proposeAndMint } from "../common";
import {
  deployAgentEnsRegistryWithAgent,
  agentNode,
  runtimeRecords,
  RUNTIME_URL_KEY,
  RUNTIME_KIND_KEY,
  AGENT_NAME,
} from "./common";

describe("WhenInitializingAgentTexts", function () {
  let _node: string;
  let _owner: HardhatEthersSigner;
  let _moderator: HardhatEthersSigner;
  let _agentSigner: HardhatEthersSigner;
  let _agentWallet: HardhatEthersSigner;
  let _agentControlledWallet: HardhatEthersSigner;
  let _outsider: HardhatEthersSigner;
  let _collection: AgentCollectionV1;
  let _collectionAddress: string;
  let _ensRegistry: AgentEnsRegistry;
  let _tokenId: bigint;

  beforeEach(async function () {
    const fixture = await loadFixture(deployAgentEnsRegistryWithAgent);
    _owner = fixture.owner;
    _moderator = fixture.moderator;
    _agentSigner = fixture.agentSigner;
    _agentWallet = fixture.agentWallet;
    _agentControlledWallet = fixture.agentControlledWallet;
    _outsider = fixture.outsider;
    _collection = fixture.collection;
    _collectionAddress = await _collection.getAddress();
    _ensRegistry = fixture.ensRegistry;
    _tokenId = fixture.tokenId;
    _node = await agentNode();
  });

  describe("Given a batch carrying both runtime keys", function () {
    // The contract gate accepts the NFT owner and any registered agent wallet
    // through the same code path, so run identical assertions for both callers.
    const callers = [
      { label: "owns the agent NFT", getSigner: () => _agentWallet },
      {
        label: "is a registered agent wallet",
        getSigner: () => _agentControlledWallet,
      },
    ];

    for (const { label, getSigner } of callers) {
      describe(`Given the caller ${label}`, function () {
        it("Should provision the subnode and store every record", async function () {
          await _ensRegistry
            .connect(getSigner())
            .initAgentTexts(_collectionAddress, _tokenId, runtimeRecords());

          expect(await _ensRegistry.provisioned(_node)).to.equal(true);
          expect(await _ensRegistry.text(_node, RUNTIME_URL_KEY)).to.equal(
            "https://agent.example/"
          );
          expect(await _ensRegistry.text(_node, RUNTIME_KIND_KEY)).to.equal(
            "agent-node"
          );
        });

        it("Should emit SubnodeProvisioned and AgentTextUpdated per record", async function () {
          await expect(
            _ensRegistry
              .connect(getSigner())
              .initAgentTexts(_collectionAddress, _tokenId, runtimeRecords())
          )
            .to.emit(_ensRegistry, "SubnodeProvisioned")
            .withArgs(_collectionAddress, _tokenId, _node, AGENT_NAME)
            .and.to.emit(_ensRegistry, "AgentTextUpdated")
            .withArgs(
              _collectionAddress,
              _tokenId,
              RUNTIME_URL_KEY,
              "https://agent.example/"
            )
            .and.to.emit(_ensRegistry, "AgentTextUpdated")
            .withArgs(
              _collectionAddress,
              _tokenId,
              RUNTIME_KIND_KEY,
              "agent-node"
            );
        });
      });
    }
  });

  describe("Given the agent is already provisioned", function () {
    it("Should revert with AlreadyProvisioned", async function () {
      await _ensRegistry
        .connect(_agentWallet)
        .initAgentTexts(_collectionAddress, _tokenId, runtimeRecords());

      await expect(
        _ensRegistry
          .connect(_agentWallet)
          .initAgentTexts(_collectionAddress, _tokenId, runtimeRecords())
      )
        .to.be.revertedWithCustomError(_ensRegistry, "AlreadyProvisioned")
        .withArgs(_collectionAddress, _tokenId);
    });
  });

  describe("Given the batch is missing agent.runtime-url", function () {
    it("Should revert with MissingRequiredKey", async function () {
      await expect(
        _ensRegistry
          .connect(_agentWallet)
          .initAgentTexts(_collectionAddress, _tokenId, [
            { key: RUNTIME_KIND_KEY, value: "agent-node" },
          ])
      )
        .to.be.revertedWithCustomError(_ensRegistry, "MissingRequiredKey")
        .withArgs(RUNTIME_URL_KEY);
    });
  });

  describe("Given the batch is missing agent.runtime-kind", function () {
    it("Should revert with MissingRequiredKey", async function () {
      await expect(
        _ensRegistry
          .connect(_agentWallet)
          .initAgentTexts(_collectionAddress, _tokenId, [
            { key: RUNTIME_URL_KEY, value: "https://agent.example/" },
          ])
      )
        .to.be.revertedWithCustomError(_ensRegistry, "MissingRequiredKey")
        .withArgs(RUNTIME_KIND_KEY);
    });
  });

  describe("Given agent.runtime-url is present but has an empty value", function () {
    it("Should revert with MissingRequiredKey", async function () {
      await expect(
        _ensRegistry
          .connect(_agentWallet)
          .initAgentTexts(_collectionAddress, _tokenId, [
            { key: RUNTIME_URL_KEY, value: "" },
            { key: RUNTIME_KIND_KEY, value: "agent-node" },
          ])
      )
        .to.be.revertedWithCustomError(_ensRegistry, "MissingRequiredKey")
        .withArgs(RUNTIME_URL_KEY);
    });
  });

  describe("Given agent.runtime-kind is present but has an empty value", function () {
    it("Should revert with MissingRequiredKey", async function () {
      await expect(
        _ensRegistry
          .connect(_agentWallet)
          .initAgentTexts(_collectionAddress, _tokenId, [
            { key: RUNTIME_URL_KEY, value: "https://agent.example/" },
            { key: RUNTIME_KIND_KEY, value: "" },
          ])
      )
        .to.be.revertedWithCustomError(_ensRegistry, "MissingRequiredKey")
        .withArgs(RUNTIME_KIND_KEY);
    });
  });

  describe("Given the collection is not registered with the manager", function () {
    it("Should revert with UnknownCollection", async function () {
      const { collection: outsideCollection, collectionsManager: outsideManager } =
        await deployCollectionWithCreator({
          name: "Outside",
          symbol: "OUT",
          owner: _owner,
          moderator: _moderator,
        });
      await outsideManager.grantRole(
        await outsideManager.SIGNER_ROLE(),
        _agentSigner.address
      );
      const outsideTokenId = await proposeAndMint(
        _agentSigner,
        outsideCollection,
        _moderator,
        { to: _agentWallet.address, name: AGENT_NAME }
      );

      await expect(
        _ensRegistry
          .connect(_agentWallet)
          .initAgentTexts(
            await outsideCollection.getAddress(),
            outsideTokenId,
            runtimeRecords()
          )
      )
        .to.be.revertedWithCustomError(_ensRegistry, "UnknownCollection")
        .withArgs(await outsideCollection.getAddress());
    });
  });

  describe("Given the caller is neither the NFT owner nor an agent wallet", function () {
    it("Should revert with NotAgentOwnerOrWallet", async function () {
      await expect(
        _ensRegistry
          .connect(_outsider)
          .initAgentTexts(_collectionAddress, _tokenId, runtimeRecords())
      )
        .to.be.revertedWithCustomError(_ensRegistry, "NotAgentOwnerOrWallet")
        .withArgs(_collectionAddress, _tokenId, _outsider.address);
    });
  });
});
