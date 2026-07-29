// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

interface IAgentCollectionV1Events {
    /// @dev Emitted when a token is minted.
    /// @param to The address that receives the minted token.
    /// @param tokenId The ID of the minted token.
    event Minted(
        address indexed to,
        uint256 tokenId
    );

    /// @dev Emitted when an agent's metadata key is updated.
    /// @param tokenId The ID of the token whose metadata was updated.
    /// @param key The key of the metadata that was updated.
    /// @param oldValue The previous value of the metadata.
    /// @param newValue The new value of the metadata.
    event AgentAttributeUpdated(
        uint256 indexed tokenId,
        string indexed key,
        string oldValue,
        string newValue
    );

    /// @dev Emitted when a typed address is added to an agent.
    /// @param tokenId The ID of the agent token.
    /// @param addressType The type of the address added.
    /// @param value The canonical value of the address added.
    event AgentAddressAdded(
        uint256 indexed tokenId,
        string addressType,
        string value
    );

    /// @dev Emitted when a typed address is removed from an agent.
    /// @param tokenId The ID of the agent token.
    /// @param addressType The type of the address removed.
    /// @param value The canonical value of the address removed.
    event AgentAddressRemoved(
        uint256 indexed tokenId,
        string addressType,
        string value
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
    /// @param proposalId The id of the created proposal.
    event AgentImageProposalCreated(
        uint256 indexed tokenId,
        string indexed key,
        uint256 proposalId
    );

    /// @dev Emitted when an image proposal is removed.
    /// @param tokenId The ID of the token whose proposal was removed.
    /// @param key The key of the image proposal.
    /// @param proposalId The id of the removed proposal.
    event AgentImageProposalRemoved(
        uint256 indexed tokenId,
        string indexed key,
        uint256 proposalId
    );

    /// @dev Emitted when a mint proposal is created.
    /// @param from The address that initiated the proposal.
    /// @param proposalId The id of the created proposal.
    event MintProposalCreated(
        address indexed from,
        uint256 proposalId
    );

    /// @dev Emitted when a mint proposal is removed.
    /// @param owner The address that was set to receive the token.
    /// @param proposalId The id of the removed proposal.
    event MintProposalRemoved(
        address indexed owner,
        uint256 proposalId
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