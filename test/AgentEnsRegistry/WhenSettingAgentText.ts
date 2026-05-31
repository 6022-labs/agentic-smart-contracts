import { expect } from "chai";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { AgentCollectionV1, AgentEnsRegistry } from "../../typechain-types";
import { deployCollectionWithCreator, proposeAndMint } from "../common";
import {
  deployAgentEnsRegistryWithAgent,
  agentNode,
  runtimeRecords,
  URL_KEY,
  AGENT_KIND_KEY,
  AGENT_NAME,
} from "./common";

describe("WhenSettingAgentText", function () {
  let _node: string;
  let _owner: HardhatEthersSigner;
  let _moderator: HardhatEthersSigner;
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
    _agentWallet = fixture.agentWallet;
    _agentControlledWallet = fixture.agentControlledWallet;
    _outsider = fixture.outsider;
    _collection = fixture.collection;
    _collectionAddress = await _collection.getAddress();
    _ensRegistry = fixture.ensRegistry;
    _tokenId = fixture.tokenId;
    _node = await agentNode();
  });

  describe("Given the agent has been initialized", function () {
    beforeEach(async function () {
      await _ensRegistry
        .connect(_agentWallet)
        .initAgentTexts(_collectionAddress, _tokenId, runtimeRecords());
    });

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
        it("Should update the text record", async function () {
          await _ensRegistry
            .connect(getSigner())
            .setAgentText(
              _collectionAddress,
              _tokenId,
              URL_KEY,
              "https://updated.example/"
            );

          expect(await _ensRegistry.text(_node, URL_KEY)).to.equal(
            "https://updated.example/"
          );
        });

        it("Should emit AgentTextUpdated without re-provisioning", async function () {
          const tx = await _ensRegistry
            .connect(getSigner())
            .setAgentText(
              _collectionAddress,
              _tokenId,
              URL_KEY,
              "https://updated.example/"
            );

          await expect(tx)
            .to.emit(_ensRegistry, "AgentTextUpdated")
            .withArgs(
              _collectionAddress,
              _tokenId,
              URL_KEY,
              "https://updated.example/"
            );
          await expect(tx).to.not.emit(_ensRegistry, "SubnodeProvisioned");
        });

        it("Should accept writes under a key that was not part of init", async function () {
          await expect(
            _ensRegistry
              .connect(getSigner())
              .setAgentText(
                _collectionAddress,
                _tokenId,
                "description",
                "An autonomous agent"
              )
          ).to.emit(_ensRegistry, "AgentTextUpdated");
        });

        it("Should accept clearing a non-mandatory key", async function () {
          await _ensRegistry
            .connect(getSigner())
            .setAgentText(
              _collectionAddress,
              _tokenId,
              "description",
              "An autonomous agent"
            );

          await expect(
            _ensRegistry
              .connect(getSigner())
              .setAgentText(_collectionAddress, _tokenId, "description", "")
          ).to.emit(_ensRegistry, "AgentTextUpdated");
          expect(await _ensRegistry.text(_node, "description")).to.equal("");
        });

        it("Should revert when clearing url", async function () {
          await expect(
            _ensRegistry
              .connect(getSigner())
              .setAgentText(_collectionAddress, _tokenId, URL_KEY, "")
          )
            .to.be.revertedWithCustomError(_ensRegistry, "MissingRequiredKey")
            .withArgs(URL_KEY);
        });

        it("Should revert when clearing agent.kind", async function () {
          await expect(
            _ensRegistry
              .connect(getSigner())
              .setAgentText(_collectionAddress, _tokenId, AGENT_KIND_KEY, "")
          )
            .to.be.revertedWithCustomError(_ensRegistry, "MissingRequiredKey")
            .withArgs(AGENT_KIND_KEY);
        });

        it("Should revert with ReservedKey when writing the avatar key", async function () {
          await expect(
            _ensRegistry
              .connect(getSigner())
              .setAgentText(
                _collectionAddress,
                _tokenId,
                "avatar",
                "ipfs://override"
              )
          )
            .to.be.revertedWithCustomError(_ensRegistry, "ReservedKey")
            .withArgs("avatar");
        });
      });
    }
  });

  describe("Given the agent has not been initialized", function () {
    it("Should revert with NotProvisioned", async function () {
      await expect(
        _ensRegistry
          .connect(_agentWallet)
          .setAgentText(
            _collectionAddress,
            _tokenId,
            URL_KEY,
            "https://agent.example/"
          )
      )
        .to.be.revertedWithCustomError(_ensRegistry, "NotProvisioned")
        .withArgs(_collectionAddress, _tokenId);
    });
  });

  describe("Given the collection is not registered with the manager", function () {
    it("Should revert with UnknownCollection", async function () {
      const { collection: outsideCollection } =
        await deployCollectionWithCreator({
          name: "outside",
          symbol: "OUT",
          owner: _owner,
          moderator: _moderator,
        });
      const outsideTokenId = await proposeAndMint(outsideCollection, _moderator, {
        to: _agentWallet.address,
        name: AGENT_NAME,
      });

      await expect(
        _ensRegistry
          .connect(_agentWallet)
          .setAgentText(
            await outsideCollection.getAddress(),
            outsideTokenId,
            URL_KEY,
            "https://agent.example/"
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
          .setAgentText(
            _collectionAddress,
            _tokenId,
            URL_KEY,
            "https://agent.example/"
          )
      )
        .to.be.revertedWithCustomError(_ensRegistry, "NotAgentOwnerOrWallet")
        .withArgs(_collectionAddress, _tokenId, _outsider.address);
    });
  });
});
