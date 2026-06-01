// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import {KeyValue} from "../../types/KeyValue.sol";

interface IAgentEnsRegistryAgentActions {
    /// @dev Provision an agent's ENS subnode and seed its text records. Must run
    ///      before `setAgentText` and reverts if already provisioned. `records`
    ///      must include a non-empty `url`; the reserved `avatar` key is rejected
    ///      (derived on read from the collection's `default` image). Caller must
    ///      control the agent (NFT owner or registered wallet) and `collection`
    ///      must be manager-registered.
    /// @param collection The agent collection contract address.
    /// @param tokenId The agent token identifier.
    /// @param records The initial text records (key/value pairs).
    function initAgentTexts(
        address collection,
        uint256 tokenId,
        KeyValue[] calldata records
    ) external;

    /// @dev Update one text record on a provisioned subnode (reverts
    ///      `NotProvisioned` otherwise). Same caller/collection rules as
    ///      `initAgentTexts`; `key` may not be the reserved `avatar`.
    /// @param collection The agent collection contract address.
    /// @param tokenId The agent token identifier.
    /// @param key The text record key (e.g. "url").
    /// @param value The text record value.
    function setAgentText(
        address collection,
        uint256 tokenId,
        string calldata key,
        string calldata value
    ) external;
}
