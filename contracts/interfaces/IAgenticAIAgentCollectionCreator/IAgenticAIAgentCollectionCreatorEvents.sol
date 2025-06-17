// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

interface IAgenticAIAgentCollectionCreatorEvents {
    /**
     * @dev Emitted when the collections descriptor is updated.
     * @param oldDescriptor The address of the old collections descriptor.
     * @param newDescriptor The address of the new collections descriptor.
     */
    event DefaultCollectionsDescriptorUpdated(address oldDescriptor, address newDescriptor);

    /**
     * @dev Emitted when the minimum token balance is updated.
     * @param oldMinimum The previous minimum required token balance.
     * @param newMinimum The new minimum required token balance.
     */
    event MinimumTokenBalanceUpdated(uint256 oldMinimum, uint256 newMinimum);
}
