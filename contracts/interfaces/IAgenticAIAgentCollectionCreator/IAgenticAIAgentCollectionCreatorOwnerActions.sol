// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

interface IAgenticAIAgentCollectionCreatorOwnerActions {
    /**
     * @dev function to update the default collections descriptor.
     * @param newDescriptor The new default descriptor for the new collections.
     */
    function updateDefaultCollectionsDescriptor(address newDescriptor) external;
}
