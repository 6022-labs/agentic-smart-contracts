import { ethers } from "hardhat";
import { HDNodeWallet } from "ethers";
import { reset } from "@nomicfoundation/hardhat-network-helpers";

export const GATEWAY_URLS = [
  "https://ens-gateway.example/{sender}/{data}.json",
];

export async function deploySimpleAgentEnsOffchainResolver() {
  await reset();

  const [admin, outsider] = await ethers.getSigners();
  const signer = ethers.Wallet.createRandom();

  const Resolver = await ethers.getContractFactory("AgentEnsOffchainResolver");
  const resolver = await Resolver.deploy(GATEWAY_URLS, signer.address);

  return { admin, outsider, signer, resolver };
}

// Builds a gateway-style signed response — abi.encode(result, expires, sig) —
// signed over keccak256(0x1900 || target || expires || keccak256(request) || keccak256(result)),
// matching contracts/libraries/SignatureVerifier.sol.
export function buildSignedResponse(
  signer: HDNodeWallet,
  resolverAddress: string,
  request: string,
  result: string,
  expires: bigint
): string {
  const hash = ethers.solidityPackedKeccak256(
    ["bytes2", "address", "uint64", "bytes32", "bytes32"],
    [
      "0x1900",
      resolverAddress,
      expires,
      ethers.keccak256(request),
      ethers.keccak256(result),
    ]
  );
  const sig = signer.signingKey.sign(hash).serialized;
  return ethers.AbiCoder.defaultAbiCoder().encode(
    ["bytes", "uint64", "bytes"],
    [result, expires, sig]
  );
}

export async function latestTimestamp(): Promise<bigint> {
  const block = await ethers.provider.getBlock("latest");
  return BigInt(block!.timestamp);
}
