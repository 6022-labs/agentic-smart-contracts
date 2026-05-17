// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import {KeyValue} from "../../types/KeyValue.sol";

interface IAgentEnsRegistryAgentActions {
    /// @dev Provision an agent's ENS subnode and seed its text records in one
    ///      call. Must be called before `setAgentText`. The `records` batch must
    ///      include both `agent.runtime-url` and `agent.runtime-kind` with
    ///      non-empty values; every key must be in the allow list. Reverts if
    ///      the agent is already provisioned. Caller must own the agent NFT or
    ///      be one of the agent's registered wallets, and `collection` must be
    ///      registered with the configured manager.
    /// @param collection The agent collection contract address.
    /// @param tokenId The agent token identifier.
    /// @param records The initial text records (key/value pairs).
    function initAgentTexts(
        address collection,
        uint256 tokenId,
        KeyValue[] calldata records
    ) external;

    /// @dev Update a single text record on an already-initialized agent subnode.
    ///      Reverts with `NotProvisioned` if `initAgentTexts` has not been called
    ///      for the agent. Caller must own the agent NFT or be one of the agent's
    ///      registered wallets, `collection` must be registered with the
    ///      configured manager, and `key` must be in the allow list.
    /// @param collection The agent collection contract address.
    /// @param tokenId The agent token identifier.
    /// @param key The text record key (e.g. "agent.runtime-url").
    /// @param value The text record value.
    function setAgentText(
        address collection,
        uint256 tokenId,
        string calldata key,
        string calldata value
    ) external;
}
