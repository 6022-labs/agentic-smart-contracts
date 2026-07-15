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
  AGENT_NAME,
  COLLECTION_NAME,
} from "./common";
import { ethers } from "hardhat";

describe("WhenInitializingAgentTexts", function () {
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

  describe("Given a batch carrying both mandatory keys", function () {
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
          expect(await _ensRegistry.text(_node, URL_KEY)).to.equal(
            "https://agent.example/",
          );
        });

        it("Should populate agentRef so derived records can resolve", async function () {
          await _ensRegistry
            .connect(getSigner())
            .initAgentTexts(_collectionAddress, _tokenId, runtimeRecords());

          const ref = await _ensRegistry.agentRef(_node);
          expect(ref.collection).to.equal(_collectionAddress);
          expect(ref.tokenId).to.equal(_tokenId);
        });

        it("Should emit SubnodeProvisioned and AgentTextUpdated per record", async function () {
          await expect(
            _ensRegistry
              .connect(getSigner())
              .initAgentTexts(_collectionAddress, _tokenId, runtimeRecords()),
          )
            .to.emit(_ensRegistry, "SubnodeProvisioned")
            .withArgs(_collectionAddress, _tokenId, _node, AGENT_NAME)
            .and.to.emit(_ensRegistry, "AgentTextUpdated")
            .withArgs(
              _collectionAddress,
              _tokenId,
              URL_KEY,
              "https://agent.example/",
            );
        });
      });
    }
  });

  describe("Given the batch includes the reserved avatar key", function () {
    it("Should revert with ReservedKey", async function () {
      await expect(
        _ensRegistry
          .connect(_agentWallet)
          .initAgentTexts(_collectionAddress, _tokenId, [
            ...runtimeRecords(),
            { key: "avatar", value: "ipfs://override" },
          ]),
      )
        .to.be.revertedWithCustomError(_ensRegistry, "ReservedKey")
        .withArgs("avatar");
    });
  });

  describe("Given the agent is already provisioned", function () {
    it("Should revert with AlreadyProvisioned", async function () {
      await _ensRegistry
        .connect(_agentWallet)
        .initAgentTexts(_collectionAddress, _tokenId, runtimeRecords());

      await expect(
        _ensRegistry
          .connect(_agentWallet)
          .initAgentTexts(_collectionAddress, _tokenId, runtimeRecords()),
      )
        .to.be.revertedWithCustomError(_ensRegistry, "AlreadyProvisioned")
        .withArgs(_collectionAddress, _tokenId);
    });
  });

  describe("Given the batch is missing url", function () {
    it("Should revert with MissingRequiredKey", async function () {
      await expect(
        _ensRegistry
          .connect(_agentWallet)
          .initAgentTexts(_collectionAddress, _tokenId, [
            { key: "description", value: "An autonomous agent" },
          ]),
      )
        .to.be.revertedWithCustomError(_ensRegistry, "MissingRequiredKey")
        .withArgs(URL_KEY);
    });
  });

  describe("Given url is present but has an empty value", function () {
    it("Should revert with MissingRequiredKey", async function () {
      await expect(
        _ensRegistry
          .connect(_agentWallet)
          .initAgentTexts(_collectionAddress, _tokenId, [
            { key: URL_KEY, value: "" },
          ]),
      )
        .to.be.revertedWithCustomError(_ensRegistry, "MissingRequiredKey")
        .withArgs(URL_KEY);
    });
  });

  describe("Given the batch repeats a key", function () {
    it("Should revert with DuplicateKey and leave the node unprovisioned", async function () {
      await expect(
        _ensRegistry
          .connect(_agentWallet)
          .initAgentTexts(_collectionAddress, _tokenId, [
            { key: URL_KEY, value: "https://agent.example/" },
            { key: URL_KEY, value: "" },
          ]),
      )
        .to.be.revertedWithCustomError(_ensRegistry, "DuplicateKey")
        .withArgs(URL_KEY);

      expect(await _ensRegistry.provisioned(_node)).to.equal(false);
    });

    it("Should revert with DuplicateKey for a repeated non-url key too", async function () {
      await expect(
        _ensRegistry
          .connect(_agentWallet)
          .initAgentTexts(_collectionAddress, _tokenId, [
            { key: URL_KEY, value: "https://agent.example/" },
            { key: "description", value: "first" },
            { key: "description", value: "second" },
          ]),
      )
        .to.be.revertedWithCustomError(_ensRegistry, "DuplicateKey")
        .withArgs("description");
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
      const outsideTokenId = await proposeAndMint(
        outsideCollection,
        _moderator,
        {
          to: _agentWallet.address,
          name: AGENT_NAME,
        },
      );

      await expect(
        _ensRegistry
          .connect(_agentWallet)
          .initAgentTexts(
            await outsideCollection.getAddress(),
            outsideTokenId,
            runtimeRecords(),
          ),
      )
        .to.be.revertedWithCustomError(_ensRegistry, "UnknownCollection")
        .withArgs(await outsideCollection.getAddress());
    });
  });

  describe("Given a spoofing collection reports a registered name from an unregistered address", function () {
    it("Should revert with UnknownCollection without trusting the spoofed name/owner", async function () {
      // Spoofs the registered name() + owner; the manager address check blocks it.
      const Spoof = await ethers.getContractFactory("TestERC721");
      const spoof = await Spoof.deploy(
        COLLECTION_NAME,
        AGENT_NAME,
        _agentWallet.address,
      );
      const maliciousAddress = await spoof.getAddress();

      await expect(
        _ensRegistry
          .connect(_agentWallet)
          .initAgentTexts(maliciousAddress, _tokenId, runtimeRecords()),
      )
        .to.be.revertedWithCustomError(_ensRegistry, "UnknownCollection")
        .withArgs(maliciousAddress);

      // The real agent's node must remain unprovisioned and unbound.
      expect(await _ensRegistry.provisioned(_node)).to.equal(false);
    });
  });

  describe("Given the caller is neither the NFT owner nor an agent wallet", function () {
    it("Should revert with NotAgentOwnerOrWallet", async function () {
      await expect(
        _ensRegistry
          .connect(_outsider)
          .initAgentTexts(_collectionAddress, _tokenId, runtimeRecords()),
      )
        .to.be.revertedWithCustomError(_ensRegistry, "NotAgentOwnerOrWallet")
        .withArgs(_collectionAddress, _tokenId, _outsider.address);
    });
  });
});
