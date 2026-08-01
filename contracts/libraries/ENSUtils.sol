// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

library ENSUtils {
    /// @dev Maximum byte length of a single ENS/DNS label.
    uint256 internal constant MAX_LABEL_LENGTH = 63;

    /// @dev Valid ENS label: `[a-z0-9-]`, 1..63 bytes, no leading/trailing or
    ///      consecutive hyphens. Mirrors UTS-46 so on-chain names namehash
    ///      identically in ENS clients.
    function isValidENSName(string memory name) internal pure returns (bool) {
        bytes memory nameBytes = bytes(name);
        if (nameBytes.length == 0 || nameBytes.length > MAX_LABEL_LENGTH) {
            return false;
        }

        // No leading or trailing hyphen.
        if (nameBytes[0] == 0x2D || nameBytes[nameBytes.length - 1] == 0x2D) {
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

            // No consecutive hyphens.
            if (char == 0x2D && nameBytes[i - 1] == 0x2D) {
                return false;
            }
        }

        return true;
    }
}