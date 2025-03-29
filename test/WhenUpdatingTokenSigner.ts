import { expect } from "chai";
import { ethers } from "hardhat";
import { AgenticAIAgentCollection } from "../typechain-types";
import { loadFixture, reset } from "@nomicfoundation/hardhat-network-helpers";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";

describe("WhenUpdatingTokenSigner", function () {
  let _agenticAIAgentCollection: AgenticAIAgentCollection;

  let _owner: HardhatEthersSigner;
  let _otherAccount: HardhatEthersSigner;

  let _signer: HardhatEthersSigner;
  let _otherSigner: HardhatEthersSigner;

  async function deployAgenticAIAgentCollection() {
    await reset();

    const [owner, otherAccount, signer, otherSigner] =
      await ethers.getSigners();

    const AgenticAIAgentCollection = await ethers.getContractFactory(
      "AgenticAIAgentCollection"
    );
    const agenticAIAgentCollection = await AgenticAIAgentCollection.deploy();

    await agenticAIAgentCollection.addSigner(signer.address);
    await agenticAIAgentCollection.addSigner(otherSigner.address);

    return {
      agenticAIAgentCollection,
      owner,
      otherAccount,
      signer,
      otherSigner,
    };
  }

  beforeEach(async function () {
    const {
      agenticAIAgentCollection,
      owner,
      otherAccount,
      signer,
      otherSigner,
    } = await loadFixture(deployAgenticAIAgentCollection);

    _owner = owner;
    _signer = signer;
    _otherSigner = otherSigner;
    _otherAccount = otherAccount;
    _agenticAIAgentCollection = agenticAIAgentCollection;
  });

  function generateRandomAddress() {
    return ethers.Wallet.createRandom().address;
  }

  function generateRandomNonce() {
    return ethers.hexlify(ethers.randomBytes(32));
  }

  async function mintWithSignature(signer: HardhatEthersSigner, to: string) {
    const nonce = generateRandomNonce();
    const agentAddresses = [generateRandomAddress()];

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

    const signature = await signer.signTypedData(domain, types, message);

    await _agenticAIAgentCollection
      .connect(_owner)
      .mint(to, agentAddresses, signer.address, ethers.id(nonce), signature);
  }

  // Function to generate a valid EIP-712 signature
  async function signUpdateTokenSignerRequest(
    signer: HardhatEthersSigner,
    tokenId: string,
    newSigner: string,
    nonce: string
  ) {
    const domain = {
      name: "AgenticAIAgentCollection",
      version: "1",
      chainId: (await ethers.provider.getNetwork()).chainId,
      verifyingContract: await _agenticAIAgentCollection.getAddress(),
    };

    const types = {
      UpdateTokenSignerRequest: [
        { name: "tokenId", type: "uint256" },
        { name: "newSigner", type: "address" },
        { name: "nonce", type: "bytes32" },
      ],
    };

    const message = {
      tokenId,
      newSigner,
      nonce: ethers.keccak256(ethers.toUtf8Bytes(nonce)),
    };

    return await signer.signTypedData(domain, types, message);
  }

  describe("Given nonce has already been used", function () {
    it("Should revert with 'UsedNonce' error", async function () {
      const nextTokenId = await _agenticAIAgentCollection.nextTokenId();

      await mintWithSignature(_signer, await _owner.getAddress());

      const nonce = generateRandomNonce();
      const signature = await signUpdateTokenSignerRequest(
        _signer,
        nextTokenId.toString(),
        await _otherSigner.getAddress(),
        nonce
      );

      await _agenticAIAgentCollection
        .connect(_owner)
        .updateTokenSigner(
          nextTokenId,
          await _otherSigner.getAddress(),
          ethers.id(nonce),
          signature
        );

      await expect(
        _agenticAIAgentCollection
          .connect(_owner)
          .updateTokenSigner(
            nextTokenId,
            await _otherAccount.getAddress(),
            ethers.id(nonce),
            signature
          )
      )
        .to.be.revertedWithCustomError(_agenticAIAgentCollection, "UsedNonce")
        .withArgs(ethers.id(nonce));
    });
  });

  describe("Given sender is not the owner of the token", function () {
    it("Should revert with 'OwnableUnauthorizedAccount' error", async function () {
      const nextTokenId = await _agenticAIAgentCollection.nextTokenId();

      await mintWithSignature(_signer, await _owner.getAddress());

      const nonce = generateRandomNonce();
      const signature = await signUpdateTokenSignerRequest(
        _signer,
        nextTokenId.toString(),
        await _otherAccount.getAddress(),
        nonce
      );

      await expect(
        _agenticAIAgentCollection
          .connect(_otherAccount)
          .updateTokenSigner(
            nextTokenId,
            await _otherAccount.getAddress(),
            ethers.id(nonce),
            signature
          )
      )
        .to.be.revertedWithCustomError(
          _agenticAIAgentCollection,
          "OwnableUnauthorizedAccount"
        )
        .withArgs(await _otherAccount.getAddress(), nextTokenId);
    });
  });

  describe("Given new signer is not a valid signer", function () {
    it("Should revert with 'NotSigner' error", async function () {
      const nextTokenId = await _agenticAIAgentCollection.nextTokenId();

      await mintWithSignature(_signer, await _owner.getAddress());

      const nonce = generateRandomNonce();
      const signature = await signUpdateTokenSignerRequest(
        _signer,
        nextTokenId.toString(),
        await _otherAccount.getAddress(),
        nonce
      );

      await expect(
        _agenticAIAgentCollection
          .connect(_owner)
          .updateTokenSigner(
            nextTokenId,
            await _otherAccount.getAddress(),
            ethers.id(nonce),
            signature
          )
      ).to.be.revertedWithCustomError(_agenticAIAgentCollection, "NotSigner");
    });
  });

  describe("Given new signer is current signer", function () {
    it("Should revert with 'SignerUnchanged' error", async function () {
      const nextTokenId = await _agenticAIAgentCollection.nextTokenId();

      const signerAddress = await _signer.getAddress();

      await mintWithSignature(_signer, await _owner.getAddress());

      const nonce = generateRandomNonce();
      const signature = await signUpdateTokenSignerRequest(
        _signer,
        nextTokenId.toString(),
        await _signer.getAddress(),
        nonce
      );

      await expect(
        _agenticAIAgentCollection
          .connect(_owner)
          .updateTokenSigner(
            nextTokenId,
            await _signer.getAddress(),
            ethers.id(nonce),
            signature
          )
      )
        .to.be.revertedWithCustomError(
          _agenticAIAgentCollection,
          "SignerUnchanged"
        )
        .withArgs(signerAddress);
    });
  });

  describe("Given signature is invalid", function () {
    it("Should revert with 'NotSigner' error", async function () {
      const nextTokenId = await _agenticAIAgentCollection.nextTokenId();

      await mintWithSignature(_signer, await _owner.getAddress());

      const firstNonce = generateRandomNonce();
      const secondNonce = generateRandomNonce();
      const invalidSignature = await signUpdateTokenSignerRequest(
        _signer,
        nextTokenId.toString(),
        await _otherSigner.getAddress(),
        firstNonce
      );

      await expect(
        _agenticAIAgentCollection
          .connect(_owner)
          .updateTokenSigner(
            nextTokenId,
            await _otherSigner.getAddress(),
            ethers.id(secondNonce),
            invalidSignature
          )
      ).to.be.revertedWithCustomError(_agenticAIAgentCollection, "NotSigner");
    });
  });

  describe("Given signer is not the signer of the agent", function () {
    it("Should revert with 'InvalidSigner' error", async function () {
      const nextTokenId = await _agenticAIAgentCollection.nextTokenId();

      await mintWithSignature(_signer, await _owner.getAddress());

      const nonce = generateRandomNonce();
      const signature = await signUpdateTokenSignerRequest(
        _otherSigner,
        nextTokenId.toString(),
        await _otherSigner.getAddress(),
        nonce
      );

      await expect(
        _agenticAIAgentCollection
          .connect(_owner)
          .updateTokenSigner(
            nextTokenId,
            await _otherSigner.getAddress(),
            ethers.id(nonce),
            signature
          )
      )
        .to.be.revertedWithCustomError(
          _agenticAIAgentCollection,
          "InvalidSigner"
        )
        .withArgs(await _otherSigner.getAddress(), await _signer.getAddress());
    });
  });

  describe("Given new signer is a valid signer", function () {
    it("Should update the signer of the token", async function () {
      const nextTokenId = await _agenticAIAgentCollection.nextTokenId();

      await mintWithSignature(_signer, await _owner.getAddress());

      const nonce = generateRandomNonce();
      const signature = await signUpdateTokenSignerRequest(
        _signer,
        nextTokenId.toString(),
        await _otherSigner.getAddress(),
        nonce
      );

      await _agenticAIAgentCollection
        .connect(_owner)
        .updateTokenSigner(
          nextTokenId,
          await _otherSigner.getAddress(),
          ethers.id(nonce),
          signature
        );

      expect(await _agenticAIAgentCollection.tokenSigner(nextTokenId)).to.equal(
        await _otherSigner.getAddress()
      );
    });

    it("Should emit 'TokenSignerChanged' event", async function () {
      const nextTokenId = await _agenticAIAgentCollection.nextTokenId();

      await mintWithSignature(_signer, await _owner.getAddress());

      const nonce = generateRandomNonce();
      const signature = await signUpdateTokenSignerRequest(
        _signer,
        nextTokenId.toString(),
        await _otherSigner.getAddress(),
        nonce
      );

      await expect(
        _agenticAIAgentCollection
          .connect(_owner)
          .updateTokenSigner(
            nextTokenId,
            await _otherSigner.getAddress(),
            ethers.id(nonce),
            signature
          )
      )
        .to.emit(_agenticAIAgentCollection, "TokenSignerChanged")
        .withArgs(
          nextTokenId,
          await _signer.getAddress(),
          await _otherSigner.getAddress()
        );
    });
  });
});
