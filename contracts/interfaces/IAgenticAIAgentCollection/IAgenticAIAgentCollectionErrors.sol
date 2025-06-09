// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

interface IAgenticAIAgentCollectionErrors {
    /**
     * @dev Error when the nonce has already been used.
     */
    error UsedNonce(bytes32 nonce);

    /**
     * @dev Error when the name is already in use.
     */
    error UsedName(string name);

    /**
     * @dev Error when the signer is invalid.
     */
    error InvalidSigner(address signer, address expectedSigner);

    /**
     * @dev Error when the name is invalid.
     */
    error InvalidName(string name);

    /**
     * @dev Error when the address is not a signer.
     */
    error NotSigner(address);

    /**
     * @dev Error when the signer is the same as the current signer.
     */
    error SignerUnchanged(address signer);

    /**
     * @dev Error when the sender is not the owner of the token.
     */
    error OwnableUnauthorizedAccount(address sender, uint256 tokenId);
}
