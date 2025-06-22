// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

interface IAgenticAIAgentCollectionCreatorErrors {
    /// @dev Error thrown when the caller does not hold enough tokens to create a collection.
    error InsufficientBalanceInAuthorizedTokens();

    /// @dev Error thrown when the token is already authorized for collection creation.
    /// @param token The address of the token that is already authorized.
    error TokenAlreadyAuthorized(address token);

    /// @dev Error thrown when the token is not authorized for collection creation.
    /// @param token The address of the token that is not authorized.
    error TokenNotAuthorized(address token);
}
