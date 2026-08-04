// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

interface IAgentEnsRegistryErrors {
    /// @dev Collection is not registered with the configured manager.
    error UnknownCollection(address collection);

    /// @dev Caller is neither the agent NFT owner nor a registered agent wallet.
    error NotAgentOwnerOrWallet(address collection, uint256 tokenId, address caller);

    /// @dev `initAgentTexts` was called for an agent that is already provisioned.
    error AlreadyProvisioned(address collection, uint256 tokenId);

    /// @dev `setAgentText` was called before the agent was initialized with `initAgentTexts`.
    error NotProvisioned(address collection, uint256 tokenId);

    /// @dev Key is resolved by the registry itself (e.g. `avatar`) and cannot
    ///      be stored.
    error ReservedKey(string key);

    /// @dev Error when an address parameter is the zero address.
    error ZeroAddress(string parameter);
}
