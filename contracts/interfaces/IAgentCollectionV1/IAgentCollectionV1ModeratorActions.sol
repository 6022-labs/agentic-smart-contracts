// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

interface IAgentCollectionV1ModeratorActions {
    /// @dev Update the collections descriptor contract used by this collection.
    /// @param collectionsDescriptor The address of the new descriptor contract.
    function updateCollectionsDescriptor(address collectionsDescriptor) external;

    /// @dev Update the collection description.
    /// @param description The new description of the collection.
    function updateDescription(
        string memory description
    ) external;

    /// @dev Apply an image proposal.
    /// @param proposalId The id of the proposal to apply.
    function addOrUpdateAgentImageFromProposal(
        uint256 proposalId
    ) external;

    /// @dev Refuse an image proposal.
    /// @param proposalId The id of the proposal to refuse.
    function refuseAddOrUpdateAgentImageProposal(
        uint256 proposalId
    ) external;

    /// @dev Mint an agent from an approved proposal.
    /// @param proposalId The id of the mint proposal to execute.
    function mintFromProposal(
        uint256 proposalId
    ) external;

    /// @dev Refuse a mint proposal.
    /// @param proposalId The id of the proposal to refuse.
    function refuseMintProposal(
        uint256 proposalId
    ) external;
}
