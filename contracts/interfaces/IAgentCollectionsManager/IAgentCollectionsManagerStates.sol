// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import {AgentCollectionInfo} from "../../types/AgentCollectionInfo.sol";

interface IAgentCollectionsManagerStates {
    /// @dev Get a collection address by its identifier.
    /// @param collectionId The id of the collection.
    function collections(uint256 collectionId) external view returns (address);

    /// @dev Paginated collection listing. Scans ids [offset, offset+limit); pass
    /// offset 0 to start. `next` is the id to resume from, or 0 when exhausted.
    function listCollections(
        uint256 offset,
        uint256 limit
    ) external view returns (AgentCollectionInfo[] memory infos, uint256 next);

    /// @dev Paginated search for the agent a wallet controls. Scans ids
    /// [offset, offset+limit); returns the match (collection != address(0)) with
    /// its tokenId + name, else zeros. `next` resumes the scan, or 0 when exhausted.
    function findAgentByWallet(
        address wallet,
        uint256 offset,
        uint256 limit
    ) external view returns (address collection, uint256 tokenId, string memory name, uint256 next);

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
