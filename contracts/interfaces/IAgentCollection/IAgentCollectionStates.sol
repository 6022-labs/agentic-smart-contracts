// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import {KeyValue} from "../../types/KeyValue.sol";

interface IAgentCollectionStates {
    /// @dev Get the fact that a account is a moderator or not.
    function isModerator(address account) external view returns (bool);

    /// @dev Description of the collection.
    function description() external view returns (string memory);

    /// @dev Get the name of an agent.
    /// @param tokenId The token identifier.
    function nameOf(uint256 tokenId) external view returns (string memory);

    /// @dev Get the signer address of an agent.
    /// @param tokenId The token identifier.
    function signerOf(uint256 tokenId) external view returns (address);

    /// @dev Get the role of an agent
    /// @param tokenId The token identifier.
    function roleOf(uint256 tokenId) external view returns (string memory);

    /// @dev Get the number of images of an agent.
    /// @param tokenId The token identifier.
    function imagesCountOf(uint256 tokenId) external view returns (uint256);

    /// @dev Get a specific image of an agent by its index.
    /// @param tokenId The token identifier.
    /// @param index The index of the image.
    function imageOfByIndex(uint256 tokenId, uint256 index) external view returns (KeyValue memory);

    /// @dev Get the number of agent wallets of an agent.
    /// @param tokenId The token identifier.
    function walletsCountOf(uint256 tokenId) external view returns (uint256);

    /// @dev Get a specific agent wallet by its index.
    /// @param tokenId The token identifier.
    /// @param index The index of the wallet.
    function walletOfByIndex(uint256 tokenId, uint256 index) external view returns (address);
}
