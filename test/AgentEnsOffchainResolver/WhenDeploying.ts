import { expect } from "chai";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { AgentEnsOffchainResolver } from "../../typechain-types";
import { deploySimpleAgentEnsOffchainResolver, GATEWAY_URLS } from "./common";

describe("WhenDeploying", function () {
  let _admin: HardhatEthersSigner;
  let _signerAddress: string;
  let _resolver: AgentEnsOffchainResolver;

  beforeEach(async function () {
    const fixture = await loadFixture(deploySimpleAgentEnsOffchainResolver);
    _admin = fixture.admin;
    _signerAddress = fixture.signer.address;
    _resolver = fixture.resolver;
  });

  it("Should grant DEFAULT_ADMIN_ROLE to the deployer", async function () {
    const role = await _resolver.DEFAULT_ADMIN_ROLE();
    expect(await _resolver.hasRole(role, _admin.address)).to.equal(true);
  });

  it("Should seed the gateway URL list", async function () {
    expect(await _resolver.urls(0)).to.equal(GATEWAY_URLS[0]);
  });

  it("Should trust the constructor signer", async function () {
    expect(await _resolver.signers(_signerAddress)).to.equal(true);
  });

  it("Should advertise the IExtendedResolver interface", async function () {
    // ENSIP-10 IExtendedResolver interface id.
    expect(await _resolver.supportsInterface("0x9061b923")).to.equal(true);
  });

  it("Should advertise the ERC-165 interface", async function () {
    expect(await _resolver.supportsInterface("0x01ffc9a7")).to.equal(true);
  });
});
