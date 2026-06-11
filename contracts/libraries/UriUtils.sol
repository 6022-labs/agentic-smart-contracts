// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

library UriUtils {
    /// @dev True when `value` contains a `://` scheme separator.
    function hasScheme(string memory value) internal pure returns (bool) {
        bytes memory raw = bytes(value);
        for (uint256 i = 0; i + 2 < raw.length; i++) {
            if (raw[i] == ":" && raw[i + 1] == "/" && raw[i + 2] == "/") return true;
        }
        return false;
    }

    /// @dev Prepend `prefix` unless `value` is empty or already carries a
    ///      scheme. Collections store bare IPFS CIDs; consumers (ENSIP-12
    ///      avatars, ERC721 metadata) need full URIs.
    function prefixUnlessUri(
        string memory prefix,
        string memory value
    ) internal pure returns (string memory) {
        if (bytes(value).length == 0 || hasScheme(value)) return value;
        return string.concat(prefix, value);
    }
}
