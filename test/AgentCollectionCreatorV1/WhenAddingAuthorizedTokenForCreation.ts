import { expect } from "chai";
import { ethers } from "hardhat";
import { loadFixture, reset } from "@nomicfoundation/hardhat-network-helpers";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { TestERC20, AgentCollectionCreatorV1 } from "../../typechain-types";

describe("WhenAddingAuthorizedTokenForCreation", function () {
  const ipfsGateway = "https://ipfs.io/ipfs/";

  let _collectionCreator: AgentCollectionCreatorV1;
  let _testErc20: TestERC20;
  let _owner: HardhatEthersSigner;
  let _otherAccount: HardhatEthersSigner;

  async function deployCreator() {
    await reset();

    const [owner, otherAccount] = await ethers.getSigners();

    const CollectionsManager = await ethers.getContractFactory(
      "AgentCollectionsManager"
    );
    const collectionsManager = await CollectionsManager.deploy();

    const Descriptor = await ethers.getContractFactory(
      "AgentCollectionsDescriptor"
    );
    const descriptor = await Descriptor.deploy(ipfsGateway);

    const Collection = await ethers.getContractFactory("AgentCollectionV1");
    const collectionImplementation = await Collection.deploy();

    const TestErc20 = await ethers.getContractFactory("TestERC20");
    const testErc20 = await TestErc20.deploy();

    const CollectionCreator = await ethers.getContractFactory(
      "AgentCollectionCreatorV1"
    );
    const collectionCreator = await CollectionCreator.deploy(
      await collectionsManager.getAddress(),
      await descriptor.getAddress(),
      await collectionImplementation.getAddress()
    );

    return { owner, otherAccount, collectionCreator, testErc20 };
  }

  beforeEach(async function () {
    const { owner, otherAccount, collectionCreator, testErc20 } =
      await loadFixture(deployCreator);

    _collectionCreator = collectionCreator;
    _testErc20 = testErc20;
    _owner = owner;
    _otherAccount = otherAccount;
  });

  describe("Given signer is admin", function () {
    describe("And token is not already authorized", function () {
      it("Should add token to authorized list and set minimum", async function () {
        const minimum = 10n;
        await _collectionCreator
          .connect(_owner)
          .addAuthorizedTokenForCreation(
            await _testErc20.getAddress(),
            minimum
          );

        expect(
          await _collectionCreator.isAuthorizedTokenForCreation(
            await _testErc20.getAddress()
          )
        ).to.be.true;

        expect(
          await _collectionCreator.minimumTokenBalanceForCreation(
            await _testErc20.getAddress()
          )
        ).to.equal(minimum);

        expect(
          await _collectionCreator.authorizedTokensForCreation(0)
        ).to.equal(await _testErc20.getAddress());
      });

      it("Should emit 'AuthorizedTokenAdded' events", async function () {
        const minimum = 1n;
        await expect(
          _collectionCreator.addAuthorizedTokenForCreation(
            await _testErc20.getAddress(),
            minimum
          )
        )
          .to.emit(_collectionCreator, "AuthorizedTokenAdded")
          .withArgs(await _testErc20.getAddress())
          .and.to.emit(
            _collectionCreator,
            "MinimumTokenBalanceForCreationUpdated"
          )
          .withArgs(await _testErc20.getAddress(), 0n, minimum);
      });
    });

    describe("And token is already authorized", function () {
      it("Should revert with 'TokenAlreadyAuthorized' error", async function () {
        await _collectionCreator.addAuthorizedTokenForCreation(
          await _testErc20.getAddress(),
          0n
        );

        await expect(
          _collectionCreator.addAuthorizedTokenForCreation(
            await _testErc20.getAddress(),
            0n
          )
        )
          .to.be.revertedWithCustomError(
            _collectionCreator,
            "TokenAlreadyAuthorized"
          )
          .withArgs(await _testErc20.getAddress());
      });
    });
  });

  describe("Given signer is not admin", function () {
    it("Should revert with 'AccessControlUnauthorizedAccount' error", async function () {
      await expect(
        _collectionCreator
          .connect(_otherAccount)
          .addAuthorizedTokenForCreation(await _testErc20.getAddress(), 0n)
      ).to.be.revertedWithCustomError(
        _collectionCreator,
        "AccessControlUnauthorizedAccount"
      );
    });
  });
});
