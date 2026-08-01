// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

/// @dev Reverse lookup from an ENS subnode back to the agent NFT it stands
///      for. Populated when the subnode is provisioned and used by the
///      registry to resolve derived text records (e.g. `avatar`) directly
///      from the agent's on-chain information.
struct AgentRef {
    address collection;
    uint256 tokenId;
}
