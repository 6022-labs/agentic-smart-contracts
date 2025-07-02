// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import {ICollateralVault6022} from "../interfaces/ICollateralVault6022.sol";

contract TestCollateralVault6022 is ICollateralVault6022 {
    bool public isDeposited;
    bool public isWithdrawn;
    uint256 public wantedAmount;
    address public wantedTokenAddress;

    constructor(
        bool _isDeposited,
        bool _isWithdrawn,
        uint256 _wantedAmount,
        address _wantedTokenAddress
    ) {
        isDeposited = _isDeposited;
        isWithdrawn = _isWithdrawn;
        wantedAmount = _wantedAmount;
        wantedTokenAddress = _wantedTokenAddress;
    }

    function setIsDeposited(bool _isDeposited) external {
        isDeposited = _isDeposited;
    }

    function setIsWithdrawn(bool _isWithdrawn) external {
        isWithdrawn = _isWithdrawn;
    }

    function setWantedAmount(uint256 _wantedAmount) external {
        wantedAmount = _wantedAmount;
    }

    function setWantedTokenAddress(address _wantedTokenAddress) external {
        wantedTokenAddress = _wantedTokenAddress;
    }
}