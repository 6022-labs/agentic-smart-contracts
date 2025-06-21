// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

interface IAgenticAIAgentCollectionEvents {
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

    /// @dev Emitted when an agent image is added or updated.
    /// @param tokenId The ID of the token whose image was added or updated.
    /// @param key The key of the image.
    /// @param oldValue The previous value of the image.
    /// @param newValue The new value of the image.
    event AgentImageUpdated(
        uint256 indexed tokenId,
        string indexed key,
        string oldValue,
        string newValue
    );

    /// @dev Emitted when an image proposal is created.
    /// @param tokenId The ID of the token whose image is proposed.
    /// @param key The key of the image proposal.
    /// @param proposalIndex The index of the created proposal.
    event AgentImageProposalCreated(
        uint256 indexed tokenId,
        string indexed key,
        uint256 proposalIndex
    );

    /// @dev Emitted when an image proposal is removed.
    /// @param tokenId The ID of the token whose proposal was removed.
    /// @param key The key of the image proposal.
    /// @param proposalIndex The index of the removed proposal.
    event AgentImageProposalRemoved(
        uint256 indexed tokenId,
        string indexed key,
        uint256 proposalIndex
    );

    /// @dev Emitted when a mint proposal is created.
    /// @param from The address that initiated the proposal.
    /// @param signer The signer address associated with the agent.
    /// @param proposalIndex The index of the created proposal.
    event MintProposalCreated(
        address indexed from,
        address indexed signer,
        uint256 proposalIndex
    );

    /// @dev Emitted when a mint proposal is removed.
    /// @param owner The address that was set to receive the token.
    /// @param signer The signer address associated with the proposal.
    /// @param proposalIndex The index of the removed proposal.
    event MintProposalRemoved(
        address indexed owner,
        address indexed signer,
        uint256 proposalIndex
    );

    /// @dev Emitted when the collections descriptor is updated.
    /// @param oldCollectionsDescriptor The previous collections descriptor address.
    /// @param newCollectionsDescriptor The new collections descriptor address.
    event CollectionsDescriptorUpdated(
        address oldCollectionsDescriptor,
        address newCollectionsDescriptor
    );

    /// @dev Emitted when the collection description is updated.
    /// @param oldDescription The previous description of the collection.
    /// @param newDescription The new description of the collection.
    event DescriptionUpdated(
        string oldDescription,
        string newDescription
    );
}