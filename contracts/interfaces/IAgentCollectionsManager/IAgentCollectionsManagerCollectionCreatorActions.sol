// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

interface IAgentCollectionsManagerCollectionCreatorActions {
    /// @dev Add a new collection.
    /// @param newCollection The new collection to add.
    function addCollection(
        address newCollection
    ) external;
}
