// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

interface IAgentCollectionsManagerEvents {
    /// @dev Emitted when a new collection is created.
    /// @param collectionId The unique identifier of the collection.
    /// @param collectionAddress The address of the newly created collection.
    /// @param name The name of the collection.
    /// @param symbol The symbol of the collection.
    event CollectionCreated(
        uint256 indexed collectionId,
        address collectionAddress,
        string name,
        string symbol
    );
}
