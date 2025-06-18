// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import {IAgenticAIAgentCollectionCreatorEvents} from "./IAgenticAIAgentCollectionCreatorEvents.sol";

interface IAgenticAIAgentCollectionCreatorStates {
    /// @dev Get the default collections descriptor.
    function defaultCollectionsDescriptor() external view returns (address);

    /// @dev Get the token required to create a collection.
    function requiredToken() external view returns (address);

    /// @dev Get the minimum token balance required to create a collection.
    function minimumTokenBalance() external view returns (uint256);
}
