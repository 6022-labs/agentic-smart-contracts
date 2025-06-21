// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";

import {AgenticAIAgentCollection} from "./AgenticAIAgentCollection.sol";
import {IAgenticAIAgentCollectionCreator} from "./interfaces/IAgenticAIAgentCollectionCreator/IAgenticAIAgentCollectionCreator.sol";
import {IAgenticAIAgentCollectionsManagerCollectionCreatorActions} from "./interfaces/IAgenticAIAgentCollectionsManager/IAgenticAIAgentCollectionsManagerCollectionCreatorActions.sol";

/// @title Factory for Agentic AI agent collections
/// @dev Allows creation of new agent collections if the caller holds enough tokens.
contract AgenticAIAgentCollectionCreator is
    AccessControl,
    IAgenticAIAgentCollectionCreator
{
    address public requiredToken;
    uint256 public minimumTokenBalance;

    address public collectionsManager;
    address public defaultCollectionsDescriptor;

    /// @dev Deploy the creator contract.
    /// @param initialCollectionsManager Address of the collections manager.
    /// @param initialDefaultCollectionsDescriptor Default descriptor for new collections.
    /// @param initialRequiredToken ERC20 token required to create a collection.
    /// @param initialMinimumTokenBalance Minimum balance of the token required.
    constructor(
        address initialCollectionsManager,
        address initialDefaultCollectionsDescriptor,
        address initialRequiredToken,
        uint256 initialMinimumTokenBalance
    ) {
        requiredToken = initialRequiredToken;
        minimumTokenBalance = initialMinimumTokenBalance;

        collectionsManager = initialCollectionsManager;
        defaultCollectionsDescriptor = initialDefaultCollectionsDescriptor;

        _grantRole(
            DEFAULT_ADMIN_ROLE,
            msg.sender
        );
    }

    /// @dev Update the default collections descriptor.
    /// @param newDescriptor The new default descriptor for the new collections.
    function updateDefaultCollectionsDescriptor(
        address newDescriptor
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        address oldDescriptor = defaultCollectionsDescriptor;
        defaultCollectionsDescriptor = newDescriptor;

        emit DefaultCollectionsDescriptorUpdated(oldDescriptor, newDescriptor);
    }

    /// @dev Update the minimum token balance required to create collections.
    /// @param newMinimum The new minimum amount of tokens required.
    function updateMinimumTokenBalance(
        uint256 newMinimum
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        uint256 oldMinimum = minimumTokenBalance;
        minimumTokenBalance = newMinimum;

        emit MinimumTokenBalanceUpdated(oldMinimum, newMinimum);
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
        uint256 balance = IERC20(requiredToken).balanceOf(msg.sender);
        if (balance < minimumTokenBalance) {
            revert InsufficientTokenBalance(balance, minimumTokenBalance);
        }

        AgenticAIAgentCollection newCollection = new AgenticAIAgentCollection(
            name,
            symbol,
            description,
            admin,
            moderator,
            collectionsManager,
            defaultCollectionsDescriptor
        );

        address newCollectionAddress = address(newCollection);

        IAgenticAIAgentCollectionsManagerCollectionCreatorActions(collectionsManager).addCollection(newCollectionAddress);

        return newCollectionAddress;
    }
}
