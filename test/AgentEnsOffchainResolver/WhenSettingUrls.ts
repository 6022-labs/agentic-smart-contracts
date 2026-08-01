import { expect } from "chai";
import { ethers } from "hardhat";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { AgentEnsOffchainResolver } from "../../typechain-types";
import { deploySimpleAgentEnsOffchainResolver } from "./common";

describe("WhenSettingUrls", function () {
  let _outsider: HardhatEthersSigner;
  let _resolver: AgentEnsOffchainResolver;

  const newUrls = [
    "https://gw1.example/{sender}/{data}.json",
    "https://gw2.example/{sender}/{data}.json",
  ];

  beforeEach(async function () {
    const fixture = await loadFixture(deploySimpleAgentEnsOffchainResolver);
    _outsider = fixture.outsider;
    _resolver = fixture.resolver;
  });

  describe("Given caller has DEFAULT_ADMIN_ROLE", function () {
    it("Should replace the URL list and emit UrlsUpdated", async function () {
      await expect(_resolver.setUrls(newUrls))
        .to.emit(_resolver, "UrlsUpdated")
        .withArgs(newUrls);

      expect(await _resolver.urls(0)).to.equal(newUrls[0]);
      expect(await _resolver.urls(1)).to.equal(newUrls[1]);
    });
  });

  describe("Given caller does not have DEFAULT_ADMIN_ROLE", function () {
    it("Should revert with AccessControlUnauthorizedAccount", async function () {
      await expect(_resolver.connect(_outsider).setUrls(newUrls))
        .to.be.revertedWithCustomError(
          _resolver,
          "AccessControlUnauthorizedAccount"
        )
        .withArgs(_outsider.address, ethers.ZeroHash);
    });
  });
});
