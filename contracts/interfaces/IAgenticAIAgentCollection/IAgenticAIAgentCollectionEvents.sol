// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

interface IAgenticAIAgentCollectionEvents {
    event MintProposal(
        address indexed from,
        address indexed signer,
        uint256 proposalId
    );

    /**
     * @dev Emitted when a token is minted with a signature.
     */
    event Minted(
        address indexed to,
        address indexed signer,
        uint256 tokenId
    );

    /**
     * @dev Emitted when a token signer has changed.
     */
    event TokenSignerChanged(
        uint256 indexed tokenId,
        address oldSigner,
        address newSigner
    );
}
