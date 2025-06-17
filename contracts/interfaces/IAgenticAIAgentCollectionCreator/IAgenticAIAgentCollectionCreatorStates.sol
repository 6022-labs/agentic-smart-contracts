// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import {IAgenticAIAgentCollectionCreatorEvents} from "./IAgenticAIAgentCollectionCreatorEvents.sol";

interface IAgenticAIAgentCollectionCreatorStates {
    /**
     * @dev function to get the default collections descriptor.
     */
    function defaultCollectionsDescriptor() external view returns (address);

    /**
     * @dev function to get the token required to create a collection.
     */
    function requiredToken() external view returns (address);

    /**
     * @dev function to get the minimum token balance required to create a collection.
     */
    function minimumTokenBalance() external view returns (uint256);
}
