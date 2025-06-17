// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import {IAgenticAIAgentCollectionCreatorEvents} from "./IAgenticAIAgentCollectionCreatorEvents.sol";

interface IAgenticAIAgentCollectionCreatorActions {
    /**
     * @dev function to create a new collection.
     * @param name The name of the collection.
     * @param symbol The symbol of the collection.
     * @param admin The address of the admin for the collection.
     * @param moderator The address of the moderator for the collection.
     * @return collectionAddress The address of the newly created collection.
     */
    function createCollection(
        string memory name,
        string memory symbol,
        address admin,
        address moderator
    ) external returns (address collectionAddress);
}
