// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

library ENSUtils {
    /// @dev Validate that a string is a valid ENS label.
    function isValidENSName(string memory name) internal pure returns (bool) {
        bytes memory nameBytes = bytes(name);
        if (nameBytes.length == 0) {
            return false;
        }

        for (uint256 i = 0; i < nameBytes.length; i++) {
            bytes1 char = nameBytes[i];
            if (
                !(char >= 0x61 && char <= 0x7A) && // a-z
                !(char >= 0x30 && char <= 0x39) && // 0-9
                !(char == 0x2D) // -
            ) {
                return false;
            }
        }

        return true;
    }
}