// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

interface IAgentCollectionCreatorV1States {
    /// @dev Get the default collections descriptor.
    function defaultCollectionsDescriptor() external view returns (address);

    /// @dev Get the token required to create a collection.
    function authorizedTokensForCreation(uint256 index) external view returns (address);

    /// @dev Get if a token is authorized for collection creation.
    function isAuthorizedTokenForCreation(address token) external view returns (bool);

    /// @dev Get the minimum token balance required to create a collection with a specific token.
    function minimumTokenBalanceForCreation(address token) external view returns (uint256);
}
