// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";
import {IERC721Metadata} from "@openzeppelin/contracts/token/ERC721/extensions/IERC721Metadata.sol";

import {IAgentCollectionStates} from "./interfaces/IAgentCollection/IAgentCollectionStates.sol";
import {IAgentCollectionsManager} from "./interfaces/IAgentCollectionsManager/IAgentCollectionsManager.sol";
import {AgentCollectionInfo} from "./types/AgentCollectionInfo.sol";

/// @title Agentic AI collections manager
/// @dev Manages collections and authorizes creators.
contract AgentCollectionsManager is
    AccessControl,
    IAgentCollectionsManager
{
    bytes32 public constant CREATOR_ROLE = keccak256("CREATOR_ROLE");

    uint256 public nextCollectionId = 1;

    mapping(uint256 => address) public collections;
    mapping(string => uint256) public collectionIdByName;
    mapping(string => uint256) public collectionIdBySymbol;
    mapping(address => bool) public isKnownCollection;

    /// @dev Deploy the manager and set the deployer as admin.
    constructor() {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
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

    /// @dev Paginated collection listing for the operator UI. Pass offset 0 to
    /// start; `next` is the id to resume from, or 0 when exhausted.
    function listCollections(
        uint256 offset,
        uint256 limit
    ) external view returns (AgentCollectionInfo[] memory infos, uint256 next) {
        uint256 start = offset < 1 ? 1 : offset;
        uint256 end = start + limit;
        if (end > nextCollectionId) {
            end = nextCollectionId;
        }
        uint256 count = end > start ? end - start : 0;

        infos = new AgentCollectionInfo[](count);
        for (uint256 i = 0; i < count; i++) {
            address collection = collections[start + i];
            IAgentCollectionStates state = IAgentCollectionStates(collection);
            infos[i] = AgentCollectionInfo({
                collectionAddress: collection,
                name: IERC721Metadata(collection).name(),
                description: state.description(),
                moderatorCount: state.moderatorCount(),
                nextTokenId: state.nextTokenId()
            });
        }
        next = end < nextCollectionId ? end : 0;
    }

    /// @dev Paginated search for the agent a typed address belongs to. Returns
    /// the first match in [offset, offset+limit) or zeros; `next` resumes the scan.
    function findAgentByAddress(
        string memory addressType,
        string memory value,
        uint256 offset,
        uint256 limit
    ) external view returns (address collection, uint256 tokenId, string memory name, uint256 next) {
        uint256 start = offset < 1 ? 1 : offset;
        uint256 end = start + limit;
        if (end > nextCollectionId) {
            end = nextCollectionId;
        }

        for (uint256 id = start; id < end; id++) {
            address current = collections[id];
            uint256 foundTokenId = IAgentCollectionStates(current).addressToTokenId(addressType, value);
            if (foundTokenId != 0) {
                return (current, foundTokenId, IAgentCollectionStates(current).nameOf(foundTokenId), 0);
            }
        }

        next = end < nextCollectionId ? end : 0;
        return (address(0), 0, "", next);
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
        isKnownCollection[address(newCollection)] = true;

        emit CollectionCreated(
            nextCollectionId,
            address(newCollection),
            name,
            symbol
        );

        nextCollectionId++;
    }
}