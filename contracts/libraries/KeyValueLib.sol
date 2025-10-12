// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import {KeyValue} from "../types/KeyValue.sol";

library KeyValueLib {
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