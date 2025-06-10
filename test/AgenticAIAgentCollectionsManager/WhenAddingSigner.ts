import { expect } from "chai";
import { ethers } from "hardhat";
import { AgenticAIAgentCollectionsManager } from "../../typechain-types";
import { loadFixture, reset } from "@nomicfoundation/hardhat-network-helpers";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";

describe("WhenAddingSigner", function () {
  let _collectionsManager: AgenticAIAgentCollectionsManager;
  let _owner: HardhatEthersSigner;
  let _otherAccount: HardhatEthersSigner;

  async function deployCollectionsManager() {
    await reset();

    const [owner, otherAccount] = await ethers.getSigners();

    const CollectionsManager = await ethers.getContractFactory(
      "AgenticAIAgentCollectionsManager"
    );
    const collectionsManager = await CollectionsManager.deploy();

    return { collectionsManager, owner, otherAccount };
  }

  beforeEach(async function () {
    const { collectionsManager, owner, otherAccount } = await loadFixture(
      deployCollectionsManager
    );

    _collectionsManager = collectionsManager;
    _owner = owner;
    _otherAccount = otherAccount;
  });

  describe("Given signer is admin", function () {
    it("Should add the signer", async function () {
      await _collectionsManager
        .connect(_owner)
        .addSigner(_otherAccount.address);

      const isSigner = await _collectionsManager.isSigner(
        _otherAccount.address
      );
      expect(isSigner).to.be.true;
    });

    it("Should emit 'SignerAdded' event", async function () {
      await expect(
        _collectionsManager
          .connect(_owner)
          .addSigner(_otherAccount.address)
      )
        .to.emit(_collectionsManager, "SignerAdded")
        .withArgs(_otherAccount.address);
    });
  });

  describe("Given signer is not admin", function () {
    it("Should revert with 'AccessControlUnauthorizedAccount' error", async function () {
      await expect(
        _collectionsManager
          .connect(_otherAccount)
          .addSigner(_otherAccount.address)
      ).to.be.revertedWithCustomError(
        _collectionsManager,
        "AccessControlUnauthorizedAccount"
      );
    });
  });
});
