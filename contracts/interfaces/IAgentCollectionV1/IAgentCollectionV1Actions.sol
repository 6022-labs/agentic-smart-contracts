// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import {KeyValue} from "../../types/KeyValue.sol";
import {NullableUint256} from "../../types/NullableUint256.sol";

interface IAgentCollectionV1Actions {
    /// @dev Remove an image from a token.
    /// @param tokenId The token whose image is removed.
    /// @param key The key of the image to remove.
    function removeAgentImage(
        uint256 tokenId,
        string memory key
    ) external;

    /// @dev Add the attribute key/value pair to a token. If the key already exists, its value is updated.
    /// @param tokenId The token whose attribute key is updated.
    /// @param key The attribute key to update.
    /// @param value The new value for the attribute key.
    function addOrUpdateAgentAttribute(
        uint256 tokenId,
        string memory key,
        string memory value
    ) external;

    /// @dev Propose minting of a new agent token. (used if moderators setup)
    /// @param to The future owner of the token.
    /// @param role The agent role.
    /// @param name The Name of the agent.
    /// @param wallets Wallet addresses controlled by the agent.
    /// @param images A set of images describing the agent.
    /// @param attributes A set of attributes describing the agent.
    /// @param cloneOf The ID of the agent to clone (if any).
    function createMintProposal(
        address to,
        string memory role,
        string memory name,
        address[] memory wallets,
        KeyValue[] memory images,
        KeyValue[] memory attributes,
        NullableUint256 memory cloneOf
    ) external;

    /// @dev Mint a new agent token. (allowed when no moderators are setup or
    /// the caller is a moderator)
    /// @param to The future owner of the token.
    /// @param role The agent role.
    /// @param name The Name of the agent.
    /// @param wallets Wallet addresses controlled by the agent.
    /// @param images A set of images describing the agent.
    /// @param attributes A set of attributes describing the agent.
    /// @param cloneOf The ID of the agent to clone (if any).
    function mint(
        address to,
        string memory role,
        string memory name,
        address[] memory wallets,
        KeyValue[] memory images,
        KeyValue[] memory attributes,
        NullableUint256 memory cloneOf
    ) external;

    /// @dev Propose to add or update an image for a token. (used if moderators setup)
    /// @param tokenId The token affected by the proposal.
    /// @param image The key/value pair representing the image.
    function createAddOrUpdateAgentImageProposal(
        uint256 tokenId,
        KeyValue memory image
    ) external;

    /// @dev Add or update an image for a token. (used if no moderators setup)
    /// @param tokenId The token affected.
    /// @param image The key/value pair representing the image.
    function addOrUpdateAgentImage(
        uint256 tokenId,
        KeyValue memory image
    ) external;
}
