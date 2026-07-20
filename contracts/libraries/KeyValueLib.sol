// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import {KeyValue} from "../types/KeyValue.sol";

library KeyValueLib {
    /// @dev The same key appears more than once in a batch of records.
    error DuplicateKey(string key);

    /// @dev A mandatory key would be left unset — either missing/empty in a
    ///      batch of records or cleared to empty on update.
    error MissingRequiredKey(string key);

    /// @dev Reverts if any key appears twice, keeping mandatory-key checks unambiguous.
    function requireNoDuplicateKeys(KeyValue[] memory keyValues) internal pure {
        for (uint256 i = 0; i < keyValues.length; i++) {
            bytes32 keyHash = keccak256(bytes(keyValues[i].key));
            for (uint256 j = 0; j < i; j++) {
                if (keccak256(bytes(keyValues[j].key)) == keyHash) {
                    revert DuplicateKey(keyValues[i].key);
                }
            }
        }
    }

    /// @dev Reverts unless `requiredKey` is present with a non-empty value. Call
    ///      after `requireNoDuplicateKeys` so the match is unambiguous.
    function requireMandatoryKey(KeyValue[] memory keyValues, string memory requiredKey) internal pure {
        bytes32 requiredHash = keccak256(bytes(requiredKey));
        for (uint256 i = 0; i < keyValues.length; i++) {
            if (keccak256(bytes(keyValues[i].key)) == requiredHash) {
                if (bytes(keyValues[i].value).length == 0) revert MissingRequiredKey(requiredKey);
                return;
            }
        }

        revert MissingRequiredKey(requiredKey);
    }

    /// @dev Reverts if `key` is `requiredKey` and `value` would clear it to empty.
    function requireNotClearing(string memory key, string memory value, string memory requiredKey) internal pure {
        if (bytes(value).length > 0) return;
        if (keccak256(bytes(key)) == keccak256(bytes(requiredKey))) revert MissingRequiredKey(requiredKey);
    }

    function get(KeyValue[] storage keyValues, string memory key) internal view returns (string memory) {
        for (uint256 i = 0; i < keyValues.length; i++) {
            if (keccak256(abi.encodePacked(keyValues[i].key)) == keccak256(abi.encodePacked(key))) {
                return keyValues[i].value;
            }
        }
        return "";
    }

    function containKey(KeyValue[] memory keyValues, string memory key) internal pure returns (bool) {
        for (uint256 i = 0; i < keyValues.length; i++) {
            if (keccak256(abi.encodePacked(keyValues[i].key)) == keccak256(abi.encodePacked(key))) {
                return true;
            }
        }
        return false;
    }

    function remove(KeyValue[] storage keyValues, string memory key) internal returns (bool) {
        for (uint256 i = 0; i < keyValues.length; i++) {
            if (keccak256(abi.encodePacked(keyValues[i].key)) == keccak256(abi.encodePacked(key))) {
                keyValues[i] = keyValues[keyValues.length - 1];
                keyValues.pop();
                return true;
            }
        }

        return false;
    }

    function addOrUpdate(
        KeyValue[] storage keyValues,
        string memory key,
        string memory value
    ) internal returns (string memory) {
        for (uint256 i = 0; i < keyValues.length; i++) {
            if (keccak256(abi.encodePacked(keyValues[i].key)) == keccak256(abi.encodePacked(key))) {
                string memory oldValue = keyValues[i].value;
                keyValues[i].value = value;
                return oldValue;
            }
        }

        keyValues.push(KeyValue({key: key, value: value}));

        return "";
    }
}