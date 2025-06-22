// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

interface IAgenticAIAgentCollectionCreatorOwnerActions {
    /// @dev Update the default collections descriptor.
    /// @param newDescriptor The new default descriptor for the new collections.
    function updateDefaultCollectionsDescriptor(address newDescriptor) external;

    /// @dev Add a new token that can be used to create collections.
    /// @param token Address of the token to authorize.
    /// @param minimumBalance Minimum balance required to create a collection with this token.
    function addAuthorizedTokenForCreation(address token, uint256 minimumBalance) external;

    /// @dev Remove a token that can be used to create collections.
    /// @param token Address of the token to remove.
    function removeAuthorizedTokenForCreation(address token) external;

    /// @dev Update the minimum token balance required to create a collection with a specific token.
    /// @param token Address of the token for which to update the minimum balance.
    /// @param newMinimum New minimum balance required to create a collection with this token.
    function updateMinimumTokenBalanceForCreation(address token, uint256 newMinimum) external;
}
