// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import {AgentInformation} from "../../types/AgentInformation.sol";
import {IAgentCollectionStates} from "../IAgentCollection/IAgentCollectionStates.sol";

interface IAgentCollectionV1States is IAgentCollectionStates {
    /// @dev Address of the collections manager contract.
    function collectionsManager() external view returns (address);

    /// @dev Address of the collections descriptor contract.
    function collectionsDescriptor() external view returns (address);

    /// @dev Description of the collection.
    function description() external view returns (string memory);

    /// @dev Get all stored information for an agent.
    /// @param tokenId The token identifier.
    /// @return The agent information structure.
    function informationOf(uint256 tokenId) external view returns (AgentInformation memory);

    /// @dev Get the signer address of an agent.
    /// @param tokenId The token identifier.
    function signerOf(uint256 tokenId) external view returns (address);

    /// @dev Get the creator address of an agent.
    /// @param tokenId The token identifier.
    function creatorOf(uint256 tokenId) external view returns (address);

    /// @dev Get the role of an agent
    /// @param tokenId The token identifier.
    function roleOf(uint256 tokenId) external view returns (string memory);

    /// @dev Get the list of agent wallets of an agent.
    /// @param tokenId The token identifier.
    function walletsOf(uint256 tokenId) external view returns (address[] memory);

    /// @dev Get the token ID associated to the agent name.
    /// @param name The name of the agent.
    function tokenIdOf(string memory name) external view returns (uint256);
}
