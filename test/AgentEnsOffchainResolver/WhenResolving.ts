import { expect } from "chai";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { AgentEnsOffchainResolver } from "../../typechain-types";
import { deploySimpleAgentEnsOffchainResolver, GATEWAY_URLS } from "./common";

describe("WhenResolving", function () {
  let _resolver: AgentEnsOffchainResolver;
  let _resolverAddress: string;

  // resolve() always reverts before inspecting name/data, so the exact bytes
  // don't matter for this assertion.
  const name = "0x00";
  const innerData = "0x59d1d43c";

  beforeEach(async function () {
    const fixture = await loadFixture(deploySimpleAgentEnsOffchainResolver);
    _resolver = fixture.resolver;
    _resolverAddress = await _resolver.getAddress();
  });

  describe("Given any name/data", function () {
    it("Should revert with OffchainLookup pointing at the gateway", async function () {
      const callData = _resolver.interface.encodeFunctionData("resolve", [
        name,
        innerData,
      ]);
      const callbackSelector =
        _resolver.interface.getFunction("resolveWithProof").selector;

      await expect(_resolver.resolve(name, innerData))
        .to.be.revertedWithCustomError(_resolver, "OffchainLookup")
        .withArgs(
          _resolverAddress,
          GATEWAY_URLS,
          callData,
          callbackSelector,
          callData
        );
    });
  });
});
