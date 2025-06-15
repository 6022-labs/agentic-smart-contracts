// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

interface IAgenticAIAgentCollectionEvents {
    event MintProposalCreated(
        address indexed from,
        address indexed signer
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
     * @dev Emitted when a token signer is updated.
     */
    event AgentSignerUpdated(
        uint256 indexed tokenId,
        address oldSigner,
        address newSigner
    );

    /**
     * @dev Emitted when an agent's mission is updated.
     */
    event AgentMissionUpdated(
        uint256 indexed tokenId,
        string oldMission,
        string newMission
    );
}
