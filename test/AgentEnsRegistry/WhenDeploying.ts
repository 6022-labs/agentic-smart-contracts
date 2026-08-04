import { expect } from "chai";
import { ethers } from "hardhat";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { AgentEnsRegistry } from "../../typechain-types";
import { deploySimpleAgentEnsRegistry, PARENT_NODE } from "./common";

describe("WhenDeploying", function () {
  let _admin: HardhatEthersSigner;
  let _ensRegistry: AgentEnsRegistry;

  beforeEach(async function () {
    const fixture = await loadFixture(deploySimpleAgentEnsRegistry);
    _admin = fixture.admin;
    _ensRegistry = fixture.ensRegistry;
  });

  it("Should grant DEFAULT_ADMIN_ROLE to the deployer", async function () {
    const role = await _ensRegistry.DEFAULT_ADMIN_ROLE();
    expect(await _ensRegistry.hasRole(role, _admin.address)).to.equal(true);
  });

  it("Should revert with ZeroAddress when manager is the zero address", async function () {
    const Registry = await ethers.getContractFactory("AgentEnsRegistry");

    await expect(Registry.deploy(ethers.ZeroAddress, PARENT_NODE))
      .to.be.revertedWithCustomError(Registry, "ZeroAddress")
      .withArgs("managerAddress");
  });
});
