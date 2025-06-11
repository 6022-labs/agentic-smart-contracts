import { expect } from "chai";
import { ethers } from "hardhat";
import { AgenticAIAgentCollection } from "../../typechain-types";
import { loadFixture, reset } from "@nomicfoundation/hardhat-network-helpers";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";

describe("WhenMinting", function () {
  const ipfsGateway = "https://ipfs.io/ipfs/";

  let _agenticAIAgentCollection: AgenticAIAgentCollection;
  let _owner: HardhatEthersSigner;
  let _signer: HardhatEthersSigner;
  let _otherAccount: HardhatEthersSigner;

  async function deployAgenticAIAgentCollection() {
    await reset();

    const [owner, signer, otherAccount] = await ethers.getSigners();

    const CollectionsManager = await ethers.getContractFactory(
      "AgenticAIAgentCollectionsManager"
    );
    const collectionsManager = await CollectionsManager.deploy();

    const CollectionsDescriptor = await ethers.getContractFactory(
      "AgenticAIAgentCollectionsDescriptor"
    );
    const collectionsDescriptor = await CollectionsDescriptor.deploy(
      ipfsGateway
    );

    const Collection = await ethers.getContractFactory(
      "AgenticAIAgentCollection"
    );
    const collection = await Collection.deploy(
      "AgenticAI",
      "AIA",
      owner.address,
      await collectionsManager.getAddress(),
      await collectionsDescriptor.getAddress()
    );

    await collectionsManager.addSigner(signer.address);

    return { collection, owner, signer, otherAccount };
  }

  beforeEach(async function () {
    const { collection, owner, signer, otherAccount } = await loadFixture(
      deployAgenticAIAgentCollection
    );

    _agenticAIAgentCollection = collection;
    _owner = owner;
    _signer = signer;
    _otherAccount = otherAccount;
  });

  function generateRandomAddress() {
    return ethers.Wallet.createRandom().address;
  }

  async function signMintProposalRequest(
    signer: HardhatEthersSigner,
    to: string,
    agentAddresses: string[],
    role: string,
    name: string,
    image: string,
    mission: string,
    nonce: string
  ) {
    const domain = {
      name: "AgenticAIAgentCollection",
      version: "1",
      chainId: (await ethers.provider.getNetwork()).chainId,
      verifyingContract: await _agenticAIAgentCollection.getAddress(),
    };

    const types = {
      MintProposalRequest: [
        { name: "to", type: "address" },
        { name: "agentAddressesHash", type: "bytes32" },
        { name: "signer", type: "address" },
        { name: "roleHash", type: "bytes32" },
        { name: "nameHash", type: "bytes32" },
        { name: "imageHash", type: "bytes32" },
        { name: "missionHash", type: "bytes32" },
        { name: "nonce", type: "bytes32" },
      ],
    };

    const agentAddressesHash = ethers.keccak256(
      ethers.solidityPacked(["address[]"], [agentAddresses])
    );
    const roleHash = ethers.keccak256(ethers.toUtf8Bytes(role));
    const nameHash = ethers.keccak256(ethers.toUtf8Bytes(name));
    const imageHash = ethers.keccak256(ethers.toUtf8Bytes(image));
    const missionHash = ethers.keccak256(ethers.toUtf8Bytes(mission));

    const message = {
      to,
      agentAddressesHash,
      signer: signer.address,
      roleHash,
      nameHash,
      imageHash,
      missionHash,
      nonce: ethers.keccak256(ethers.toUtf8Bytes(nonce)),
    };

    return await signer.signTypedData(domain, types, message);
  }

  async function proposeAndMint(
    to: string,
    agentAddresses: string[],
    role: string,
    name: string,
    image: string,
    mission: string,
    nonce: string
  ) {
    const proposalId = await _agenticAIAgentCollection.nextProposalId();
    const signature = await signMintProposalRequest(
      _signer,
      to,
      agentAddresses,
      role,
      name,
      image,
      mission,
      nonce
    );

    await _agenticAIAgentCollection.mintProposal(
      to,
      agentAddresses,
      _signer.address,
      role,
      name,
      image,
      mission,
      ethers.id(nonce),
      signature
    );

    const tokenId = await _agenticAIAgentCollection.nextTokenId();

    await _agenticAIAgentCollection.connect(_owner).mint(proposalId);

    return tokenId;
  }

  describe("Given a signature from signer", function () {
    describe("Given a valid minting proposal", function () {
      it("Should mint the token", async function () {
        const nonce = "1";
        const name = "test-agent";
        const role = "facilitator";
        const mission = "";
        const baseImageCid =
          "bafybeibsulc7sgpck3w7ur7eqa6fwaazcsswn3dg3rfl65zka3knajx43i";
        const agentAddresses = [generateRandomAddress()];

        const proposalId = await _agenticAIAgentCollection.nextProposalId();
        const tokenId = await _agenticAIAgentCollection.nextTokenId();

        const signature = await signMintProposalRequest(
          _signer,
          _otherAccount.address,
          agentAddresses,
          role,
          name,
          baseImageCid,
          mission,
          nonce
        );

        await _agenticAIAgentCollection.mintProposal(
          _otherAccount.address,
          agentAddresses,
          _signer.address,
          role,
          name,
          baseImageCid,
          mission,
          ethers.id(nonce),
          signature
        );

        await expect(_agenticAIAgentCollection.connect(_owner).mint(proposalId))
          .to.emit(_agenticAIAgentCollection, "Transfer")
          .withArgs(ethers.ZeroAddress, _otherAccount.address, tokenId);
      });

      it("Should assign the owner of the token", async function () {
        const nonce = "1";
        const name = "test-agent";
        const role = "facilitator";
        const mission = "";
        const baseImageCid =
          "bafybeibsulc7sgpck3w7ur7eqa6fwaazcsswn3dg3rfl65zka3knajx43i";
        const agentAddresses = [generateRandomAddress()];

        const tokenId = await proposeAndMint(
          _otherAccount.address,
          agentAddresses,
          role,
          name,
          baseImageCid,
          mission,
          nonce
        );

        expect(await _agenticAIAgentCollection.ownerOf(tokenId)).to.equal(
          _otherAccount.address
        );
      });

      it("Should mint the NFT with the expected token ID", async function () {
        const nonce1 = "1";
        const nonce2 = "2";
        const agentAddresses1 = [generateRandomAddress()];
        const agentAddresses2 = [generateRandomAddress()];
        const name1 = "test-agent-1";
        const name2 = "test-agent-2";
        const role = "facilitator";
        const mission = "";
        const baseImageCid =
          "bafybeibsulc7sgpck3w7ur7eqa6fwaazcsswn3dg3rfl65zka3knajx43i";

        const baseTokenId = await _agenticAIAgentCollection.nextTokenId();

        await proposeAndMint(
          _otherAccount.address,
          agentAddresses1,
          role,
          name1,
          baseImageCid,
          mission,
          nonce1
        );

        await proposeAndMint(
          _otherAccount.address,
          agentAddresses2,
          role,
          name2,
          baseImageCid,
          mission,
          nonce2
        );

        expect(await _agenticAIAgentCollection.ownerOf(baseTokenId)).to.equal(
          _otherAccount.address
        );
        expect(
          await _agenticAIAgentCollection.ownerOf(baseTokenId + BigInt(1))
        ).to.equal(_otherAccount.address);
      });

      it("Should increment next token ID", async function () {
        const nonce1 = "1";
        const nonce2 = "2";
        const agentAddresses1 = [generateRandomAddress()];
        const agentAddresses2 = [generateRandomAddress()];
        const name1 = "test-agent-1";
        const name2 = "test-agent-2";
        const role = "facilitator";
        const mission = "";
        const baseImageCid =
          "bafybeibsulc7sgpck3w7ur7eqa6fwaazcsswn3dg3rfl65zka3knajx43i";

        const baseTokenId = await _agenticAIAgentCollection.nextTokenId();

        await proposeAndMint(
          _otherAccount.address,
          agentAddresses1,
          role,
          name1,
          baseImageCid,
          mission,
          nonce1
        );

        expect(await _agenticAIAgentCollection.nextTokenId()).to.equal(
          baseTokenId + BigInt(1)
        );

        await proposeAndMint(
          _otherAccount.address,
          agentAddresses2,
          role,
          name2,
          baseImageCid,
          mission,
          nonce2
        );

        expect(await _agenticAIAgentCollection.nextTokenId()).to.equal(
          baseTokenId + BigInt(2)
        );
      });

      it("Should mark the nonce as used", async function () {
        const nonce = "1";
        const agentAddresses = [generateRandomAddress()];
        const role = "facilitator";
        const mission = "";
        const name = "test-agent";
        const baseImageCid =
          "bafybeibsulc7sgpck3w7ur7eqa6fwaazcsswn3dg3rfl65zka3knajx43i";

        await proposeAndMint(
          _otherAccount.address,
          agentAddresses,
          role,
          name,
          baseImageCid,
          mission,
          nonce
        );

        expect(await _agenticAIAgentCollection.isNonceUsed(ethers.id(nonce))).to
          .be.true;
      });

      it("Should assign signer of the token", async function () {
        const nonce = "1";
        const agentAddresses = [generateRandomAddress()];
        const role = "facilitator";
        const mission = "";
        const name = "test-agent";
        const baseImageCid =
          "bafybeibsulc7sgpck3w7ur7eqa6fwaazcsswn3dg3rfl65zka3knajx43i";

        const tokenId = await proposeAndMint(
          _otherAccount.address,
          agentAddresses,
          role,
          name,
          baseImageCid,
          mission,
          nonce
        );

        expect(await _agenticAIAgentCollection.signerOf(tokenId)).to.equal(
          _signer.address
        );
      });

      it("Should assign agent addresses to the token", async function () {
        const nonce = "1";
        const agentAddresses = [generateRandomAddress()];
        const role = "facilitator";
        const mission = "";
        const name = "test-agent";
        const baseImageCid =
          "bafybeibsulc7sgpck3w7ur7eqa6fwaazcsswn3dg3rfl65zka3knajx43i";

        const tokenId = await proposeAndMint(
          _otherAccount.address,
          agentAddresses,
          role,
          name,
          baseImageCid,
          mission,
          nonce
        );

        const walletsOf = await _agenticAIAgentCollection.walletsOf(tokenId);

        expect(walletsOf.length).to.equal(agentAddresses.length);
        for (let i = 0; i < agentAddresses.length; i++) {
          expect(agentAddresses).to.include(walletsOf[i]);
        }
      });

      it("Should assign name to the token", async function () {
        const nonce = "1";
        const agentAddresses = [generateRandomAddress()];
        const role = "facilitator";
        const mission = "";
        const name = "test-agent";
        const baseImageCid =
          "bafybeibsulc7sgpck3w7ur7eqa6fwaazcsswn3dg3rfl65zka3knajx43i";

        const tokenId = await proposeAndMint(
          _otherAccount.address,
          agentAddresses,
          role,
          name,
          baseImageCid,
          mission,
          nonce
        );

        expect(await _agenticAIAgentCollection.nameOf(tokenId)).to.equal(name);
      });

      it("Should assign base image to the token", async function () {
        const nonce = "1";
        const agentAddresses = [generateRandomAddress()];
        const role = "facilitator";
        const mission = "";
        const name = "test-agent";
        const baseImageCid =
          "bafybeibsulc7sgpck3w7ur7eqa6fwaazcsswn3dg3rfl65zka3knajx43i";

        const tokenId = await proposeAndMint(
          _otherAccount.address,
          agentAddresses,
          role,
          name,
          baseImageCid,
          mission,
          nonce
        );

        expect(await _agenticAIAgentCollection.imageOf(tokenId)).to.equal(
          baseImageCid
        );
      });

      it("Should assign creator to the token", async function () {
        const nonce = "1";
        const agentAddresses = [generateRandomAddress()];
        const role = "facilitator";
        const mission = "";
        const name = "test-agent";
        const baseImageCid =
          "bafybeibsulc7sgpck3w7ur7eqa6fwaazcsswn3dg3rfl65zka3knajx43i";

        const tokenId = await proposeAndMint(
          _otherAccount.address,
          agentAddresses,
          role,
          name,
          baseImageCid,
          mission,
          nonce
        );

        expect(await _agenticAIAgentCollection.creatorOf(tokenId)).to.equal(
          _owner.address
        );
      });

      it("Should assign role to the token", async function () {
        const nonce = "1";
        const agentAddresses = [generateRandomAddress()];
        const role = "facilitator";
        const mission = "";
        const name = "test-agent";
        const baseImageCid =
          "bafybeibsulc7sgpck3w7ur7eqa6fwaazcsswn3dg3rfl65zka3knajx43i";

        const tokenId = await proposeAndMint(
          _otherAccount.address,
          agentAddresses,
          role,
          name,
          baseImageCid,
          mission,
          nonce
        );

        expect(await _agenticAIAgentCollection.roleOf(tokenId)).to.equal(role);
      });

      it("Should assign token id to name", async function () {
        const nonce = "1";
        const agentAddresses = [generateRandomAddress()];
        const role = "facilitator";
        const mission = "";
        const name = "test-agent";
        const baseImageCid =
          "bafybeibsulc7sgpck3w7ur7eqa6fwaazcsswn3dg3rfl65zka3knajx43i";

        const tokenId = await proposeAndMint(
          _otherAccount.address,
          agentAddresses,
          role,
          name,
          baseImageCid,
          mission,
          nonce
        );

        expect(await _agenticAIAgentCollection.tokenIdOf(name)).to.be.equal(
          tokenId
        );
      });

      it("Should emit a Minted event", async function () {
        const nonce = "1";
        const name = "test-agent";
        const role = "facilitator";
        const mission = "";
        const baseImageCid =
          "bafybeibsulc7sgpck3w7ur7eqa6fwaazcsswn3dg3rfl65zka3knajx43i";
        const agentAddresses = [generateRandomAddress()];

        const proposalId = await _agenticAIAgentCollection.nextProposalId();
        const tokenId = await _agenticAIAgentCollection.nextTokenId();

        const signature = await signMintProposalRequest(
          _signer,
          _otherAccount.address,
          agentAddresses,
          role,
          name,
          baseImageCid,
          mission,
          nonce
        );

        await _agenticAIAgentCollection.mintProposal(
          _otherAccount.address,
          agentAddresses,
          _signer.address,
          role,
          name,
          baseImageCid,
          mission,
          ethers.id(nonce),
          signature
        );

        await expect(_agenticAIAgentCollection.connect(_owner).mint(proposalId))
          .to.emit(_agenticAIAgentCollection, "Minted")
          .withArgs(_otherAccount.address, _signer.address, tokenId);
      });

      it("Should emit a TokenSignerChanged event", async function () {
        const nonce = "1";
        const name = "test-agent";
        const role = "facilitator";
        const mission = "";
        const baseImageCid =
          "bafybeibsulc7sgpck3w7ur7eqa6fwaazcsswn3dg3rfl65zka3knajx43i";
        const agentAddresses = [generateRandomAddress()];

        const proposalId = await _agenticAIAgentCollection.nextProposalId();
        const tokenId = await _agenticAIAgentCollection.nextTokenId();

        const signature = await signMintProposalRequest(
          _signer,
          _otherAccount.address,
          agentAddresses,
          role,
          name,
          baseImageCid,
          mission,
          nonce
        );

        await _agenticAIAgentCollection.mintProposal(
          _otherAccount.address,
          agentAddresses,
          _signer.address,
          role,
          name,
          baseImageCid,
          mission,
          ethers.id(nonce),
          signature
        );

        await expect(_agenticAIAgentCollection.connect(_owner).mint(proposalId))
          .to.emit(_agenticAIAgentCollection, "TokenSignerChanged")
          .withArgs(tokenId, ethers.ZeroAddress, _signer.address);
      });
    });
  });
});
