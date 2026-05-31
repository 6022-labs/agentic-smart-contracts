// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

interface IAgentCollectionsManagerStates {
    /// @dev Get a collection address by its identifier.
    /// @param collectionId The id of the collection.
    function collections(uint256 collectionId) external view returns (address);

    /// @dev Get a collection id by its name.
    /// @param name The name of the collection.
    function collectionIdByName(string memory name) external view returns (uint256);

    /// @dev Get a collection id by its symbol.
    /// @param symbol The symbol of the collection.
    function collectionIdBySymbol(string memory symbol) external view returns (uint256);

    /// @dev Whether a collection address was registered through this manager.
    /// @param collection The collection address to check.
    function isKnownCollection(address collection) external view returns (bool);
}
