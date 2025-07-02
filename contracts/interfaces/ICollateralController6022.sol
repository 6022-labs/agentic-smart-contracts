// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

interface ICollateralController6022 {
    function getVaultsByOwner(address owner) external view returns (address[] memory);
}