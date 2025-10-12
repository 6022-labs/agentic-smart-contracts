// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import {KeyValue} from "./KeyValue.sol";
import {NullableUint256} from "./NullableUint256.sol";

struct AgentInformation {
    string name;
    string role;
    address signer;
    address creator;
    address[] wallets;
    KeyValue[] images;
    KeyValue[] metadata;
    NullableUint256 cloneOf;
}