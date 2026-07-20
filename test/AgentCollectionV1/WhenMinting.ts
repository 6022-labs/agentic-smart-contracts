import { expect } from "chai";
import { ethers } from "hardhat";
import { AgentCollectionV1 } from "../../typechain-types";
import { loadFixture, reset } from "@nomicfoundation/hardhat-network-helpers";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import {
  AgentAddressStruct,
  NullableUint256Struct,
} from "../../typechain-types/contracts/AgentCollectionV1";
import {
  generateRandomAddress,
  evmAddresses,
  btcAddresses,
  deployCollectionWithCreator,
} from "../common";

describe("WhenMinting", function () {
  const ipfsGateway = "https://ipfs.io/ipfs/";

  const DEFAULT_ROLE = "facilitator";
  const DEFAULT_CLONE_OF: NullableUint256Struct = { isSet: false, value: 0n };
  const DEFAULT_IMAGES = [
    {
      key: "default",
      value: "bafybeibsulc7sgpck3w7ur7eqa6fwaazcsswn3dg3rfl65zka3knajx43i",
    },
  ];
  const DEFAULT_ATTRIBUTES = [
    { key: "role", value: DEFAULT_ROLE },
    { key: "mission", value: "random mission" },
  ];
  const DEFAULT_NAME = "test-agent";
  const INVALID_NAME = "Invalid_Name";

  let _collection: AgentCollectionV1;
  let _owner: HardhatEthersSigner;
  let _otherAccount: HardhatEthersSigner;

  // Mints with the signature-free API. `caller` defaults to the connected
  // signer of `_collection`.
  function mint(
    args: {
      to: string;
      name?: string;
      addresses: AgentAddressStruct[];
      images?: { key: string; value: string }[];
      attributes?: { key: string; value: string }[];
      cloneOf?: NullableUint256Struct;
    },
    caller?: HardhatEthersSigner,
  ) {
    const collection = caller ? _collection.connect(caller) : _collection;
    return collection.mint(
      args.to,
      args.name ?? DEFAULT_NAME,
      args.addresses,
      args.images ?? DEFAULT_IMAGES,
      args.attributes ?? DEFAULT_ATTRIBUTES,
      args.cloneOf ?? DEFAULT_CLONE_OF,
    );
  }

  async function deployCollection() {
    await reset();

    const [owner, otherAccount] = await ethers.getSigners();

    const { collection } = await deployCollectionWithCreator({
      owner,
      moderator: owner,
      ipfsGateway,
    });

    return { collection, owner, otherAccount };
  }

  beforeEach(async function () {
    const { collection, owner, otherAccount } = await loadFixture(
      deployCollection,
    );

    _owner = owner;
    _collection = collection;
    _otherAccount = otherAccount;
  });

  async function revokeModerator() {
    return await _collection
      .connect(_owner)
      .revokeRole(await _collection.MODERATOR_ROLE(), _owner.address);
  }

  describe("Given a moderator exists", function () {
    describe("And caller is not a moderator", function () {
      it("Should revert with 'NotModerator' error", async function () {
        await expect(
          mint(
            {
              to: _otherAccount.address,
              addresses: evmAddresses(generateRandomAddress()),
            },
            _otherAccount,
          ),
        ).to.be.revertedWithCustomError(_collection, "NotModerator");
      });
    });

    describe("And caller is a moderator", function () {
      it("Should allow a moderator to mint directly (cloneOf set)", async function () {
        let nextTokenId = await _collection.nextTokenId();
        await mint({
          to: _otherAccount.address,
          addresses: evmAddresses(generateRandomAddress()),
        });

        const cloneOf: NullableUint256Struct = {
          isSet: true,
          value: nextTokenId,
        };
        nextTokenId = await _collection.nextTokenId();
        await mint({
          to: _otherAccount.address,
          name: "cloned-agent",
          addresses: evmAddresses(generateRandomAddress()),
          cloneOf,
        });

        expect(await _collection.ownerOf(nextTokenId)).to.equal(
          _otherAccount.address,
        );
      });

      it("Should allow a moderator to mint directly (cloneOf not set)", async function () {
        const nextTokenId = await _collection.nextTokenId();
        await mint({
          to: _otherAccount.address,
          addresses: evmAddresses(generateRandomAddress()),
        });
        expect(await _collection.ownerOf(nextTokenId)).to.equal(
          _otherAccount.address,
        );
      });
    });
  });

  describe("Given no moderators are set", function () {
    beforeEach(async function () {
      await revokeModerator();
    });

    describe("Given an invalid ens name", function () {
      // Agent name must be a valid ENS label (see ENSUtils.isValidENSName).
      const invalidNames = [
        { label: "empty", value: "" },
        { label: "an invalid char", value: INVALID_NAME },
        { label: "leading hyphen", value: "-foo" },
        { label: "trailing hyphen", value: "foo-" },
        { label: "double hyphen", value: "a--b" },
        { label: "longer than 63 chars", value: "a".repeat(64) },
      ];

      for (const { label, value } of invalidNames) {
        it(`Should revert with 'InvalidName' when name is ${label}`, async function () {
          await expect(
            mint({
              to: _otherAccount.address,
              name: value,
              addresses: evmAddresses(generateRandomAddress()),
            }),
          )
            .to.be.revertedWithCustomError(_collection, "InvalidName")
            .withArgs(value);
        });
      }
    });

    describe("Given the recipient is the zero address", function () {
      it("Should revert with 'ZeroAddress' error", async function () {
        await expect(
          mint({
            to: ethers.ZeroAddress,
            addresses: evmAddresses(generateRandomAddress()),
          }),
        )
          .to.be.revertedWithCustomError(_collection, "ZeroAddress")
          .withArgs("to");
      });
    });

    describe("Given an evm address value is the zero address", function () {
      it("Should revert with 'InvalidEvmAddressValue' error", async function () {
        await expect(
          mint({
            to: _otherAccount.address,
            addresses: evmAddresses(ethers.ZeroAddress),
          }),
        )
          .to.be.revertedWithCustomError(_collection, "InvalidEvmAddressValue")
          .withArgs(ethers.ZeroAddress);
      });
    });

    describe("Given an evm address value is malformed hex", function () {
      it("Should revert with 'InvalidEvmAddressValue' error", async function () {
        await expect(
          mint({
            to: _otherAccount.address,
            addresses: evmAddresses("not-an-address"),
          }),
        )
          .to.be.revertedWithCustomError(_collection, "InvalidEvmAddressValue")
          .withArgs("not-an-address");
      });
    });

    describe("Given no evm address", function () {
      it("Should revert with 'MissingEvmAddress' error", async function () {
        await expect(
          mint({
            to: _otherAccount.address,
            addresses: btcAddresses("bc1qexampleonly"),
          }),
        ).to.be.revertedWithCustomError(_collection, "MissingEvmAddress");
      });
    });

    describe("Given name is already taken", function () {
      it("Should revert with 'UsedName'", async function () {
        const tokenId = await _collection.nextTokenId();
        await mint({
          to: _otherAccount.address,
          addresses: evmAddresses(generateRandomAddress()),
        });

        await expect(
          mint({
            to: _otherAccount.address,
            addresses: evmAddresses(generateRandomAddress()),
          }),
        )
          .to.be.revertedWithCustomError(_collection, "UsedName")
          .withArgs(DEFAULT_NAME, tokenId);
      });
    });

    describe("Given an evm address is already taken", function () {
      it("Should revert with 'UsedAgentAddress'", async function () {
        const wallet = generateRandomAddress();
        const tokenId = await _collection.nextTokenId();
        await mint({
          to: _otherAccount.address,
          name: DEFAULT_NAME + "-1",
          addresses: evmAddresses(wallet),
        });

        await expect(
          mint({
            to: _otherAccount.address,
            name: DEFAULT_NAME + "-2",
            addresses: evmAddresses(wallet),
          }),
        )
          .to.be.revertedWithCustomError(_collection, "UsedAgentAddress")
          .withArgs("evm", wallet.toLowerCase(), tokenId);
      });
    });

    describe("Given the address list repeats an entry", function () {
      it("Should revert with 'UsedAgentAddress' and tokenId 0", async function () {
        const wallet = generateRandomAddress();
        await expect(
          mint({
            to: _otherAccount.address,
            addresses: evmAddresses(wallet, wallet),
          }),
        )
          .to.be.revertedWithCustomError(_collection, "UsedAgentAddress")
          .withArgs("evm", wallet.toLowerCase(), 0n);
      });
    });

    describe("Given cloneOf is set but value is 0", function () {
      it("Should revert with 'InvalidCloneOf'", async function () {
        await expect(
          mint({
            to: _otherAccount.address,
            addresses: evmAddresses(generateRandomAddress()),
            cloneOf: { isSet: true, value: 0n },
          }),
        )
          .to.be.revertedWithCustomError(_collection, "InvalidCloneOf")
          .withArgs(0);
      });
    });

    describe("Given cloneOf is set but related token (agent) does not exist", function () {
      it("Should revert with 'InvalidCloneOf'", async function () {
        await expect(
          mint({
            to: _otherAccount.address,
            addresses: evmAddresses(generateRandomAddress()),
            cloneOf: { isSet: true, value: 9999n },
          }),
        )
          .to.be.revertedWithCustomError(_collection, "InvalidCloneOf")
          .withArgs(9999);
      });
    });

    describe("Given the default image is missing", function () {
      it("Should revert with 'MissingDefaultImage'", async function () {
        await expect(
          mint({
            to: _otherAccount.address,
            addresses: evmAddresses(generateRandomAddress()),
            images: [{ key: "profile", value: "cid1" }],
          }),
        ).to.be.revertedWithCustomError(_collection, "MissingDefaultImage");
      });
    });

    describe("Given the role attribute is missing", function () {
      it("Should revert with 'MissingRequiredKey'", async function () {
        await expect(
          mint({
            to: _otherAccount.address,
            addresses: evmAddresses(generateRandomAddress()),
            attributes: [{ key: "mission", value: "random mission" }],
          }),
        )
          .to.be.revertedWithCustomError(_collection, "MissingRequiredKey")
          .withArgs("role");
      });
    });

    describe("Given the role attribute is empty", function () {
      it("Should revert with 'MissingRequiredKey'", async function () {
        await expect(
          mint({
            to: _otherAccount.address,
            addresses: evmAddresses(generateRandomAddress()),
            attributes: [{ key: "role", value: "" }],
          }),
        )
          .to.be.revertedWithCustomError(_collection, "MissingRequiredKey")
          .withArgs("role");
      });
    });

    describe("Given the attributes list repeats a key", function () {
      it("Should revert with 'DuplicateKey'", async function () {
        await expect(
          mint({
            to: _otherAccount.address,
            addresses: evmAddresses(generateRandomAddress()),
            attributes: [
              { key: "role", value: DEFAULT_ROLE },
              { key: "mission", value: "a" },
              { key: "mission", value: "b" },
            ],
          }),
        )
          .to.be.revertedWithCustomError(_collection, "DuplicateKey")
          .withArgs("mission");
      });
    });

    describe("Given the attributes list repeats the mandatory key", function () {
      it("Should revert with 'DuplicateKey'", async function () {
        await expect(
          mint({
            to: _otherAccount.address,
            addresses: evmAddresses(generateRandomAddress()),
            attributes: [
              { key: "role", value: "" },
              { key: "role", value: DEFAULT_ROLE },
            ],
          }),
        )
          .to.be.revertedWithCustomError(_collection, "DuplicateKey")
          .withArgs("role");
      });
    });

    describe("Given valid mint parameters", function () {
      it("Should allow anybody to mint (cloneOf set)", async function () {
        let nextTokenId = await _collection.nextTokenId();
        await expect(_collection.ownerOf(nextTokenId)).to.be.reverted;

        await mint(
          {
            to: _otherAccount.address,
            addresses: evmAddresses(generateRandomAddress()),
          },
          _otherAccount,
        );

        const cloneOf: NullableUint256Struct = {
          isSet: true,
          value: nextTokenId,
        };
        nextTokenId = await _collection.nextTokenId();
        await mint(
          {
            to: _otherAccount.address,
            name: "cloned-agent",
            addresses: evmAddresses(generateRandomAddress()),
            cloneOf,
          },
          _otherAccount,
        );

        expect(await _collection.ownerOf(nextTokenId)).to.equal(
          _otherAccount.address,
        );
      });

      it("Should allow anybody to mint (cloneOf not set)", async function () {
        const nextTokenId = await _collection.nextTokenId();
        await expect(_collection.ownerOf(nextTokenId)).to.be.reverted;

        await mint(
          {
            to: _otherAccount.address,
            addresses: evmAddresses(generateRandomAddress()),
          },
          _otherAccount,
        );

        expect(await _collection.ownerOf(nextTokenId)).to.equal(
          _otherAccount.address,
        );
      });

      it("Should assign the owner of the token", async function () {
        const nextTokenId = await _collection.nextTokenId();
        await mint({
          to: _otherAccount.address,
          addresses: evmAddresses(generateRandomAddress()),
        });
        expect(await _collection.ownerOf(nextTokenId)).to.equal(
          _otherAccount.address,
        );
      });

      it("Should increment next token ID", async function () {
        const before = await _collection.nextTokenId();
        await mint({
          to: _otherAccount.address,
          addresses: evmAddresses(generateRandomAddress()),
        });
        expect(await _collection.nextTokenId()).to.equal(before + BigInt(1));
      });

      it("Should assign agent addresses to the token", async function () {
        const wallet = generateRandomAddress();
        const nextTokenId = await _collection.nextTokenId();
        await mint({
          to: _otherAccount.address,
          addresses: evmAddresses(wallet),
        });

        expect(await _collection.addressesCountOf(nextTokenId)).to.equal(1n);
        expect(await _collection.addressToTokenId("evm", wallet)).to.equal(
          nextTokenId,
        );
      });

      it("Should store canonicalized addresses (evm lowercased, non-evm verbatim)", async function () {
        const wallet = generateRandomAddress();
        const btcValue = "bc1QVerbatimValue";
        const nextTokenId = await _collection.nextTokenId();
        await mint({
          to: _otherAccount.address,
          addresses: [...evmAddresses(wallet), ...btcAddresses(btcValue)],
        });

        expect(await _collection.addressesCountOf(nextTokenId)).to.equal(2n);

        const information = await _collection.informationOf(nextTokenId);
        expect(
          information.addresses.map((entry) => [
            entry.addressType,
            entry.value,
          ]),
        ).to.deep.equal([
          ["evm", wallet.toLowerCase()],
          ["btc", btcValue],
        ]);
      });

      it("Should assign name to the token", async function () {
        const nextTokenId = await _collection.nextTokenId();
        await mint({
          to: _otherAccount.address,
          addresses: evmAddresses(generateRandomAddress()),
        });
        expect(await _collection.nameOf(nextTokenId)).to.equal(DEFAULT_NAME);
      });

      it("Should assign images to the token", async function () {
        const nextTokenId = await _collection.nextTokenId();
        await mint({
          to: _otherAccount.address,
          addresses: evmAddresses(generateRandomAddress()),
        });

        const imageCount = await _collection.imagesCountOf(nextTokenId);
        expect(imageCount).to.equal(DEFAULT_IMAGES.length);
        for (let i = 0; i < imageCount; i++) {
          const imagesOf = await _collection.imageOfByIndex(nextTokenId, i);
          expect(imagesOf[0]).to.be.equal(DEFAULT_IMAGES[i].key);
          expect(imagesOf[1]).to.be.equal(DEFAULT_IMAGES[i].value);
        }
      });

      it("Should assign attributes to the token", async function () {
        const nextTokenId = await _collection.nextTokenId();
        await mint({
          to: _otherAccount.address,
          addresses: evmAddresses(generateRandomAddress()),
        });

        const attributeCount = await _collection.attributesCountOf(nextTokenId);
        expect(attributeCount).to.equal(DEFAULT_ATTRIBUTES.length);
        for (let i = 0; i < attributeCount; i++) {
          const attributeOf = await _collection.attributeOfByIndex(
            nextTokenId,
            i,
          );
          expect(attributeOf[0]).to.be.equal(DEFAULT_ATTRIBUTES[i].key);
          expect(attributeOf[1]).to.be.equal(DEFAULT_ATTRIBUTES[i].value);
        }
      });

      it("Should return attribute values from 'attributeOfByKey'", async function () {
        const nextTokenId = await _collection.nextTokenId();
        await mint({
          to: _otherAccount.address,
          addresses: evmAddresses(generateRandomAddress()),
        });

        for (const attribute of DEFAULT_ATTRIBUTES) {
          expect(
            await _collection.attributeOfByKey(nextTokenId, attribute.key),
          ).to.equal(attribute.value);
        }
      });

      it("Should return an empty string from 'attributeOfByKey' for an unset key", async function () {
        const nextTokenId = await _collection.nextTokenId();
        await mint({
          to: _otherAccount.address,
          addresses: evmAddresses(generateRandomAddress()),
        });

        expect(
          await _collection.attributeOfByKey(nextTokenId, "does-not-exist"),
        ).to.equal("");
      });

      it("Should assign creator (the caller) to the token", async function () {
        const nextTokenId = await _collection.nextTokenId();
        await mint(
          {
            to: _otherAccount.address,
            addresses: evmAddresses(generateRandomAddress()),
          },
          _otherAccount,
        );
        expect(await _collection.creatorOf(nextTokenId)).to.equal(
          _otherAccount.address,
        );
      });

      it("Should assign role to the token", async function () {
        const nextTokenId = await _collection.nextTokenId();
        await mint({
          to: _otherAccount.address,
          addresses: evmAddresses(generateRandomAddress()),
        });
        expect(
          await _collection.attributeOfByKey(nextTokenId, "role"),
        ).to.equal(DEFAULT_ROLE);
      });

      it("Should assign token id to name", async function () {
        const nextTokenId = await _collection.nextTokenId();
        await mint({
          to: _otherAccount.address,
          addresses: evmAddresses(generateRandomAddress()),
        });
        expect(await _collection.nameToTokenId(DEFAULT_NAME)).to.be.equal(
          nextTokenId,
        );
      });

      it("Should assign token id to evm address", async function () {
        const wallet = generateRandomAddress();
        const nextTokenId = await _collection.nextTokenId();
        await mint({
          to: _otherAccount.address,
          addresses: evmAddresses(wallet),
        });
        expect(await _collection.addressToTokenId("evm", wallet)).to.be.equal(
          nextTokenId,
        );
      });

      it("Should emit 'Minted' event", async function () {
        const nextTokenId = await _collection.nextTokenId();
        await expect(
          mint({
            to: _otherAccount.address,
            addresses: evmAddresses(generateRandomAddress()),
          }),
        )
          .to.emit(_collection, "Minted")
          .withArgs(_otherAccount.address, nextTokenId);
      });
    });
  });
});
