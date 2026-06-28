// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

interface IAgentCollectionCreatorV1States {
    /// @dev Get the default collections descriptor.
    /// @return Address of the default collections descriptor.
    function collectionsDescriptor() external view returns (address);
}
