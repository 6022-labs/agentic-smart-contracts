// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

// Uncomment this line to use console.log
// import "hardhat/console.sol";

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";

interface IAgenticAIAgentCollection is IERC721 {
    /**
     * @dev Emitted when a token is minted with a signature.
     */
    event Minted(address indexed to, address indexed signer, uint256 tokenId);

    /**
     * @dev Emitted when a signer is added.
     */
    event SignerAdded(address signer);

    /**
     * @dev Emitted when a signer is removed.
     */
    event SignerRemoved(address signer);

    /**
     * @dev Emitted when a token signer has changed.
     */
    event TokenSignerChanged(uint256 indexed tokenId, address oldSigner, address newSigner);

    /**
     * @dev Error when the nonce has already been used.
     */
    error UsedNonce(bytes32 nonce);

    /**
     * @dev Error when the signature is invalid.
     */
    error InvalidSignature(bytes signature, address recoveredSigner);

    /**
     * @dev Error when the signer is invalid.
     */
    error InvalidSigner(address signer, address expectedSigner);

    /**
     * @dev Error when the address is not a signer.
     */
    error NotSigner();

    /**
     * @dev Error when the signer is the same as the current signer.
     */
    error SignerUnchanged(address signer);

    /**
     * @dev Error when the sender is not the owner of the token.
     */
    error OwnableUnauthorizedAccount(address sender, uint256 tokenId);

    function mint(
        address to,
        address[] memory agentAddresses,
        address signer,
        bytes32 nonce,
        bytes memory signature
    ) external;

    function tokenSigner(uint256 tokenId) external returns (address);

    function tokenWallets(uint256 tokenId) external returns (address[] memory);
}
