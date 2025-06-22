// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

interface IAgenticAIAgentCollectionCreatorEvents {
    /// @dev Emitted when the collections descriptor is updated.
    /// @param oldDescriptor The address of the old collections descriptor.
    /// @param newDescriptor The address of the new collections descriptor.
    event DefaultCollectionsDescriptorUpdated(address oldDescriptor, address newDescriptor);

    /// @dev Emitted when a new token is authorized for collection creation.
    event AuthorizedTokenAdded(address token);

    /// @dev Emitted when a token is removed from the list of authorized tokens for collection creation.
    event AuthorizedTokenRemoved(address token);

    /// @dev Emitted when minimum token balance for collection creation is updated.
    /// @param token The address of the token for which the minimum balance was updated.
    /// @param oldMinimumBalance The old minimum balance required for collection creation.
    /// @param newMinimumBalance The new minimum balance required for collection creation.
    event MinimumTokenBalanceForCreationUpdated(address token, uint256 oldMinimumBalance, uint256 newMinimumBalance);
}
