// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import {KeyValue} from "../../types/KeyValue.sol";
import {AgentInformation} from "../../types/AgentInformation.sol";
import {IAgentCollectionStates} from "../IAgentCollection/IAgentCollectionStates.sol";

interface IAgentCollectionV1States is IAgentCollectionStates {
    /// @dev Address of the collections descriptor contract.
    function collectionsDescriptor() external view returns (address);

    /// @dev Description of the collection.
    function description() external view returns (string memory);

    /// @dev Get all stored information for an agent.
    /// @param tokenId The token identifier.
    /// @return The agent information structure.
    function informationOf(uint256 tokenId) external view returns (AgentInformation memory);

    /// @dev Get the creator address of an agent.
    /// @param tokenId The token identifier.
    function creatorOf(uint256 tokenId) external view returns (address);

    /// @dev Get the number of attributes of an agent.
    /// @param tokenId The token identifier.
    function attributesCountOf(uint256 tokenId) external view returns (uint256);

    /// @dev Get a specific attribute of an agent by its index.
    /// @param tokenId The token identifier.
    /// @param index The index of the attribute.
    function attributeOfByIndex(uint256 tokenId, uint256 index) external view returns (KeyValue memory);

    /// @dev Get the token ID associated to the agent name.
    /// @param name The name of the agent.
    function nameToTokenId(string memory name) external view returns (uint256);

}
