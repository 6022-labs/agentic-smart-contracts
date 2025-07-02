// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

interface ICollateralVault6022 {
    function isDeposited() external view returns (bool);
    function isWithdrawn() external view returns (bool);
    function wantedAmount() external view returns (uint256);
    function wantedTokenAddress() external view returns (address);
}