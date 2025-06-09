// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

interface IAgenticAIAgentCollectionsManagerEvents {
    /**
     * @dev Emitted when a new collection is created.
     */
    event CollectionCreated(
        uint256 indexed collectionId,
        address collectionAddress,
        string name,
        string symbol
    );

    /**
     * @dev Emitted when a signer is added.
     */
    event SignerAdded(address signer);

    /**
     * @dev Emitted when a signer is removed.
     */
    event SignerRemoved(address signer);
}
