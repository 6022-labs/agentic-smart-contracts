// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

interface IAgentCollectionCreatorV1OwnerActions {
    /// @dev Update the default collections descriptor.
    /// @param newDescriptor The new default descriptor for the new collections.
    function updateCollectionsDescriptor(address newDescriptor) external;
}
