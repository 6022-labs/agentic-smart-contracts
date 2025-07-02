// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

interface IAgentCollectionCreatorV1States {
    /// @dev Check if the account can create a collection based on its token balances.
    /// @param account Address of the account to check.
    /// @return True if the account can create a collection, false otherwise.
    function canCreateCollection(address account) external view returns (bool);

    /// @dev Get the default collections descriptor.
    /// @return Address of the default collections descriptor.
    function collectionsDescriptor() external view returns (address);

    /// @dev Get the token required to create a collection.
    /// @param index Index of the token in the authorized tokens list.
    /// @return Address of the authorized token for collection creation.
    function authorizedTokensForCreation(uint256 index) external view returns (address);

    /// @dev Get if a token is authorized for collection creation.
    /// @param token Address of the token to check.
    /// @return True if the token is authorized for collection creation, false otherwise.
    function isAuthorizedTokenForCreation(address token) external view returns (bool);

    /// @dev Get the minimum token balance required to create a collection with a specific token.
    /// @param token Address of the token to check.
    /// @return Minimum token balance required to create a collection with the specified token.
    function minimumTokenBalanceForCreation(address token) external view returns (uint256);
}
