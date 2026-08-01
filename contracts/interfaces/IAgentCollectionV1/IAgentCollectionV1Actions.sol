// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {KeyValue} from "../../types/KeyValue.sol";
import {AgentAddress} from "../../types/AgentAddress.sol";
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
    ///      Clearing a mandatory key to an empty value reverts.
    /// @param tokenId The token whose attribute key is updated.
    /// @param key The attribute key to update.
    /// @param value The new value for the attribute key.
    function addOrUpdateAgentAttribute(
        uint256 tokenId,
        string memory key,
        string memory value
    ) external;

    /// @dev Add a typed address to an agent. Only the agent controller (owner
    /// or an existing evm agent address) may call.
    /// @param tokenId The agent token.
    /// @param addressType The type of the address to add ("evm", "btc", ...).
    /// @param value The value of the address to add.
    function addAgentAddress(uint256 tokenId, string memory addressType, string memory value) external;

    /// @dev Remove a typed address from an agent. Only the agent controller
    /// (owner or an existing evm agent address) may call.
    /// @param tokenId The agent token.
    /// @param addressType The type of the address to remove.
    /// @param value The value of the address to remove.
    function removeAgentAddress(uint256 tokenId, string memory addressType, string memory value) external;

    /// @dev Propose minting of a new agent token. (used if moderators setup)
    /// @param to The future owner of the token.
    /// @param name The Name of the agent.
    /// @param addresses Typed addresses controlled by the agent (at least one evm).
    /// @param images A set of images describing the agent.
    /// @param attributes A set of attributes describing the agent (unique keys; must satisfy the mandatory-key requirements).
    /// @param cloneOf The ID of the agent to clone (if any).
    function createMintProposal(
        address to,
        string memory name,
        AgentAddress[] memory addresses,
        KeyValue[] memory images,
        KeyValue[] memory attributes,
        NullableUint256 memory cloneOf
    ) external;

    /// @dev Mint a new agent token. (allowed when no moderators are setup or
    /// the caller is a moderator)
    /// @param to The future owner of the token.
    /// @param name The Name of the agent.
    /// @param addresses Typed addresses controlled by the agent (at least one evm).
    /// @param images A set of images describing the agent.
    /// @param attributes A set of attributes describing the agent (unique keys; must satisfy the mandatory-key requirements).
    /// @param cloneOf The ID of the agent to clone (if any).
    function mint(
        address to,
        string memory name,
        AgentAddress[] memory addresses,
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
