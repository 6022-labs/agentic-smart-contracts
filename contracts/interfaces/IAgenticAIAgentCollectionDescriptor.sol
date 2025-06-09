// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

struct AgentInformation {
    string name;
    string role;
    string image;
    address owner;
    address signer;
    address creator;
    address[] wallets;
}

interface IAgenticAIAgentCollectionDescriptor {
    function updateIpfsGateway(string memory ipfsGateway) external;

    function buildTokenURI(address collection, uint256 tokenId) external view returns (string memory);

    function agentInformation(address collection, uint256 tokenId) external view returns (AgentInformation memory);
}
