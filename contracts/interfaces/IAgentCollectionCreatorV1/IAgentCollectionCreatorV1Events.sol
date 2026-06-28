// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

interface IAgentCollectionCreatorV1Events {
    /// @dev Emitted when the collections descriptor is updated.
    /// @param oldDescriptor The address of the old collections descriptor.
    /// @param newDescriptor The address of the new collections descriptor.
    event DefaultCollectionsDescriptorUpdated(address oldDescriptor, address newDescriptor);
}
