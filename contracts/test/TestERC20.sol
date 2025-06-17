// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

// Uncomment this line to use console.log
// import "hardhat/console.sol";

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";


contract TestERC20 is
    ERC20
{
    constructor() ERC20("Test Token", "TTK") { }

    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }
}
