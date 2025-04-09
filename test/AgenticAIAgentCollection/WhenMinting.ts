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

    const AgenticAIAgentCollectionDescriptor = await ethers.getContractFactory(
      "AgenticAIAgentCollectionDescriptor"
    );
    const agenticAIAgentCollectionDescriptor =
      await AgenticAIAgentCollectionDescriptor.deploy(ipfsGateway);

    const AgenticAIAgentCollection = await ethers.getContractFactory(
      "AgenticAIAgentCollection"
    );
    const agenticAIAgentCollection = await AgenticAIAgentCollection.deploy(
      await agenticAIAgentCollectionDescriptor.getAddress()
    );

    // Assign SIGNER_ROLE to _signer
    await agenticAIAgentCollection.connect(owner).addSigner(signer.address);

    return { agenticAIAgentCollection, owner, signer, otherAccount };
  }

  beforeEach(async function () {
    const { agenticAIAgentCollection, owner, signer, otherAccount } =
      await loadFixture(deployAgenticAIAgentCollection);

    _agenticAIAgentCollection = agenticAIAgentCollection;
    _owner = owner;
    _signer = signer;
    _otherAccount = otherAccount;
  });

  function generateRandomAddress() {
    return ethers.Wallet.createRandom().address;
  }

  // Function to generate a valid EIP-712 signature
  async function signMintRequest(
    signer: HardhatEthersSigner,
    to: string,
    agentAddresses: string[],
    name: string,
    image: string,
    nonce: string
  ) {
    const domain = {
      name: "AgenticAIAgentCollection",
      version: "1",
      chainId: (await ethers.provider.getNetwork()).chainId,
      verifyingContract: await _agenticAIAgentCollection.getAddress(),
    };

    const types = {
      MintRequest: [
        { name: "to", type: "address" },
        { name: "agentAddressesHash", type: "bytes32" }, // Change this from address[] to bytes32
        { name: "signer", type: "address" },
        { name: "nameHash", type: "bytes32" },
        { name: "imageHash", type: "bytes32" },
        { name: "nonce", type: "bytes32" },
      ],
    };

    const agentAddressesHash = ethers.keccak256(
      ethers.solidityPacked(["address[]"], [agentAddresses])
    );
    const nameHash = ethers.keccak256(ethers.toUtf8Bytes(name));
    const imageHash = ethers.keccak256(ethers.toUtf8Bytes(image));

    const message = {
      to,
      agentAddressesHash,
      signer: signer.address,
      nameHash,
      imageHash,
      nonce: ethers.keccak256(ethers.toUtf8Bytes(nonce)),
    };

    return await signer.signTypedData(domain, types, message);
  }

  describe("Given a signature from signer", function () {
    describe("Given a valid nonce used twice", function () {
      it("Should revert with 'UsedNonce' error on second attempt", async function () {
        const nonce = "1";
        const name = "test-agent";
        const baseImageCid =
          "bafybeibsulc7sgpck3w7ur7eqa6fwaazcsswn3dg3rfl65zka3knajx43i";
        const agentAddresses = [generateRandomAddress()];
        const signature = await signMintRequest(
          _signer,
          _otherAccount.address,
          agentAddresses,
          name,
          baseImageCid,
          nonce
        );

        await _agenticAIAgentCollection
          .connect(_otherAccount)
          .mint(
            _otherAccount.address,
            agentAddresses,
            _signer.address,
            name,
            baseImageCid,
            ethers.id(nonce),
            signature
          );

        await expect(
          _agenticAIAgentCollection
            .connect(_otherAccount)
            .mint(
              _otherAccount.address,
              agentAddresses,
              _signer.address,
              name,
              baseImageCid,
              ethers.id(nonce),
              signature
            )
        ).to.be.revertedWithCustomError(_agenticAIAgentCollection, "UsedNonce");
      });
    });

    describe("Given a name already taken", function () {
      it("Should revert with 'UsedName' error", async function () {
        const nonce1 = "1";
        const nonce2 = "2";
        const name = "test-agent";
        const baseImageCid =
          "bafybeibsulc7sgpck3w7ur7eqa6fwaazcsswn3dg3rfl65zka3knajx43i";
        const agentAddresses = [generateRandomAddress()];

        const signature1 = await signMintRequest(
          _signer,
          _otherAccount.address,
          agentAddresses,
          name,
          baseImageCid,
          nonce1
        );

        const signature2 = await signMintRequest(
          _signer,
          _otherAccount.address,
          agentAddresses,
          name,
          baseImageCid,
          nonce2
        );

        await _agenticAIAgentCollection
          .connect(_otherAccount)
          .mint(
            _otherAccount.address,
            agentAddresses,
            _signer.address,
            name,
            baseImageCid,
            ethers.id(nonce1),
            signature1
          );

        await expect(
          _agenticAIAgentCollection
            .connect(_otherAccount)
            .mint(
              _otherAccount.address,
              agentAddresses,
              _signer.address,
              name,
              baseImageCid,
              ethers.id(nonce2),
              signature2
            )
        ).to.be.revertedWithCustomError(_agenticAIAgentCollection, "UsedName");
      });
    });

    describe("Given a signature that does not match parameters", function () {
      it("Should revert with 'NotSigner' error", async function () {
        const nonce = "1";
        const name = "test-agent";
        const baseImageCid =
          "bafybeibsulc7sgpck3w7ur7eqa6fwaazcsswn3dg3rfl65zka3knajx43i";
        const agentAddresses = [generateRandomAddress()];
        const signature = await signMintRequest(
          _signer,
          _otherAccount.address,
          agentAddresses,
          name,
          baseImageCid,
          nonce
        );

        await expect(
          _agenticAIAgentCollection
            .connect(_otherAccount)
            .mint(
              _signer.address,
              agentAddresses,
              _signer.address,
              name,
              baseImageCid,
              ethers.id(nonce),
              signature
            )
        ).to.be.revertedWithCustomError(_agenticAIAgentCollection, "NotSigner");
      });
    });

    describe("Given a signature that matches parameters", function () {
      it("Should mint the token", async function () {
        const nonce = "1";
        const name = "test-agent";
        const baseImageCid =
          "bafybeibsulc7sgpck3w7ur7eqa6fwaazcsswn3dg3rfl65zka3knajx43i";
        const agentAddresses = [generateRandomAddress()];

        const signature = await signMintRequest(
          _signer,
          _otherAccount.address,
          agentAddresses,
          name,
          baseImageCid,
          nonce
        );

        await expect(
          _agenticAIAgentCollection
            .connect(_otherAccount)
            .mint(
              _otherAccount.address,
              agentAddresses,
              _signer.address,
              name,
              baseImageCid,
              ethers.id(nonce),
              signature
            )
        )
          .to.emit(_agenticAIAgentCollection, "Transfer")
          .withArgs(ethers.ZeroAddress, _otherAccount.address, 1);
      });

      it("Should assign the owner of the token", async function () {
        const nonce = "1";
        const name = "test-agent";
        const baseImageCid =
          "bafybeibsulc7sgpck3w7ur7eqa6fwaazcsswn3dg3rfl65zka3knajx43i";
        const agentAddresses = [generateRandomAddress()];

        const nextTokenId = await _agenticAIAgentCollection.nextTokenId();

        const signature = await signMintRequest(
          _signer,
          _otherAccount.address,
          agentAddresses,
          name,
          baseImageCid,
          nonce
        );

        await _agenticAIAgentCollection
          .connect(_otherAccount)
          .mint(
            _otherAccount.address,
            agentAddresses,
            _signer.address,
            name,
            baseImageCid,
            ethers.id(nonce),
            signature
          );

        expect(await _agenticAIAgentCollection.ownerOf(nextTokenId)).to.equal(
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
        const baseImageCid =
          "bafybeibsulc7sgpck3w7ur7eqa6fwaazcsswn3dg3rfl65zka3knajx43i";

        const baseNextTokenId = await _agenticAIAgentCollection.nextTokenId();

        const signature1 = await signMintRequest(
          _signer,
          _otherAccount.address,
          agentAddresses1,
          name1,
          baseImageCid,
          nonce1
        );
        const signature2 = await signMintRequest(
          _signer,
          _otherAccount.address,
          agentAddresses2,
          name2,
          baseImageCid,
          nonce2
        );

        await _agenticAIAgentCollection
          .connect(_otherAccount)
          .mint(
            _otherAccount.address,
            agentAddresses1,
            _signer.address,
            name1,
            baseImageCid,
            ethers.id(nonce1),
            signature1
          );

        await _agenticAIAgentCollection
          .connect(_otherAccount)
          .mint(
            _otherAccount.address,
            agentAddresses2,
            _signer.address,
            name2,
            baseImageCid,
            ethers.id(nonce2),
            signature2
          );

        expect(
          await _agenticAIAgentCollection.ownerOf(baseNextTokenId)
        ).to.equal(_otherAccount.address);

        expect(
          await _agenticAIAgentCollection.ownerOf(baseNextTokenId + BigInt(1))
        ).to.equal(_otherAccount.address);
      });

      it("Should increment next token ID", async function () {
        const nonce1 = "1";
        const nonce2 = "2";
        const agentAddresses1 = [generateRandomAddress()];
        const agentAddresses2 = [generateRandomAddress()];

        const name1 = "test-agent-1";
        const name2 = "test-agent-2";
        const baseImageCid =
          "bafybeibsulc7sgpck3w7ur7eqa6fwaazcsswn3dg3rfl65zka3knajx43i";

        const baseNextTokenId = await _agenticAIAgentCollection.nextTokenId();

        const signature1 = await signMintRequest(
          _signer,
          _otherAccount.address,
          agentAddresses1,
          name1,
          baseImageCid,
          nonce1
        );
        const signature2 = await signMintRequest(
          _signer,
          _otherAccount.address,
          agentAddresses2,
          name2,
          baseImageCid,
          nonce2
        );

        await _agenticAIAgentCollection
          .connect(_otherAccount)
          .mint(
            _otherAccount.address,
            agentAddresses1,
            _signer.address,
            name1,
            baseImageCid,
            ethers.id(nonce1),
            signature1
          );

        expect(await _agenticAIAgentCollection.nextTokenId()).to.equal(
          baseNextTokenId + BigInt(1)
        );

        await _agenticAIAgentCollection
          .connect(_otherAccount)
          .mint(
            _otherAccount.address,
            agentAddresses2,
            _signer.address,
            name2,
            baseImageCid,
            ethers.id(nonce2),
            signature2
          );

        expect(await _agenticAIAgentCollection.nextTokenId()).to.equal(
          baseNextTokenId + BigInt(2)
        );
      });

      it("Should mark the nonce as used", async function () {
        const nonce = "1";
        const agentAddresses = [generateRandomAddress()];

        const name = "test-agent";
        const baseImageCid =
          "bafybeibsulc7sgpck3w7ur7eqa6fwaazcsswn3dg3rfl65zka3knajx43i";

        const signature = await signMintRequest(
          _signer,
          _otherAccount.address,
          agentAddresses,
          name,
          baseImageCid,
          nonce
        );

        await _agenticAIAgentCollection
          .connect(_otherAccount)
          .mint(
            _otherAccount.address,
            agentAddresses,
            _signer.address,
            name,
            baseImageCid,
            ethers.id(nonce),
            signature
          );

        expect(
          await _agenticAIAgentCollection.isNonceUsed(
            ethers.keccak256(ethers.toUtf8Bytes(nonce.toString()))
          )
        ).to.be.true;
      });

      it("Should assign signer of the token", async function () {
        const nonce = "1";
        const agentAddresses = [generateRandomAddress()];

        const name = "test-agent";
        const baseImageCid =
          "bafybeibsulc7sgpck3w7ur7eqa6fwaazcsswn3dg3rfl65zka3knajx43i";

        const nextTokenId = await _agenticAIAgentCollection.nextTokenId();

        const signature = await signMintRequest(
          _signer,
          _otherAccount.address,
          agentAddresses,
          name,
          baseImageCid,
          nonce
        );

        await _agenticAIAgentCollection
          .connect(_otherAccount)
          .mint(
            _otherAccount.address,
            agentAddresses,
            _signer.address,
            name,
            baseImageCid,
            ethers.id(nonce),
            signature
          );

        expect(await _agenticAIAgentCollection.signerOf(nextTokenId)).to.equal(
          _signer.address
        );
      });

      it("Should assign agent addresses to the token", async function () {
        const nonce = "1";
        const agentAddresses = [generateRandomAddress()];

        const name = "test-agent";
        const baseImageCid =
          "bafybeibsulc7sgpck3w7ur7eqa6fwaazcsswn3dg3rfl65zka3knajx43i";

        const nextTokenId = await _agenticAIAgentCollection.nextTokenId();

        const signature = await signMintRequest(
          _signer,
          _otherAccount.address,
          agentAddresses,
          name,
          baseImageCid,
          nonce
        );

        await _agenticAIAgentCollection
          .connect(_otherAccount)
          .mint(
            _otherAccount.address,
            agentAddresses,
            _signer.address,
            name,
            baseImageCid,
            ethers.id(nonce),
            signature
          );

        const walletsOf = await _agenticAIAgentCollection.walletsOf(
          nextTokenId
        );

        expect(walletsOf.length).to.equal(agentAddresses.length);

        for (let i = 0; i < agentAddresses.length; i++) {
          expect(agentAddresses).to.include(walletsOf[i]);
        }
      });

      it("Should assign name to the token", async function () {
        const nonce = "1";
        const agentAddresses = [generateRandomAddress()];

        const name = "test-agent";
        const baseImageCid =
          "bafybeibsulc7sgpck3w7ur7eqa6fwaazcsswn3dg3rfl65zka3knajx43i";

        const nextTokenId = await _agenticAIAgentCollection.nextTokenId();

        const signature = await signMintRequest(
          _signer,
          _otherAccount.address,
          agentAddresses,
          name,
          baseImageCid,
          nonce
        );

        await _agenticAIAgentCollection
          .connect(_otherAccount)
          .mint(
            _otherAccount.address,
            agentAddresses,
            _signer.address,
            name,
            baseImageCid,
            ethers.id(nonce),
            signature
          );

        expect(await _agenticAIAgentCollection.nameOf(nextTokenId)).to.equal(
          name
        );
      });

      it("Should assign base image to the token", async function () {
        const nonce = "1";
        const agentAddresses = [generateRandomAddress()];

        const name = "test-agent";
        const baseImageCid =
          "bafybeibsulc7sgpck3w7ur7eqa6fwaazcsswn3dg3rfl65zka3knajx43i";

        const nextTokenId = await _agenticAIAgentCollection.nextTokenId();

        const signature = await signMintRequest(
          _signer,
          _otherAccount.address,
          agentAddresses,
          name,
          baseImageCid,
          nonce
        );

        await _agenticAIAgentCollection
          .connect(_otherAccount)
          .mint(
            _otherAccount.address,
            agentAddresses,
            _signer.address,
            name,
            baseImageCid,
            ethers.id(nonce),
            signature
          );

        expect(await _agenticAIAgentCollection.imageOf(nextTokenId)).to.equal(
          baseImageCid
        );
      });

      it("Should assign creator to the token", async function () {
        const nonce = "1";
        const agentAddresses = [generateRandomAddress()];

        const name = "test-agent";
        const baseImageCid =
          "bafybeibsulc7sgpck3w7ur7eqa6fwaazcsswn3dg3rfl65zka3knajx43i";

        const nextTokenId = await _agenticAIAgentCollection.nextTokenId();

        const signature = await signMintRequest(
          _signer,
          _otherAccount.address,
          agentAddresses,
          name,
          baseImageCid,
          nonce
        );

        await _agenticAIAgentCollection
          .connect(_otherAccount)
          .mint(
            _otherAccount.address,
            agentAddresses,
            _signer.address,
            name,
            baseImageCid,
            ethers.id(nonce),
            signature
          );

        expect(await _agenticAIAgentCollection.creatorOf(nextTokenId)).to.equal(
          _otherAccount.address
        );
      });

      it("Should assign token id to name", async function () {
        const nonce = "1";
        const agentAddresses = [generateRandomAddress()];

        const name = "test-agent";
        const baseImageCid =
          "bafybeibsulc7sgpck3w7ur7eqa6fwaazcsswn3dg3rfl65zka3knajx43i";

        const signature = await signMintRequest(
          _signer,
          _otherAccount.address,
          agentAddresses,
          name,
          baseImageCid,
          nonce
        );

        const nextTokenId = await _agenticAIAgentCollection.nextTokenId();

        await _agenticAIAgentCollection
          .connect(_otherAccount)
          .mint(
            _otherAccount.address,
            agentAddresses,
            _signer.address,
            name,
            baseImageCid,
            ethers.id(nonce),
            signature
          );

        expect(await _agenticAIAgentCollection.tokenIdOf(name)).to.be.equal(
          nextTokenId
        );
      });

      it("Should emit a Minted event", async function () {
        const nonce = "1";
        const agentAddresses = [generateRandomAddress()];

        const name = "test-agent";
        const baseImageCid =
          "bafybeibsulc7sgpck3w7ur7eqa6fwaazcsswn3dg3rfl65zka3knajx43i";

        const nextTokenId = await _agenticAIAgentCollection.nextTokenId();

        const signature = await signMintRequest(
          _signer,
          _otherAccount.address,
          agentAddresses,
          name,
          baseImageCid,
          nonce
        );

        await expect(
          _agenticAIAgentCollection
            .connect(_otherAccount)
            .mint(
              _otherAccount.address,
              agentAddresses,
              _signer.address,
              name,
              baseImageCid,
              ethers.id(nonce),
              signature
            )
        )
          .to.emit(_agenticAIAgentCollection, "Minted")
          .withArgs(_otherAccount.address, _signer.address, nextTokenId);
      });

      it("Should emit a TokenSignerChanged event", async function () {
        const nonce = "1";
        const agentAddresses = [generateRandomAddress()];

        const name = "test-agent";
        const baseImageCid =
          "bafybeibsulc7sgpck3w7ur7eqa6fwaazcsswn3dg3rfl65zka3knajx43i";

        const nextTokenId = await _agenticAIAgentCollection.nextTokenId();

        const signature = await signMintRequest(
          _signer,
          _otherAccount.address,
          agentAddresses,
          name,
          baseImageCid,
          nonce
        );

        await expect(
          _agenticAIAgentCollection
            .connect(_otherAccount)
            .mint(
              _otherAccount.address,
              agentAddresses,
              _signer.address,
              name,
              baseImageCid,
              ethers.id(nonce),
              signature
            )
        )
          .to.emit(_agenticAIAgentCollection, "TokenSignerChanged")
          .withArgs(nextTokenId, ethers.ZeroAddress, _signer.address);
      });
    });
  });

  describe("Given a signature from a non-signer", function () {
    it("Should revert with 'NotSigner' error", async function () {
      const nonce = "1";
      const agentAddresses = [generateRandomAddress()];

      const name = "test-agent";
      const baseImageCid =
        "bafybeibsulc7sgpck3w7ur7eqa6fwaazcsswn3dg3rfl65zka3knajx43i";

      const signature = await signMintRequest(
        _otherAccount,
        _otherAccount.address,
        agentAddresses,
        name,
        baseImageCid,
        nonce
      );

      await expect(
        _agenticAIAgentCollection
          .connect(_otherAccount)
          .mint(
            _otherAccount.address,
            agentAddresses,
            _signer.address,
            name,
            baseImageCid,
            ethers.id(nonce),
            signature
          )
      ).to.be.revertedWithCustomError(_agenticAIAgentCollection, "NotSigner");
    });
  });
});
