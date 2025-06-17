// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import {IAgenticAIAgentCollectionCreatorEvents} from "./IAgenticAIAgentCollectionCreatorEvents.sol";

interface IAgenticAIAgentCollectionCreatorStates {
    /**
     * @dev function to get the default collections descriptor.
     */
    function defaultCollectionsDescriptor() external view returns (address);
}
