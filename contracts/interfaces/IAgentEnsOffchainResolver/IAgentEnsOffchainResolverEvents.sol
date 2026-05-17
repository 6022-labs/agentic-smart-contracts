// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

interface IAgentEnsOffchainResolverEvents {
    /// @dev Emitted when the gateway URL list is replaced by admin.
    event UrlsUpdated(string[] urls);

    /// @dev Emitted when a gateway signer is added or removed by admin.
    event SignerUpdated(address indexed signer, bool trusted);
}
