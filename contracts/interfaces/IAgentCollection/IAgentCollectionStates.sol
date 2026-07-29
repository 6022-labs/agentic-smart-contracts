// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {KeyValue} from "../../types/KeyValue.sol";
import {AgentAddress} from "../../types/AgentAddress.sol";

interface IAgentCollectionStates {
    /// @dev Get the fact that a account is a moderator or not.
    function isModerator(address account) external view returns (bool);

    /// @dev Number of moderators configured on the collection.
    function moderatorCount() external view returns (uint256);

    /// @dev Get the token ID associated to a typed address, or 0 if none.
    /// @param addressType The type of the address ("evm", "btc", ...).
    /// @param value The address value (evm values accepted in any casing).
    function addressToTokenId(string memory addressType, string memory value) external view returns (uint256);

    /// @dev The next tokenId to be minted (count of minted agents + 1).
    function nextTokenId() external view returns (uint256);

    /// @dev Description of the collection.
    function description() external view returns (string memory);

    /// @dev Get the name of an agent.
    /// @param tokenId The token identifier.
    function nameOf(uint256 tokenId) external view returns (string memory);

    /// @dev Get the number of images of an agent.
    /// @param tokenId The token identifier.
    function imagesCountOf(uint256 tokenId) external view returns (uint256);

    /// @dev Get a specific image of an agent by its index.
    /// @param tokenId The token identifier.
    /// @param index The index of the image.
    function imageOfByIndex(uint256 tokenId, uint256 index) external view returns (KeyValue memory);

    /// @dev Get the number of typed addresses of an agent.
    /// @param tokenId The token identifier.
    function addressesCountOf(uint256 tokenId) external view returns (uint256);

    /// @dev Get a specific typed address of an agent by its index.
    /// @param tokenId The token identifier.
    /// @param index The index of the address.
    function addressOfByIndex(uint256 tokenId, uint256 index) external view returns (AgentAddress memory);
}
