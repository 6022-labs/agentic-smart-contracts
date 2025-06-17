// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

interface IAgenticAIAgentCollectionCreatorErrors {
    /**
     * @dev Error thrown when the caller does not hold enough tokens to create a collection.
     * @param balance The current balance of tokens held by the caller.
     * @param required The minimum number of tokens required.
     */
    error InsufficientTokenBalance(uint256 balance, uint256 required);
}
