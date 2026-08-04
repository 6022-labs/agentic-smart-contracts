import { expect } from "chai";
import { ethers } from "hardhat";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { AgentEnsRegistry } from "../../typechain-types";
import { generateRandomAddress } from "../common";
import { deploySimpleAgentEnsRegistry } from "./common";

describe("WhenSettingManager", function () {
  let _outsider: HardhatEthersSigner;
  let _ensRegistry: AgentEnsRegistry;

  beforeEach(async function () {
    const fixture = await loadFixture(deploySimpleAgentEnsRegistry);
    _outsider = fixture.outsider;
    _ensRegistry = fixture.ensRegistry;
  });

  describe("Given caller has DEFAULT_ADMIN_ROLE", function () {
    it("Should update manager and emit ManagerUpdated", async function () {
      const newManager = generateRandomAddress();

      await expect(_ensRegistry.setManager(newManager))
        .to.emit(_ensRegistry, "ManagerUpdated")
        .withArgs(newManager);

      expect(await _ensRegistry.manager()).to.equal(newManager);
    });
  });

  describe("Given new manager is the zero address", function () {
    it("Should revert with ZeroAddress", async function () {
      await expect(_ensRegistry.setManager(ethers.ZeroAddress))
        .to.be.revertedWithCustomError(_ensRegistry, "ZeroAddress")
        .withArgs("newManager");
    });
  });

  describe("Given caller does not have DEFAULT_ADMIN_ROLE", function () {
    it("Should revert with AccessControlUnauthorizedAccount", async function () {
      await expect(
        _ensRegistry.connect(_outsider).setManager(generateRandomAddress())
      )
        .to.be.revertedWithCustomError(
          _ensRegistry,
          "AccessControlUnauthorizedAccount"
        )
        .withArgs(_outsider.address, ethers.ZeroHash);
    });
  });
});
