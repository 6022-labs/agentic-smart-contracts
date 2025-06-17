import { expect } from "chai";
import { ethers } from "hardhat";
import { loadFixture, reset } from "@nomicfoundation/hardhat-network-helpers";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import {
  AgenticAIAgentCollectionCreator,
  AgenticAIAgentCollectionsManager,
  AgenticAIAgentCollectionsDescriptor,
} from "../../typechain-types";

describe("WhenUpdatingMinimumTokenBalance", function () {
  const ipfsGateway = "https://ipfs.io/ipfs/";

  let _creator: AgenticAIAgentCollectionCreator;
  let _owner: HardhatEthersSigner;
  let _otherAccount: HardhatEthersSigner;

  async function deployCreator() {
    await reset();

    const [owner, otherAccount] = await ethers.getSigners();

    const CollectionsManager = await ethers.getContractFactory(
      "AgenticAIAgentCollectionsManager"
    );
    const collectionsManager =
      (await CollectionsManager.deploy()) as AgenticAIAgentCollectionsManager;

    const Descriptor = await ethers.getContractFactory(
      "AgenticAIAgentCollectionsDescriptor"
    );
    const descriptor = (await Descriptor.deploy(
      ipfsGateway
    )) as AgenticAIAgentCollectionsDescriptor;

    const TestERC20 = await ethers.getContractFactory("TestERC20");
    const token = await TestERC20.deploy();
    const minimum = ethers.parseEther("1");
    await token.mint(owner.address, minimum);

    const Creator = await ethers.getContractFactory(
      "AgenticAIAgentCollectionCreator"
    );
    const creator = (await Creator.deploy(
      await collectionsManager.getAddress(),
      await descriptor.getAddress(),
      await token.getAddress(),
      minimum
    )) as AgenticAIAgentCollectionCreator;

    const creatorRole = await collectionsManager.CREATOR_ROLE();
    await collectionsManager.grantRole(creatorRole, await creator.getAddress());

    return { owner, otherAccount, creator };
  }

  beforeEach(async function () {
    const { owner, otherAccount, creator } = await loadFixture(deployCreator);

    _creator = creator;
    _owner = owner;
    _otherAccount = otherAccount;
  });

  describe("Given signer is admin", function () {
    it("Should update the minimum token balance", async function () {
      await _creator.connect(_owner).updateMinimumTokenBalance(2n);

      expect(await _creator.minimumTokenBalance()).to.equal(2n);
    });

    it("Should emit 'MinimumTokenBalanceUpdated' event", async function () {
      const oldMinimum = await _creator.minimumTokenBalance();

      await expect(_creator.connect(_owner).updateMinimumTokenBalance(2n))
        .to.emit(_creator, "MinimumTokenBalanceUpdated")
        .withArgs(oldMinimum, 2n);
    });
  });

  describe("Given signer is not admin", function () {
    it("Should revert with 'AccessControlUnauthorizedAccount' error", async function () {
      await expect(
        _creator.connect(_otherAccount).updateMinimumTokenBalance(2n)
      ).to.be.revertedWithCustomError(
        _creator,
        "AccessControlUnauthorizedAccount"
      );
    });
  });
});
