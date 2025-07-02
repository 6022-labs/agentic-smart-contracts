// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import {ICollateralController6022} from "../interfaces/ICollateralController6022.sol";

contract TestCollateralController6022 is ICollateralController6022 {
    mapping(address => address[]) public vaultsByOwner;

    function getVaultsByOwner(
        address owner
    ) external view override returns (address[] memory) {
        return vaultsByOwner[owner];
    }

    function addVault(address owner, address vault) external {
        vaultsByOwner[owner].push(vault);
    }
}