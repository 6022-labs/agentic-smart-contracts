import { expect } from "chai";
import { ethers } from "hardhat";
import { reset } from "@nomicfoundation/hardhat-network-helpers";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import {
  AgentCollectionCreatorV1,
  AgentCollectionsManager,
  AgentCollectionV1,
} from "../../typechain-types";
import {
  deployCollectionWithCreator,
  generateRandomAddress,
  evmAddresses,
  btcAddresses,
} from "../common";

const DEFAULT_IMAGES = [
  {
    key: "default",
    value: "bafybeibsulc7sgpck3w7ur7eqa6fwaazcsswn3dg3rfl65zka3knajx43i",
  },
];
const DEFAULT_ATTRIBUTES = [{ key: "mission", value: "random mission" }];
const NO_CLONE = { isSet: false, value: 0n };
const BTC_VALUE = "bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4";

describe("WhenFindingAgentByAddress", function () {
  let _creator: AgentCollectionCreatorV1;
  let _manager: AgentCollectionsManager;
  let _collection: AgentCollectionV1;
  let _owner: HardhatEthersSigner;

  beforeEach(async function () {
    await reset();
    const [owner] = await ethers.getSigners();
    _owner = owner;

    const { collectionsManager, collectionCreator, collection } =
      await deployCollectionWithCreator({
        owner,
        moderator: owner,
        name: "alpha",
        symbol: "ALP",
      });
    _manager = collectionsManager;
    _creator = collectionCreator;
    _collection = collection;
  });

  describe("Given an evm address controls an agent", function () {
    it("Should return its collection, tokenId and name", async function () {
      const wallet = generateRandomAddress();
      const tokenId = await _collection.nextTokenId();
      await _collection
        .connect(_owner)
        .mint(
          _owner.address,
          "facilitator",
          "alpha-agent",
          evmAddresses(wallet),
          DEFAULT_IMAGES,
          DEFAULT_ATTRIBUTES,
          NO_CLONE
        );

      const [collection, foundTokenId, name, next] =
        await _manager.findAgentByAddress("evm", wallet, 0, 10);

      expect(collection).to.equal(await _collection.getAddress());
      expect(foundTokenId).to.equal(tokenId);
      expect(name).to.equal("alpha-agent");
      expect(next).to.equal(0n);
    });

    it("Should find an agent in a later collection across pages", async function () {
      await _creator.createCollection(
        "beta",
        "BET",
        "description",
        _owner.address,
        _owner.address
      );
      const secondCollection = await ethers.getContractAt(
        "AgentCollectionV1",
        await _manager.collections(2)
      );

      const wallet = generateRandomAddress();
      await secondCollection
        .connect(_owner)
        .mint(
          _owner.address,
          "facilitator",
          "beta-agent",
          evmAddresses(wallet),
          DEFAULT_IMAGES,
          DEFAULT_ATTRIBUTES,
          NO_CLONE
        );

      // First page (collection 1 only) misses it and resumes at 2.
      const [missCollection, , , next] = await _manager.findAgentByAddress(
        "evm",
        wallet,
        0,
        1
      );
      expect(missCollection).to.equal(ethers.ZeroAddress);
      expect(next).to.equal(2n);

      const [hitCollection] = await _manager.findAgentByAddress(
        "evm",
        wallet,
        next,
        10
      );
      expect(hitCollection).to.equal(await secondCollection.getAddress());
    });
  });

  describe("Given a btc address belongs to an agent", function () {
    it("Should return its collection, tokenId and name", async function () {
      const tokenId = await _collection.nextTokenId();
      await _collection
        .connect(_owner)
        .mint(
          _owner.address,
          "facilitator",
          "alpha-agent",
          [
            ...evmAddresses(generateRandomAddress()),
            ...btcAddresses(BTC_VALUE),
          ],
          DEFAULT_IMAGES,
          DEFAULT_ATTRIBUTES,
          NO_CLONE
        );

      const [collection, foundTokenId, name] =
        await _manager.findAgentByAddress("btc", BTC_VALUE, 0, 10);

      expect(collection).to.equal(await _collection.getAddress());
      expect(foundTokenId).to.equal(tokenId);
      expect(name).to.equal("alpha-agent");
    });
  });

  describe("Given an address belongs to no agent", function () {
    it("Should return zero values", async function () {
      const [collection, tokenId, name, next] =
        await _manager.findAgentByAddress(
          "evm",
          generateRandomAddress(),
          0,
          10
        );

      expect(collection).to.equal(ethers.ZeroAddress);
      expect(tokenId).to.equal(0n);
      expect(name).to.equal("");
      expect(next).to.equal(0n);
    });
  });
});
