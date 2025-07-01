// SPDX-License-Identifier: UNLICENSED
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
    /// @param proposalIndex The index of the proposal to apply.
    function addOrUpdateImageFromProposal(
        uint256 proposalIndex
    ) external;

    /// @dev Refuse an image proposal.
    /// @param proposalIndex The index of the proposal to refuse.
    function refuseAddOrUpdateImageProposal(
        uint256 proposalIndex
    ) external;

    /// @dev Mint an agent from an approved proposal.
    /// @param proposalIndex The index of the mint proposal to execute.
    function mintFromProposal(
        uint256 proposalIndex
    ) external;

    /// @dev Refuse a mint proposal.
    /// @param proposalIndex The index of the proposal to refuse.
    function refuseMintProposal(
        uint256 proposalIndex
    ) external;
}
