// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import {KeyValue} from "../types/KeyValue.sol";

library AgentImagesLib {
    function imagesContainDefault(KeyValue[] memory images) internal pure returns (bool) {
        for (uint256 i = 0; i < images.length; i++) {
            if (keccak256(abi.encodePacked(images[i].key)) == keccak256(abi.encodePacked("default"))) {
                return true;
            }
        }
        return false;
    }

    function removeImage(KeyValue[] storage images, string memory key) internal returns (bool) {
        for (uint256 i = 0; i < images.length; i++) {
            if (keccak256(abi.encodePacked(images[i].key)) == keccak256(abi.encodePacked(key))) {
                images[i] = images[images.length - 1];
                images.pop();
                return true;
            }
        }

        return false;
    }

    function addOrUpdateImage(
        KeyValue[] storage images,
        string memory key,
        string memory value
    ) internal returns (string memory) {
        for (uint256 i = 0; i < images.length; i++) {
            if (keccak256(abi.encodePacked(images[i].key)) == keccak256(abi.encodePacked(key))) {
                string memory oldValue = images[i].value;
                images[i].value = value;
                return oldValue;
            }
        }

        images.push(KeyValue({key: key, value: value}));

        return "";
    }
}