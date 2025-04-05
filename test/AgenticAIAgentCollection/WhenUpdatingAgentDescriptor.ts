import { expect } from "chai";
import { ethers } from "hardhat";
import { loadFixture, reset } from "@nomicfoundation/hardhat-network-helpers";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import {
  AgenticAIAgentCollection,
  AgenticAIAgentCollectionDescriptor,
} from "../../typechain-types";

describe("WhenUpdatingAgentDescriptor", function () {
  const ipfsGateway = "https://ipfs.io/ipfs/";

  let _agenticAIAgentCollection: AgenticAIAgentCollection;
  let _agenticAIAgentCollectionDescriptor: AgenticAIAgentCollectionDescriptor;

  let _owner: HardhatEthersSigner;
  let _otherAccount: HardhatEthersSigner;

  async function deployAgenticAIAgentCollection() {
    await reset();

    // Contracts are deployed using the first signer/account by default
    const [owner, otherAccount] = await ethers.getSigners();

    const AgenticAIAgentCollectionDescriptor = await ethers.getContractFactory(
      "AgenticAIAgentCollectionDescriptor"
    );
    const agenticAIAgentCollectionDescriptor =
      await AgenticAIAgentCollectionDescriptor.deploy(ipfsGateway);

    const AgenticAIAgentCollection = await ethers.getContractFactory(
      "AgenticAIAgentCollection"
    );
    const agenticAIAgentCollection = await AgenticAIAgentCollection.deploy(
      ethers.ZeroAddress
    );

    return {
      agenticAIAgentCollection,
      agenticAIAgentCollectionDescriptor,
      owner,
      otherAccount,
    };
  }

  beforeEach(async function () {
    const {
      owner,
      otherAccount,
      agenticAIAgentCollection,
      agenticAIAgentCollectionDescriptor,
    } = await loadFixture(deployAgenticAIAgentCollection);

    _agenticAIAgentCollection = agenticAIAgentCollection;
    _agenticAIAgentCollectionDescriptor = agenticAIAgentCollectionDescriptor;

    _owner = owner;
    _otherAccount = otherAccount;
  });

  describe("Given signer is admin", function () {
    it("Should update the agent descriptor", async function () {
      await expect(
        _agenticAIAgentCollection
          .connect(_owner)
          .updateAgentDescriptor(
            await _agenticAIAgentCollectionDescriptor.getAddress()
          )
      ).to.not.be.reverted;
    });
  });

  describe("Given signer is not admin", function () {
    it("Should revert with 'AccessControlUnauthorizedAccount' error", async function () {
      await expect(
        _agenticAIAgentCollection
          .connect(_otherAccount)
          .updateAgentDescriptor(
            await _agenticAIAgentCollectionDescriptor.getAddress()
          )
      ).to.be.revertedWithCustomError(
        _agenticAIAgentCollection,
        "AccessControlUnauthorizedAccount"
      );
    });
  });
});
