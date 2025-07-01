// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";
import {IERC721Metadata} from "@openzeppelin/contracts/token/ERC721/extensions/IERC721Metadata.sol";

import {IAgentCollectionStates} from "./interfaces/IAgentCollection/IAgentCollectionStates.sol";
import {IAgentCollectionsManager} from "./interfaces/IAgentCollectionsManager/IAgentCollectionsManager.sol";

/// @title Agentic AI collections manager
/// @dev Manages collections and authorizes signers and creators.
contract AgentCollectionsManager is
    AccessControl,
    IAgentCollectionsManager
{
    bytes32 public constant SIGNER_ROLE = keccak256("SIGNER_ROLE");
    bytes32 public constant CREATOR_ROLE = keccak256("CREATOR_ROLE");

    uint256 public nextCollectionId = 1;

    mapping(uint256 => address) public collections;
    mapping(string => uint256) public collectionIdByName;
    mapping(string => uint256) public collectionIdBySymbol;

    /// @dev Deploy the manager and set the deployer as admin.
    constructor() {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }

    /// @dev Check if an address has the signer role.
    /// @param signer The address to check.
    function isSigner(address signer) external view returns (bool) {
        return hasRole(SIGNER_ROLE, signer);
    }

    function moderatorOf(address account) external view returns (address[] memory) {
        uint256 numberOfModeratorCollections = 0;

        // Count the number of collections where the account is a moderator
        for (uint256 collectionIndex = 1; collectionIndex < nextCollectionId; collectionIndex++) {
            IAgentCollectionStates collection = IAgentCollectionStates(collections[collectionIndex]);
            if (collection.isModerator(account)) {
                numberOfModeratorCollections++;
            }
        }

        // Fill the array with the addresses of the collections where the account is a moderator
        address[] memory moderatorCollections = new address[](numberOfModeratorCollections);
        uint256 insertIndex = 0;
        for (uint256 collectionIndex = 1; collectionIndex < nextCollectionId; collectionIndex++) {
            address collection = collections[collectionIndex];
            if (IAgentCollectionStates(collection).isModerator(account)) {
                moderatorCollections[insertIndex] = collection;
                insertIndex++;
            }
        }

        return moderatorCollections;
    }

    /// @dev Add a new collection.
    /// @param newCollection The new collection to add.
    function addCollection(
        address newCollection
    ) external onlyRole(CREATOR_ROLE) {
        string memory name = IERC721Metadata(newCollection).name();
        string memory symbol = IERC721Metadata(newCollection).symbol();

        if (collectionIdByName[name] != 0) {
            revert CollectionNameAlreadyExists(name);
        }
        if (collectionIdBySymbol[symbol] != 0) {
            revert CollectionSymbolAlreadyExists(symbol);
        }

        collections[nextCollectionId] = address(newCollection);
        collectionIdByName[name] = nextCollectionId;
        collectionIdBySymbol[symbol] = nextCollectionId;

        emit CollectionCreated(
            nextCollectionId,
            address(newCollection),
            name,
            symbol
        );

        nextCollectionId++;
    }
}