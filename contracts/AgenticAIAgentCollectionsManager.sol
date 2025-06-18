// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";
import {IERC721Metadata} from "@openzeppelin/contracts/token/ERC721/extensions/IERC721Metadata.sol";

import {IAgenticAIAgentCollectionsManager} from "./interfaces/IAgenticAIAgentCollectionsManager/IAgenticAIAgentCollectionsManager.sol";

/// @title Agentic AI collections manager
/// @dev Manages collections and authorizes signers and creators.
contract AgenticAIAgentCollectionsManager is
    AccessControl,
    IAgenticAIAgentCollectionsManager
{
    bytes32 public constant SIGNER_ROLE = keccak256("SIGNER_ROLE");
    bytes32 public constant CREATOR_ROLE = keccak256("CREATOR_ROLE");

    address private _collectionCreatorAddress;

    uint256 private _nextCollectionId = 1;

    mapping(uint256 => address) private _collections;
    mapping(string => uint256) private _collectionIdByName;
    mapping(string => uint256) private _collectionIdBySymbol;

    /// @dev Deploy the manager and set the deployer as admin.
    constructor() {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }

    /// @dev Get a collection address by its identifier.
    /// @param collectionId The id of the collection.
    function collection(uint256 collectionId) external view returns (address) {
        return _collections[collectionId];
    }

    /// @dev Check if an address has the signer role.
    /// @param signer The address to check.
    function isSigner(address signer) external view returns (bool) {
        return hasRole(SIGNER_ROLE, signer);
    }

    /// @dev Add a new collection.
    /// @param newCollection The new collection to add.
    function addCollection(
        address newCollection
    ) external onlyRole(CREATOR_ROLE) {
        string memory name = IERC721Metadata(newCollection).name();
        string memory symbol = IERC721Metadata(newCollection).symbol();

        if (_collectionIdByName[name] != 0) {
            revert CollectionNameAlreadyExists(name);
        }
        if (_collectionIdBySymbol[symbol] != 0) {
            revert CollectionSymbolAlreadyExists(symbol);
        }

        _collections[_nextCollectionId] = address(newCollection);
        _collectionIdByName[name] = _nextCollectionId;
        _collectionIdBySymbol[symbol] = _nextCollectionId;

        emit CollectionCreated(
            _nextCollectionId,
            address(newCollection),
            name,
            symbol
        );

        _nextCollectionId++;
    }
}