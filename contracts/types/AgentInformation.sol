// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import {KeyValue} from "./KeyValue.sol";

struct AgentInformation {
    string name;
    string role;
    address signer;
    string mission;
    address creator;
    address[] wallets;
    KeyValue[] images;
}