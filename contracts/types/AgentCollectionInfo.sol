// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

/// @dev A collection plus the data the operator UI needs to pick one.
struct AgentCollectionInfo {
    string name;
    string description;
    uint256 moderatorCount;
    uint256 nextTokenId;
    address collectionAddress;
}
