// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import {KeyValue} from "../../types/KeyValue.sol";

interface IAgenticAIAgentCollectionActions {
    /// @dev Update the signer address of an agent.
    /// @param tokenId The token to update.
    /// @param newSigner The new signer address.
    /// @param nonce Unique nonce used for signature.
    /// @param signature Off-chain signature authorizing the change.
    function updateAgentSigner(
        uint256 tokenId,
        address newSigner,
        bytes32 nonce,
        bytes memory signature
    ) external;

    /// @dev Remove an image from a token.
    /// @param tokenId The token whose image is removed.
    /// @param key The key of the image to remove.
    function removeImage(
        uint256 tokenId,
        string memory key
    ) external;

    /// @dev Update the mission of an agent.
    /// @param tokenId The token whose mission is updated.
    /// @param newMission The new mission text.
    function updateAgentMission(
        uint256 tokenId,
        string memory newMission
    ) external;

    /// @dev Propose minting of a new agent token. (used if moderators setup)
    /// @param to The future owner of the token.
    /// @param agentAddresses Wallet addresses controlled by the agent.
    /// @param signer The signer address linked to the agent.
    /// @param role The agent role.
    /// @param name The Name of the agent.
    /// @param mission The initial mission for the agent.
    /// @param images A set of images describing the agent.
    /// @param nonce Unique nonce used for signature replay protection.
    /// @param signature Off-chain signature authorizing the mint.
    function createMintProposal(
        address to,
        address[] memory agentAddresses,
        address signer,
        string memory role,
        string memory name,
        string memory mission,
        KeyValue[] memory images,
        bytes32 nonce,
        bytes memory signature
    ) external;

    /// @dev Mint a new agent token. (used if no moderators setup)
    /// @param to The future owner of the token.
    /// @param agentAddresses Wallet addresses controlled by the agent.
    /// @param signer The signer address linked to the agent.
    /// @param role The agent role.
    /// @param name The Name of the agent.
    /// @param mission The initial mission for the agent.
    /// @param images A set of images describing the agent.
    /// @param nonce Unique nonce used for signature replay protection.
    /// @param signature Off-chain signature authorizing the mint.
    function mint(
        address to,
        address[] memory agentAddresses,
        address signer,
        string memory role,
        string memory name,
        string memory mission,
        KeyValue[] memory images,
        bytes32 nonce,
        bytes memory signature
    ) external;

    /// @dev Propose to add or update an image for a token. (used if moderators setup)
    /// @param tokenId The token affected by the proposal.
    /// @param image The key/value pair representing the image.
    function createAddOrUpdateImageProposal(
        uint256 tokenId,
        KeyValue memory image
    ) external;

    /// @dev Add or update an image for a token. (used if no moderators setup)
    /// @param tokenId The token affected.
    /// @param image The key/value pair representing the image.
    function addOrUpdateImage(
        uint256 tokenId,
        KeyValue memory image
    ) external;
}
