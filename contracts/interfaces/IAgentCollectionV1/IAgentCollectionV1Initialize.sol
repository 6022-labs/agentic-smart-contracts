// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

interface IAgentCollectionV1Initialize
{
    /// @dev Initialize a new agent collection.
    /// @param name ERC721 name of the collection.
    /// @param symbol ERC721 symbol of the collection.
    /// @param admin Address granted the default admin role.
    /// @param moderator Address granted the moderator role.
    /// @param initialCollectionsDescriptor Address of the descriptor contract.
    function initialize(
        string memory name,
        string memory symbol,
        string memory initialDescription,
        address admin,
        address moderator,
        address initialCollectionsDescriptor
    ) external;
}
