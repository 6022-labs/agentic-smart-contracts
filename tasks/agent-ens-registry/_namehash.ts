import { ethers } from "ethers";

/// Computes the agent's ENS node as
/// `<agentName>.<collectionName>.<chainId>.<parentDomain>`, matching
/// `AgentEnsRegistry._resolveAgentNode` (see contracts/AgentEnsRegistry.sol).
export function agentNamehash(params: {
  parentDomain: string;
  chainId: string | number | bigint;
  collectionName: string;
  agentName: string;
}): string {
  const parentNode = ethers.namehash(params.parentDomain);
  const chainHash = ethers.keccak256(
    ethers.toUtf8Bytes(params.chainId.toString())
  );
  const chainNode = ethers.keccak256(
    ethers.solidityPacked(["bytes32", "bytes32"], [parentNode, chainHash])
  );
  const collectionHash = ethers.keccak256(
    ethers.toUtf8Bytes(params.collectionName)
  );
  const collectionNode = ethers.keccak256(
    ethers.solidityPacked(["bytes32", "bytes32"], [chainNode, collectionHash])
  );
  const agentHash = ethers.keccak256(ethers.toUtf8Bytes(params.agentName));
  return ethers.keccak256(
    ethers.solidityPacked(["bytes32", "bytes32"], [collectionNode, agentHash])
  );
}

/// Resolves a `--node` arg from either the raw bytes32 form or the
/// `--agent-name / --collection-name / --chain-id / --parent-domain` quartet.
/// Exactly one of the two forms must be provided.
export function resolveNodeArg(taskArgs: {
  node?: string;
  agentName?: string;
  collectionName?: string;
  chainId?: string;
  parentDomain?: string;
}): string {
  const hasRaw = !!taskArgs.node;
  const hasLabels =
    !!taskArgs.agentName && !!taskArgs.collectionName && !!taskArgs.chainId;

  if (hasRaw && hasLabels) {
    throw new Error(
      "Pass either --node OR the label set (--agent-name + --collection-name + --chain-id), not both"
    );
  }
  if (!hasRaw && !hasLabels) {
    throw new Error(
      "Missing node. Pass --node 0x... OR --agent-name x --collection-name y --chain-id 137"
    );
  }

  if (hasRaw) {
    return taskArgs.node!;
  }

  return agentNamehash({
    parentDomain: taskArgs.parentDomain ?? "6022.eth",
    chainId: taskArgs.chainId!,
    collectionName: taskArgs.collectionName!,
    agentName: taskArgs.agentName!,
  });
}
