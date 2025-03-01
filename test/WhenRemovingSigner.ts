import { expect } from "chai";
import { ethers } from "hardhat";
import { AgenticAIAgentCollection } from "../typechain-types";
import { loadFixture, reset } from "@nomicfoundation/hardhat-network-helpers";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";

describe("WhenRemovingSigner", function () {
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
    it("Should remove the signer", async function () {
      await _agenticAIAgentCollection
        .connect(_owner)
        .removeSigner(_otherAccount.address);

      const signerRole = await _agenticAIAgentCollection.SIGNER_ROLE();

      const isSigner = await _agenticAIAgentCollection.hasRole(
        signerRole,
        _otherAccount.address
      );
      expect(isSigner).to.be.false;
    });

    it("Should emit 'SignerRemoved' event", async function () {
      await expect(
        _agenticAIAgentCollection
          .connect(_owner)
          .removeSigner(_otherAccount.address)
      )
        .to.emit(_agenticAIAgentCollection, "SignerRemoved")
        .withArgs(_otherAccount.address);
    });
  });

  describe("Given signer is not admin", function () {
    it("Should revert with 'AccessControlUnauthorizedAccount' error", async function () {
      await expect(
        _agenticAIAgentCollection
          .connect(_otherAccount)
          .removeSigner(_otherAccount.address)
      ).to.be.revertedWithCustomError(
        _agenticAIAgentCollection,
        "AccessControlUnauthorizedAccount"
      );
    });
  });
});
