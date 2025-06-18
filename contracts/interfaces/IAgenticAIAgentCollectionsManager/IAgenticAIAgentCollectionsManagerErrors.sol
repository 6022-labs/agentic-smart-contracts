// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

interface IAgenticAIAgentCollectionsManagerErrors {
    /// @dev Error when the collection name already exists.
    error CollectionNameAlreadyExists(string name);

    /// @dev Error when the collection symbol already exists.
    error CollectionSymbolAlreadyExists(string symbol);
}
