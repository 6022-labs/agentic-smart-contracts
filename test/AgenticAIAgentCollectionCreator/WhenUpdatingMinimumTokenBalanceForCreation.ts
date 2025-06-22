import { expect } from "chai";
import { ethers } from "hardhat";
import { loadFixture, reset } from "@nomicfoundation/hardhat-network-helpers";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import {
  TestERC20,
  AgenticAIAgentCollectionCreator,
} from "../../typechain-types";

describe("WhenUpdatingMinimumTokenBalanceForCreation", function () {
  const ipfsGateway = "https://ipfs.io/ipfs/";

  let _collectionCreator: AgenticAIAgentCollectionCreator;
  let _testErc20: TestERC20;
  let _owner: HardhatEthersSigner;
  let _otherAccount: HardhatEthersSigner;

  async function deployCreatorWithToken() {
    await reset();

    const [owner, otherAccount] = await ethers.getSigners();

    const CollectionsManager = await ethers.getContractFactory(
      "AgenticAIAgentCollectionsManager"
    );
    const collectionsManager = await CollectionsManager.deploy();

    const Descriptor = await ethers.getContractFactory(
      "AgenticAIAgentCollectionsDescriptor"
    );
    const descriptor = await Descriptor.deploy(ipfsGateway);

    const Collection = await ethers.getContractFactory(
      "AgenticAIAgentCollection"
    );
    const collectionImplementation = await Collection.deploy();

    const TestErc20 = await ethers.getContractFactory("TestERC20");
    const testErc20 = await TestErc20.deploy();

    const CollectionCreator = await ethers.getContractFactory(
      "AgenticAIAgentCollectionCreator"
    );
    const collectionCreator = await CollectionCreator.deploy(
      await collectionsManager.getAddress(),
      await descriptor.getAddress(),
      await collectionImplementation.getAddress()
    );

    await collectionCreator.addAuthorizedTokenForCreation(
      await testErc20.getAddress(),
      1n
    );

    return { owner, otherAccount, collectionCreator, testErc20 };
  }

  beforeEach(async function () {
    const { owner, otherAccount, collectionCreator, testErc20 } =
      await loadFixture(deployCreatorWithToken);

    _collectionCreator = collectionCreator;
    _testErc20 = testErc20;
    _owner = owner;
    _otherAccount = otherAccount;
  });

  describe("Given signer is admin", function () {
    describe("And token is authorized", function () {
      it("Should update the minimum balance", async function () {
        const newMinimum = 5n;
        await _collectionCreator
          .connect(_owner)
          .updateMinimumTokenBalanceForCreation(
            await _testErc20.getAddress(),
            newMinimum
          );

        expect(
          await _collectionCreator.minimumTokenBalanceForCreation(
            await _testErc20.getAddress()
          )
        ).to.equal(newMinimum);
      });

      it("Should emit 'MinimumTokenBalanceForCreationUpdated' event", async function () {
        const oldMinimum =
          await _collectionCreator.minimumTokenBalanceForCreation(
            await _testErc20.getAddress()
          );
        const newMinimum = 3n;

        await expect(
          _collectionCreator.updateMinimumTokenBalanceForCreation(
            await _testErc20.getAddress(),
            newMinimum
          )
        )
          .to.emit(_collectionCreator, "MinimumTokenBalanceForCreationUpdated")
          .withArgs(await _testErc20.getAddress(), oldMinimum, newMinimum);
      });
    });

    describe("But token is not authorized", function () {
      it("Should revert with 'TokenNotAuthorized' error", async function () {
        const TestErc20 = await ethers.getContractFactory("TestERC20");
        const otherToken = (await TestErc20.deploy()) as TestERC20;

        await expect(
          _collectionCreator.updateMinimumTokenBalanceForCreation(
            await otherToken.getAddress(),
            1n
          )
        )
          .to.be.revertedWithCustomError(
            _collectionCreator,
            "TokenNotAuthorized"
          )
          .withArgs(await otherToken.getAddress());
      });
    });
  });

  describe("Given signer is not admin", function () {
    it("Should revert with 'AccessControlUnauthorizedAccount' error", async function () {
      await expect(
        _collectionCreator
          .connect(_otherAccount)
          .updateMinimumTokenBalanceForCreation(
            await _testErc20.getAddress(),
            2n
          )
      ).to.be.revertedWithCustomError(
        _collectionCreator,
        "AccessControlUnauthorizedAccount"
      );
    });
  });
});
