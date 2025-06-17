// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";

import {AgenticAIAgentCollection} from "./AgenticAIAgentCollection.sol";
import {IAgenticAIAgentCollectionCreator} from "./interfaces/IAgenticAIAgentCollectionCreator/IAgenticAIAgentCollectionCreator.sol";
import {IAgenticAIAgentCollectionsManagerCollectionCreatorActions} from "./interfaces/IAgenticAIAgentCollectionsManager/IAgenticAIAgentCollectionsManagerCollectionCreatorActions.sol";

contract AgenticAIAgentCollectionCreator is
    AccessControl,
    IAgenticAIAgentCollectionCreator
{
    address private _collectionsManager;
    address private _defaultCollectionsDescriptor;

    constructor(
        address initialCollectionsManager,
        address initialDefaultCollectionsDescriptor
    ) {
        _collectionsManager = initialCollectionsManager;
        _defaultCollectionsDescriptor = initialDefaultCollectionsDescriptor;

        _grantRole(
            DEFAULT_ADMIN_ROLE,
            msg.sender
        );
    }

    function defaultCollectionsDescriptor() external view returns (address) {
        return _defaultCollectionsDescriptor;
    }

    function updateDefaultCollectionsDescriptor(
        address newDescriptor
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        address oldDescriptor = _defaultCollectionsDescriptor;
        _defaultCollectionsDescriptor = newDescriptor;

        emit DefaultCollectionsDescriptorUpdated(oldDescriptor, newDescriptor);
    }

    function createCollection(
        string memory name,
        string memory symbol,
        address admin,
        address moderator
    ) external override returns (address collectionAddress) {
        AgenticAIAgentCollection newCollection = new AgenticAIAgentCollection(
            name,
            symbol,
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
