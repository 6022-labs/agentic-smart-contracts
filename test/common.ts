import { ethers } from "hardhat";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { AgenticAIAgentCollection } from "../typechain-types";

export function generateRandomAddress(): string {
  return ethers.Wallet.createRandom().address;
}

export async function signMintProposalRequest(
  signer: HardhatEthersSigner,
  agenticAIAgentCollection: AgenticAIAgentCollection,
  params: {
    to: string;
    agentAddresses: string[];
    signer: string;
    role: string;
    name: string;
    image: string;
    mission: string;
    nonce: string;
  }
) {
  if (!agenticAIAgentCollection) {
    throw new Error("AgenticAIAgentCollection instance not set");
  }

  const domain = {
    name: "AgenticAIAgentCollection",
    version: "1",
    chainId: (await ethers.provider.getNetwork()).chainId,
    verifyingContract: await agenticAIAgentCollection.getAddress(),
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
    ethers.solidityPacked(["address[]"], [params.agentAddresses])
  );
  const roleHash = ethers.keccak256(ethers.toUtf8Bytes(params.role));
  const nameHash = ethers.keccak256(ethers.toUtf8Bytes(params.name));
  const imageHash = ethers.keccak256(ethers.toUtf8Bytes(params.image));
  const missionHash = ethers.keccak256(ethers.toUtf8Bytes(params.mission));

  const message = {
    to: params.to,
    agentAddressesHash,
    signer: params.signer,
    roleHash,
    nameHash,
    imageHash,
    missionHash,
    nonce: ethers.keccak256(ethers.toUtf8Bytes(params.nonce)),
  };

  return await signer.signTypedData(domain, types, message);
}
