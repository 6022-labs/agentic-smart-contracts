// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

// Uncomment this line to use console.log
// import "hardhat/console.sol";

import { IAgenticAIAgentCollection } from "./IAgenticAIAgentCollection.sol";

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

    function buildTokenURI(IAgenticAIAgentCollection collection, uint256 tokenId) external view returns (string memory);

    function agentInformation(IAgenticAIAgentCollection collection, uint256 tokenId) external view returns (AgentInformation memory);
}
