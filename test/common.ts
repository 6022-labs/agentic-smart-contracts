import { ethers } from "hardhat";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { AgenticAIAgentCollection } from "../typechain-types";

export function generateRandomAddress(): string {
  return ethers.Wallet.createRandom().address;
}

export async function signCreateMintProposalRequest(
  signer: HardhatEthersSigner,
  agenticAIAgentCollection: AgenticAIAgentCollection,
  params: {
    to: string;
    agentAddresses: string[];
    signer: string;
    role: string;
    name: string;
    images: { key: string; value: string }[];
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
    CreateMintProposalRequest: [
      { name: "to", type: "address" },
      { name: "agentAddressesHash", type: "bytes32" },
      { name: "signer", type: "address" },
      { name: "roleHash", type: "bytes32" },
      { name: "nameHash", type: "bytes32" },
      { name: "imagesHash", type: "bytes32" },
      { name: "missionHash", type: "bytes32" },
      { name: "nonce", type: "bytes32" },
    ],
  };

  const agentAddressesHash = ethers.keccak256(
    ethers.solidityPacked(["address[]"], [params.agentAddresses])
  );
  const roleHash = ethers.keccak256(ethers.toUtf8Bytes(params.role));
  const nameHash = ethers.keccak256(ethers.toUtf8Bytes(params.name));
  // Hash the images array as in Solidity: keccak256(abi.encodePacked(keccak256(abi.encodePacked(key, value)), ...))
  const imageHashes = params.images.map((img) =>
    ethers.keccak256(
      ethers.solidityPacked(["string", "string"], [img.key, img.value])
    )
  );
  const imagesPacked = ethers.solidityPacked(["bytes32[]"], [imageHashes]);
  const imagesHash = ethers.keccak256(imagesPacked);
  const missionHash = ethers.keccak256(ethers.toUtf8Bytes(params.mission));

  const message = {
    to: params.to,
    agentAddressesHash,
    signer: params.signer,
    roleHash,
    nameHash,
    imagesHash,
    missionHash,
    nonce: ethers.keccak256(ethers.toUtf8Bytes(params.nonce)),
  };

  return await signer.signTypedData(domain, types, message);
}
