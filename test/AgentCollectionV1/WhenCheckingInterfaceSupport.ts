import { expect } from "chai";
import { ethers } from "hardhat";
import { AgentCollectionV1 } from "../../typechain-types";
import { loadFixture, reset } from "@nomicfoundation/hardhat-network-helpers";
import { deployCollectionWithCreator } from "../common";

describe("WhenCheckingInterfaceSupport", function () {
  const ipfsGateway = "https://ipfs.io/ipfs/";

  // ERC165 interface ids.
  const ERC721_ID = "0x80ac58cd";
  const ACCESS_CONTROL_ID = "0x7965db0b";
  const INVALID_ID = "0xffffffff";

  let _collection: AgentCollectionV1;

  async function deployAgentCollection() {
    await reset();

    const [owner] = await ethers.getSigners();

    const { collection } = await deployCollectionWithCreator({
      owner,
      moderator: owner,
      ipfsGateway,
    });

    return { collection };
  }

  beforeEach(async function () {
    const { collection } = await loadFixture(deployAgentCollection);
    _collection = collection;
  });

  it("Should support the ERC721 interface", async function () {
    expect(await _collection.supportsInterface(ERC721_ID)).to.equal(true);
  });

  it("Should support the AccessControl interface", async function () {
    expect(await _collection.supportsInterface(ACCESS_CONTROL_ID)).to.equal(
      true,
    );
  });

  it("Should not support an unknown interface", async function () {
    expect(await _collection.supportsInterface(INVALID_ID)).to.equal(false);
  });
});
