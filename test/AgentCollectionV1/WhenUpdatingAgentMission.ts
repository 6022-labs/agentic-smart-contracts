import { expect } from "chai";
import { ethers } from "hardhat";
import { AgentCollectionV1 } from "../../typechain-types";
import { loadFixture, reset } from "@nomicfoundation/hardhat-network-helpers";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import {
  signMintRequest,
  generateRandomNonce,
  generateRandomAddress,
  deployCollectionWithCreator,
} from "../common";

describe("WhenUpdatingAgentMission", function () {
  const ipfsGateway = "https://ipfs.io/ipfs/";

  let _collection: AgentCollectionV1;

  let _owner: HardhatEthersSigner;
  let _signer: HardhatEthersSigner;
  let _otherAccount: HardhatEthersSigner;

  async function deployAgentCollection() {
    await reset();

    const [owner, signer, otherAccount] = await ethers.getSigners();

    const { collection, collectionsManager } =
      await deployCollectionWithCreator({
        owner,
        moderator: owner,
        ipfsGateway,
      });

    const signerRole = await collectionsManager.SIGNER_ROLE();
    await collectionsManager.grantRole(signerRole, signer.address);

    return { collection, owner, signer, otherAccount };
  }

  beforeEach(async function () {
    const { collection, owner, signer, otherAccount } = await loadFixture(
      deployAgentCollection
    );

    _collection = collection;
    _owner = owner;
    _signer = signer;
    _otherAccount = otherAccount;
  });

  async function mintWithSignature(mission: string, to: string) {
    const name = "test-agent";
    const images = [
      {
        key: "default",
        value: "bafybeibsulc7sgpck3w7ur7eqa6fwaazcsswn3dg3rfl65zka3knajx43i",
      },
    ];
    const role = "facilitator";

    const nonce = generateRandomNonce();
    const agentAddresses = [generateRandomAddress()];

    const signature = await signMintRequest(_signer, _collection, {
      to,
      agentAddresses,
      signer: _signer.address,
      role,
      name,
      images,
      mission,
      nonce,
    });

    await _collection.createMintProposal(
      to,
      agentAddresses,
      _signer.address,
      role,
      name,
      mission,
      images,
      ethers.id(nonce),
      signature
    );

    const mintProposalsLength = await _collection.mintProposalsLength();

    await _collection
      .connect(_owner)
      .mintFromProposal(mintProposalsLength - BigInt(1));

    return (await _collection.nextTokenId()) - BigInt(1);
  }

  describe("Given token id does not exist", function () {
    it("Should revert with 'ERC721NonexistentToken' error", async function () {
      const tokenId = 1;

      await expect(
        _collection.connect(_owner).updateAgentMission(tokenId, "new mission")
      )
        .to.be.revertedWithCustomError(_collection, "ERC721NonexistentToken")
        .withArgs(tokenId);
    });
  });

  describe("Given sender is not the owner of the token", function () {
    it("Should revert with 'OwnableUnauthorizedAccount' error", async function () {
      const initialMission = "initial mission";
      const tokenId = await mintWithSignature(
        initialMission,
        await _owner.getAddress()
      );

      await expect(
        _collection
          .connect(_otherAccount)
          .updateAgentMission(tokenId, "new mission")
      )
        .to.be.revertedWithCustomError(
          _collection,
          "OwnableUnauthorizedAccount"
        )
        .withArgs(await _otherAccount.getAddress(), tokenId);
    });
  });

  describe("Given sender is the owner of the token", function () {
    const INITIAL_MISSION = "initial mission";
    const NEW_MISSION = "new mission";

    it("Should update the mission", async function () {
      const tokenId = await mintWithSignature(
        INITIAL_MISSION,
        await _owner.getAddress()
      );

      await _collection
        .connect(_owner)
        .updateAgentMission(tokenId, NEW_MISSION);

      expect(await _collection.missionOf(tokenId)).to.equal(NEW_MISSION);
    });

    it("Should emit 'AgentMissionUpdated' event", async function () {
      const tokenId = await mintWithSignature(
        INITIAL_MISSION,
        await _owner.getAddress()
      );

      await expect(
        _collection.connect(_owner).updateAgentMission(tokenId, NEW_MISSION)
      )
        .to.emit(_collection, "AgentMissionUpdated")
        .withArgs(tokenId, INITIAL_MISSION, NEW_MISSION);
    });
  });
});
