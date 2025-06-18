// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

interface IAgenticAIAgentCollectionEvents {
    /// @dev Emitted when a mint proposal is created.
    /// @param from The address that initiated the proposal.
    /// @param signer The signer address associated with the agent.
    event MintProposalCreated(
        address indexed from,
        address indexed signer
    );

    /// @dev Emitted when a token is minted with a signature.
    /// @param to The address that receives the minted token.
    /// @param signer The signer address associated with the minted token.
    /// @param tokenId The ID of the minted token.
    event Minted(
        address indexed to,
        address indexed signer,
        uint256 tokenId
    );

    /// @dev Emitted when a token signer is updated.
    /// @param tokenId The ID of the token whose signer was updated.
    /// @param oldSigner The previous signer address.
    /// @param newSigner The new signer address.
    event AgentSignerUpdated(
        uint256 indexed tokenId,
        address oldSigner,
        address newSigner
    );

    /// @dev Emitted when an agent's mission is updated.
    /// @param tokenId The ID of the token whose mission was updated.
    /// @param oldMission The previous mission text.
    /// @param newMission The new mission text.
    event AgentMissionUpdated(
        uint256 indexed tokenId,
        string oldMission,
        string newMission
    );

    /// @dev Emitted when the collections descriptor is updated.
    /// @param oldCollectionsDescriptor The previous collections descriptor address.
    /// @param newCollectionsDescriptor The new collections descriptor address.
    event CollectionsDescriptorUpdated(
        address oldCollectionsDescriptor,
        address newCollectionsDescriptor
    );
}
