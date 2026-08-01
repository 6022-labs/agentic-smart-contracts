import { expect } from "chai";
import { ethers } from "hardhat";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { AgentEnsRegistry } from "../../typechain-types";
import { deploySimpleAgentEnsRegistry } from "./common";

describe("WhenSettingParentNode", function () {
  let _outsider: HardhatEthersSigner;
  let _ensRegistry: AgentEnsRegistry;

  beforeEach(async function () {
    const fixture = await loadFixture(deploySimpleAgentEnsRegistry);
    _outsider = fixture.outsider;
    _ensRegistry = fixture.ensRegistry;
  });

  describe("Given caller has DEFAULT_ADMIN_ROLE", function () {
    it("Should update parent node and emit ParentNodeUpdated", async function () {
      const newParentNode = ethers.namehash("other.eth");

      await expect(_ensRegistry.setParentNode(newParentNode))
        .to.emit(_ensRegistry, "ParentNodeUpdated")
        .withArgs(newParentNode);

      expect(await _ensRegistry.parentNode()).to.equal(newParentNode);
    });
  });

  describe("Given caller does not have DEFAULT_ADMIN_ROLE", function () {
    it("Should revert with AccessControlUnauthorizedAccount", async function () {
      await expect(
        _ensRegistry
          .connect(_outsider)
          .setParentNode(ethers.namehash("other.eth"))
      )
        .to.be.revertedWithCustomError(
          _ensRegistry,
          "AccessControlUnauthorizedAccount"
        )
        .withArgs(_outsider.address, ethers.ZeroHash);
    });
  });
});
