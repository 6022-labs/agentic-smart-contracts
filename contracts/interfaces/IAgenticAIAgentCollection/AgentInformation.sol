// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

struct AgentInformation {
    string name;
    string role;
    string image;
    address owner;
    address signer;
    string mission;
    address creator;
    address[] wallets;
}