// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";

import {AgenticAIAgentCollection} from "./AgenticAIAgentCollection.sol";
import {IAgenticAIAgentCollectionCreator} from "./interfaces/IAgenticAIAgentCollectionCreator.sol";
import {IAgenticAIAgentCollectionsManagerCollectionCreatorActions} from "./interfaces/IAgenticAIAgentCollectionsManager/IAgenticAIAgentCollectionsManagerCollectionCreatorActions.sol";

contract AgenticAIAgentCollectionCreator is
    AccessControl,
    IAgenticAIAgentCollectionCreator
{
    address private _collectionsManager;
    address private _collectionsDescriptor;

    constructor(
        address initialCollectionsManager,
        address initialCollectionsDescriptor
    ) {
        _collectionsManager = initialCollectionsManager;
        _collectionsDescriptor = initialCollectionsDescriptor;

        _grantRole(
            DEFAULT_ADMIN_ROLE,
            msg.sender
        );
    }

    function collectionsDescriptor() external view returns (address) {
        return _collectionsDescriptor;
    }

    function updateCollectionsDescriptor(
        address newDescriptor
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        _collectionsDescriptor = newDescriptor;
    }

    function createCollection(
        string memory name,
        string memory symbol,
        address moderator
    ) external override returns (address collectionAddress) {
        AgenticAIAgentCollection newCollection = new AgenticAIAgentCollection(
            name,
            symbol,
            moderator,
            _collectionsManager,
            _collectionsDescriptor
        );

        address newCollectionAddress = address(newCollection);

        IAgenticAIAgentCollectionsManagerCollectionCreatorActions(_collectionsManager).addCollection(newCollectionAddress);

        return newCollectionAddress;
    }
}
