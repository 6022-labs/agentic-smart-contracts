// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

interface IAgenticAIAgentCollectionCreator {
    /**
     * @dev function to get the collections descriptor.
     */
    function collectionsDescriptor() external view returns (address);

    /**
     * @dev function to update the collections descriptor.
     * @param newDescriptor The new descriptor for the collections.
     */
    function updateCollectionsDescriptor(address newDescriptor) external;

    function createCollection(
        string memory name,
        string memory symbol,
        address admin,
        address moderator
    ) external returns (address collectionAddress);
}
