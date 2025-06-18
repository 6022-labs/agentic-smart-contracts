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
    address private _requiredToken;
    uint256 private _minimumTokenBalance;

    address private _collectionsManager;
    address private _defaultCollectionsDescriptor;

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
        _requiredToken = initialRequiredToken;
        _minimumTokenBalance = initialMinimumTokenBalance;

        _collectionsManager = initialCollectionsManager;
        _defaultCollectionsDescriptor = initialDefaultCollectionsDescriptor;

        _grantRole(
            DEFAULT_ADMIN_ROLE,
            msg.sender
        );
    }

    /// @dev Get the default collections descriptor.
    function defaultCollectionsDescriptor() external view returns (address) {
        return _defaultCollectionsDescriptor;
    }

    /// @dev Get the token required to create a collection.
    function requiredToken() external view returns (address) {
        return _requiredToken;
    }

    /// @dev Get the minimum token balance required to create a collection.
    function minimumTokenBalance() external view returns (uint256) {
        return _minimumTokenBalance;
    }

    /// @dev Update the default collections descriptor.
    /// @param newDescriptor The new default descriptor for the new collections.
    function updateDefaultCollectionsDescriptor(
        address newDescriptor
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        address oldDescriptor = _defaultCollectionsDescriptor;
        _defaultCollectionsDescriptor = newDescriptor;

        emit DefaultCollectionsDescriptorUpdated(oldDescriptor, newDescriptor);
    }

    /// @dev Update the minimum token balance required to create collections.
    /// @param newMinimum The new minimum amount of tokens required.
    function updateMinimumTokenBalance(
        uint256 newMinimum
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        uint256 oldMinimum = _minimumTokenBalance;
        _minimumTokenBalance = newMinimum;

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
        uint256 balance = IERC20(_requiredToken).balanceOf(msg.sender);
        if (balance < _minimumTokenBalance) {
            revert InsufficientTokenBalance(balance, _minimumTokenBalance);
        }

        AgenticAIAgentCollection newCollection = new AgenticAIAgentCollection(
            name,
            symbol,
            description,
            admin,
            moderator,
            _collectionsManager,
            _defaultCollectionsDescriptor
        );

        address newCollectionAddress = address(newCollection);

        IAgenticAIAgentCollectionsManagerCollectionCreatorActions(_collectionsManager).addCollection(newCollectionAddress);

        return newCollectionAddress;
    }
}
