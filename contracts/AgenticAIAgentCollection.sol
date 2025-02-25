// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

// Uncomment this line to use console.log
// import "hardhat/console.sol";

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";

contract AgenticAIAgentCollection is ERC721 {
    constructor() ERC721("AgenticAIAgentCollection", "AIAgent") {

    }
}
