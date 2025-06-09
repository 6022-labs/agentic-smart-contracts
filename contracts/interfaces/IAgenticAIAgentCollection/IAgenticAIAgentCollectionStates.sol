// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

interface IAgenticAIAgentCollectionStates {
    function signerOf(uint256 tokenId) external view returns (address);

    function creatorOf(uint256 tokenId) external view returns (address);

    function roleOf(uint256 tokenId) external view returns (string memory);

    function nameOf(uint256 tokenId) external view returns (string memory);

    function imageOf(uint256 tokenId) external view returns (string memory);

    function walletsOf(uint256 tokenId) external view returns (address[] memory);

    function tokenIdOf(string memory name) external view returns (uint256);
}
