// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

interface IAgenticAIAgentCollectionsDescriptorActions {
    function buildTokenURI(address collection, uint256 tokenId) external view returns (string memory);
}
