import { expect } from "chai";
import { ethers } from "hardhat";
import { AgenticAIAgentCollection } from "../typechain-types";
import { loadFixture, reset } from "@nomicfoundation/hardhat-network-helpers";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";

describe("WhenSettingBaseURL", function () {
  let _agenticAIAgentCollection: AgenticAIAgentCollection;

  let _owner: HardhatEthersSigner;
  let _otherAccount: HardhatEthersSigner;

  async function deployAgenticAIAgentCollection() {
    await reset();

    // Contracts are deployed using the first signer/account by default
    const [owner, otherAccount] = await ethers.getSigners();

    const AgenticAIAgentCollection = await ethers.getContractFactory(
      "AgenticAIAgentCollection"
    );
    const agenticAIAgentCollection = await AgenticAIAgentCollection.deploy();
    await agenticAIAgentCollection.addSigner(otherAccount.address);

    return { agenticAIAgentCollection, owner, otherAccount };
  }

  beforeEach(async function () {
    const { agenticAIAgentCollection, owner, otherAccount } = await loadFixture(
      deployAgenticAIAgentCollection
    );

    _agenticAIAgentCollection = agenticAIAgentCollection;

    _owner = owner;
    _otherAccount = otherAccount;
  });

  describe("Given signer is admin", function () {
    it("Should change baseURI", async function () {
      const newBaseURI = "https://example.com/";
      await _agenticAIAgentCollection.connect(_owner).setBaseURI(newBaseURI);

      const baseURI = await _agenticAIAgentCollection.baseURI();
      expect(baseURI).to.equal(newBaseURI);
    });
  });

  describe("Given signer is not admin", function () {
    it("Should revert with 'AccessControlUnauthorizedAccount' error", async function () {
      const newBaseURI = "https://example.com/";
      await expect(
        _agenticAIAgentCollection.connect(_otherAccount).setBaseURI(newBaseURI)
      ).to.be.revertedWithCustomError(
        _agenticAIAgentCollection,
        "AccessControlUnauthorizedAccount"
      );
    });
  });
});
