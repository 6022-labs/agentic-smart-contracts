// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import {KeyValue} from "../../types/KeyValue.sol";
import {AgentInformation} from "../../types/AgentInformation.sol";

interface IAgenticAIAgentCollectionStates {
    function collectionsManager() external view returns (address);

    function collectionsDescriptor() external view returns (address);

    function informationOf(uint256 tokenId) external view returns (AgentInformation memory);

    function signerOf(uint256 tokenId) external view returns (address);

    function creatorOf(uint256 tokenId) external view returns (address);

    function roleOf(uint256 tokenId) external view returns (string memory);

    function nameOf(uint256 tokenId) external view returns (string memory);

    function imagesOf(uint256 tokenId) external view returns (KeyValue[] memory);

    function missionOf(uint256 tokenId) external view returns (string memory);

    function walletsOf(uint256 tokenId) external view returns (address[] memory);

    function tokenIdOf(string memory name) external view returns (uint256);
}
