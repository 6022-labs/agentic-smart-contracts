// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

interface IAgentCollectionCreatorV1Errors {
    /// @dev Error when an address parameter is the zero address.
    /// @param parameter The name of the offending parameter.
    error ZeroAddress(string parameter);
}
