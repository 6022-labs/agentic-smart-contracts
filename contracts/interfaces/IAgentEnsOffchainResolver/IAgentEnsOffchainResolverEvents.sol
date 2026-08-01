// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

interface IAgentEnsOffchainResolverEvents {
    /// @dev Emitted when the gateway URL list is set (at deploy and on `setUrls`).
    event UrlsUpdated(string[] urls);

    /// @dev Emitted when a signer's trust is set (at deploy and on `setSigner`).
    event SignerUpdated(address indexed signer, bool trusted);
}
