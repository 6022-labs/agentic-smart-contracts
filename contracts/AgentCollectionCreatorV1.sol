// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import {Clones} from "@openzeppelin/contracts/proxy/Clones.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";

import {IAgentCollectionV1Initialize} from "./interfaces/IAgentCollectionV1/IAgentCollectionV1Initialize.sol";
import {IAgentCollectionCreatorV1} from "./interfaces/IAgentCollectionCreatorV1/IAgentCollectionCreatorV1.sol";
import {IAgentCollectionsManagerCollectionCreatorActions} from "./interfaces/IAgentCollectionsManager/IAgentCollectionsManagerCollectionCreatorActions.sol";

/// @title Factory for Agentic AI agent collections
/// @dev Allows creation of new agent collections if the caller holds enough tokens.
contract AgentCollectionCreatorV1 is
    AccessControl,
    IAgentCollectionCreatorV1
{
    address public immutable collectionImplementation;

    address[] public authorizedTokensForCreation;
    mapping(address => bool) public isAuthorizedTokenForCreation;
    mapping(address => uint256) public minimumTokenBalanceForCreation;

    address public collectionsManager;
    address public defaultCollectionsDescriptor;

    /// @dev Deploy the creator contract.
    /// @param initialCollectionsManager Address of the collections manager.
    /// @param initialDefaultCollectionsDescriptor Default descriptor for new collections.
    constructor(
        address initialCollectionsManager,
        address initialDefaultCollectionsDescriptor,
        address initialCollectionImplementation
    ) {
        collectionsManager = initialCollectionsManager;
        defaultCollectionsDescriptor = initialDefaultCollectionsDescriptor;

        collectionImplementation = initialCollectionImplementation;

        _grantRole(
            DEFAULT_ADMIN_ROLE,
            msg.sender
        );
    }

    modifier onlyAuthorizedTokenForCreation(address token) {
        if (!isAuthorizedTokenForCreation[token]) {
            revert TokenNotAuthorized(token);
        }
        _;
    }

    modifier onlyNotAuthorizedTokenForCreation(address token) {
        if (isAuthorizedTokenForCreation[token]) {
            revert TokenAlreadyAuthorized(token);
        }
        _;
    }

    /// @dev Check if the account can create a collection based on its token balances.
    /// @param account Address of the account to check.
    /// @return True if the account can create a collection, false otherwise.
    function canCreateCollection(address account) public view returns (bool) {
        bool hasMinimumBalanceInOneOfAuthorizedTokens = false;

        for (uint256 i = 0; i < authorizedTokensForCreation.length; i++) {
            address token = authorizedTokensForCreation[i];
            uint256 requiredBalance = minimumTokenBalanceForCreation[token];

            if (IERC20(token).balanceOf(account) >= requiredBalance) {
                hasMinimumBalanceInOneOfAuthorizedTokens = true;
                break;
            }
        }

        return hasMinimumBalanceInOneOfAuthorizedTokens;
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

    /// @dev Add a new token that can be used to create collections.
    /// @param token Address of the token to authorize.
    /// @param minimumBalance Minimum balance required to create a collection with this token.
    function addAuthorizedTokenForCreation(
        address token,
        uint256 minimumBalance
    ) external onlyRole(DEFAULT_ADMIN_ROLE) onlyNotAuthorizedTokenForCreation(token) {
        authorizedTokensForCreation.push(token);
        isAuthorizedTokenForCreation[token] = true;

        minimumTokenBalanceForCreation[token] = minimumBalance;

        emit AuthorizedTokenAdded(token);
        emit MinimumTokenBalanceForCreationUpdated(
            token,
            0,
            minimumBalance
        );
    }

    /// @dev Remove a token that can be used to create collections.
    /// @param token Address of the token to remove.
    function removeAuthorizedTokenForCreation(
        address token
    ) external onlyRole(DEFAULT_ADMIN_ROLE) onlyAuthorizedTokenForCreation(token) {
        uint256 index;
        for (uint256 i = 0; i < authorizedTokensForCreation.length; i++) {
            if (authorizedTokensForCreation[i] == token) {
                index = i;
                break;
            }
        }
        if (index < authorizedTokensForCreation.length) {
            authorizedTokensForCreation[index] = authorizedTokensForCreation[authorizedTokensForCreation.length - 1];
            authorizedTokensForCreation.pop();
        }

        delete isAuthorizedTokenForCreation[token];
        delete minimumTokenBalanceForCreation[token];

        emit AuthorizedTokenRemoved(token);
    }

    /// @dev Update the minimum token balance required to create a collection with a specific token.
    /// @param token Address of the token for which to update the minimum balance.
    /// @param newMinimum New minimum balance required to create a collection with this token.
    function updateMinimumTokenBalanceForCreation(
        address token,
        uint256 newMinimum
    ) external onlyRole(DEFAULT_ADMIN_ROLE) onlyAuthorizedTokenForCreation(token) {
        uint256 oldMinimum = minimumTokenBalanceForCreation[token];
        minimumTokenBalanceForCreation[token] = newMinimum;

        emit MinimumTokenBalanceForCreationUpdated(
            token,
            oldMinimum,
            newMinimum
        );
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
        if (!canCreateCollection(msg.sender)) {
            revert InsufficientBalanceInAuthorizedTokens();
        }

        address newCollection = Clones.clone(collectionImplementation);

        IAgentCollectionV1Initialize(newCollection).initialize(
            name,
            symbol,
            description,
            admin,
            moderator,
            collectionsManager,
            defaultCollectionsDescriptor
        );

        address newCollectionAddress = address(newCollection);

        IAgentCollectionsManagerCollectionCreatorActions(collectionsManager).addCollection(newCollectionAddress);

        return newCollectionAddress;
    }
}
