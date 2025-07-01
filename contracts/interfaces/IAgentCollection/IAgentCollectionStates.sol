// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import {KeyValue} from "../../types/KeyValue.sol";

interface IAgentCollectionStates {
    /// @dev Get the fact that a account is a moderator or not.
    function isModerator(address account) external view returns (bool);

    /// @dev Description of the collection.
    function description() external view returns (string memory);

    /// @param tokenId The token identifier.
    function nameOf(uint256 tokenId) external view returns (string memory);

    /// @dev Get all stored images of an agent.
    /// @param tokenId The token identifier.
    function imagesOf(uint256 tokenId) external view returns (KeyValue[] memory);
}
