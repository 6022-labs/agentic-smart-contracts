// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

interface IAgentCollectionV1Errors {
    /// @dev Error when the name is already in use.
    /// @param name The name that is already in use.
    /// @param tokenId The token ID associated with the name.
    error UsedName(string name, uint256 tokenId);

    /// @dev Error when the wallet is already in use.
    /// @param wallet The wallet that is already in use.
    /// @param tokenId The token ID associated with the wallet.
    error UsedWallet(address wallet, uint256 tokenId);

    /// @dev Error when the wallet address is invalid (e.g., zero address).
    error InvalidWallet();

    /// @dev Error when the name is invalid.
    /// @param name The name that is not valid.
    error InvalidName(string name);

    /// @dev Error when the collection name is not a valid ENS label.
    /// @param name The collection name that is not valid.
    error InvalidCollectionName(string name);

    /// @dev Error when the cloneOf is invalid.
    /// @param cloneOf The cloneOf that is not valid.
    error InvalidCloneOf(uint256 cloneOf);

    /// @dev Error when no image with key `default` is present.
    error MissingDefaultImage();

    /// @dev Error when the sender is not the owner of the token.
    /// @param sender The address that attempted the action.
    /// @param tokenId The ID of the token that was attempted to be accessed.
    error OwnableUnauthorizedAccount(address sender, uint256 tokenId);

    /// @dev Error when no moderators are set but the action requires moderators.
    error NoModerators();

    /// @dev Error when the caller is not a moderator but moderators are set.
    /// @param sender The address that attempted the action.
    error NotModerator(address sender);
}
