import { expect } from "chai";
import { ethers } from "hardhat";
import { AgenticAIAgentCollection } from "../../typechain-types";
import { loadFixture, reset } from "@nomicfoundation/hardhat-network-helpers";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import {
  generateRandomAddress,
  signCreateMintProposalRequest,
} from "../common";

describe("WhenRemovingImage", function () {
  const ipfsGateway = "https://ipfs.io/ipfs/";
});
