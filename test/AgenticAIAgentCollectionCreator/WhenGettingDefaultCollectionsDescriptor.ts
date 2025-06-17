import { expect } from "chai";
import { ethers } from "hardhat";
import { loadFixture, reset } from "@nomicfoundation/hardhat-network-helpers";
import {
  AgenticAIAgentCollectionCreator,
  AgenticAIAgentCollectionsDescriptor,
  AgenticAIAgentCollectionsManager,
} from "../../typechain-types";

import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";

describe("WhenGettingDefaultCollectionsDescriptor", function () {
  const ipfsGateway = "https://ipfs.io/ipfs/";

  let _creator: AgenticAIAgentCollectionCreator;
  let _descriptor: AgenticAIAgentCollectionsDescriptor;
  let _owner: HardhatEthersSigner;

  async function deployCreator() {
    await reset();

    const [owner] = await ethers.getSigners();

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

    const Creator = await ethers.getContractFactory(
      "AgenticAIAgentCollectionCreator"
    );
    const creator = (await Creator.deploy(
      await collectionsManager.getAddress(),
      await descriptor.getAddress(),
      await token.getAddress(),
      0n
    )) as AgenticAIAgentCollectionCreator;

    const creatorRole = await collectionsManager.CREATOR_ROLE();
    await collectionsManager.grantRole(creatorRole, await creator.getAddress());

    return { owner, creator, descriptor };
  }

  beforeEach(async function () {
    const { owner, creator, descriptor } = await loadFixture(deployCreator);

    _creator = creator;
    _descriptor = descriptor;
    _owner = owner;
  });

  describe("Given contract is deployed", function () {
    it("Should return the collections descriptor address", async function () {
      expect(await _creator.defaultCollectionsDescriptor()).to.equal(
        await _descriptor.getAddress()
      );
    });
  });
});
