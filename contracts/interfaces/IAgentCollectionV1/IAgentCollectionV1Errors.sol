// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

interface IAgentCollectionV1Errors {
    /// @dev Error when the nonce has already been used.
    /// @param nonce The nonce that was used.
    error UsedNonce(bytes32 nonce);

    /// @dev Error when the name is already in use.
    /// @param name The name that was used.
    error UsedName(string name);

    /// @dev Error when the signer is invalid.
    /// @param signer The actual signer address.
    /// @param expectedSigner The expected signer address.
    error InvalidSigner(address signer, address expectedSigner);

    /// @dev Error when the name is invalid.
    /// @param name The name that is not valid.
    error InvalidName(string name);

    /// @dev Error when the address is not a signer.
    /// @param signer The address that is not a signer.
    error NotSigner(address signer);

    /// @dev Error when the signer is the same as the current signer.
    /// @param signer The address that is unchanged.
    error SignerUnchanged(address signer);

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
