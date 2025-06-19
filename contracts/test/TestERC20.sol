// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";


contract TestERC20 is
    ERC20
{
    constructor() ERC20("Test Token", "TTK") { }

    /// @dev Mint test tokens for testing purposes.
    /// @param to Receiver of the minted tokens.
    /// @param amount Amount of tokens to mint.
    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }
}
