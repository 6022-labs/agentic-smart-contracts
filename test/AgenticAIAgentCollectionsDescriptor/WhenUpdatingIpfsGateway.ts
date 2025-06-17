import { expect } from "chai";
import { ethers } from "hardhat";
import { loadFixture, reset } from "@nomicfoundation/hardhat-network-helpers";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { AgenticAIAgentCollectionsDescriptor } from "../../typechain-types";

describe("WhenUpdatingIpfsGateway", function () {
  const ipfsGateway = "https://ipfs.io/ipfs/";
  const newGateway = "https://gateway.ipfs/";

  let _descriptor: AgenticAIAgentCollectionsDescriptor;
  let _owner: HardhatEthersSigner;
  let _otherAccount: HardhatEthersSigner;

  async function deployDescriptor() {
    await reset();

    const [owner, otherAccount] = await ethers.getSigners();

    const Descriptor = await ethers.getContractFactory(
      "AgenticAIAgentCollectionsDescriptor"
    );
    const descriptor = await Descriptor.deploy(ipfsGateway);

    return { descriptor, owner, otherAccount };
  }

  beforeEach(async function () {
    const { descriptor, owner, otherAccount } = await loadFixture(
      deployDescriptor
    );

    _descriptor = descriptor;
    _owner = owner;
    _otherAccount = otherAccount;
  });

  describe("Given caller is admin", function () {
    it("Should emit 'IpfsGatewayUpdated' event", async function () {
      await expect(_descriptor.connect(_owner).updateIpfsGateway(newGateway))
        .to.emit(_descriptor, "IpfsGatewayUpdated")
        .withArgs(ipfsGateway, newGateway);
    });
  });

  describe("Given caller is not admin", function () {
    it("Should revert with 'AccessControlUnauthorizedAccount'", async function () {
      await expect(
        _descriptor.connect(_otherAccount).updateIpfsGateway(newGateway)
      ).to.be.revertedWithCustomError(
        _descriptor,
        "AccessControlUnauthorizedAccount"
      );
    });
  });
});
