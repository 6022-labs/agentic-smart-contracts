// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

interface IAgenticAIAgentCollectionModeratorActions {
    /// @dev Update the collections descriptor contract used by this collection.
    /// @param collectionsDescriptor The address of the new descriptor contract.
    function updateCollectionsDescriptor(address collectionsDescriptor) external;

    /// @dev Apply an image proposal.
    /// @param proposalIndex The index of the proposal to apply.
    function addOrUpdateImage(
        uint256 proposalIndex
    ) external;

    /// @dev Refuse an image proposal.
    /// @param proposalIndex The index of the proposal to refuse.
    function refuseAddOrUpdateImageProposal(
        uint256 proposalIndex
    ) external;

    /// @dev Mint an agent from an approved proposal.
    /// @param proposalIndex The index of the mint proposal to execute.
    function mint(
        uint256 proposalIndex
    ) external;

    /// @dev Refuse a mint proposal.
    /// @param proposalIndex The index of the proposal to refuse.
    function refuseMintProposal(
        uint256 proposalIndex
    ) external;
}
