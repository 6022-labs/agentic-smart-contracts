// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

interface IAgenticAIAgentCollectionsDescriptor {
    function updateIpfsGateway(string memory ipfsGateway) external;

    function buildTokenURI(address collection, uint256 tokenId) external view returns (string memory);
}
