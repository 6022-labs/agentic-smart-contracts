// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

// Uncomment this line to use console.log
// import "hardhat/console.sol";

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";

interface IAgenticAIAgentCollection is IERC721 {
    /**
     * @dev Emitted when a token is minted with a signature.
     */
    event MintedWithSignature(address indexed to, uint256 tokenId);

    /**
     * @dev Emitted when a signer is added.
     */
    event SignerAdded(address signer);

    /**
     * @dev Emitted when a signer is removed.
     */
    event SignerRemoved(address signer);

    /**
     * @dev Error when the nonce has already been used.
     */
    error UsedNonce(bytes32 nonce);

    /**
     * @dev Error when the signature is invalid.
     */
    error InvalidSignature(bytes signature);

    function mintWithSignature(
        address to,
        bytes32 nonce,
        bytes memory signature
    ) external;
}
