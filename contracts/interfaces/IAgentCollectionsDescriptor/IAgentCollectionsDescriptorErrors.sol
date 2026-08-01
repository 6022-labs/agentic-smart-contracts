// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

interface IAgentCollectionsDescriptorErrors {
    /// @dev Error when no image with key `default` is present.
    error MissingDefaultImage();
}
