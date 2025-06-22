import { expect } from "chai";
import { ethers } from "hardhat";
import { deployCollectionWithCreator } from "../common";
import { loadFixture, reset } from "@nomicfoundation/hardhat-network-helpers";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import {
  AgenticAIAgentCollection,
  AgenticAIAgentCollectionsDescriptor,
} from "../../typechain-types";

describe("WhenUpdatingDescription", function () {
  const ipfsGateway = "https://ipfs.io/ipfs/";

  let _agenticAIAgentCollection: AgenticAIAgentCollection;
  let _agenticAIAgentCollectionsDescriptor: AgenticAIAgentCollectionsDescriptor;

  let _owner: HardhatEthersSigner;
  let _otherAccount: HardhatEthersSigner;

  async function deployAgenticAIAgentCollection() {
    await reset();

    const [owner, otherAccount] = await ethers.getSigners();

    const { collection, collectionsDescriptor } =
      await deployCollectionWithCreator({
        owner,
        moderator: owner,
        name: "AgenticAI",
        symbol: "AIA",
        description: "initial description",
        ipfsGateway,
      });

    return {
      collection,
      agenticAIAgentCollectionsDescriptor: collectionsDescriptor,
      owner,
      otherAccount,
    };
  }

  beforeEach(async function () {
    const {
      owner,
      otherAccount,
      collection,
      agenticAIAgentCollectionsDescriptor,
    } = await loadFixture(deployAgenticAIAgentCollection);

    _agenticAIAgentCollection = collection;
    _agenticAIAgentCollectionsDescriptor = agenticAIAgentCollectionsDescriptor;

    _owner = owner;
    _otherAccount = otherAccount;
  });

  describe("Given signer is moderator", function () {
    it("Should update the description", async function () {
      await _agenticAIAgentCollection
        .connect(_owner)
        .updateDescription("updated description");

      expect(await _agenticAIAgentCollection.description()).to.equal(
        "updated description"
      );
    });

    it("Should emit 'DescriptionUpdated' event", async function () {
      const newDescription = "updated description";

      await expect(
        _agenticAIAgentCollection
          .connect(_owner)
          .updateDescription(newDescription)
      )
        .to.emit(_agenticAIAgentCollection, "DescriptionUpdated")
        .withArgs("initial description", newDescription);
    });
  });

  describe("Given signer is not admin", function () {
    it("Should revert with 'AccessControlUnauthorizedAccount' error when called by a non-admin", async function () {
      await expect(
        _agenticAIAgentCollection
          .connect(_otherAccount)
          .updateCollectionsDescriptor(
            await _agenticAIAgentCollectionsDescriptor.getAddress()
          )
      ).to.be.revertedWithCustomError(
        _agenticAIAgentCollection,
        "AccessControlUnauthorizedAccount"
      );
    });
  });
});
