// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import {Clones} from "@openzeppelin/contracts/proxy/Clones.sol";
import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";

import {IAgentCollectionV1Initialize} from "./interfaces/IAgentCollectionV1/IAgentCollectionV1Initialize.sol";
import {IAgentCollectionCreatorV1} from "./interfaces/IAgentCollectionCreatorV1/IAgentCollectionCreatorV1.sol";
import {IAgentCollectionsManagerCollectionCreatorActions} from "./interfaces/IAgentCollectionsManager/IAgentCollectionsManagerCollectionCreatorActions.sol";

/// @title Factory for Agentic AI agent collections
/// @dev Allows anyone to create a new agent collection.
contract AgentCollectionCreatorV1 is
    AccessControl,
    IAgentCollectionCreatorV1
{
    address public immutable collectionImplementation;

    address public collectionsManager;
    address public collectionsDescriptor;

    /// @dev Deploy the creator contract.
    /// @param initialCollectionsManager Address of the collections manager.
    /// @param initialCollectionsDescriptor Address of the descriptor for new collections.
    /// @param initialCollectionImplementation Address of the implementation for new collections.
    constructor(
        address initialCollectionsManager,
        address initialCollectionsDescriptor,
        address initialCollectionImplementation
    ) {
        collectionsManager = initialCollectionsManager;
        collectionsDescriptor = initialCollectionsDescriptor;
        collectionImplementation = initialCollectionImplementation;

        _grantRole(
            DEFAULT_ADMIN_ROLE,
            msg.sender
        );
    }

    /// @dev Update the default collections descriptor.
    /// @param newDescriptor The new default descriptor for the new collections.
    function updateCollectionsDescriptor(
        address newDescriptor
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        address oldDescriptor = collectionsDescriptor;
        collectionsDescriptor = newDescriptor;

        emit DefaultCollectionsDescriptorUpdated(oldDescriptor, newDescriptor);
    }

    /// @dev Create a new agent collection contract.
    /// @param name Name of the collection.
    /// @param symbol Symbol of the collection.
    /// @param description Description of the collection.
    /// @param admin Admin address for the collection.
    /// @param moderator Moderator address for the collection.
    /// @return collectionAddress Address of the newly created collection.
    function createCollection(
        string memory name,
        string memory symbol,
        string memory description,
        address admin,
        address moderator
    ) external override returns (address collectionAddress) {
        address newCollection = Clones.clone(collectionImplementation);

        IAgentCollectionV1Initialize(newCollection).initialize(
            name,
            symbol,
            description,
            admin,
            moderator,
            collectionsDescriptor
        );

        address newCollectionAddress = address(newCollection);

        IAgentCollectionsManagerCollectionCreatorActions(collectionsManager).addCollection(newCollectionAddress);

        return newCollectionAddress;
    }
}
