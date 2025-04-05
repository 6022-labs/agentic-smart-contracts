// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

// Uncomment this line to use console.log
// import "hardhat/console.sol";

import { IAgenticAIAgentCollection } from "./IAgenticAIAgentCollection.sol";

interface IAgenticAIAgentCollectionDescriptor {
    function buildTokenURI(IAgenticAIAgentCollection collection, uint256 tokenId) external view returns (string memory);
}
