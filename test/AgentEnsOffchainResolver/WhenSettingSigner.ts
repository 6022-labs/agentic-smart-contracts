import { expect } from "chai";
import { ethers } from "hardhat";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { AgentEnsOffchainResolver } from "../../typechain-types";
import { generateRandomAddress } from "../common";
import { deploySimpleAgentEnsOffchainResolver } from "./common";

describe("WhenSettingSigner", function () {
  let _outsider: HardhatEthersSigner;
  let _resolver: AgentEnsOffchainResolver;

  beforeEach(async function () {
    const fixture = await loadFixture(deploySimpleAgentEnsOffchainResolver);
    _outsider = fixture.outsider;
    _resolver = fixture.resolver;
  });

  describe("Given caller has DEFAULT_ADMIN_ROLE", function () {
    it("Should add a trusted signer and emit SignerUpdated", async function () {
      const newSigner = generateRandomAddress();

      await expect(_resolver.setSigner(newSigner, true))
        .to.emit(_resolver, "SignerUpdated")
        .withArgs(newSigner, true);

      expect(await _resolver.signers(newSigner)).to.equal(true);
    });

    it("Should remove a trusted signer and emit SignerUpdated", async function () {
      const newSigner = generateRandomAddress();
      await _resolver.setSigner(newSigner, true);

      await expect(_resolver.setSigner(newSigner, false))
        .to.emit(_resolver, "SignerUpdated")
        .withArgs(newSigner, false);

      expect(await _resolver.signers(newSigner)).to.equal(false);
    });
  });

  describe("Given caller does not have DEFAULT_ADMIN_ROLE", function () {
    it("Should revert with AccessControlUnauthorizedAccount", async function () {
      await expect(
        _resolver.connect(_outsider).setSigner(generateRandomAddress(), true)
      )
        .to.be.revertedWithCustomError(
          _resolver,
          "AccessControlUnauthorizedAccount"
        )
        .withArgs(_outsider.address, ethers.ZeroHash);
    });
  });
});
