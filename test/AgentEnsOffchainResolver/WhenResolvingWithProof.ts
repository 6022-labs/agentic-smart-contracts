import { expect } from "chai";
import { ethers } from "hardhat";
import { HDNodeWallet } from "ethers";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { AgentEnsOffchainResolver } from "../../typechain-types";
import {
  deploySimpleAgentEnsOffchainResolver,
  buildSignedResponse,
  latestTimestamp,
} from "./common";

describe("WhenResolvingWithProof", function () {
  let _resolver: AgentEnsOffchainResolver;
  let _resolverAddress: string;
  let _signer: HDNodeWallet;

  // Stand-ins for the original lookup callData and the resolved record bytes —
  // resolveWithProof only hashes `request` and returns `result` verbatim.
  const request = "0xdeadbeef";
  const result = ethers.AbiCoder.defaultAbiCoder().encode(
    ["string"],
    ["https://agent.example/"]
  );

  beforeEach(async function () {
    const fixture = await loadFixture(deploySimpleAgentEnsOffchainResolver);
    _resolver = fixture.resolver;
    _signer = fixture.signer;
    _resolverAddress = await _resolver.getAddress();
  });

  describe("Given a response signed by a trusted signer", function () {
    it("Should return the resolved result", async function () {
      const expires = (await latestTimestamp()) + 3600n;
      const response = buildSignedResponse(
        _signer,
        _resolverAddress,
        request,
        result,
        expires
      );

      expect(await _resolver.resolveWithProof(response, request)).to.equal(
        result
      );
    });
  });

  describe("Given a response signed by an untrusted signer", function () {
    it("Should revert with UntrustedSigner", async function () {
      const untrusted = ethers.Wallet.createRandom();
      const expires = (await latestTimestamp()) + 3600n;
      const response = buildSignedResponse(
        untrusted,
        _resolverAddress,
        request,
        result,
        expires
      );

      await expect(_resolver.resolveWithProof(response, request))
        .to.be.revertedWithCustomError(_resolver, "UntrustedSigner")
        .withArgs(untrusted.address);
    });
  });

  describe("Given a response that has expired", function () {
    it("Should revert with SignatureExpired", async function () {
      const expires = (await latestTimestamp()) - 1n;
      const response = buildSignedResponse(
        _signer,
        _resolverAddress,
        request,
        result,
        expires
      );

      await expect(_resolver.resolveWithProof(response, request))
        .to.be.revertedWithCustomError(_resolver, "SignatureExpired")
        .withArgs(expires);
    });
  });
});
