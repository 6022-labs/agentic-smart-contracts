// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import {KeyValue} from "./KeyValue.sol";
import {AgentAddress} from "./AgentAddress.sol";
import {NullableUint256} from "./NullableUint256.sol";

struct AgentInformation {
    string name;
    address creator;
    KeyValue[] images;
    KeyValue[] attributes;
    NullableUint256 cloneOf;
    AgentAddress[] addresses;
}