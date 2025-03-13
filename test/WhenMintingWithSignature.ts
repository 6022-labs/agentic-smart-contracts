import { expect } from "chai";
import { ethers } from "hardhat";
import { AgenticAIAgentCollection } from "../typechain-types";
import { loadFixture, reset } from "@nomicfoundation/hardhat-network-helpers";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";

describe("WhenMintingWithSignature", function () {
  let _agenticAIAgentCollection: AgenticAIAgentCollection;

  let _owner: HardhatEthersSigner;
  let _signer: HardhatEthersSigner;
  let _otherAccount: HardhatEthersSigner;

  async function deployAgenticAIAgentCollection() {
    await reset();

    const [owner, signer, otherAccount] = await ethers.getSigners();

    const AgenticAIAgentCollection = await ethers.getContractFactory(
      "AgenticAIAgentCollection"
    );
    const agenticAIAgentCollection = await AgenticAIAgentCollection.deploy();

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
    nonce: string
  ) {
    const domain = {
      name: "VerifiedMintNFT",
      version: "1",
      chainId: (await ethers.provider.getNetwork()).chainId,
      verifyingContract: await _agenticAIAgentCollection.getAddress(),
    };

    const types = {
      MintRequest: [
        { name: "to", type: "address" },
        { name: "agentAddressesHash", type: "bytes32" }, // Change this from address[] to bytes32
        { name: "signer", type: "address" },
        { name: "nonce", type: "bytes32" },
      ],
    };

    const agentAddressesHash = ethers.keccak256(
      ethers.solidityPacked(["address[]"], [agentAddresses])
    );

    const message = {
      to,
      agentAddressesHash,
      signer: signer.address,
      nonce: ethers.keccak256(ethers.toUtf8Bytes(nonce)),
    };

    return await signer.signTypedData(domain, types, message);
  }

  describe("Given a signature from signer", function () {
    describe("Given a valid nonce used twice", function () {
      it("Should revert with 'UsedNonce' error on second attempt", async function () {
        const nonce = "1";
        const agentAddresses = [generateRandomAddress()];
        const signature = await signMintRequest(
          _signer,
          _otherAccount.address,
          agentAddresses,
          "1"
        );

        await _agenticAIAgentCollection
          .connect(_otherAccount)
          .mintWithSignature(
            _otherAccount.address,
            agentAddresses,
            _signer.address,
            ethers.id(nonce),
            signature
          );

        await expect(
          _agenticAIAgentCollection
            .connect(_otherAccount)
            .mintWithSignature(
              _otherAccount.address,
              agentAddresses,
              _signer.address,
              ethers.id(nonce),
              signature
            )
        ).to.be.revertedWithCustomError(_agenticAIAgentCollection, "UsedNonce");
      });
    });

    describe("Given a signature that does not match parameters", function () {
      it("Should revert with 'InvalidSignature' error", async function () {
        const nonce = "1";
        const agentAddresses = [generateRandomAddress()];
        const signature = await signMintRequest(
          _signer,
          _otherAccount.address,
          agentAddresses,
          nonce
        );

        await expect(
          _agenticAIAgentCollection
            .connect(_otherAccount)
            .mintWithSignature(
              _signer.address,
              agentAddresses,
              _signer.address,
              ethers.id(nonce),
              signature
            )
        ).to.be.revertedWithCustomError(
          _agenticAIAgentCollection,
          "InvalidSignature"
        );
      });
    });

    describe("Given a signature that matches parameters", function () {
      it("Should mint the token", async function () {
        const nonce = "1";
        const agentAddresses = [generateRandomAddress()];
        const signature = await signMintRequest(
          _signer,
          _otherAccount.address,
          agentAddresses,
          nonce
        );

        await expect(
          _agenticAIAgentCollection
            .connect(_otherAccount)
            .mintWithSignature(
              _otherAccount.address,
              agentAddresses,
              _signer.address,
              ethers.id(nonce),
              signature
            )
        )
          .to.emit(_agenticAIAgentCollection, "Transfer")
          .withArgs(ethers.ZeroAddress, _otherAccount.address, 0);
      });

      it("Should assign the NFT to the correct recipient", async function () {
        const nonce = "1";
        const agentAddresses = [generateRandomAddress()];
        const signature = await signMintRequest(
          _signer,
          _otherAccount.address,
          agentAddresses,
          nonce
        );

        await _agenticAIAgentCollection
          .connect(_otherAccount)
          .mintWithSignature(
            _otherAccount.address,
            agentAddresses,
            _signer.address,
            ethers.id(nonce),
            signature
          );

        expect(await _agenticAIAgentCollection.ownerOf(0)).to.equal(
          _otherAccount.address
        );
      });

      it("Should mint the NFT with the expected token ID", async function () {
        const nonce1 = "1";
        const nonce2 = "2";
        const agentAddresses1 = [generateRandomAddress()];
        const agentAddresses2 = [generateRandomAddress()];
        const signature1 = await signMintRequest(
          _signer,
          _otherAccount.address,
          agentAddresses1,
          nonce1
        );
        const signature2 = await signMintRequest(
          _signer,
          _otherAccount.address,
          agentAddresses2,
          nonce2
        );

        await _agenticAIAgentCollection
          .connect(_otherAccount)
          .mintWithSignature(
            _otherAccount.address,
            agentAddresses1,
            _signer.address,
            ethers.id(nonce1),
            signature1
          );

        await _agenticAIAgentCollection
          .connect(_otherAccount)
          .mintWithSignature(
            _otherAccount.address,
            agentAddresses2,
            _signer.address,
            ethers.id(nonce2),
            signature2
          );

        expect(await _agenticAIAgentCollection.ownerOf(0)).to.equal(
          _otherAccount.address
        );
        expect(await _agenticAIAgentCollection.ownerOf(1)).to.equal(
          _otherAccount.address
        );
      });

      it("Should increment next token ID", async function () {
        const nonce1 = "1";
        const nonce2 = "2";
        const agentAddresses1 = [generateRandomAddress()];
        const agentAddresses2 = [generateRandomAddress()];
        const signature1 = await signMintRequest(
          _signer,
          _otherAccount.address,
          agentAddresses1,
          nonce1
        );
        const signature2 = await signMintRequest(
          _signer,
          _otherAccount.address,
          agentAddresses2,
          nonce2
        );

        await _agenticAIAgentCollection
          .connect(_otherAccount)
          .mintWithSignature(
            _otherAccount.address,
            agentAddresses1,
            _signer.address,
            ethers.id(nonce1),
            signature1
          );

        expect(await _agenticAIAgentCollection.nextTokenId()).to.equal(1);

        await _agenticAIAgentCollection
          .connect(_otherAccount)
          .mintWithSignature(
            _otherAccount.address,
            agentAddresses2,
            _signer.address,
            ethers.id(nonce2),
            signature2
          );

        expect(await _agenticAIAgentCollection.nextTokenId()).to.equal(2);
      });

      it("Should mark the nonce as used", async function () {
        const nonce = "1";
        const agentAddresses = [generateRandomAddress()];

        const signature = await signMintRequest(
          _signer,
          _otherAccount.address,
          agentAddresses,
          nonce
        );

        await _agenticAIAgentCollection
          .connect(_otherAccount)
          .mintWithSignature(
            _otherAccount.address,
            agentAddresses,
            _signer.address,
            ethers.id(nonce),
            signature
          );

        expect(
          await _agenticAIAgentCollection.usedNonces(
            ethers.keccak256(ethers.toUtf8Bytes(nonce.toString()))
          )
        ).to.be.true;
      });

      it("Should emit a MintedWithSignature event", async function () {
        const nonce = "1";
        const agentAddresses = [generateRandomAddress()];

        const nextTokenId = await _agenticAIAgentCollection.nextTokenId();

        const signature = await signMintRequest(
          _signer,
          _otherAccount.address,
          agentAddresses,
          nonce
        );

        await expect(
          _agenticAIAgentCollection
            .connect(_otherAccount)
            .mintWithSignature(
              _otherAccount.address,
              agentAddresses,
              _signer.address,
              ethers.id(nonce),
              signature
            )
        )
          .to.emit(_agenticAIAgentCollection, "MintedWithSignature")
          .withArgs(_otherAccount.address, _signer.address, nextTokenId);
      });

      it("Should assign signer to the token", async function () {
        const nonce = "1";
        const agentAddresses = [generateRandomAddress()];

        const nextTokenId = await _agenticAIAgentCollection.nextTokenId();

        const signature = await signMintRequest(
          _signer,
          _otherAccount.address,
          agentAddresses,
          nonce
        );

        await _agenticAIAgentCollection
          .connect(_otherAccount)
          .mintWithSignature(
            _otherAccount.address,
            agentAddresses,
            _signer.address,
            ethers.id(nonce),
            signature
          );

        expect(
          await _agenticAIAgentCollection.tokenSigner(nextTokenId)
        ).to.equal(_signer.address);
      });
    });
  });

  describe("Given a signature from a non-signer", function () {
    it("Should revert with 'InvalidSignature' error", async function () {
      const nonce = "1";
      const agentAddresses = [generateRandomAddress()];
      const signature = await signMintRequest(
        _otherAccount,
        _otherAccount.address,
        agentAddresses,
        nonce
      );

      await expect(
        _agenticAIAgentCollection
          .connect(_otherAccount)
          .mintWithSignature(
            _otherAccount.address,
            agentAddresses,
            _signer.address,
            ethers.id(nonce),
            signature
          )
      ).to.be.revertedWithCustomError(
        _agenticAIAgentCollection,
        "InvalidSignature"
      );
    });
  });
});
